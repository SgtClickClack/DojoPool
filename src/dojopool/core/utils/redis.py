import os
from functools import lru_cache
from typing import Optional

import redis.asyncio as redis


@lru_cache()
def get_redis_client() -> redis.Redis:
    """
    Get a Redis client instance.
    Uses connection pooling and caches the client instance.
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Parse password from URL if present
    password = None
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
            redis.TCP_KEEPIDLE: 30,
            redis.TCP_KEEPINTVL: 5,
            redis.TCP_KEEPCNT: 3,
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

    async def set(self, key: str, value: str, expire: int = None):
        """Set a value in Redis with optional expiration in seconds"""
        try:
            return await self.redis.set(key, value, ex=expire)
        except Exception as e:
            print(f"Redis set error: {str(e)}")
            return False

    async def delete(self, key: str):
        """Delete a key from Redis"""
        try:
            return await self.redis.delete(key) > 0
        except Exception as e:
            print(f"Redis delete error: {str(e)}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if a key exists in Redis"""
        try:
            return await self.redis.exists(key) > 0
        except Exception as e:
            print(f"Redis exists error: {str(e)}")
            return False

    async def expire(self, key: str, seconds: int) -> bool:
        """Set expiration time for a key"""
        try:
            return await self.redis.expire(key, seconds)
        except Exception as e:
            print(f"Redis expire error: {str(e)}")
            return False

    async def ttl(self, key: str):
        """Get remaining time to live for a key in seconds"""
        try:
            return await self.redis.ttl(key)
        except Exception as e:
            print(f"Redis ttl error: {str(e)}")
            return -2  # -2 means key does not exist

    async def incr(self, key: str) -> Optional[int]:
        """Increment a counter"""
        try:
            return await self.redis.incr(key)
        except Exception as e:
            print(f"Redis incr error: {str(e)}")
            return None

    async def decr(self, key: str):
        """Decrement a counter"""
        try:
            return await self.redis.decr(key)
        except Exception as e:
            print(f"Redis decr error: {str(e)}")
            return None

    async def hget(self, name: str, key: str):
        """Get a value from a hash"""
        try:
            return await self.redis.hget(name, key)
        except Exception as e:
            print(f"Redis hget error: {str(e)}")
            return None

    async def hset(self, name: str, key: str, value: str):
        """Set a value in a hash"""
        try:
            return await self.redis.hset(name, key, value) > 0
        except Exception as e:
            print(f"Redis hset error: {str(e)}")
            return False

    async def hdel(self, name: str, key: str) -> bool:
        """Delete a key from a hash"""
        try:
            return await self.redis.hdel(name, key) > 0
        except Exception as e:
            print(f"Redis hdel error: {str(e)}")
            return False

    async def hgetall(self, name: str) -> dict:
        """Get all fields and values in a hash"""
        try:
            return await self.redis.hgetall(name)
        except Exception as e:
            print(f"Redis hgetall error: {str(e)}")
            return {}
