"""Flask-specific caching utilities."""

from functools import wraps
from typing import Any, Callable, Optional
import json

from flask import make_response, request

from .redis_cache import (
    redis_client,
    cache_key_prefix,
    generate_cache_key,
    get_cached_value,
    set_cached_value,
)


def cache_response_flask(
    timeout: int = 300, key_prefix: Optional[str] = None, unless: Optional[Callable] = None
):
    """Cache decorator for Flask endpoints.

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

            # Skip cache for non-GET requests
            if request.method != "GET":
                return f(*args, **kwargs)

            # Generate cache key
            cache_key = generate_cache_key(key_prefix or f.__name__, args, kwargs)

            # Add query parameters to cache key
            if request.args:
                cache_key = f"{cache_key}:{hash(frozenset(request.args.items()))}"

            # Try to get from cache
            cached_response = get_cached_value(cache_key)
            if cached_response:
                try:
                    data = json.loads(cached_response)
                    response = make_response(data)
                    response.headers["X-Cache"] = "HIT"
                    return response
                except json.JSONDecodeError:
                    # If cached data is corrupted, return fresh response
                    pass

            # Get fresh response
            response = f(*args, **kwargs)

            # Cache the response if it's JSON serializable
            if hasattr(response, "get_json"):
                try:
                    data = response.get_json()
                    if data:
                        set_cached_value(cache_key, json.dumps(data), timeout)
                except (TypeError, ValueError) as e:
                    print(f"Could not cache response for {cache_key}: {str(e)}")

            response.headers["X-Cache"] = "MISS"
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
        print(f"Failed to invalidate cache: {str(e)}")


def get_endpoint_cache_stats(pattern: str = "*") -> dict:
    """Get cache statistics for specific endpoint pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        return {"cached_keys": len(keys), "pattern": pattern, "prefix": cache_key_prefix()}
    except Exception as e:
        return {"error": str(e), "pattern": pattern, "prefix": cache_key_prefix()}
