"""
Cache management system for optimizing image delivery and enabling offline support.
Implements browser caching strategies and service worker integration.
"""

import hashlib
import json
import logging
import os
import weakref
from dataclasses import dataclass
from datetime import datetime, timedelta
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
    ) -> None:
        self.max_size_bytes: int = max_size_mb * 1024 * 1024
        self.max_items: int = max_items
        self.ttl: timedelta = timedelta(seconds=ttl_seconds)
        self.cleanup_interval: timedelta = timedelta(seconds=cleanup_interval)
        self.eviction_policy: str = eviction_policy


class CacheManager:
    """Manages caching of processed images with various eviction policies."""

    def __init__(self, config: Optional[CacheConfig] = None) -> None:
        """Initialize cache manager with configuration."""
        self.config = config or CacheConfig()
        self._cache: Dict[str, CacheEntry] = {}
        self._size_bytes: int = 0
        self._last_cleanup: datetime = datetime.now()

        # Use weak references for values to allow garbage collection
        self._weak_cache: weakref.WeakValueDictionary = weakref.WeakValueDictionary()

        # Create cache directory if it doesn't exist
        self._cache_dir: Path = Path("cache")
        self._cache_dir.mkdir(exist_ok=True)

        # Load existing cache entries
        self._load_cache()

    def get(self, key: str) -> Optional[CacheEntry]:
        """Retrieve an item from cache."""
        try:
            # Check memory cache first
            entry = self._cache.get(key)
            if entry:
                # Update access metadata
                entry.last_accessed = datetime.now()
                return entry

            # Check disk cache
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                with open(cache_path, "rb") as f:
                    data = f.read()
                with open(f"{cache_path}.meta", "r") as f:
                    meta = json.load(f)

                # Create new cache entry
                entry = CacheEntry(
                    key=key,
                    data=data,
                    mime_type=meta["mime_type"],
                    size=len(data),
                    created_at=datetime.fromisoformat(meta["created_at"]),
                    last_accessed=datetime.now(),
                    access_count=meta["access_count"],
                    tags=set(meta["tags"]),
                )

                # Add to memory cache if within limits
                if self._can_add_to_memory(len(data)):
                    self._cache[key] = entry
                    self._size_bytes += len(data)

                return entry

            return None

        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None

    def put(self, key: str, data: bytes, mime_type: str, tags: Optional[Set[str]] = None) -> bool:
        """Add an item to cache."""
        try:
            # Check if cleanup is needed
            self._maybe_cleanup()

            # Create cache entry
            entry = CacheEntry(
                key=key,
                data=data,
                mime_type=mime_type,
                size=len(data),
                created_at=datetime.now(),
                last_accessed=datetime.now(),
                access_count=1,
                tags=tags or set(),
            )

            # Save to disk cache
            cache_path = self._get_cache_path(key)
            with open(cache_path, "wb") as f:
                f.write(data)

            # Save metadata
            meta = {
                "key": key,  # Store original key
                "mime_type": mime_type,
                "created_at": entry.created_at.isoformat(),
                "access_count": entry.access_count,
                "tags": list(entry.tags),
            }
            with open(f"{cache_path}.meta", "w") as f:
                json.dump(meta, f)

            # Add to memory cache if within limits
            if self._can_add_to_memory(len(data)):
                if key in self._cache:
                    self._size_bytes -= self._cache[key].size
                self._cache[key] = entry
                self._size_bytes += len(data)

            return True

        except Exception as e:
            logger.error(f"Error adding to cache: {str(e)}")
            return False

    def invalidate(self, key: str) -> bool:
        """Remove an item from cache."""
        try:
            success = True

            # Remove from memory cache
            if key in self._cache:
                self._size_bytes -= self._cache[key].size
                del self._cache[key]

            # Get cache paths
            cache_path = self._get_cache_path(key)
            meta_path = Path(f"{cache_path}.meta")

            # Remove from disk cache
            if cache_path.exists():
                try:
                    os.remove(cache_path)
                except OSError as e:
                    logger.error(f"Error removing cache file: {str(e)}")
                    success = False

            if meta_path.exists():
                try:
                    os.remove(meta_path)
                except OSError as e:
                    logger.error(f"Error removing meta file: {str(e)}")
                    success = False

            return success

        except Exception as e:
            logger.error(f"Error invalidating cache entry: {str(e)}")
            return False

    def invalidate_by_tag(self, tag: str) -> int:
        """Remove all items with the specified tag."""
        try:
            invalidated = 0

            # Find all keys with the tag in memory cache
            memory_keys = {key for key, entry in self._cache.items() if tag in entry.tags}

            # Find all keys with the tag in disk cache
            disk_keys = set()
            for meta_path in self._cache_dir.glob("*.meta"):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                    if tag in meta.get("tags", []):
                        # Reconstruct original key from metadata
                        disk_keys.add(meta.get("key"))
                except Exception as e:
                    logger.error(f"Error reading meta file: {str(e)}")

            # Combine and deduplicate keys
            all_keys = memory_keys | disk_keys

            # Invalidate each key
            for key in all_keys:
                if key and self.invalidate(key):
                    invalidated += 1

            return invalidated

        except Exception as e:
            logger.error(f"Error invalidating by tag: {str(e)}")
            return 0

    def clear(self) -> bool:
        """Clear all cache entries."""
        try:
            # Clear memory cache
            self._cache.clear()
            self._size_bytes = 0

            # Clear disk cache
            for path in self._cache_dir.glob("*"):
                os.remove(path)

            return True

        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False

    def _get_cache_path(self, key: str) -> Path:
        """Get the file path for a cache key."""
        # Use hash of key as filename to avoid filesystem issues
        filename = hashlib.sha256(key.encode()).hexdigest()
        return self._cache_dir / filename

    def _can_add_to_memory(self, size: int) -> bool:
        """Check if an item can be added to memory cache."""
        return (
            len(self._cache) < self.config.max_items
            and (self._size_bytes + size) <= self.config.max_size_bytes
        )

    def _maybe_cleanup(self) -> None:
        """Run cleanup if needed based on interval."""
        now = datetime.now()
        if (now - self._last_cleanup) >= self.config.cleanup_interval:
            self._cleanup()
            self._last_cleanup = now

    def _cleanup(self) -> None:
        """Clean up expired and excess entries."""
        try:
            now = datetime.now()

            # Remove expired entries
            expired = [
                key
                for key, entry in self._cache.items()
                if (now - entry.created_at) > self.config.ttl
            ]
            for key in expired:
                self.invalidate(key)

            # Check disk cache for expired entries
            for meta_path in self._cache_dir.glob("*.meta"):
                try:
                    with open(meta_path, "r") as f:
                        meta = json.load(f)
                    created_at = datetime.fromisoformat(meta["created_at"])
                    if (now - created_at) > self.config.ttl:
                        key = meta.get("key")
                        if key:
                            self.invalidate(key)
                except Exception as e:
                    logger.error(f"Error checking expired entry: {str(e)}")

            # Apply eviction policy if needed
            if len(self._cache) > self.config.max_items:
                self._apply_eviction_policy()

        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")

    def _apply_eviction_policy(self) -> None:
        """Apply the configured eviction policy."""
        try:
            if not self._cache:
                return

            if self.config.eviction_policy == "lru":
                # Remove least recently used
                key_to_remove = min(self._cache.items(), key=lambda x: x[1].last_accessed)[0]
            elif self.config.eviction_policy == "lfu":
                # Remove least frequently used
                key_to_remove = min(self._cache.items(), key=lambda x: x[1].access_count)[0]
            else:  # 'fifo'
                # Remove oldest entry
                key_to_remove = min(self._cache.items(), key=lambda x: x[1].created_at)[0]

            self.invalidate(key_to_remove)

        except Exception as e:
            logger.error(f"Error applying eviction policy: {str(e)}")

    def _load_cache(self) -> None:
        """Load existing cache entries from disk."""
        try:
            # Load metadata files
            for meta_path in self._cache_dir.glob("*.meta"):
                try:
                    # Read metadata
                    with open(meta_path, "r") as f:
                        meta = json.load(f)

                    # Get cache file path
                    key = meta.get("key")
                    if not key:
                        continue

                    cache_path = self._get_cache_path(key)
                    if not cache_path.exists():
                        continue

                    # Read cache data
                    with open(cache_path, "rb") as f:
                        data = f.read()

                    # Create cache entry
                    entry = CacheEntry(
                        key=key,
                        data=data,
                        mime_type=meta["mime_type"],
                        size=len(data),
                        created_at=datetime.fromisoformat(meta["created_at"]),
                        last_accessed=datetime.now(),
                        access_count=meta["access_count"],
                        tags=set(meta["tags"]),
                    )

                    # Add to memory cache if within limits
                    if self._can_add_to_memory(len(data)):
                        self._cache[key] = entry
                        self._size_bytes += len(data)

                except Exception as e:
                    logger.error(f"Error loading cache entry: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error loading cache: {str(e)}")
