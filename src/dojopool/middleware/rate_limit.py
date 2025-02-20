import gc
import gc
"""Rate limiting middleware with tiered protection."""

import time
from datetime import datetime
from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

import redis
from flask import Flask, Request, Response, current_app, g, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import TooManyRequests
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.errors import RateLimitExceededError


class RateLimitMiddleware:
    """Middleware for rate limiting requests."""

    def __init__(self, app: Flask, redis_client: redis.Redis):
        """Initialize rate limiting middleware.

        Args:
            app: Flask application instance
            redis_client: Redis client for rate limit storage
        """
        self.app = app
        self.redis = redis_client

        # Configure default rate limits
        self.default_limits: Any = {
            "strict": {  # For sensitive endpoints (auth, password reset)
                "rate": 5,
                "per": 60,  # 5 requests per minute
            },
            "normal": {  # For authenticated API endpoints
                "rate": 30,
                "per": 60,  # 30 requests per minute
            },
            "lenient": {  # For public endpoints
                "rate": 60,
                "per": 60,  # 60 requests per minute
            },
        }

        # Register before_request handler
        app.before_request(self._check_rate_limit)

    def _get_rate_limit_key(self, identifier: str):
        """Generate Redis key for rate limiting.

        Args:
            identifier: Unique identifier for the rate limit

        Returns:
            Redis key string
        """
        return f"rate_limit:{identifier}"

    def _check_rate_limit(self) -> Optional[Response]:
        """Check if request exceeds rate limit."""
        # Skip rate limiting for excluded endpoints
        if request.endpoint in current_app.config.get(
            "RATE_LIMIT_EXCLUDED_ENDPOINTS", set()
        ):
            return None

        # Determine rate limit tier
        tier: Any = self._get_limit_tier()
        limits: Any = self.default_limits[tier]

        # Get identifier based on authentication status
        if hasattr(g, "user_id"):
            identifier: Any = f"user:{g.user_id}"
        else:
            identifier: Any = f"ip:{request.remote_addr}"

        # Check rate limit
        key: Any = self._get_rate_limit_key(identifier)
        current: int = int(self.redis.get(key) or 0)

        if current >= limits["rate"]:
            raise RateLimitExceededError(
                message=f'Rate limit exceeded. Try again in {limits["per"]} seconds.',
                details={"limit": limits["rate"], "window": limits["per"]},
            )

        # Increment counter
        pipe: Any = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, limits["per"])
        pipe.execute()

    def _get_limit_tier(self) -> str:
        """Determine rate limit tier for current request."""
        endpoint: Any = request.endpoint or ""

        # Strict limits for sensitive endpoints
        if any(
            pattern in endpoint for pattern in ["auth", "password", "login", "register"]
        ):
            return "strict"

        # Normal limits for authenticated endpoints
        if hasattr(g, "user_id"):
            return "normal"

        # Lenient limits for public endpoints
        return "lenient"

    def limit(self, rate: int, per: int = 60, key_func: Optional[Callable] = None):
        """Decorator to apply custom rate limits to routes.

        Args:
            rate: Number of requests allowed
            per: Time window in seconds
            key_func: Optional function to generate rate limit key

        Returns:
            Decorated function
        """

        def decorator(f: Callable):
            @wraps(f)
            def decorated_function(*args: Any, **kwargs: Any):
                # Get rate limit key
                if key_func:
                    identifier: Any = key_func()
                elif hasattr(g, "user_id"):
                    identifier: Any = f"user:{g.user_id}"
                else:
                    identifier: Any = f"ip:{request.remote_addr}"

                key: Any = self._get_rate_limit_key(identifier)

                # Check rate limit
                current: int = int(self.redis.get(key) or 0)
                if current >= rate:
                    raise RateLimitExceededError(
                        message=f"Rate limit exceeded. Try again in {per} seconds.",
                        details={"limit": rate, "window": per},
                    )

                # Increment counter
                pipe: Any = self.redis.pipeline()
                pipe.incr(key)
                pipe.expire(key, per)
                pipe.execute()

                return f(*args, **kwargs)

            return decorated_function

        return decorator

    def get_rate_limit_headers(self, key: str) -> Dict[str, str]:
        """Generate rate limit headers for response.

        Args:
            key: Rate limit key

        Returns:
            Dictionary of rate limit headers
        """
        current: int = int(self.redis.get(key) or 0)
        reset = self.redis.ttl(key)

        tier: Any = self._get_limit_tier()
        limit: Any = self.default_limits[tier]["rate"]

        return {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Remaining": str(max(0, limit - current)),
            "X-RateLimit-Reset": str(reset if reset > 0 else 0),
        }
