"""
Caching layer for blockchain operations.
"""
from typing import Any, Optional, Dict, Callable
from functools import wraps
import json
from datetime import datetime, timedelta
from redis import Redis
from dojopool.core.exceptions import BlockchainError

class BlockchainCache:
    """Cache for blockchain operations."""
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379/0",
        default_ttl: int = 300  # 5 minutes
    ):
        """Initialize cache.
        
        Args:
            redis_url: Redis connection URL
            default_ttl: Default TTL in seconds
        """
        self.redis = Redis.from_url(redis_url)
        self.default_ttl = default_ttl
        
    def _make_key(self, prefix: str, *args: Any, **kwargs: Any) -> str:
        """Create cache key from arguments."""
        key_parts = [prefix]
        
        # Add positional args
        for arg in args:
            if isinstance(arg, (str, int, float, bool)):
                key_parts.append(str(arg))
            elif isinstance(arg, (list, dict, tuple)):
                # Hash complex types
                key_parts.append(str(hash(json.dumps(arg, sort_keys=True))))
                
        # Add keyword args (sorted for consistency)
        for k, v in sorted(kwargs.items()):
            if isinstance(v, (str, int, float, bool)):
                key_parts.append(f"{k}:{v}")
            elif isinstance(v, (list, dict, tuple)):
                # Hash complex types
                key_parts.append(f"{k}:{hash(json.dumps(v, sort_keys=True))}")
                
        return ":".join(key_parts)
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        try:
            value = self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            raise BlockchainError(f"Cache get failed: {str(e)}")
            
    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """Set value in cache."""
        try:
            ttl = ttl or self.default_ttl
            self.redis.setex(
                key,
                ttl,
                json.dumps(value)
            )
        except Exception as e:
            raise BlockchainError(f"Cache set failed: {str(e)}")
            
    def delete(self, key: str) -> None:
        """Delete value from cache."""
        try:
            self.redis.delete(key)
        except Exception as e:
            raise BlockchainError(f"Cache delete failed: {str(e)}")
            
    def clear(self, prefix: str = "") -> None:
        """Clear all keys with prefix."""
        try:
            for key in self.redis.scan_iter(f"{prefix}*"):
                self.redis.delete(key)
        except Exception as e:
            raise BlockchainError(f"Cache clear failed: {str(e)}")

def cache_blockchain(
    ttl: Optional[int] = None,
    prefix: Optional[str] = None,
    cache_errors: bool = False
) -> Callable:
    """Decorator for caching blockchain operations.
    
    Args:
        ttl: Cache TTL in seconds
        prefix: Cache key prefix
        cache_errors: Whether to cache errors
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Get cache instance from first arg (self)
            if not args or not hasattr(args[0], 'cache'):
                raise BlockchainError("Cache decorator requires instance with cache attribute")
                
            cache = args[0].cache
            
            # Generate cache key
            key_prefix = prefix or func.__name__
            cache_key = cache._make_key(key_prefix, *args[1:], **kwargs)
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                if isinstance(cached_value, dict) and cached_value.get('__is_error__'):
                    if cache_errors:
                        raise BlockchainError(cached_value['message'])
                    return None
                return cached_value
                
            try:
                # Call original function
                result = await func(*args, **kwargs)
                
                # Cache result
                cache.set(cache_key, result, ttl)
                
                return result
                
            except Exception as e:
                if cache_errors:
                    # Cache error
                    error_data = {
                        '__is_error__': True,
                        'message': str(e),
                        'timestamp': datetime.utcnow().isoformat()
                    }
                    cache.set(cache_key, error_data, ttl)
                raise
                
        return wrapper
    return decorator

# Cache configuration
CACHE_CONFIG = {
    # Balance caching
    'get_balance': {
        'ttl': 60,  # 1 minute
        'cache_errors': False
    },
    
    # Transaction caching
    'get_transaction': {
        'ttl': 300,  # 5 minutes
        'cache_errors': True
    },
    'get_transactions': {
        'ttl': 300,  # 5 minutes
        'cache_errors': True
    },
    
    # Network info caching
    'get_network_info': {
        'ttl': 60,  # 1 minute
        'cache_errors': False
    },
    
    # Token metadata caching
    'get_metadata': {
        'ttl': 3600,  # 1 hour
        'cache_errors': True
    },
    
    # Gas price caching
    'get_gas_price': {
        'ttl': 30,  # 30 seconds
        'cache_errors': False
    }
} 