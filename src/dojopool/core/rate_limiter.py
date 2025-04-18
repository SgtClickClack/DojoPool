"""Rate limiter implementation with Redis backend."""

import time
from datetime import datetime
from typing import Any, Dict
import logging
import math
import uuid

import redis

from dojopool.core.exceptions import RateLimitError


class RateLimitStrategy:
    """Base class for rate limiting strategies."""

    def __init__(self, max_requests: int, time_window: int):
        """Initialize rate limit strategy.

        Args:
            max_requests: Maximum number of requests allowed
            time_window: Time window in seconds
        """
        self.max_requests = max_requests
        self.time_window = time_window

    def should_allow(self, current_count: int, elapsed_time: float, cost: int = 1) -> bool:
        """Check if request should be allowed."""
        raise NotImplementedError


class FixedWindowStrategy(RateLimitStrategy):
    """Fixed window rate limiting strategy."""

    def should_allow(self, current_count: int, elapsed_time: float, cost: int = 1) -> bool:
        logging.debug(f"[FixedWindow] current_count={current_count}, elapsed_time={elapsed_time}, cost={cost}, max_requests={self.max_requests}")
        return (current_count + cost) <= self.max_requests


class SlidingWindowStrategy(RateLimitStrategy):
    """Sliding window rate limiting strategy."""

    def should_allow(self, current_count: int, elapsed_time: float, cost: int = 1) -> bool:
        """Check if request should be allowed based on sliding window."""
        rate = current_count / max(elapsed_time, 1)
        return rate <= (self.max_requests / self.time_window)


class TokenBucketStrategy(RateLimitStrategy):
    """Token bucket rate limiting strategy."""

    def __init__(self, max_requests: int, time_window: int, refill_rate: float):
        """Initialize token bucket strategy.

        Args:
            max_requests: Maximum number of tokens
            time_window: Time window in seconds
            refill_rate: Token refill rate per second
        """
        super().__init__(max_requests, time_window)
        self.refill_rate = refill_rate

    def should_allow(self, current_count: int, elapsed_time: float, cost: int = 1) -> bool:
        tokens_refilled = math.floor(elapsed_time * self.refill_rate)
        if current_count >= self.max_requests:
            # Only allow if the bucket is fully refilled
            return tokens_refilled >= self.max_requests
        else:
            tokens_available = self.max_requests - current_count + tokens_refilled
            tokens_available = min(self.max_requests, max(0, tokens_available))
            return tokens_available >= cost


class RateLimiter:
    """Rate limiter with Redis backend."""

    def __init__(
        self, redis_client: redis.Redis, strategy: RateLimitStrategy, namespace: str = "rate_limit"
    ):
        """Initialize rate limiter.

        Args:
            redis_client: Redis client instance
            strategy: Rate limiting strategy
            namespace: Redis key namespace
        """
        self.redis = redis_client
        self.strategy = strategy
        self.namespace = namespace

    def _get_key(self, identifier: str) -> str:
        """Get Redis key for identifier."""
        return f"{self.namespace}:{identifier}"

    def is_allowed(self, identifier: str, cost: int = 1, raise_on_limit: bool = True) -> bool:
        """Check if request is allowed.

        Args:
            identifier: Request identifier (e.g. IP, user ID)
            cost: Request cost in tokens
            raise_on_limit: Whether to raise exception on limit

        Returns:
            bool: Whether request is allowed

        Raises:
            RateLimitError: If request is not allowed and raise_on_limit is True
        """
        key = self._get_key(identifier)
        now = time.time()
        window_start = now - self.strategy.time_window

        # Step 1: Clean old requests
        self.redis.zremrangebyscore(key, 0, window_start)

        # Step 2: Get current request count and earliest timestamp
        pipe = self.redis.pipeline()
        pipe.zcard(key)
        pipe.zrange(key, 0, 0, withscores=True)
        results = pipe.execute()
        current_count = results[0]
        earliest = results[1][0][1] if results[1] else now - self.strategy.time_window
        elapsed_time = now - earliest

        logging.debug(f"[RateLimiter] key={key}, now={now}, window_start={window_start}, current_count={current_count}, earliest={earliest}, elapsed_time={elapsed_time}, cost={cost}")

        if isinstance(self.strategy, TokenBucketStrategy):
            is_allowed = self.strategy.should_allow(current_count=current_count, elapsed_time=elapsed_time, cost=cost)
        else:
            # For fixed/sliding window, check allowance BEFORE adding new requests
            is_allowed = self.strategy.should_allow(current_count=current_count, elapsed_time=self.strategy.time_window, cost=cost)
            if not is_allowed:
                if raise_on_limit:
                    reset_time = datetime.fromtimestamp(window_start + self.strategy.time_window)
                    raise RateLimitError(
                        message="Rate limit exceeded",
                        details={
                            "limit": self.strategy.max_requests,
                            "remaining": max(0, self.strategy.max_requests - current_count),
                            "reset_time": reset_time.isoformat(),
                            "retry_after": int(reset_time.timestamp() - now),
                        },
                    )
                else:
                    return False

        # Only add new requests for cost if allowed
        for i in range(cost):
            unique_member = f"{now}-{uuid.uuid4()}"
            self.redis.zadd(key, {unique_member: now})
        self.redis.expire(key, self.strategy.time_window)
        return True

    def get_limit_info(self, identifier: str) -> Dict[str, Any]:
        """Get rate limit information.

        Args:
            identifier: Request identifier

        Returns:
            dict: Rate limit information
        """
        key = self._get_key(identifier)
        pipe = self.redis.pipeline()

        now = time.time()
        window_start = now - self.strategy.time_window

        # Clean old requests
        pipe.zremrangebyscore(key, 0, window_start)

        # Get current request count
        pipe.zcard(key)

        # Execute pipeline
        _, current_count = pipe.execute()

        reset_time = datetime.fromtimestamp(window_start + self.strategy.time_window)

        return {
            "limit": self.strategy.max_requests,
            "remaining": max(0, self.strategy.max_requests - current_count),
            "reset_time": reset_time.isoformat(),
            "retry_after": int(reset_time.timestamp() - now),
        }

    def reset(self, identifier: str) -> None:
        """Reset rate limit for identifier.

        Args:
            identifier: Request identifier
        """
        key = self._get_key(identifier)
        self.redis.delete(key)
