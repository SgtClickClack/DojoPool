"""
Cache Decorators Module

This module provides decorators for caching function results.
"""

import functools
from typing import Any, Callable, Optional, Union
from datetime import timedelta
from .redis import RedisCache


def cached(
    key_prefix: str,
    expire: Optional[Union[int, timedelta]] = None,
    key_builder: Optional[Callable[..., str]] = None
):
    """Decorator for caching function results.
    
    Args:
        key_prefix: Prefix for cache key
        expire: Cache expiration time
        key_builder: Optional function to build cache key from args
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Get cache instance
            cache = RedisCache()
            
            # Build cache key
            if key_builder:
                key = key_builder(*args, **kwargs)
            else:
                # Default key building
                key_parts = [key_prefix]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = cache.get(key)
            if cached_value is not None:
                return cached_value
            
            # If not in cache, execute function
            result = func(*args, **kwargs)
            
            # Cache result
            if result is not None:
                cache.set(key, result, expire)
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """Decorator for invalidating cache entries.
    
    Args:
        pattern: Pattern to match cache keys to invalidate
    """
    def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Execute function
            result = func(*args, **kwargs)
            
            # Invalidate cache
            cache = RedisCache()
            cache.clear_pattern(pattern)
            
            return result
        return wrapper
    return decorator


def cached_many(
    key_prefix: str,
    expire: Optional[Union[int, timedelta]] = None,
    key_builder: Optional[Callable[..., list[str]]] = None
):
    """Decorator for caching multiple function results.
    
    Args:
        key_prefix: Prefix for cache keys
        expire: Cache expiration time
        key_builder: Optional function to build cache keys from args
    """
    def decorator(func: Callable[..., dict[str, Any]]) -> Callable[..., dict[str, Any]]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> dict[str, Any]:
            # Get cache instance
            cache = RedisCache()
            
            # Build cache keys
            if key_builder:
                keys = key_builder(*args, **kwargs)
            else:
                # Default key building
                keys = [
                    f"{key_prefix}:{arg}"
                    for arg in args
                ]
            
            # Try to get from cache
            cached_values = cache.get_many(keys)
            
            # Get missing keys
            missing_keys = [k for k in keys if k not in cached_values]
            
            if not missing_keys:
                return cached_values
            
            # Execute function for missing keys
            result = func(*args, **kwargs)
            
            # Cache new results
            if result:
                cache.set_many(result, expire)
                cached_values.update(result)
            
            return cached_values
        return wrapper
    return decorator 