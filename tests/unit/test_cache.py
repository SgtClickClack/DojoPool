"""Test cache functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.cache import cache_service
from dojopool.models import User, Game, Match

def test_cache_set_get():
    """Test basic cache set and get operations."""
    key = "test_key"
    value = "test_value"
    
    cache_service.set(key, value)
    result = cache_service.get(key)
    
    assert result == value

def test_cache_expiry():
    """Test cache expiry functionality."""
    key = "expiry_test"
    value = "expiry_value"
    ttl = 1  # 1 second
    
    cache_service.set(key, value, ttl=ttl)
    
    # Value should exist initially
    assert cache_service.get(key) == value
    
    # Wait for expiry
    time.sleep(1.1)
    
    # Value should be None after expiry
    assert cache_service.get(key) is None

def test_cache_delete():
    """Test cache deletion."""
    key = "delete_test"
    value = "delete_value"
    
    cache_service.set(key, value)
    assert cache_service.get(key) == value
    
    cache_service.delete(key)
    assert cache_service.get(key) is None

def test_cache_clear():
    """Test clearing entire cache."""
    keys = ["key1", "key2", "key3"]
    value = "test_value"
    
    for key in keys:
        cache_service.set(key, value)
    
    cache_service.clear()
    
    for key in keys:
        assert cache_service.get(key) is None

def test_cache_update():
    """Test updating cached values."""
    key = "update_test"
    value1 = "value1"
    value2 = "value2"
    
    cache_service.set(key, value1)
    assert cache_service.get(key) == value1
    
    cache_service.set(key, value2)
    assert cache_service.get(key) == value2

def test_cache_complex_objects():
    """Test caching complex Python objects."""
    key = "complex_test"
    value = {
        "string": "test",
        "number": 123,
        "list": [1, 2, 3],
        "dict": {"nested": "value"}
    }
    
    cache_service.set(key, value)
    result = cache_service.get(key)
    
    assert result == value
    assert isinstance(result, dict)
    assert isinstance(result["list"], list)
    assert isinstance(result["dict"], dict)

def test_cache_none_values():
    """Test caching None values."""
    key = "none_test"
    
    cache_service.set(key, None)
    assert cache_service.get(key) is None
    
    # Distinguish between non-existent key and None value
    non_existent = cache_service.get("non_existent_key")
    assert non_existent is None

def test_cache_multiple_operations():
    """Test multiple cache operations in sequence."""
    operations = [
        ("key1", "value1"),
        ("key2", "value2"),
        ("key3", "value3")
    ]
    
    # Set multiple values
    for key, value in operations:
        cache_service.set(key, value)
    
    # Verify all values
    for key, value in operations:
        assert cache_service.get(key) == value
    
    # Delete some values
    cache_service.delete(operations[0][0])
    assert cache_service.get(operations[0][0]) is None
    assert cache_service.get(operations[1][0]) == operations[1][1]

def test_cache_with_model_objects():
    """Test caching model objects."""
    user = User(username="test_user", email="test@example.com")
    key = f"user_{user.id}"
    
    cache_service.set(key, user)
    cached_user = cache_service.get(key)
    
    assert cached_user.username == user.username
    assert cached_user.email == user.email

def test_cache_performance():
    """Test cache performance."""
    num_operations = 1000
    start_time = time.time()
    
    for i in range(num_operations):
        key = f"perf_test_{i}"
        cache_service.set(key, f"value_{i}")
        _ = cache_service.get(key)
    
    end_time = time.time()
    total_time = end_time - start_time
    
    # Performance assertion: 1000 operations should complete within 1 second
    assert total_time < 1.0 