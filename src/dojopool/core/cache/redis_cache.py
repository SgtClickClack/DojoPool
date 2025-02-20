"""Redis cache configuration for API optimization."""

import json
import os
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import fakeredis
from flask import Response, current_app, request
from flask.typing import ResponseReturnValue
from redis import Redis
from werkzeug.wrappers import Response as WerkzeugResponse

# Use fakeredis for development if REDIS_USE_FAKE is set
REDIS_USE_FAKE: bool = os.environ.get("REDIS_USE_FAKE", "true").lower() == "true"

if REDIS_USE_FAKE:
    redis_client = fakeredis.FakeStrictRedis()
else:
    redis_client = Redis(
        host=os.environ.get("REDIS_HOST", "localhost"),
        port=int(os.environ.get("REDIS_PORT", 6379)),
        db=int(os.environ.get("REDIS_DB", 0)),
        password=os.environ.get("REDIS_PASSWORD", None),
    )


def cache_key_prefix() -> str:
    """Get the cache key prefix for the current environment."""
    return current_app.config.get("CACHE_KEY_PREFIX", "dojopool")


def generate_cache_key(function_name: str, args: tuple, kwargs: dict):
    """Generate a cache key for the given function and arguments."""
    key_parts = [cache_key_prefix(), function_name]

    # Add positional args to key
    if args:
        key_parts.extend(str(arg) for arg in args)

    # Add keyword args to key
    if kwargs:
        key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))

    return ":".join(key_parts)


def cache_response(
    timeout: int = 300,
    key_prefix: Optional[str] = None,
    unless: Optional[Callable[..., bool]] = None,
):
    """Cache decorator for API responses.

    Args:
        timeout: Cache timeout in seconds
        key_prefix: Optional prefix for cache key
        unless: Optional function to determine if caching should be skipped

    Returns:
        Decorated function
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Skip cache if condition is met
            if unless and unless():
                return f(*args, **kwargs)

            # Generate cache key
            cache_key: str = generate_cache_key(key_prefix or f.__name__, args, kwargs)

            # Try to get from cache
            cached_response: Any = redis_client.get(cache_key)
            if cached_response:
                try:
                    return json.loads(cached_response)
                except json.JSONDecodeError:
                    # If cached data is corrupted, return fresh response
                    pass

            # Get fresh response
            response: Any = f(*args, **kwargs)

            # Cache the response
            try:
                redis_client.setex(cache_key, timeout, json.dumps(response))
            except (TypeError, ValueError) as e:
                current_app.logger.warning(
                    f"Could not cache response for {cache_key}: {str(e)}"
                )

            return response

        return wrapped

    return decorator


def invalidate_cache(pattern: str = "*"):
    """Invalidate cache entries matching pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        if keys:
            redis_client.delete(*keys)
    except Exception as e:
        current_app.logger.error(f"Cache invalidation failed: {str(e)}")


def get_cached_value(key: str, default: Any = None):
    """Get value from cache."""
    try:
        return redis_client.get(f"{cache_key_prefix()}{key}")
    except Exception:
        return default


def set_cached_value(key: str, value: str, timeout: int = 300):
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
            return {
                "type": "fakeredis",
                "keys": len(redis_client.keys("*")),
                "status": "connected",
            }
        else:
            info: Any = redis_client.info()
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
