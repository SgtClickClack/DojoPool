"""Flask-specific caching utilities."""

import json
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

from flask import Response, current_app, make_response, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from .redis_cache import (
    cache_key_prefix,
    generate_cache_key,
    get_cached_value,
    redis_client,
    set_cached_value,
)


def cached_response(
    timeout: int = 300,
    key_prefix: str = "",
    unless: Optional[Callable[..., bool]] = None,
) -> Callable:
    """Cache a Flask view response.

    Args:
        timeout: Cache timeout in seconds
        key_prefix: Cache key prefix
        unless: Function to determine if caching should be skipped

    Returns:
        Decorated function
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            # Skip cache if condition is met
            if unless and unless():
                return f(*args, **kwargs)

            # Skip cache for non-GET requests
            if request.method != "GET":
                return f(*args, **kwargs)

            # Generate cache key
            cache_key: str = generate_cache_key(key_prefix or f.__name__, args, kwargs)

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
                except (TypeError, ValueError):
                    pass

            # Get fresh response
            response = f(*args, **kwargs)

            # Cache the response if it's JSON serializable
            if hasattr(response, "get_json"):
                try:
                    data = response.get_json()
                    if data:
                        set_cached_value(cache_key, json.dumps(data), timeout)
                except (TypeError, ValueError):
                    pass

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


def get_endpoint_cache_stats(pattern: str = "*"):
    """Get cache statistics for specific endpoint pattern."""
    try:
        keys = redis_client.keys(f"{cache_key_prefix()}{pattern}")
        return {
            "cached_keys": len(keys),
            "pattern": pattern,
            "prefix": cache_key_prefix(),
        }
    except Exception as e:
        return {"error": str(e), "pattern": pattern, "prefix": cache_key_prefix()}
