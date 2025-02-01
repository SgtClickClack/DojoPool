"""Cache module."""

import json
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict, List, Optional, Union

from flask_caching import Cache

cache = Cache()


class CacheService:
    """Cache service."""

    def __init__(self):
        """Initialize cache service."""
        self.default_timeout = 300  # 5 minutes

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        return cache.get(key)

    def set(self, key: str, value: Any, timeout: Optional[int] = None) -> None:
        """Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            timeout: Cache timeout in seconds
        """
        cache.set(key, value, timeout=timeout or self.default_timeout)

    def delete(self, key: str) -> None:
        """Delete value from cache.

        Args:
            key: Cache key
        """
        cache.delete(key)

    def exists(self, key: str) -> bool:
        """Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists
        """
        return cache.has(key)

    def clear(self) -> None:
        """Clear all cache entries."""
        cache.clear()

    def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache.

        Args:
            keys: List of cache keys

        Returns:
            Dict of key-value pairs
        """
        return {key: value for key, value in zip(keys, cache.get_many(*keys)) if value is not None}

    def set_many(self, mapping: Dict[str, Any], timeout: Optional[int] = None) -> None:
        """Set multiple values in cache.

        Args:
            mapping: Dict of key-value pairs
            timeout: Cache timeout in seconds
        """
        cache.set_many(mapping, timeout=timeout or self.default_timeout)

    def delete_many(self, keys: List[str]) -> None:
        """Delete multiple values from cache.

        Args:
            keys: List of cache keys
        """
        cache.delete_many(*keys)

    def incr(self, key: str, delta: int = 1) -> int:
        """Increment value in cache.

        Args:
            key: Cache key
            delta: Increment amount

        Returns:
            New value
        """
        return cache.inc(key, delta)

    def decr(self, key: str, delta: int = 1) -> int:
        """Decrement value in cache.

        Args:
            key: Cache key
            delta: Decrement amount

        Returns:
            New value
        """
        return cache.dec(key, delta)

    def cached(self, key_prefix: str, timeout: Optional[int] = None):
        """Cache decorator.

        Args:
            key_prefix: Cache key prefix
            timeout: Cache timeout in seconds

        Returns:
            Decorator function
        """

        def decorator(f):
            @wraps(f)
            def wrapper(*args, **kwargs):
                # Generate cache key
                key_parts = [key_prefix]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
                cache_key = ":".join(key_parts)

                # Try to get from cache
                result = self.get(cache_key)
                if result is not None:
                    return result

                # Call function and cache result
                result = f(*args, **kwargs)
                self.set(cache_key, result, timeout=timeout or self.default_timeout)
                return result

            return wrapper

        return decorator


cache_service = CacheService()

__all__ = ["cache", "cache_service", "CacheService"]
