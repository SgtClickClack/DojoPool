"""Rate limiting system for API endpoints."""

import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from functools import wraps
from typing import Dict, Optional, Tuple

from flask import jsonify, request


@dataclass
class RateLimit:
    """Rate limit configuration."""

    requests: int
    window: int  # seconds
    block_duration: Optional[int] = None  # seconds to block after limit exceeded


@dataclass
class RateLimitState:
    """Current state of a rate limit."""

    requests: int = 0
    window_start: datetime = field(default_factory=datetime.utcnow)
    blocked_until: Optional[datetime] = None


class RateLimiter:
    """Rate limiter for API endpoints."""

    def __init__(self):
        """Initialize rate limiter."""
        self._lock = threading.Lock()
        self._limits: Dict[str, Dict[str, RateLimitState]] = {}

        # Default limits
        self.default_limits = {
            "default": RateLimit(100, 60),  # 100 requests per minute
            "qr_verify": RateLimit(30, 60),  # 30 verifications per minute
            "qr_generate": RateLimit(10, 60),  # 10 generations per minute
            "qr_refresh": RateLimit(5, 60),  # 5 refreshes per minute
            "export": RateLimit(
                2, 60, 300
            ),  # 2 exports per minute, block for 5 minutes if exceeded
        }

        # Start cleanup thread
        self._stop_cleanup = False
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def configure_limit(
        self, limit_type: str, requests: int, window: int, block_duration: Optional[int] = None
    ) -> None:
        """Configure a rate limit.

        Args:
            limit_type: Type of limit to configure
            requests: Number of requests allowed
            window: Time window in seconds
            block_duration: Optional blocking duration in seconds
        """
        self.default_limits[limit_type] = RateLimit(
            requests=requests, window=window, block_duration=block_duration
        )

    def check_limit(
        self, key: str, limit_type: str = "default"
    ) -> Tuple[bool, Optional[str], Optional[int]]:
        """Check if a request should be allowed.

        Args:
            key: Unique key for the limit (e.g., IP address)
            limit_type: Type of limit to check

        Returns:
            Tuple[bool, Optional[str], Optional[int]]:
                - Whether request is allowed
                - Optional error message
                - Optional retry after seconds
        """
        with self._lock:
            # Get limit configuration
            limit_config = self.default_limits.get(limit_type)
            if not limit_config:
                return True, None, None

            # Get or create limit state
            if limit_type not in self._limits:
                self._limits[limit_type] = {}

            state = self._limits[limit_type].get(key)
            if not state:
                state = RateLimitState()
                self._limits[limit_type][key] = state

            now = datetime.utcnow()

            # Check if blocked
            if state.blocked_until and now < state.blocked_until:
                retry_after = int((state.blocked_until - now).total_seconds())
                return False, "Too many requests, please try again later", retry_after

            # Check if window expired
            window_end = state.window_start + timedelta(seconds=limit_config.window)
            if now >= window_end:
                # Reset window
                state.requests = 0
                state.window_start = now
                state.blocked_until = None

            # Check limit
            if state.requests >= limit_config.requests:
                # Set block if configured
                if limit_config.block_duration:
                    state.blocked_until = now + timedelta(seconds=limit_config.block_duration)
                    retry_after = limit_config.block_duration
                else:
                    retry_after = int((window_end - now).total_seconds())

                return False, "Rate limit exceeded", retry_after

            # Increment counter
            state.requests += 1
            return True, None, None

    def _cleanup_loop(self) -> None:
        """Background thread for cleaning up expired limits."""
        while not self._stop_cleanup:
            try:
                self._cleanup_expired()
            except Exception as e:
                print(f"Error in rate limit cleanup: {str(e)}")

            time.sleep(60)  # Run every minute

    def _cleanup_expired(self) -> None:
        """Clean up expired rate limits."""
        now = datetime.utcnow()

        with self._lock:
            for limit_type in list(self._limits.keys()):
                limit_config = self.default_limits.get(limit_type)
                if not limit_config:
                    continue

                for key in list(self._limits[limit_type].keys()):
                    state = self._limits[limit_type][key]
                    window_end = state.window_start + timedelta(seconds=limit_config.window)

                    # Remove expired states
                    if now >= window_end and (
                        not state.blocked_until or now >= state.blocked_until
                    ):
                        del self._limits[limit_type][key]

                # Remove empty limit types
                if not self._limits[limit_type]:
                    del self._limits[limit_type]


def rate_limit(limit_type: str = "default"):
    """Decorator for rate limiting routes.

    Args:
        limit_type: Type of rate limit to apply

    Returns:
        Decorated function
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.remote_addr or 'unknown'

            # Check rate limit
            allowed, error, retry_after = rate_limiter.check_limit(
                key=client_ip, limit_type=limit_type
            )

            if not allowed:
                response = jsonify({"error": error or "Rate limit exceeded"})
                response.status_code = 429  # Too Many Requests
                if retry_after:
                    response.headers["Retry-After"] = str(retry_after)
                return response

            return f(*args, **kwargs)

        return decorated_function

    return decorator


# Global instance
rate_limiter = RateLimiter()
