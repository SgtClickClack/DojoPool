"""Test rate limiting functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.rate_limit import rate_limit_service
from dojopool.models import User, Game, Match

def test_rate_limit_basic():
    """Test basic rate limiting."""
    key = "test_key"
    limit = 5
    period = 60  # seconds
    
    for i in range(limit):
        assert rate_limit_service.check_rate_limit(key, limit, period) is True
    
    assert rate_limit_service.check_rate_limit(key, limit, period) is False

def test_rate_limit_reset():
    """Test rate limit reset."""
    key = "reset_test"
    limit = 3
    period = 1  # second
    
    for i in range(limit):
        assert rate_limit_service.check_rate_limit(key, limit, period) is True
    
    assert rate_limit_service.check_rate_limit(key, limit, period) is False
    
    # Wait for reset
    time.sleep(1.1)
    
    assert rate_limit_service.check_rate_limit(key, limit, period) is True

def test_rate_limit_multiple_keys():
    """Test rate limiting with multiple keys."""
    limit = 3
    period = 60
    keys = ["key1", "key2", "key3"]
    
    for key in keys:
        for i in range(limit):
            assert rate_limit_service.check_rate_limit(key, limit, period) is True
        assert rate_limit_service.check_rate_limit(key, limit, period) is False

def test_rate_limit_remaining():
    """Test remaining rate limit checks."""
    key = "remaining_test"
    limit = 5
    period = 60
    
    for i in range(3):  # Use 3 out of 5 requests
        rate_limit_service.check_rate_limit(key, limit, period)
    
    remaining = rate_limit_service.get_remaining_limit(key)
    assert remaining == 2

def test_rate_limit_reset_time():
    """Test rate limit reset time."""
    key = "reset_time_test"
    limit = 5
    period = 60
    
    rate_limit_service.check_rate_limit(key, limit, period)
    reset_time = rate_limit_service.get_reset_time(key)
    
    assert reset_time > datetime.utcnow()
    assert reset_time <= datetime.utcnow() + timedelta(seconds=period)

def test_rate_limit_cleanup():
    """Test rate limit cleanup."""
    key = "cleanup_test"
    limit = 5
    period = 1
    
    rate_limit_service.check_rate_limit(key, limit, period)
    
    # Wait for expiry
    time.sleep(1.1)
    
    rate_limit_service.cleanup_expired()
    assert rate_limit_service.get_remaining_limit(key) == limit

def test_rate_limit_burst():
    """Test burst rate limiting."""
    key = "burst_test"
    limit = 10
    period = 60
    burst = 15  # Allow burst up to 15 requests
    
    for i in range(burst):
        assert rate_limit_service.check_rate_limit(key, limit, period, burst=burst) is True
    
    assert rate_limit_service.check_rate_limit(key, limit, period, burst=burst) is False

def test_rate_limit_sliding_window():
    """Test sliding window rate limiting."""
    key = "sliding_test"
    limit = 5
    period = 2  # seconds
    
    # Use all requests
    for i in range(limit):
        assert rate_limit_service.check_rate_limit(key, limit, period, sliding=True) is True
    
    assert rate_limit_service.check_rate_limit(key, limit, period, sliding=True) is False
    
    # Wait for half the period
    time.sleep(1)
    
    # Should still be limited
    assert rate_limit_service.check_rate_limit(key, limit, period, sliding=True) is False
    
    # Wait for the rest of the period
    time.sleep(1.1)
    
    # Should be able to make requests again
    assert rate_limit_service.check_rate_limit(key, limit, period, sliding=True) is True

def test_rate_limit_distributed():
    """Test distributed rate limiting."""
    key = "distributed_test"
    limit = 10
    period = 60
    
    # Simulate multiple nodes
    nodes = ["node1", "node2", "node3"]
    
    for node in nodes:
        for i in range(limit // len(nodes)):
            assert rate_limit_service.check_rate_limit(
                key, limit, period, node_id=node
            ) is True
    
    # All nodes should be limited now
    for node in nodes:
        assert rate_limit_service.check_rate_limit(
            key, limit, period, node_id=node
        ) is False

def test_rate_limit_statistics():
    """Test rate limit statistics."""
    key = "stats_test"
    limit = 10
    period = 60
    
    for i in range(5):
        rate_limit_service.check_rate_limit(key, limit, period)
    
    stats = rate_limit_service.get_statistics(key)
    assert stats["total_requests"] == 5
    assert stats["remaining_limit"] == 5
    assert "reset_time" in stats
``` 