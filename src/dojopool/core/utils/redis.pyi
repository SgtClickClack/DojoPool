import os
from functools import lru_cache
from typing import Optional

import redis.asyncio as redis

def get_redis_client() -> redis.Redis: ...

class RedisCache:
    pass
