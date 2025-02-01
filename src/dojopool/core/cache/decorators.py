"""Cache decorators for DojoPool."""

from functools import wraps
from typing import Any, Callable, Optional

from flask import current_app, request

from . import cache


def cached_view(timeout: int = 300, key_prefix: str = "") -> Callable:
    """Cache a view function's response.

    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            cache_key = f"{key_prefix}:{request.path}:{request.query_string.decode()}"
            response = cache.get(cache_key)
            if response is None:
                response = f(*args, **kwargs)
                cache.set(cache_key, response, timeout=timeout)
            return response

        return decorated_function

    return decorator


def cached_model(
    timeout: int = 300, key_prefix: str = "", unless: Optional[Callable] = None
) -> Callable:
    """Cache a model method's result.

    Args:
        timeout: Cache timeout in seconds
        key_prefix: Prefix for cache key
        unless: Function that returns True if result should not be cached
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(self, *args: Any, **kwargs: Any) -> Any:
            if unless and unless():
                return f(self, *args, **kwargs)

            cache_key = f"{key_prefix}:{self.__class__.__name__}:{self.id}:{f.__name__}"
            result = cache.get(cache_key)
            if result is None:
                result = f(self, *args, **kwargs)
                cache.set(cache_key, result, timeout=timeout)
            return result

        return decorated_function

    return decorator


def invalidate_cache(key_pattern: str) -> None:
    """Invalidate all cache keys matching pattern."""
    if hasattr(cache, "delete_pattern"):
        cache.delete_pattern(key_pattern)
    else:
        current_app.logger.warning(
            f"Cache backend does not support pattern deletion: {key_pattern}"
        )
