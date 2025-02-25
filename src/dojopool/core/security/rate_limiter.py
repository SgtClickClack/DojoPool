"""Rate limiting configuration."""

from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, Tuple, Union, cast
from flask import request, current_app, Response, jsonify
from flask_login import current_user
from redis import Redis
import time

@dataclass
class RateLimit:
    """Rate limit configuration."""
    
    requests: int
    period: int  # in seconds
    by: str = "ip"  # "ip", "user", "api_key"

class RateLimiter:
    """Rate limiter implementation using Redis sliding window."""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        """Initialize rate limiter."""
        self.redis = Redis.from_url(redis_url, decode_responses=True)
        
        # Default rate limits
        self.default_limits = {
            "default": RateLimit(100, 60),  # 100 requests per minute
            "auth": RateLimit(5, 60),  # 5 login attempts per minute
            "api": RateLimit(1000, 3600),  # 1000 requests per hour
            "game": RateLimit(60, 60),  # 60 game actions per minute
        }
    
    def _get_identifier(self, by: str) -> str:
        """Get identifier based on rate limit type."""
        if by == "ip":
            return str(request.remote_addr or "unknown")
        elif by == "user" and current_user and current_user.is_authenticated:
            return str(current_user.id)
        elif by == "api_key" and "X-API-Key" in request.headers:
            return str(request.headers["X-API-Key"])
        return str(request.remote_addr or "unknown")

    def _check_rate_limit(
        self, key: str, limit: int, period: int
    ) -> Tuple[bool, int, int]:
        """
        Check rate limit using sliding window algorithm.
        
        Returns:
            Tuple of (is_allowed, remaining_requests, retry_after)
        """
        now = time.time()
        window_start = now - period
        
        # Remove old requests
        self.redis.zremrangebyscore(key, 0, window_start)
        
        # Count requests in current window
        current_requests = int(self.redis.zcard(key) or 0)
        
        if current_requests >= limit:
            oldest_request_list = self.redis.zrange(key, 0, 0)
            if oldest_request_list:
                oldest_request = float(oldest_request_list[0])
                retry_after = int(oldest_request + period - now)
                return False, 0, max(0, retry_after)
            return False, 0, period
        
        # Add current request
        pipeline = self.redis.pipeline()
        pipeline.zadd(key, {str(now): now})
        pipeline.expire(key, period)
        pipeline.execute()
        
        return True, limit - current_requests - 1, 0

    def limit(
        self,
        key_prefix: str = "default",
        limit: Optional[RateLimit] = None,
        error_message: Optional[str] = None,
    ) -> Callable:
        """
        Rate limiting decorator.
        
        Args:
            key_prefix: Rate limit type (default, auth, api, game)
            limit: Custom rate limit configuration
            error_message: Custom error message
        """
        def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
            @wraps(f)
            def decorated_function(*args: Any, **kwargs: Any) -> Any:
                # Get rate limit configuration
                rate_limit = limit or self.default_limits.get(key_prefix, self.default_limits["default"])
                
                # Build rate limit key
                identifier = self._get_identifier(rate_limit.by)
                key = f"rate_limit:{key_prefix}:{identifier}"
                
                # Check rate limit
                is_allowed, remaining, retry_after = self._check_rate_limit(
                    key, rate_limit.requests, rate_limit.period
                )
                
                # Set rate limit headers
                response_headers = {
                    "X-RateLimit-Limit": str(rate_limit.requests),
                    "X-RateLimit-Remaining": str(remaining),
                    "X-RateLimit-Reset": str(int(time.time() + retry_after))
                }
                
                if not is_allowed:
                    response_headers["Retry-After"] = str(retry_after)
                    error = {
                        "error": error_message or "Rate limit exceeded",
                        "retry_after": retry_after
                    }
                    return jsonify(error), 429, response_headers
                
                # Execute route handler
                response = f(*args, **kwargs)
                
                # Add rate limit headers to response
                if isinstance(response, tuple):
                    body, status_code = response
                    return jsonify(body), status_code, response_headers
                
                if isinstance(response, Response):
                    for key, value in response_headers.items():
                        response.headers[key] = value
                    return response
                
                return response
                
            return decorated_function
        return decorator

# Initialize global rate limiter
rate_limiter = RateLimiter() 