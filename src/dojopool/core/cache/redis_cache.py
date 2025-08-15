"""Redis cache configuration for API optimization."""

from functools import wraps
import json
from typing import Any, Callable, Optional, Union
import os

from redis import Redis
import fakeredis
from flask import current_app, request

# Use fakeredis for development if REDIS_USE_FAKE is set
REDIS_USE_FAKE = os.environ.get("REDIS_USE_FAKE", "true").lower() == "true"

if REDIS_USE_FAKE:
    redis_client = fakeredis.FakeStrictRedis(decode_responses=True)
else:
    redis_client = Redis(
        host=current_app.config.get("REDIS_HOST", "localhost"),
        port=current_app.config.get("REDIS_PORT", 6379),
        db=current_app.config.get("REDIS_DB", 0),
        decode_responses=True,
    )


def cache_key_prefix() -> str:
    """Get cache key prefix from config."""
    return current_app.config.get("CACHE_KEY_PREFIX", "dojopool:")


def generate_cache_key(function_name: str, args: tuple, kwargs: dict) -> str:
    """Generate a unique cache key."""
    key_parts = [cache_key_prefix(), function_name, str(hash(str(args))), str(hash(str(kwargs)))]
    return ":".join(key_parts)


def cache_response(
    timeout: int = 300, key_prefix: Optional[str] = None, unless: Optional[Callable] = None
) -> Callable:
    """Cache decorator for API responses.

    Args:
        timeout: Cache timeout in seconds (default: 300)
        key_prefix: Optional prefix for cache key
        unless: Optional function to determine if caching should be skipped
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Skip cache if condition is met
            if unless and unless():
                return f(*args, **kwargs)

            # Generate cache key
            cache_key = generate_cache_key(key_prefix or f.__name__, args, kwargs)

            # Try to get from cache
            cached_response = redis_client.get(cache_key)
            if cached_response:
                try:
                    return json.loads(cached_response)
                except json.JSONDecodeError:
                    # If cached data is corrupted, return fresh response
                    pass

            # Get fresh response
            response = f(*args, **kwargs)

            # Cache the response
            try:
                redis_client.setex(cache_key, timeout, json.dumps(response))
            except (TypeError, ValueError) as e:
                current_app.logger.warning(f"Could not cache response for {cache_key}: {str(e)}")

            return response

        return wrapped

    return decorator


def invalidate_cache(pattern: str = "*") -> None:
    """Invalidate cache entries matching pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        if keys:
            redis_client.delete(*keys)
    except Exception as e:
        current_app.logger.error(f"Cache invalidation failed: {str(e)}")


def get_cached_value(key: str, default: Any = None) -> Union[str, None]:
    """Get value from cache."""
    try:
        return redis_client.get(f"{cache_key_prefix()}{key}")
    except Exception:
        return default


def set_cached_value(key: str, value: str, timeout: int = 300) -> bool:
    """Set value in cache with timeout."""
    try:
        return redis_client.setex(f"{cache_key_prefix()}{key}", timeout, value)
    except Exception:
        return False


# Performance monitoring
def get_cache_stats() -> dict:
    """Get cache statistics."""
    try:
        if REDIS_USE_FAKE:
            # Limited stats for fakeredis
            return {"type": "fakeredis", "keys": len(redis_client.keys("*")), "status": "connected"}
        else:
            info = redis_client.info()
            return {
                "type": "redis",
                "status": "connected",
                "keys": info.get("db0", {}).get("keys", 0),
                "used_memory": info.get("used_memory_human"),
                "connected_clients": info.get("connected_clients"),
                "uptime_days": info.get("uptime_in_days"),
            }
    except Exception as e:
        return {
            "type": "redis" if not REDIS_USE_FAKE else "fakeredis",
            "status": "error",
            "error": str(e),
        }
