"""FastAPI-specific caching utilities."""

from functools import wraps
from typing import Any, Callable, Optional

from fastapi import Request
from fastapi.responses import JSONResponse

from .redis_cache import (
    redis_client,
    cache_key_prefix,
    generate_cache_key,
    get_cached_value,
    set_cached_value,
)


def cache_response_fastapi(
    timeout: int = 300, key_prefix: Optional[str] = None, unless: Optional[Callable] = None
):
    """Cache decorator for FastAPI endpoints.

    Args:
        timeout: Cache timeout in seconds (default: 300)
        key_prefix: Optional prefix for cache key
        unless: Optional function to determine if caching should be skipped
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Get request object from args
            request = next((arg for arg in args if isinstance(arg, Request)), None)
            if not request:
                return await func(*args, **kwargs)

            # Skip cache if condition is met
            if unless and unless():
                return await func(*args, **kwargs)

            # Generate cache key
            cache_key = generate_cache_key(key_prefix or func.__name__, args, kwargs)

            # Try to get from cache
            cached_response = get_cached_value(cache_key)
            if cached_response:
                return JSONResponse(content=cached_response)

            # Get fresh response
            response = await func(*args, **kwargs)

            # Cache the response
            if isinstance(response, dict) or isinstance(response, list):
                set_cached_value(cache_key, response, timeout)

            return response

        return wrapped

    return decorator


def invalidate_endpoint_cache(pattern: str = "*") -> None:
    """Invalidate cache for specific endpoint pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        if keys:
            redis_client.delete(*keys)
    except Exception as e:
        # Log error but don't raise
        print(f"Failed to invalidate cache: {str(e)}")


def get_endpoint_cache_stats(pattern: str = "*") -> dict:
    """Get cache statistics for specific endpoint pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        return {"cached_keys": len(keys), "pattern": pattern, "prefix": cache_key_prefix()}
    except Exception as e:
        return {"error": str(e), "pattern": pattern, "prefix": cache_key_prefix()}
