"""Cache management system with advanced invalidation and memory optimization."""
import time
from typing import Any, Dict, List, Optional, Set, Tuple
from datetime import datetime, timedelta
import redis
from redis.exceptions import RedisError
import logging
import json
import sys
from functools import wraps
import weakref

logger = logging.getLogger(__name__)

class CacheInvalidationStrategy:
    """Handles cache invalidation decisions."""
    
    def __init__(self):
        self.access_counts: Dict[str, int] = {}
        self.last_accessed: Dict[str, float] = {}
        self.dependencies: Dict[str, Set[str]] = {}
        
    def record_access(self, key: str) -> None:
        """Record cache key access."""
        self.access_counts[key] = self.access_counts.get(key, 0) + 1
        self.last_accessed[key] = time.time()
        
    def add_dependency(self, key: str, depends_on: str) -> None:
        """Add a dependency between cache keys."""
        if key not in self.dependencies:
            self.dependencies[key] = set()
        self.dependencies[key].add(depends_on)
        
    def get_dependent_keys(self, key: str) -> Set[str]:
        """Get all keys that depend on the given key."""
        dependent_keys = set()
        for k, deps in self.dependencies.items():
            if key in deps:
                dependent_keys.add(k)
                dependent_keys.update(self.get_dependent_keys(k))
        return dependent_keys
        
    def should_invalidate(self, key: str, age: float, access_count: int) -> bool:
        """Determine if a cache entry should be invalidated."""
        if age > 24 * 3600:  # Older than 24 hours
            return access_count < 10  # Invalidate if rarely accessed
        if age > 3600:  # Older than 1 hour
            return access_count < 5  # Invalidate if very rarely accessed
        return False

