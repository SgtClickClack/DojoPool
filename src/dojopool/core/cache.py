"""Cache management module for DojoPool."""

import json
import logging
import time
from typing import Any, Dict, Optional, Union
from functools import wraps
import redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

class CacheManager:
    """Multi-level cache manager with Redis and in-memory caching."""
    
    def __init__(
        self,
        redis_host: str = 'localhost',
        redis_port: int = 6379,
        redis_db: int = 0,
        redis_password: Optional[str] = None,
        default_ttl: int = 3600,  # 1 hour
        local_cache_size: int = 1000,  # Maximum number of items in local cache
        enable_local_cache: bool = True
    ):
        """Initialize cache manager.
        
        Args:
            redis_host: Redis server host
            redis_port: Redis server port
            redis_db: Redis database number
            redis_password: Redis password
            default_ttl: Default time-to-live for cache entries (seconds)
            local_cache_size: Maximum number of items in local cache
            enable_local_cache: Whether to enable local in-memory cache
        """
        self.default_ttl = default_ttl
        self.local_cache_size = local_cache_size
        self.enable_local_cache = enable_local_cache
        
        # Initialize Redis connection
        try:
            self.redis = redis.Redis(
                host=redis_host,
                port=redis_port,
                db=redis_db,
                password=redis_password,
                decode_responses=True
            )
            self.redis.ping()  # Test connection
            logger.info("Redis connection established")
        except RedisError as e:
            logger.error(f"Redis connection failed: {e}")
            self.redis = None
        
        # Initialize local cache
        if enable_local_cache:
            self.local_cache: Dict[str, Dict[str, Any]] = {}
            self.cache_hits = 0
            self.cache_misses = 0
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get value from cache.
        
        Args:
            key: Cache key
            default: Default value if key not found
            
        Returns:
            Cached value or default
        """
        # Try local cache first
        if self.enable_local_cache:
            local_value = self.local_cache.get(key)
            if local_value is not None:
                if time.time() < local_value.get('expires_at', 0):
                    self.cache_hits += 1
                    return local_value['value']
                else:
                    # Remove expired entry
                    del self.local_cache[key]
        
        # Try Redis
        if self.redis:
            try:
                value = self.redis.get(key)
                if value is not None:
                    value = json.loads(value)
                    # Update local cache
                    if self.enable_local_cache:
                        ttl = self.redis.ttl(key)
                        if ttl > 0:
                            self.set_local(key, value, ttl)
                    return value
            except (RedisError, json.JSONDecodeError) as e:
                logger.error(f"Error getting value from Redis: {e}")
        
        if self.enable_local_cache:
            self.cache_misses += 1
        return default
    
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None,
        nx: bool = False,
        xx: bool = False
    ) -> bool:
        """Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (None for default)
            nx: Only set if key doesn't exist
            xx: Only set if key exists
            
        Returns:
            bool: Whether the value was set
        """
        ttl = ttl if ttl is not None else self.default_ttl
        
        # Set in Redis
        if self.redis:
            try:
                serialized = json.dumps(value)
                if nx:
                    success = self.redis.set(key, serialized, ex=ttl, nx=True)
                elif xx:
                    success = self.redis.set(key, serialized, ex=ttl, xx=True)
                else:
                    success = self.redis.set(key, serialized, ex=ttl)
                
                if success and self.enable_local_cache:
                    self.set_local(key, value, ttl)
                return bool(success)
            except (RedisError, TypeError) as e:
                logger.error(f"Error setting value in Redis: {e}")
                return False
        
        # If Redis is not available, only set in local cache
        if self.enable_local_cache:
            self.set_local(key, value, ttl)
            return True
        
        return False
    
    def set_local(self, key: str, value: Any, ttl: int):
        """Set value in local cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds
        """
        # Ensure local cache doesn't exceed size limit
        if len(self.local_cache) >= self.local_cache_size:
            # Remove oldest entry
            oldest_key = min(
                self.local_cache.keys(),
                key=lambda k: self.local_cache[k].get('expires_at', 0)
            )
            del self.local_cache[oldest_key]
        
        self.local_cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl
        }
    
    def delete(self, key: str) -> bool:
        """Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            bool: Whether the value was deleted
        """
        success = True
        
        # Delete from Redis
        if self.redis:
            try:
                success = bool(self.redis.delete(key))
            except RedisError as e:
                logger.error(f"Error deleting value from Redis: {e}")
                success = False
        
        # Delete from local cache
        if self.enable_local_cache and key in self.local_cache:
            del self.local_cache[key]
        
        return success
    
    def flush(self):
        """Flush all caches."""
        if self.redis:
            try:
                self.redis.flushdb()
            except RedisError as e:
                logger.error(f"Error flushing Redis: {e}")
        
        if self.enable_local_cache:
            self.local_cache.clear()
            self.cache_hits = 0
            self.cache_misses = 0
    
    def get_stats(self) -> Dict[str, Union[int, float]]:
        """Get cache statistics.
        
        Returns:
            Dict containing cache statistics
        """
        stats = {
            'local_cache_enabled': self.enable_local_cache,
            'redis_connected': bool(self.redis)
        }
        
        if self.enable_local_cache:
            total_requests = self.cache_hits + self.cache_misses
            hit_rate = (
                self.cache_hits / total_requests * 100
                if total_requests > 0 else 0
            )
            stats.update({
                'local_cache_size': len(self.local_cache),
                'local_cache_limit': self.local_cache_size,
                'cache_hits': self.cache_hits,
                'cache_misses': self.cache_misses,
                'hit_rate': round(hit_rate, 2)
            })
        
        if self.redis:
            try:
                info = self.redis.info()
                stats.update({
                    'redis_used_memory': info['used_memory'],
                    'redis_hits': info['keyspace_hits'],
                    'redis_misses': info['keyspace_misses'],
                    'redis_evicted_keys': info['evicted_keys']
                })
            except RedisError as e:
                logger.error(f"Error getting Redis stats: {e}")
        
        return stats

def cached(
    ttl: Optional[int] = None,
    key_prefix: str = '',
    key_pattern: Optional[str] = None
):
    """Decorator for caching function results.
    
    Args:
        ttl: Time-to-live in seconds (None for default)
        key_prefix: Prefix for cache key
        key_pattern: Pattern for generating cache key from function arguments
        
    Returns:
        Decorated function
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_pattern:
                try:
                    cache_key = key_pattern.format(*args, **kwargs)
                except (KeyError, IndexError) as e:
                    logger.error(f"Error generating cache key: {e}")
                    return func(*args, **kwargs)
            else:
                # Default key pattern: function_name:arg1:arg2:kwarg1=val1:...
                arg_parts = [str(arg) for arg in args]
                kwarg_parts = [f"{k}={v}" for k, v in sorted(kwargs.items())]
                cache_key = ':'.join([func.__name__] + arg_parts + kwarg_parts)
            
            if key_prefix:
                cache_key = f"{key_prefix}:{cache_key}"
            
            # Get cache manager instance
            cache = CacheManager()  # You might want to use a singleton pattern
            
            # Try to get from cache
            result = cache.get(cache_key)
            if result is not None:
                return result
            
            # Call function and cache result
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl=ttl)
            return result
        
        return wrapper
    return decorator