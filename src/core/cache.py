from functools import wraps
from flask import current_app
from .extensions import cache
import hashlib
import json

def cache_key(*args, **kwargs):
    """Generate a cache key from arguments."""
    key_dict = {
        'args': args,
        'kwargs': kwargs
    }
    key_str = json.dumps(key_dict, sort_keys=True)
    return hashlib.sha256(key_str.encode()).hexdigest()

def cached_query(timeout=300):
    """Cache decorator for database queries."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            key = f"{f.__name__}:{cache_key(*args, **kwargs)}"
            result = cache.get(key)
            if result is None:
                result = f(*args, **kwargs)
                cache.set(key, result, timeout=timeout)
            return result
        return decorated_function
    return decorator

def cached_user_data(timeout=300):
    """Cache decorator for user-specific data."""
    def decorator(f):
        @wraps(f)
        def decorated_function(user_id, *args, **kwargs):
            key = f"user:{user_id}:{f.__name__}:{cache_key(*args, **kwargs)}"
            result = cache.get(key)
            if result is None:
                result = f(user_id, *args, **kwargs)
                cache.set(key, result, timeout=timeout)
            return result
        return decorated_function
    return decorator

def cached_game_state(timeout=60):
    """Cache decorator for game state data."""
    def decorator(f):
        @wraps(f)
        def decorated_function(game_id, *args, **kwargs):
            key = f"game:{game_id}:{f.__name__}:{cache_key(*args, **kwargs)}"
            result = cache.get(key)
            if result is None:
                result = f(game_id, *args, **kwargs)
                cache.set(key, result, timeout=timeout)
            return result
        return decorated_function
    return decorator

def invalidate_user_cache(user_id):
    """Invalidate all cached data for a specific user."""
    pattern = f"user:{user_id}:*"
    keys = cache.cache._read_client.keys(pattern)
    if keys:
        cache.delete_many(*keys)

def invalidate_game_cache(game_id):
    """Invalidate all cached data for a specific game."""
    pattern = f"game:{game_id}:*"
    keys = cache.cache._read_client.keys(pattern)
    if keys:
        cache.delete_many(*keys) 