class MemoryOptimizer:
    """Optimizes memory usage for cached items."""
    
    def __init__(self, max_memory_mb: int = 100):
        self.max_memory = max_memory_mb * 1024 * 1024  # Convert to bytes
        self.current_memory = 0
        self.item_sizes: Dict[str, int] = {}
        
    def estimate_size(self, value: Any) -> int:
        """Estimate memory size of a cached value."""
        if isinstance(value, (str, bytes)):
            return sys.getsizeof(value)
        try:
            return sys.getsizeof(json.dumps(value))
        except (TypeError, ValueError):
            return sys.getsizeof(str(value))
            
    def can_store(self, size: int) -> bool:
        """Check if there's enough memory to store an item."""
        return self.current_memory + size <= self.max_memory
        
    def register_item(self, key: str, value: Any) -> None:
        """Register a new cached item."""
        size = self.estimate_size(value)
        self.item_sizes[key] = size
        self.current_memory += size
        
    def unregister_item(self, key: str) -> None:
        """Unregister a cached item."""
        if key in self.item_sizes:
            self.current_memory -= self.item_sizes[key]
            del self.item_sizes[key]
            
    def get_items_to_evict(self, needed_space: int) -> List[str]:
        """Get items to evict to free up space."""
        if needed_space > self.max_memory:
            return list(self.item_sizes.keys())
            
        items_to_evict = []
        space_to_free = needed_space - (self.max_memory - self.current_memory)
        
        if space_to_free <= 0:
            return items_to_evict
            
        # Sort items by size, largest first
        sorted_items = sorted(
            self.item_sizes.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        freed_space = 0
        for key, size in sorted_items:
            items_to_evict.append(key)
            freed_space += size
            if freed_space >= space_to_free:
                break
                
        return items_to_evict

class CacheManager:
    """Advanced cache management system with invalidation and memory optimization."""
    
    def __init__(
        self,
        redis_host: str = 'localhost',
        redis_port: int = 6379,
        redis_db: int = 0,
        redis_password: Optional[str] = None,
        default_ttl: int = 3600,  # 1 hour
        local_cache_size: int = 1000,  # Maximum number of items in local cache
        enable_local_cache: bool = True,
        max_memory_mb: int = 100
    ):
        # Redis connection
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            password=redis_password,
            decode_responses=True
        )
        
        # Configuration
        self.default_ttl = default_ttl
        self.local_cache_size = local_cache_size
        self.enable_local_cache = enable_local_cache
        
        # Initialize components
        self.invalidation = CacheInvalidationStrategy()
        self.memory_optimizer = MemoryOptimizer(max_memory_mb)
        
        # Statistics
        self.stats = {
            'hits': 0,
            'misses': 0,
            'invalidations': 0,
            'memory_evictions': 0
        }
        
        # Initialize local cache with weak references
        if enable_local_cache:
            self.local_cache: Dict[str, Tuple[weakref.ref, float]] = {}
            
        # Start maintenance task
        self._schedule_maintenance()
        
    def _schedule_maintenance(self) -> None:
        """Schedule periodic maintenance tasks."""
        import threading
        maintenance_thread = threading.Thread(
            target=self._maintenance_task,
            daemon=True
        )
        maintenance_thread.start()
        
    def _maintenance_task(self) -> None:
        """Periodic maintenance task."""
        while True:
            try:
                self._cleanup_expired()
                self._optimize_memory()
                time.sleep(60)  # Run every minute
            except Exception as e:
                logger.error(f"Maintenance task error: {e}")
                
    def _cleanup_expired(self) -> None:
        """Clean up expired cache entries."""
        now = time.time()
        keys_to_remove = []
        
        for key, (value_ref, expiry) in self.local_cache.items():
            if expiry < now or value_ref() is None:
                keys_to_remove.append(key)
                
        for key in keys_to_remove:
            self.invalidate(key)
            
    def _optimize_memory(self) -> None:
        """Optimize memory usage."""
        if not self.enable_local_cache:
            return
            
        # Get items to evict based on memory pressure
        items_to_evict = self.memory_optimizer.get_items_to_evict(0)
        
        # Evict items
        for key in items_to_evict:
            self.invalidate(key)
            self.stats['memory_evictions'] += 1
            
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        dependencies: Optional[List[str]] = None
    ) -> None:
        """Set a cache entry with optional TTL and dependencies."""
        try:
            # Check memory constraints
            size = self.memory_optimizer.estimate_size(value)
            if not self.memory_optimizer.can_store(size):
                # Evict items to make space
                items_to_evict = self.memory_optimizer.get_items_to_evict(size)
                for item_key in items_to_evict:
                    self.invalidate(item_key)
                    
            # Store in Redis
            ttl = ttl or self.default_ttl
            expiry = time.time() + ttl
            
            data = {
                'value': value,
                'expiry': expiry,
                'dependencies': dependencies or []
            }
            
            self.redis.setex(
                key,
                ttl,
                json.dumps(data)
            )
            
            # Store in local cache if enabled
            if self.enable_local_cache:
                self.local_cache[key] = (weakref.ref(value), expiry)
                self.memory_optimizer.register_item(key, value)
                
            # Register dependencies
            if dependencies:
                for dep in dependencies:
                    self.invalidation.add_dependency(key, dep)
                    
        except RedisError as e:
            logger.error(f"Redis error while setting key {key}: {e}")
            
    def get(self, key: str) -> Optional[Any]:
        """Get a cache entry."""
        try:
            # Check local cache first
            if self.enable_local_cache and key in self.local_cache:
                value_ref, expiry = self.local_cache[key]
                value = value_ref()
                
                if value is not None and expiry > time.time():
                    self.stats['hits'] += 1
                    self.invalidation.record_access(key)
                    return value
                    
            # Try Redis
            data = self.redis.get(key)
            if data:
                try:
                    parsed = json.loads(data)
                    value = parsed['value']
                    expiry = parsed['expiry']
                    
                    if expiry > time.time():
                        self.stats['hits'] += 1
                        self.invalidation.record_access(key)
                        
                        # Update local cache
                        if self.enable_local_cache:
                            self.local_cache[key] = (weakref.ref(value), expiry)
                            self.memory_optimizer.register_item(key, value)
                            
                        return value
                        
                except (json.JSONDecodeError, KeyError) as e:
                    logger.error(f"Error parsing cache data for key {key}: {e}")
                    
            self.stats['misses'] += 1
            return None
            
        except RedisError as e:
            logger.error(f"Redis error while getting key {key}: {e}")
            return None
            
    def invalidate(self, key: str) -> None:
        """Invalidate a cache entry and its dependents."""
        try:
            # Get dependent keys
            dependent_keys = self.invalidation.get_dependent_keys(key)
            dependent_keys.add(key)
            
            # Remove from Redis
            self.redis.delete(*dependent_keys)
            
            # Remove from local cache
            if self.enable_local_cache:
                for dep_key in dependent_keys:
                    if dep_key in self.local_cache:
                        self.memory_optimizer.unregister_item(dep_key)
                        del self.local_cache[dep_key]
                        
            self.stats['invalidations'] += len(dependent_keys)
            
        except RedisError as e:
            logger.error(f"Redis error while invalidating key {key}: {e}")
            
    def clear(self) -> None:
        """Clear all cache entries."""
        try:
            self.redis.flushdb()
            if self.enable_local_cache:
                self.local_cache.clear()
                self.memory_optimizer = MemoryOptimizer(
                    self.memory_optimizer.max_memory // (1024 * 1024)
                )
        except RedisError as e:
            logger.error(f"Redis error while clearing cache: {e}")
            
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            **self.stats,
            'memory_usage': self.memory_optimizer.current_memory,
            'memory_limit': self.memory_optimizer.max_memory,
            'local_cache_size': len(self.local_cache) if self.enable_local_cache else 0,
            'local_cache_limit': self.local_cache_size
        }

def cached(
    ttl: Optional[int] = None,
    key_prefix: str = '',
    dependencies: Optional[List[str]] = None
):
    """Decorator for caching function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Generate cache key
            key_parts = [key_prefix or func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            cache_key = ':'.join(key_parts)
            
            # Try to get from cache
            result = self.cache_manager.get(cache_key)
            if result is not None:
                return result
                
            # Call function and cache result
            result = func(self, *args, **kwargs)
            self.cache_manager.set(
                cache_key,
                result,
                ttl=ttl,
                dependencies=dependencies
            )
            return result
            
        return wrapper
    return decorator