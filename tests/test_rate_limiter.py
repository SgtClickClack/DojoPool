"""Tests for rate limiter functionality."""

import time
from unittest.mock import Mock

import pytest
import redis

from dojopool.core.exceptions import RateLimitError
from dojopool.core.rate_limiter import (
    FixedWindowStrategy,
    RateLimiter,
    SlidingWindowStrategy,
    TokenBucketStrategy,
)


@pytest.fixture
def redis_client():
    """Create Redis client fixture."""
    client = redis.Redis(host="localhost", port=6379, db=0)
    yield client
    client.flushdb()  # Clean up after tests


@pytest.fixture
def fixed_window_limiter(redis_client):
    """Create fixed window rate limiter fixture."""
    strategy = FixedWindowStrategy(max_requests=5, time_window=60)
    return RateLimiter(redis_client, strategy, namespace="test_fixed")


@pytest.fixture
def sliding_window_limiter(redis_client):
    """Create sliding window rate limiter fixture."""
    strategy = SlidingWindowStrategy(max_requests=5, time_window=60)
    return RateLimiter(redis_client, strategy, namespace="test_sliding")


@pytest.fixture
def token_bucket_limiter(redis_client):
    """Create token bucket rate limiter fixture."""
    strategy = TokenBucketStrategy(max_requests=5, time_window=60, refill_rate=0.1)
    return RateLimiter(redis_client, strategy, namespace="test_token")


def test_fixed_window_strategy():
    """Test fixed window rate limiting strategy."""
    strategy = FixedWindowStrategy(max_requests=2, time_window=60)

    # First request should be allowed
    assert strategy.should_allow(current_count=0, elapsed_time=0)

    # Second request should be allowed
    assert strategy.should_allow(current_count=1, elapsed_time=30)

    # Third request should be denied
    assert not strategy.should_allow(current_count=2, elapsed_time=45)


def test_sliding_window_strategy():
    """Test sliding window rate limiting strategy."""
    strategy = SlidingWindowStrategy(max_requests=2, time_window=60)

    # First request should be allowed
    assert strategy.should_allow(current_count=0, elapsed_time=60)

    # Second request should be allowed
    assert strategy.should_allow(current_count=1, elapsed_time=60)

    # Third request should be denied
    assert not strategy.should_allow(current_count=3, elapsed_time=60)


def test_token_bucket_strategy():
    """Test token bucket rate limiting strategy."""
    strategy = TokenBucketStrategy(max_requests=2, time_window=60, refill_rate=0.1)

    # First request should be allowed
    assert strategy.should_allow(current_count=0, elapsed_time=0)

    # Second request should be allowed
    assert strategy.should_allow(current_count=1, elapsed_time=10)

    # Third request should be denied
    assert not strategy.should_allow(current_count=2, elapsed_time=15)

    # After tokens refill, request should be allowed
    assert strategy.should_allow(current_count=1, elapsed_time=20)


def test_rate_limiter_basic_functionality(fixed_window_limiter):
    """Test basic rate limiter functionality."""
    identifier = "test_user"

    # First request should be allowed
    assert fixed_window_limiter.is_allowed(identifier)

    # Get limit info
    info = fixed_window_limiter.get_limit_info(identifier)
    assert info["limit"] == 5
    assert info["remaining"] == 4
    assert "reset_time" in info
    assert "retry_after" in info

    # Reset limiter
    fixed_window_limiter.reset(identifier)

    # Should be allowed again
    assert fixed_window_limiter.is_allowed(identifier)


def test_rate_limiter_exceeding_limit(fixed_window_limiter):
    """Test rate limiter when exceeding limit."""
    identifier = "test_user"

    # Use up all allowed requests
    for _ in range(5):
        assert fixed_window_limiter.is_allowed(identifier)

    # Next request should raise error
    with pytest.raises(RateLimitError) as exc_info:
        fixed_window_limiter.is_allowed(identifier)

    error = exc_info.value
    assert error.message == "Rate limit exceeded"
    assert "limit" in error.details
    assert "remaining" in error.details
    assert "reset_time" in error.details
    assert "retry_after" in error.details


def test_rate_limiter_with_cost(fixed_window_limiter):
    """Test rate limiter with request cost."""
    identifier = "test_user"

    # Request with cost of 3
    assert fixed_window_limiter.is_allowed(identifier, cost=3)

    info = fixed_window_limiter.get_limit_info(identifier)
    assert info["remaining"] == 2  # 5 - 3 = 2


def test_rate_limiter_with_different_strategies(
    redis_client, fixed_window_limiter, sliding_window_limiter, token_bucket_limiter
):
    """Test rate limiter with different strategies."""
    identifier = "test_user"

    # Test fixed window
    assert fixed_window_limiter.is_allowed(identifier)

    # Test sliding window
    assert sliding_window_limiter.is_allowed(identifier)

    # Test token bucket
    assert token_bucket_limiter.is_allowed(identifier)


def test_rate_limiter_namespace_isolation(redis_client):
    """Test rate limiter namespace isolation."""
    identifier = "test_user"

    # Create two limiters with different namespaces
    limiter1 = RateLimiter(
        redis_client,
        FixedWindowStrategy(max_requests=1, time_window=60),
        namespace="ns1",
    )
    limiter2 = RateLimiter(
        redis_client,
        FixedWindowStrategy(max_requests=1, time_window=60),
        namespace="ns2",
    )

    # Use up limit in first namespace
    assert limiter1.is_allowed(identifier)
    with pytest.raises(RateLimitError):
        limiter1.is_allowed(identifier)

    # Should still be allowed in second namespace
    assert limiter2.is_allowed(identifier)


def test_rate_limiter_expiry(redis_client):
    """Test rate limiter key expiry."""
    identifier = "test_user"

    # Create limiter with short window
    limiter = RateLimiter(
        redis_client,
        FixedWindowStrategy(max_requests=1, time_window=1),
        namespace="test_expiry",
    )

    # Use up limit
    assert limiter.is_allowed(identifier)
    with pytest.raises(RateLimitError):
        limiter.is_allowed(identifier)

    # Wait for expiry
    time.sleep(1.1)

    # Should be allowed again
    assert limiter.is_allowed(identifier)


def test_rate_limiter_redis_errors(redis_client):
    """Test rate limiter handling of Redis errors."""
    identifier = "test_user"

    # Create limiter with mock Redis client that raises errors
    mock_redis = Mock()
    mock_redis.pipeline.side_effect = redis.RedisError("Test error")

    limiter = RateLimiter(
        mock_redis,
        FixedWindowStrategy(max_requests=1, time_window=60),
        namespace="test_errors",
    )

    # Should handle Redis errors gracefully
    with pytest.raises(redis.RedisError):
        limiter.is_allowed(identifier)
