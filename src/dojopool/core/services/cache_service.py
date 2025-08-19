"""Cache service module."""

from typing import Any, Dict, List, Optional, Union
from datetime import datetime, timedelta

from ..extensions import cache


class CacheService:
    """Cache service class for handling caching operations."""

    @staticmethod
    async def get(key: str) -> Optional[Any]:
        """Get a value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        return cache.get(key)

    @staticmethod
    async def set(key: str, value: Any, timeout: Optional[int] = None) -> None:
        """Set a value in cache.

        Args:
            key: Cache key
            value: Value to cache
            timeout: Cache timeout in seconds
        """
        cache.set(key, value, timeout=timeout)

    @staticmethod
    async def delete(key: str) -> None:
        """Delete a value from cache.

        Args:
            key: Cache key
        """
        cache.delete(key)

    @staticmethod
    async def clear() -> None:
        """Clear all cache."""
        cache.clear()

    @staticmethod
    async def get_many(keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache.

        Args:
            keys: List of cache keys

        Returns:
            Dictionary of cache keys and values
        """
        return {key: cache.get(key) for key in keys}

    @staticmethod
    async def set_many(mapping: Dict[str, Any], timeout: Optional[int] = None) -> None:
        """Set multiple values in cache.

        Args:
            mapping: Dictionary of cache keys and values
            timeout: Cache timeout in seconds
        """
        for key, value in mapping.items():
            cache.set(key, value, timeout=timeout)

    @staticmethod
    async def delete_many(keys: List[str]) -> None:
        """Delete multiple values from cache.

        Args:
            keys: List of cache keys
        """
        for key in keys:
            cache.delete(key)


cache_service = CacheService()
