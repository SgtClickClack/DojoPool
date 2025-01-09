"""Tests for API handler functionality."""
import pytest
from dojopool.api.handler import APIHandler
from dojopool.models import User, Match, Tournament
from dojopool.core.db import db

def test_api_request_handling():
    """Test API request handling."""
    # Create handler
    handler = APIHandler()
    
    # Test GET request
    response = handler.handle_request("GET", "/api/users")
    assert response.status_code == 200
    assert "users" in response.json
    
    # Test POST request
    data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    response = handler.handle_request("POST", "/api/users", data)
    assert response.status_code == 201
    assert "user" in response.json
    
    # Test invalid request
    response = handler.handle_request("PUT", "/api/invalid")
    assert response.status_code == 404

def test_api_authentication():
    """Test API authentication."""
    # Create handler
    handler = APIHandler()
    
    # Create test user
    user = User(
        username="testuser",
        email="test@example.com"
    )
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Test login
    data = {
        "username": "testuser",
        "password": "password123"
    }
    response = handler.handle_request("POST", "/api/auth/login", data)
    assert response.status_code == 200
    assert "token" in response.json
    
    # Test protected endpoint without token
    response = handler.handle_request("GET", "/api/protected")
    assert response.status_code == 401
    
    # Test protected endpoint with token
    token = response.json["token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = handler.handle_request("GET", "/api/protected", headers=headers)
    assert response.status_code == 200

def test_api_error_handling():
    """Test API error handling."""
    # Create handler
    handler = APIHandler()
    
    # Test invalid JSON
    response = handler.handle_request("POST", "/api/users", data="invalid json")
    assert response.status_code == 400
    assert "error" in response.json
    
    # Test validation error
    data = {
        "username": "",  # Empty username
        "email": "invalid email",
        "password": "short"
    }
    response = handler.handle_request("POST", "/api/users", data)
    assert response.status_code == 422
    assert "errors" in response.json
    
    # Test not found error
    response = handler.handle_request("GET", "/api/users/999999")
    assert response.status_code == 404
    assert "error" in response.json 