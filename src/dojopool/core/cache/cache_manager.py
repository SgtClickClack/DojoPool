"""
Cache management system for optimizing image delivery and enabling offline support.
Implements browser caching strategies and service worker integration.
"""

from typing import Optional, Dict, Any, List, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
import json
import os
import hashlib
from pathlib import Path
import weakref

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
        eviction_policy: str = 'lru'  # 'lru', 'lfu', or 'fifo'
    ):
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.max_items = max_items
        self.ttl = timedelta(seconds=ttl_seconds)
        self.cleanup_interval = timedelta(seconds=cleanup_interval)
        self.eviction_policy = eviction_policy

class CacheManager:
    """Manages caching of processed images with various eviction policies."""
    
    def __init__(self, config: Optional[CacheConfig] = None):
        """Initialize cache manager with configuration."""
        self.config = config or CacheConfig()
        self._cache: Dict[str, CacheEntry] = {}
        self._size_bytes = 0
        self._last_cleanup = datetime.now()
        
        # Use weak references for values to allow garbage collection
        self._weak_cache = weakref.WeakValueDictionary()
        
        # Create cache directory if it doesn't exist
        self._cache_dir = Path('cache')
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
                entry.access_count += 1
                return entry
            
            # Check disk cache
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                with open(cache_path, 'rb') as f:
                    data = f.read()
                with open(f"{cache_path}.meta", 'r') as f:
                    meta = json.load(f)
                
                # Create new cache entry
                entry = CacheEntry(
                    key=key,
                    data=data,
                    mime_type=meta['mime_type'],
                    size=len(data),
                    created_at=datetime.fromisoformat(meta['created_at']),
                    last_accessed=datetime.now(),
                    access_count=meta['access_count'] + 1,
                    tags=set(meta['tags'])
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
    
    def put(
        self,
        key: str,
        data: bytes,
        mime_type: str,
        tags: Optional[Set[str]] = None
    ) -> bool:
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
                tags=tags or set()
            )
            
            # Save to disk cache
            cache_path = self._get_cache_path(key)
            with open(cache_path, 'wb') as f:
                f.write(data)
            
            # Save metadata
            meta = {
                'mime_type': mime_type,
                'created_at': entry.created_at.isoformat(),
                'access_count': entry.access_count,
                'tags': list(entry.tags)
            }
            with open(f"{cache_path}.meta", 'w') as f:
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
            # Remove from memory cache
            if key in self._cache:
                self._size_bytes -= self._cache[key].size
                del self._cache[key]
            
            # Remove from disk cache
            cache_path = self._get_cache_path(key)
            if cache_path.exists():
                os.remove(cache_path)
            meta_path = Path(f"{cache_path}.meta")
            if meta_path.exists():
                os.remove(meta_path)
            
            return True
            
        except Exception as e:
            logger.error(f"Error invalidating cache entry: {str(e)}")
            return False
    
    def invalidate_by_tag(self, tag: str) -> int:
        """Remove all items with the specified tag."""
        try:
            invalidated = 0
            keys_to_remove = [
                key for key, entry in self._cache.items()
                if tag in entry.tags
            ]
            
            for key in keys_to_remove:
                if self.invalidate(key):
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
            for path in self._cache_dir.glob('*'):
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
            len(self._cache) < self.config.max_items and
            (self._size_bytes + size) <= self.config.max_size_bytes
        )
    
    def _maybe_cleanup(self) -> None:
        """Perform cleanup if needed."""
        now = datetime.now()
        if (now - self._last_cleanup) >= self.config.cleanup_interval:
            self._cleanup()
            self._last_cleanup = now
    
    def _cleanup(self) -> None:
        """Clean up expired and excess entries."""
        try:
            now = datetime.now()
            
            # Remove expired entries
            expired_keys = [
                key for key, entry in self._cache.items()
                if (now - entry.created_at) > self.config.ttl
            ]
            
            for key in expired_keys:
                self.invalidate(key)
            
            # If still over limits, apply eviction policy
            while (
                len(self._cache) > self.config.max_items or
                self._size_bytes > self.config.max_size_bytes
            ):
                if not self._evict_one():
                    break
                
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
    
    def _evict_one(self) -> bool:
        """Evict one item based on the configured policy."""
        if not self._cache:
            return False
        
        try:
            if self.config.eviction_policy == 'lru':
                # Least Recently Used
                key_to_evict = min(
                    self._cache.keys(),
                    key=lambda k: self._cache[k].last_accessed
                )
            elif self.config.eviction_policy == 'lfu':
                # Least Frequently Used
                key_to_evict = min(
                    self._cache.keys(),
                    key=lambda k: self._cache[k].access_count
                )
            else:
                # FIFO (First In First Out)
                key_to_evict = min(
                    self._cache.keys(),
                    key=lambda k: self._cache[k].created_at
                )
            
            return self.invalidate(key_to_evict)
            
        except Exception as e:
            logger.error(f"Error during eviction: {str(e)}")
            return False
    
    def _load_cache(self) -> None:
        """Load existing cache entries from disk."""
        try:
            for meta_path in self._cache_dir.glob('*.meta'):
                try:
                    # Load metadata
                    with open(meta_path, 'r') as f:
                        meta = json.load(f)
                    
                    # Load data if within memory limits
                    data_path = meta_path.with_suffix('')
                    if data_path.exists():
                        with open(data_path, 'rb') as f:
                            data = f.read()
                        
                        if self._can_add_to_memory(len(data)):
                            entry = CacheEntry(
                                key=meta_path.stem,
                                data=data,
                                mime_type=meta['mime_type'],
                                size=len(data),
                                created_at=datetime.fromisoformat(meta['created_at']),
                                last_accessed=datetime.fromisoformat(meta['created_at']),
                                access_count=meta['access_count'],
                                tags=set(meta['tags'])
                            )
                            self._cache[meta_path.stem] = entry
                            self._size_bytes += len(data)
                
                except Exception as e:
                    logger.error(f"Error loading cache entry: {str(e)}")
                    continue
                    
        except Exception as e:
            logger.error(f"Error loading cache: {str(e)}")
``` 