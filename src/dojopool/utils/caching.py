from functools import wraps

from src.extensions import cache


def cache_query(timeout=300, key_prefix="view"):
    """
    Cache decorator for database queries
    :param timeout: Cache timeout in seconds (default: 5 minutes)
    :param key_prefix: Prefix for the cache key
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Create a unique cache key based on function arguments
            cache_key = f"{key_prefix}:{f.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get the value from cache
            rv = cache.get(cache_key)
            if rv is not None:
                return rv

            # If not in cache, execute function and cache result
            rv = f(*args, **kwargs)
            cache.set(cache_key, rv, timeout=timeout)
            return rv

        return decorated_function

    return decorator


def invalidate_cache(key_pattern):
    """
    Invalidate cache entries matching the given pattern
    :param key_pattern: Pattern to match cache keys
    """
    cache.delete_pattern(key_pattern)


def cache_user_data(user_id, data, timeout=3600):
    """
    Cache user-specific data
    :param user_id: User ID
    :param data: Data to cache
    :param timeout: Cache timeout in seconds (default: 1 hour)
    """
    cache_key = f"user:{user_id}:data"
    cache.set(cache_key, data, timeout=timeout)


def get_cached_user_data(user_id):
    """
    Get cached user data
    :param user_id: User ID
    :return: Cached user data or None
    """
    cache_key = f"user:{user_id}:data"
    return cache.get(cache_key)


def cache_game_data(game_id, data, timeout=1800):
    """
    Cache game-specific data
    :param game_id: Game ID
    :param data: Data to cache
    :param timeout: Cache timeout in seconds (default: 30 minutes)
    """
    cache_key = f"game:{game_id}:data"
    cache.set(cache_key, data, timeout=timeout)


def get_cached_game_data(game_id):
    """
    Get cached game data
    :param game_id: Game ID
    :return: Cached game data or None
    """
    cache_key = f"game:{game_id}:data"
    return cache.get(cache_key)
