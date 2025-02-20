"""
Stub definitions for cache module.
These definitions help MyPy know about expected functions.
"""

from functools import wraps
from typing import Any, Callable, TypeVar, cast

F = TypeVar("F", bound=Callable[..., Any])


def cached_game_state(f: F) -> F:
    """
    Decorator to cache game state.

    Args:
        f: Function to decorate

    Returns:
        Decorated function with caching
    """

    @wraps(f)
    def wrapper(*args: Any, **kwargs: Any):
        # TODO: Implement actual caching logic
        return f(*args, **kwargs)

    return cast(F, wrapper)


def cached_query(x):
    return x


def cached_user_data(x):
    return x


def invalidate_game_cache():
    pass


def invalidate_user_cache():
    pass
