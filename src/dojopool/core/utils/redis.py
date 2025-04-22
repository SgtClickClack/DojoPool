import os
from functools import lru_cache
from typing import Optional, Any
import socket
import redis.asyncio as redis

@lru_cache()
def get_redis_client() -> redis.Redis:
    """
    Get a Redis client instance.
    Uses connection pooling and caches the client instance.
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Parse password from URL if present
    password = os.getenv("REDIS_PASSWORD", "A16aql5hjk86zqm2ham78r9rnmgkyz6bk88vih6sugp23giq8ht")
    if "@" in redis_url:
        # Extract password from redis://[:password@]host:port/db
        auth_part = redis_url.split("@")[0].split("://")[1]
        if ":" in auth_part:
            password = auth_part.split(":")[1]
        redis_url = f"redis://{redis_url.split('@')[1]}"

    return redis.Redis.from_url(
        redis_url,
        password=password,
        decode_responses=True,
        encoding="utf-8",
        socket_timeout=5.0,
        socket_connect_timeout=5.0,
        socket_keepalive=True,
        health_check_interval=30,
        retry_on_timeout=True,
        max_connections=10,
        socket_keepalive_options={
            socket.TCP_KEEPIDLE: 30,
            socket.TCP_KEEPINTVL: 5,
            socket.TCP_KEEPCNT: 3,
        },
    )

class RedisCache:
    """Helper class for common Redis caching operations"""

    def __init__(self):
        self.redis = get_redis_client()

    async def get(self, key: str) -> Optional[str]:
        """Get a value from Redis"""
        try:
            return await self.redis.get(key)
        except Exception as e:
            print(f"Redis get error: {str(e)}")
            return None

    async def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        """Set a value in Redis with optional expiration in seconds"""
        try:
            if expire is not None:
                result = await self.redis.set(key, value, ex=expire)
            else:
                result = await self.redis.set(key, value)
            return result
        except Exception as e:
            print(f"Redis set error: {str(e)}")
            return False

    async def delete(self, key: str) -> int:
        """Delete a key from Redis"""
        try:
            return await self.redis.delete(key)
        except Exception as e:
            print(f"Redis delete error: {str(e)}")
            return 0

    async def exists(self, key: str) -> int:
        """Check if a key exists in Redis"""
        try:
            return await self.redis.exists(key)
        except Exception as e:
            print(f"Redis exists error: {str(e)}")
            return 0

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration time for a key"""
        try:
            return await self.redis.expire(key, seconds)
        except Exception as e:
            print(f"Redis expire error: {str(e)}")
            return False

    async def ttl(self, key: str) -> int:
        """Get remaining time to live for a key in seconds"""
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            print(f"Redis ttl error: {str(e)}")
            return -2  # -2 means key does not exist

    async def incr(self, key: str) -> int:
        """Increment a counter"""
        try:
            return await self.redis.incr(key)
        except Exception as e:
            print(f"Redis incr error: {str(e)}")
            return 0

    async def decr(self, key: str) -> int:
        """Decrement a counter"""
        try:
            return await self.redis.decr(key)
        except Exception as e:
            print(f"Redis decr error: {str(e)}")
            return 0

    async def hget(self, name: str, key: str) -> Optional[str]:
        """Get a value from a hash"""
        try:
            # redis.hget may return a coroutine or a direct result (str/None), so check type
            result: Any = self.redis.hget(name, key)
            if hasattr(result, "__await__"):
                result = await result
            if isinstance(result, (str, type(None))):
                return result
            return None
        except Exception as e:
            print(f"Redis hget error: {str(e)}")
            return None

    async def hset(self, name: str, key: str, value: str) -> int:
        """Set a value in a hash"""
        try:
            result: Any = self.redis.hset(name, key, value)
            if hasattr(result, "__await__"):
                result = await result
            if isinstance(result, int):
                return result
            return 0
        except Exception as e:
            print(f"Redis hset error: {str(e)}")
            return 0

    async def hdel(self, name: str, key: str) -> int:
        """Delete a key from a hash"""
        try:
            result: Any = self.redis.hdel(name, key)
            if hasattr(result, "__await__"):
                result = await result
            if isinstance(result, int):
                return result
            return 0
        except Exception as e:
            print(f"Redis hdel error: {str(e)}")
            return 0

    async def hgetall(self, name: str) -> dict:
        """Get all fields and values in a hash"""
        try:
            result: Any = self.redis.hgetall(name)
            if hasattr(result, "__await__"):
                result = await result
            if isinstance(result, dict):
                return result
            return {}
        except Exception as e:
            print(f"Redis hgetall error: {str(e)}")
            return {}
