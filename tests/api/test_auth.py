"""Tests for authentication API endpoints."""
import pytest
from dojopool.models import User
from dojopool.core.db import db
from dojopool.core.auth.service import auth_service

def test_register(client):
    """Test user registration."""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = client.post(
        "/api/auth/register",
        json=user_data
    )
    assert response.status_code == 201
    assert response.json["username"] == user_data["username"]
    assert response.json["email"] == user_data["email"]
    
    # Verify user was created in database
    user = User.query.filter_by(email=user_data["email"]).first()
    assert user is not None
    assert user.username == user_data["username"]
    assert user.check_password(user_data["password"])

def test_login(client):
    """Test user login."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    login_data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = client.post(
        "/api/auth/login",
        json=login_data
    )
    assert response.status_code == 200
    assert "token" in response.json
    assert "user" in response.json
    assert response.json["user"]["email"] == login_data["email"]

def test_verify_token(client):
    """Test token verification."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create token
    token = auth_service.create_token(user)
    
    response = client.get(
        "/api/auth/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json["valid"]
    assert response.json["user"]["email"] == user.email

def test_change_password(client, auth_headers):
    """Test password change."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    password_data = {
        "old_password": "password123",
        "new_password": "newpassword123"
    }
    
    response = client.post(
        "/api/auth/change-password",
        json=password_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify password was changed
    user = User.query.filter_by(email="test@example.com").first()
    assert user.check_password("newpassword123")

def test_reset_password(client):
    """Test password reset."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Request password reset
    response = client.post(
        "/api/auth/reset-password",
        json={"email": "test@example.com"}
    )
    assert response.status_code == 200
    
    # Get reset token
    token = auth_service.create_reset_token(user)
    
    # Reset password
    response = client.post(
        f"/api/auth/reset-password/{token}",
        json={"password": "newpassword123"}
    )
    assert response.status_code == 200
    
    # Verify password was reset
    user = User.query.filter_by(email="test@example.com").first()
    assert user.check_password("newpassword123")