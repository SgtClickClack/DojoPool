"""Tests for API performance."""
import pytest
import time
from dojopool.api.handler import APIHandler
from dojopool.models import User, Match, Tournament
from dojopool.core.db import db

def test_api_response_time():
    """Test API response time."""
    # Create handler
    handler = APIHandler()
    
    # Test GET request timing
    start_time = time.time()
    response = handler.handle_request("GET", "/api/users")
    end_time = time.time()
    
    # Check response time is under 100ms
    assert (end_time - start_time) < 0.1
    assert response.status_code == 200

def test_api_concurrent_requests():
    """Test API handling of concurrent requests."""
    # Create handler
    handler = APIHandler()
    
    # Create test data
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Test concurrent login requests
    start_time = time.time()
    responses = []
    for _ in range(10):
        data = {
            "username": "testuser",
            "password": "password123"
        }
        response = handler.handle_request("POST", "/api/auth/login", data)
        responses.append(response)
    end_time = time.time()
    
    # Check all responses are successful
    assert all(r.status_code == 200 for r in responses)
    # Check total time for 10 requests is under 1 second
    assert (end_time - start_time) < 1.0

def test_api_database_performance():
    """Test API database operation performance."""
    # Create handler
    handler = APIHandler()
    
    # Create test data
    users = []
    for i in range(100):
        user = User(
            username=f"testuser{i}",
            email=f"test{i}@example.com"
        )
        users.append(user)
    db.session.add_all(users)
    db.session.commit()
    
    # Test bulk user retrieval
    start_time = time.time()
    response = handler.handle_request("GET", "/api/users?limit=100")
    end_time = time.time()
    
    # Check response time is under 200ms
    assert (end_time - start_time) < 0.2
    assert response.status_code == 200
    assert len(response.json["users"]) == 100

def test_api_caching_performance():
    """Test API caching performance."""
    # Create handler
    handler = APIHandler()
    
    # Create test data
    tournament = Tournament(name="Test Tournament")
    db.session.add(tournament)
    db.session.commit()
    
    # First request (uncached)
    start_time = time.time()
    response1 = handler.handle_request("GET", f"/api/tournaments/{tournament.id}")
    uncached_time = time.time() - start_time
    
    # Second request (should be cached)
    start_time = time.time()
    response2 = handler.handle_request("GET", f"/api/tournaments/{tournament.id}")
    cached_time = time.time() - start_time
    
    # Check cached response is faster
    assert cached_time < uncached_time
    assert response1.status_code == 200
    assert response2.status_code == 200