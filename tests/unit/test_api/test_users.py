"""Test suite for user management API endpoints."""

import pytest
from flask import url_for
from dojopool.models.user import User
from dojopool.core.auth.security import verify_password

def test_register_success(client):
    """Test successful user registration."""
    data = {
        'email': 'test@example.com',
        'password': 'SecurePass123!',
        'name': 'Test User'
    }
    
    response = client.post('/api/users/register', json=data)
    assert response.status_code == 201
    
    json_data = response.get_json()
    assert 'message' in json_data
    assert 'user' in json_data
    assert 'token' in json_data
    
    user = json_data['user']
    assert user['email'] == data['email']
    assert user['name'] == data['name']
    assert 'password' not in user

def test_register_duplicate_email(client, user):
    """Test registration with existing email."""
    data = {
        'email': user.email,
        'password': 'SecurePass123!',
        'name': 'Another User'
    }
    
    response = client.post('/api/users/register', json=data)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert 'errors' in json_data
    assert 'email' in json_data['errors']

def test_register_invalid_data(client):
    """Test registration with invalid data."""
    # Missing required fields
    response = client.post('/api/users/register', json={})
    assert response.status_code == 400
    
    # Invalid email format
    data = {
        'email': 'invalid-email',
        'password': 'SecurePass123!',
        'name': 'Test User'
    }
    response = client.post('/api/users/register', json=data)
    assert response.status_code == 400
    
    # Weak password
    data = {
        'email': 'test@example.com',
        'password': '123',
        'name': 'Test User'
    }
    response = client.post('/api/users/register', json=data)
    assert response.status_code == 400

def test_login_success(client, user):
    """Test successful login."""
    data = {
        'email': user.email,
        'password': 'password123'  # From user fixture
    }
    
    response = client.post('/api/users/login', json=data)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert 'message' in json_data
    assert 'user' in json_data
    assert 'token' in json_data
    
    assert json_data['user']['id'] == user.id
    assert json_data['user']['email'] == user.email

def test_login_invalid_credentials(client, user):
    """Test login with invalid credentials."""
    # Wrong password
    data = {
        'email': user.email,
        'password': 'wrongpass'
    }
    response = client.post('/api/users/login', json=data)
    assert response.status_code == 401
    
    # Non-existent email
    data = {
        'email': 'nonexistent@example.com',
        'password': 'password123'
    }
    response = client.post('/api/users/login', json=data)
    assert response.status_code == 401

def test_logout(client, auth_headers):
    """Test user logout."""
    response = client.post('/api/users/logout', headers=auth_headers)
    assert response.status_code == 200
    
    # Verify we can't access protected routes after logout
    response = client.get('/api/users/me', headers=auth_headers)
    assert response.status_code == 401

def test_get_current_user(client, auth_headers, user):
    """Test getting current user profile."""
    response = client.get('/api/users/me', headers=auth_headers)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert 'user' in json_data
    assert json_data['user']['id'] == user.id
    assert json_data['user']['email'] == user.email

def test_update_current_user(client, auth_headers, user):
    """Test updating current user profile."""
    data = {
        'name': 'Updated Name',
        'email': 'updated@example.com'
    }
    
    response = client.put('/api/users/me', json=data, headers=auth_headers)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert 'message' in json_data
    assert 'user' in json_data
    assert json_data['user']['name'] == data['name']
    assert json_data['user']['email'] == data['email']

def test_update_current_user_duplicate_email(client, auth_headers, user):
    """Test updating user with existing email."""
    # Create another user first
    other_user = User(email='other@example.com', name='Other User')
    other_user.set_password('password123')
    db.session.add(other_user)
    db.session.commit()
    
    # Try to update current user's email to other user's email
    data = {'email': other_user.email}
    response = client.put('/api/users/me', json=data, headers=auth_headers)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert 'errors' in json_data
    assert 'email' in json_data['errors']

def test_change_password(client, auth_headers, user):
    """Test changing user password."""
    data = {
        'current_password': 'password123',
        'new_password': 'NewSecurePass123!'
    }
    
    response = client.put('/api/users/me/password', json=data, headers=auth_headers)
    assert response.status_code == 200
    
    # Verify new password works
    user.refresh_from_db()
    assert verify_password(user.password_hash, data['new_password'])

def test_change_password_wrong_current(client, auth_headers):
    """Test changing password with wrong current password."""
    data = {
        'current_password': 'wrongpass',
        'new_password': 'NewSecurePass123!'
    }
    
    response = client.put('/api/users/me/password', json=data, headers=auth_headers)
    assert response.status_code == 401

def test_get_user_profile(client, auth_headers, user):
    """Test getting another user's public profile."""
    response = client.get(f'/api/users/{user.id}', headers=auth_headers)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert 'user' in json_data
    assert json_data['user']['id'] == user.id
    assert 'email' not in json_data['user']  # Email should not be in public profile

def test_get_nonexistent_user(client, auth_headers):
    """Test getting profile of non-existent user."""
    response = client.get('/api/users/99999', headers=auth_headers)
    assert response.status_code == 404 