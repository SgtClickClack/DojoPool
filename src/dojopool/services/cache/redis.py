"""
Redis Cache Service Module

This module provides Redis caching functionality for the application.
"""

import json
from typing import Any, Optional, Union
from datetime import timedelta
import redis
from ..core.config import settings


class RedisCache:
    """Redis cache service for managing cached data."""

    def __init__(self):
        """Initialize Redis connection."""
        self.redis = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=settings.REDIS_DB,
            password=settings.REDIS_PASSWORD,
            decode_responses=True
        )

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if not found
        """
        try:
            value = self.redis.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None

    def set(
        self,
        key: str,
        value: Any,
        expire: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds or timedelta
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.redis.set(
                key,
                json.dumps(value),
                ex=expire
            )
            return True
        except Exception:
            return False

    def delete(self, key: str) -> bool:
        """Delete value from cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return bool(self.redis.delete(key))
        except Exception:
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists in cache.
        
        Args:
            key: Cache key
            
        Returns:
            True if key exists, False otherwise
        """
        try:
            return bool(self.redis.exists(key))
        except Exception:
            return False

    def clear_pattern(self, pattern: str) -> bool:
        """Clear all keys matching pattern.
        
        Args:
            pattern: Key pattern to match
            
        Returns:
            True if successful, False otherwise
        """
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
            return True
        except Exception:
            return False

    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment value in cache.
        
        Args:
            key: Cache key
            amount: Amount to increment by
            
        Returns:
            New value or None if failed
        """
        try:
            return self.redis.incrby(key, amount)
        except Exception:
            return None

    def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrement value in cache.
        
        Args:
            key: Cache key
            amount: Amount to decrement by
            
        Returns:
            New value or None if failed
        """
        try:
            return self.redis.decrby(key, amount)
        except Exception:
            return None

    def get_many(self, keys: list[str]) -> dict[str, Any]:
        """Get multiple values from cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            Dictionary of key-value pairs
        """
        try:
            values = self.redis.mget(keys)
            return {
                key: json.loads(value)
                for key, value in zip(keys, values)
                if value is not None
            }
        except Exception:
            return {}

    def set_many(
        self,
        items: dict[str, Any],
        expire: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """Set multiple values in cache.
        
        Args:
            items: Dictionary of key-value pairs
            expire: Expiration time in seconds or timedelta
            
        Returns:
            True if successful, False otherwise
        """
        try:
            pipeline = self.redis.pipeline()
            for key, value in items.items():
                pipeline.set(
                    key,
                    json.dumps(value),
                    ex=expire
                )
            pipeline.execute()
            return True
        except Exception:
            return False

    def delete_many(self, keys: list[str]) -> bool:
        """Delete multiple values from cache.
        
        Args:
            keys: List of cache keys
            
        Returns:
            True if successful, False otherwise
        """
        try:
            return bool(self.redis.delete(*keys))
        except Exception:
            return False 