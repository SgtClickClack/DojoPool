"""Secure caching implementation using Redis."""
from typing import Any, Optional, Union
import json
from datetime import timedelta

import redis
from redis.client import Redis
from redis.connection import ConnectionPool

class SecureCache:
    """Thread-safe and secure caching implementation using Redis."""
    
    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        ssl: bool = True,
        default_timeout: int = 300
    ) -> None:
        """Initialize the cache with Redis connection settings."""
        self.default_timeout = default_timeout
        self.pool = ConnectionPool(
            host=host,
            port=port,
            db=db,
            password=password,
            ssl=ssl,
            decode_responses=True
        )
        
    def _get_redis(self) -> Redis:
        """Get a Redis connection from the pool."""
        return redis.Redis(connection_pool=self.pool)
        
    def get(self, key: str) -> Any:
        """Get a value from the cache."""
        client = self._get_redis()
        value = client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
            
    def set(
        self,
        key: str,
        value: Any,
        timeout: Optional[Union[int, timedelta]] = None
    ) -> None:
        """Set a value in the cache with optional timeout."""
        client = self._get_redis()
        if timeout is None:
            timeout = self.default_timeout
            
        if isinstance(timeout, timedelta):
            timeout = int(timeout.total_seconds())
            
        try:
            value = json.dumps(value)
        except (TypeError, ValueError):
            if not isinstance(value, (str, bytes)):
                raise ValueError("Value must be JSON serializable or string")
                
        client.setex(key, timeout, value)
        
    def delete(self, key: str) -> None:
        """Delete a value from the cache."""
        client = self._get_redis()
        client.delete(key)
        
    def exists(self, key: str) -> bool:
        """Check if a key exists in the cache."""
        client = self._get_redis()
        return client.exists(key) > 0
        
    def clear(self) -> None:
        """Clear all keys from the cache."""
        client = self._get_redis()
        client.flushdb()
        
    def get_many(self, *keys: str) -> list[Any]:
        """Get multiple values from the cache."""
        client = self._get_redis()
        values = client.mget(keys)
        return [
            json.loads(v) if v is not None else None
            for v in values
        ]
        
    def set_many(
        self,
        mapping: dict[str, Any],
        timeout: Optional[Union[int, timedelta]] = None
    ) -> None:
        """Set multiple key-value pairs in the cache."""
        if timeout is None:
            timeout = self.default_timeout
            
        if isinstance(timeout, timedelta):
            timeout = int(timeout.total_seconds())
            
        client = self._get_redis()
        pipeline = client.pipeline()
        
        for key, value in mapping.items():
            try:
                value = json.dumps(value)
            except (TypeError, ValueError):
                if not isinstance(value, (str, bytes)):
                    raise ValueError(
                        f"Value for key {key} must be JSON serializable or string"
                    )
            pipeline.setex(key, timeout, value)
            
        pipeline.execute()
        
    def delete_many(self, *keys: str) -> None:
        """Delete multiple keys from the cache."""
        client = self._get_redis()
        client.delete(*keys)
        
    def incr(self, key: str) -> int:
        """Increment a value in the cache."""
        client = self._get_redis()
        return client.incr(key)
        
    def decr(self, key: str) -> int:
        """Decrement a value in the cache."""
        client = self._get_redis()
        return client.decr(key)
        
    def get_or_set(
        self,
        key: str,
        default: Any,
        timeout: Optional[Union[int, timedelta]] = None
    ) -> Any:
        """Get a value from the cache or set it if it doesn't exist."""
        value = self.get(key)
        if value is None:
            self.set(key, default, timeout)
            return default
        return value 