"""WebSocket rate limiting module.

This module provides rate limiting functionality for WebSocket operations.
"""

import asyncio
from collections import defaultdict
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, List, Optional

from .constants import ErrorCodes
from .log_config import logger
from .utils import format_error_response


class RateLimiter:
    """Rate limiter class."""

    def __init__(self):
        """Initialize RateLimiter."""
        self._requests: Dict[str, List[datetime]] = defaultdict(list)
        self._locks: Dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)
        self._cleanup_task: Optional[asyncio.Task] = None

    async def start_cleanup(self, interval: int = 300) -> None:
        """Start cleanup task.

        Args:
            interval: Cleanup interval in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop(interval))

    async def stop_cleanup(self):
        """Stop cleanup task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None

    async def _cleanup_loop(self, interval: int):
        """Cleanup loop to remove expired requests.

        Args:
            interval: Cleanup interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.cleanup()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in rate limiter cleanup",
                    exc_info=True,
                    extra={"error": str(e)},
                )

    async def cleanup(self):
        """Remove expired requests."""
        now = datetime.utcnow()
        expired_keys = []

        for key, requests in self._requests.items():
            # Get lock for this key
            async with self._locks[key]:
                # Remove expired requests
                self._requests[key] = [
                    req
                    for req in requests
                    if (now - req).total_seconds() <= 3600  # Keep last hour
                ]

                # Mark key for removal if empty
                if not self._requests[key]:
                    expired_keys.append(key)

        # Remove expired keys
        for key in expired_keys:
            del self._requests[key]
            del self._locks[key]

    async def check_rate_limit(
        self, key: str, max_requests: int, time_window: timedelta
    ) -> Optional[Dict[str, Any]]:
        """Check if rate limit is exceeded.

        Args:
            key: Rate limit key
            max_requests: Maximum requests allowed
            time_window: Time window

        Returns:
            Optional[Dict[str, Any]]: Error response if limit exceeded, None otherwise
        """
        now = datetime.utcnow()
        window_start = now - time_window

        # Get lock for this key
        async with self._locks[key]:
            # Add current request
            self._requests[key].append(now)

            # Count requests in window
            requests_in_window = sum(
                1 for req in self._requests[key] if req > window_start
            )

            # Check if limit exceeded
            if requests_in_window > max_requests:
                return format_error_response(
                    ErrorCodes.RATE_LIMIT_EXCEEDED,
                    "Rate limit exceeded",
                    {
                        "max_requests": max_requests,
                        "time_window_seconds": time_window.total_seconds(),
                        "requests_made": requests_in_window,
                    },
                )

        return None

    def get_request_count(self, key: str, time_window: timedelta) -> int:
        """Get request count for key within time window.

        Args:
            key: Rate limit key
            time_window: Time window

        Returns:
            int: Request count
        """
        now = datetime.utcnow()
        window_start = now - time_window

        return sum(1 for req in self._requests.get(key, []) if req > window_start)


# Global rate limiter instance
rate_limiter = RateLimiter()


def rate_limit(
    max_requests: int, time_window: timedelta, key_func: Optional[Callable] = None
):
    """Rate limiting decorator.

    Args:
        max_requests: Maximum requests allowed
        time_window: Time window
        key_func: Optional function to generate rate limit key

    Returns:
        Callable: Decorated function
    """

    def decorator(f):
        @wraps(f)
        async def wrapper(socket, *args, **kwargs):
            # Generate rate limit key
            if key_func:
                key = key_func(socket, *args, **kwargs)
            else:
                key = f"{socket.id}_{f.__name__}"

            # Check rate limit
            error = await rate_limiter.check_rate_limit(key, max_requests, time_window)

            if error:
                # Log rate limit exceeded
                logger.warning(
                    "Rate limit exceeded",
                    extra={
                        "key": key,
                        "max_requests": max_requests,
                        "time_window_seconds": time_window.total_seconds(),
                    },
                )

                # Emit error to client
                await socket.emit("error", error)
                return

            # Execute handler
            return await f(socket, *args, **kwargs)

        return wrapper

    return decorator


async def start_rate_limiter(cleanup_interval: int = 300) -> None:
    """Start rate limiter cleanup task.

    Args:
        cleanup_interval: Cleanup interval in seconds
    """
    await rate_limiter.start_cleanup(cleanup_interval)


async def stop_rate_limiter():
    """Stop rate limiter cleanup task."""
    await rate_limiter.stop_cleanup()
