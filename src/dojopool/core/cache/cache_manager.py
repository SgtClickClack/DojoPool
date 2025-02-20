import gc
import gc
"""Cache management module."""

import logging
import os
import pickle
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Set

logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """Represents a cached item with metadata."""

    key: str
    data: bytes
    mime_type: str
    size: int
    created_at: datetime
    last_accessed: datetime
    access_count: int
    tags: Set[str]


class CacheConfig:
    """Configuration for cache behavior."""

    def __init__(
        self,
        max_size_mb: int = 500,
        max_items: int = 10000,
        ttl_seconds: int = 86400,  # 24 hours
        cleanup_interval: int = 3600,  # 1 hour
        eviction_policy: str = "lru",  # 'lru', 'lfu', or 'fifo'
    ):
        """Initialize cache configuration.

        Args:
            max_size_mb: Maximum cache size in MB
            max_items: Maximum number of items
            ttl_seconds: Time to live in seconds
            cleanup_interval: Cleanup interval in seconds
            eviction_policy: Cache eviction policy
        """
        self.max_size = max_size_mb * 1024 * 1024  # Convert to bytes
        self.max_items = max_items
        self.ttl = ttl_seconds
        self.cleanup_interval = cleanup_interval
        self.eviction_policy = eviction_policy


class CacheManager:
    """Manages caching of data with metadata."""

    def __init__(self, config: Optional[CacheConfig] = None):
        """Initialize cache manager.

        Args:
            config: Optional cache configuration
        """
        self.config = config or CacheConfig()
        self.cache: Dict[str, CacheEntry] = {}
        self.last_cleanup = datetime.utcnow()
        self.cache_dir = Path("data/cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._load_cache()

    def get(self, key: str) -> Optional[CacheEntry]:
        """Get cached entry.

        Args:
            key: Cache key

        Returns:
            Optional[CacheEntry]: Cached entry if found
        """
        try:
            entry = self.cache.get(key)
            if not entry:
                return None

            # Check if expired
            now = datetime.utcnow()
            if (now - entry.created_at).total_seconds() > self.config.ttl:
                self.invalidate(key)
                return None

            # Update access time and count
            entry.last_accessed = now
            entry.access_count += 1

            # Maybe cleanup
            self._maybe_cleanup()

            return entry

        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None

    def put(
        self, key: str, data: bytes, mime_type: str, tags: Optional[Set[str]] = None
    ) -> bool:
        """Put data in cache.

        Args:
            key: Cache key
            data: Data to cache
            mime_type: MIME type of data
            tags: Optional tags

        Returns:
            bool: True if successful
        """
        try:
            size = len(data)
            if not self._can_add_to_memory(size):
                # Try to free up space
                while (
                    len(self.cache) > 0
                    and not self._can_add_to_memory(size)
                    and self._evict_one()
                ):
                    pass

                if not self._can_add_to_memory(size):
                    logger.error("Cannot add to cache: insufficient space")
                    return False

            # Create entry
            entry = CacheEntry(
                key=key,
                data=data,
                mime_type=mime_type,
                size=size,
                created_at=datetime.utcnow(),
                last_accessed=datetime.utcnow(),
                access_count=0,
                tags=tags or set(),
            )

            # Save to cache
            self.cache[key] = entry

            # Save to disk
            cache_path = self._get_cache_path(key)
            with open(cache_path, "wb") as f:
                pickle.dump(entry, f)

            # Maybe cleanup
            self._maybe_cleanup()

            return True

        except Exception as e:
            logger.error(f"Error adding to cache: {str(e)}")
            return False

    def invalidate(self, key: str) -> bool:
        """Invalidate cached entry.

        Args:
            key: Cache key

        Returns:
            bool: True if successful
        """
        try:
            if key in self.cache:
                del self.cache[key]

            # Remove from disk
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                cache_path.unlink()

            return True

        except Exception as e:
            logger.error(f"Error invalidating cache entry: {str(e)}")
            return False

    def invalidate_by_tag(self, tag: str):
        """Invalidate entries by tag.

        Args:
            tag: Tag to match

        Returns:
            int: Number of entries invalidated
        """
        try:
            count = 0
            keys_to_remove = [
                key for key, entry in self.cache.items() if tag in entry.tags
            ]

            for key in keys_to_remove:
                if self.invalidate(key):
                    count += 1

            return count

        except Exception as e:
            logger.error(f"Error invalidating by tag: {str(e)}")
            return 0

    def clear(self):
        """Clear all cached entries.

        Returns:
            bool: True if successful
        """
        try:
            self.cache.clear()

            # Clear disk cache
            for cache_file in self.cache_dir.glob("*.cache"):
                cache_file.unlink()

            return True

        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False

    def _get_cache_path(self, key: str):
        """Get path for cache file.

        Args:
            key: Cache key

        Returns:
            Path: Cache file path
        """
        return self.cache_dir / f"{key}.cache"

    def _can_add_to_memory(self, size: int) -> bool:
        """Check if item can be added to cache.

        Args:
            size: Size in bytes

        Returns:
            bool: True if item can be added
        """
        current_size = sum(entry.size for entry in self.cache.values())
        return (
            current_size + size <= self.config.max_size
            and len(self.cache) < self.config.max_items
        )

    def _maybe_cleanup(self):
        """Maybe run cache cleanup."""
        now = datetime.utcnow()
        if (now - self.last_cleanup).total_seconds() >= self.config.cleanup_interval:
            self._cleanup()
            self.last_cleanup = now

    def _cleanup(self) -> None:
        """Clean up expired entries."""
        try:
            now = datetime.utcnow()
            keys_to_remove = []

            # Find expired entries
            for key, entry in self.cache.items():
                if (now - entry.created_at).total_seconds() > self.config.ttl:
                    keys_to_remove.append(key)

            # Remove expired entries
            for key in keys_to_remove:
                self.invalidate(key)

            # Check size limits
            while len(self.cache) > 0 and (
                sum(e.size for e in self.cache.values()) > self.config.max_size
                or len(self.cache) > self.config.max_items
            ):
                if not self._evict_one():
                    break

        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

    def _evict_one(self) -> bool:
        """Evict one entry based on policy.

        Returns:
            bool: True if successful
        """
        try:
            if not self.cache:
                return False

            key_to_evict = None

            if self.config.eviction_policy == "lru":
                # Least recently used
                key_to_evict = min(
                    self.cache.keys(), key=lambda k: self.cache[k].last_accessed
                )
            elif self.config.eviction_policy == "lfu":
                # Least frequently used
                key_to_evict = min(
                    self.cache.keys(), key=lambda k: self.cache[k].access_count
                )
            else:  # fifo
                # First in first out
                key_to_evict = min(
                    self.cache.keys(), key=lambda k: self.cache[k].created_at
                )

            if key_to_evict:
                return self.invalidate(key_to_evict)

            return False

        except Exception as e:
            logger.error(f"Error evicting cache entry: {str(e)}")
            return False

    def _load_cache(self):
        """Load cache from disk."""
        try:
            for cache_file in self.cache_dir.glob("*.cache"):
                try:
                    with open(cache_file, "rb") as f:
                        entry = pickle.load(f)
                        self.cache[entry.key] = entry
                except Exception as e:
                    logger.error(f"Error loading cache entry: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error loading cache: {str(e)}")
