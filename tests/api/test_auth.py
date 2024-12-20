"""Tests for authentication API endpoints."""

import pytest
from flask import url_for
from src.core.models import User
from datetime import datetime, timedelta

def test_register_success(client, session):
    """Test successful user registration."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }
    
    response = client.post('/auth/register', json=data)
    assert response.status_code == 201
    
    # Check response format
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'token' in json_data['data']
    assert json_data['data']['user']['username'] == data['username']
    assert json_data['data']['user']['email'] == data['email']
    
    # Verify user was created in database
    user = User.query.filter_by(username=data['username']).first()
    assert user is not None
    assert user.email == data['email']
    assert user.check_password(data['password'])

def test_register_duplicate_username(client, user):
    """Test registration with existing username."""
    data = {
        'username': user.username,
        'email': 'different@example.com',
        'password': 'testpass123'
    }
    
    response = client.post('/auth/register', json=data)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'username already exists' in json_data['message'].lower()

def test_register_duplicate_email(client, user):
    """Test registration with existing email."""
    data = {
        'username': 'different_user',
        'email': user.email,
        'password': 'testpass123'
    }
    
    response = client.post('/auth/register', json=data)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'email already exists' in json_data['message'].lower()

def test_register_missing_fields(client):
    """Test registration with missing required fields."""
    data = {'username': 'testuser'}  # Missing email and password
    
    response = client.post('/auth/register', json=data)
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'missing required fields' in json_data['message'].lower()

def test_login_success(client, user):
    """Test successful login."""
    data = {
        'username': user.username,
        'password': 'password123'  # Default password from UserFactory
    }
    
    response = client.post('/auth/login', json=data)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'token' in json_data['data']
    assert json_data['data']['user']['username'] == user.username

def test_login_invalid_credentials(client, user):
    """Test login with invalid credentials."""
    data = {
        'username': user.username,
        'password': 'wrongpassword'
    }
    
    response = client.post('/auth/login', json=data)
    assert response.status_code == 401
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'invalid username or password' in json_data['message'].lower()

def test_login_inactive_user(client, user):
    """Test login with inactive user account."""
    user.is_active = False
    data = {
        'username': user.username,
        'password': 'password123'
    }
    
    response = client.post('/auth/login', json=data)
    assert response.status_code == 401
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'account is deactivated' in json_data['message'].lower()

def test_logout(client, user):
    """Test user logout."""
    # First login
    client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    
    # Then logout
    response = client.post('/auth/logout')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert 'logout successful' in json_data['message'].lower()

def test_get_profile_authenticated(client, user):
    """Test getting user profile when authenticated."""
    # First login
    client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    
    response = client.get('/auth/me')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['user']['username'] == user.username
    assert json_data['data']['user']['email'] == user.email

def test_get_profile_unauthenticated(client):
    """Test getting user profile when not authenticated."""
    response = client.get('/auth/me')
    assert response.status_code == 401

def test_update_profile(client, user):
    """Test updating user profile."""
    # First login
    client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    
    # Update profile
    data = {
        'email': 'newemail@example.com',
        'password': 'newpassword123'
    }
    
    response = client.put('/auth/me', json=data)
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['user']['email'] == data['email']
    
    # Verify password was updated
    user = User.query.filter_by(username=user.username).first()
    assert user.check_password(data['password']) 

def test_token_validation(client, user):
    """Test token validation and expiration."""
    # Login to get token
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    
    # Test valid token
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    
    # Test invalid token
    headers = {'Authorization': 'Bearer invalid_token'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    
    # Test malformed token
    headers = {'Authorization': 'malformed_header'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401

def test_content_type_validation(client):
    """Test content type validation for API endpoints."""
    # Test without content type header
    response = client.post('/auth/register')
    assert response.status_code == 415
    
    # Test with wrong content type
    headers = {'Content-Type': 'text/plain'}
    response = client.post('/auth/register', headers=headers)
    assert response.status_code == 415
    
    # Test with form data instead of JSON
    response = client.post('/auth/register', data={'username': 'test'})
    assert response.status_code == 415

def test_rate_limiting(client):
    """Test rate limiting on auth endpoints."""
    # Make multiple rapid requests
    for _ in range(5):
        client.post('/auth/login', json={
            'username': 'test',
            'password': 'test'
        })
    
    # Next request should be rate limited
    response = client.post('/auth/login', json={
        'username': 'test',
        'password': 'test'
    })
    assert response.status_code == 429
    assert 'retry after' in response.get_json()['message'].lower()

def test_session_management(client, user):
    """Test session management and concurrent logins."""
    # First login
    response1 = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token1 = response1.get_json()['data']['token']
    
    # Second login from different client
    response2 = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token2 = response2.get_json()['data']['token']
    
    # Both tokens should be valid
    headers1 = {'Authorization': f'Bearer {token1}'}
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    assert client.get('/auth/me', headers=headers1).status_code == 200
    assert client.get('/auth/me', headers=headers2).status_code == 200
    
    # Logout from first session
    client.post('/auth/logout', headers=headers1)
    
    # First token should be invalid, second still valid
    assert client.get('/auth/me', headers=headers1).status_code == 401
    assert client.get('/auth/me', headers=headers2).status_code == 200

def test_session_limits(client, user):
    """Test maximum concurrent sessions."""
    max_sessions = 3
    active_tokens = []
    
    # Create maximum allowed sessions
    for _ in range(max_sessions):
        response = client.post('/auth/login', json={
            'username': user.username,
            'password': 'password123'
        })
        assert response.status_code == 200
        token = response.get_json()['data']['token']
        active_tokens.append(token)
    
    # Verify all sessions are active
    for token in active_tokens:
        headers = {'Authorization': f'Bearer {token}'}
        response = client.get('/auth/me', headers=headers)
        assert response.status_code == 200
    
    # Try to create one more session
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 400
    assert 'maximum sessions reached' in response.get_json()['message'].lower()

def test_session_inactivity_timeout(client, user):
    """Test session inactivity timeout."""
    # Login to create session
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Initial request should work
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    
    # Simulate session timeout (handled by server-side logic)
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    assert 'session expired' in response.get_json()['message'].lower()

def test_remember_me_functionality(client, user):
    """Test remember me login functionality."""
    # Login with remember me
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'remember_me': True
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'token' in data
    assert data['token_expires_in'] > 3600  # Regular tokens expire in 1 hour
    
    # Login without remember me
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'remember_me': False
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'token' in data
    assert data['token_expires_in'] <= 3600  # Regular session length

def test_password_validation(client):
    """Test password validation rules."""
    test_cases = [
        {
            'password': 'short',  # Too short
            'expected_status': 400,
            'expected_message': 'password must be at least'
        },
        {
            'password': '12345678',  # No letters
            'expected_status': 400,
            'expected_message': 'password must contain'
        },
        {
            'password': 'abcdefgh',  # No numbers
            'expected_status': 400,
            'expected_message': 'password must contain'
        },
        {
            'password': 'password123',  # Common password
            'expected_status': 400,
            'expected_message': 'password is too common'
        }
    ]
    
    for test_case in test_cases:
        response = client.post('/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': test_case['password']
        })
        assert response.status_code == test_case['expected_status']
        assert test_case['expected_message'] in response.get_json()['message'].lower()

def test_email_validation(client):
    """Test email validation rules."""
    test_cases = [
        {
            'email': 'invalid-email',
            'expected_status': 400,
            'expected_message': 'invalid email format'
        },
        {
            'email': 'test@nonexistent',
            'expected_status': 400,
            'expected_message': 'invalid email format'
        },
        {
            'email': '@example.com',
            'expected_status': 400,
            'expected_message': 'invalid email format'
        },
        {
            'email': 'test@.com',
            'expected_status': 400,
            'expected_message': 'invalid email format'
        }
    ]
    
    for test_case in test_cases:
        response = client.post('/auth/register', json={
            'username': 'testuser',
            'password': 'ValidPass123!',
            'email': test_case['email']
        })
        assert response.status_code == test_case['expected_status']
        assert test_case['expected_message'] in response.get_json()['message'].lower()

def test_xss_prevention(client):
    """Test prevention of XSS attacks in user input."""
    xss_payloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">',
        '<svg/onload=alert("xss")>'
    ]
    
    for payload in xss_payloads:
        response = client.post('/auth/register', json={
            'username': payload,
            'email': 'test@example.com',
            'password': 'ValidPass123!'
        })
        assert response.status_code == 400
        assert 'invalid characters' in response.get_json()['message'].lower()

def test_csrf_protection(client, user):
    """Test CSRF protection on authentication endpoints."""
    # Test without CSRF token
    client.set_cookie('localhost', 'session', 'dummy-session-id')
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 400
    assert 'csrf' in response.get_json()['message'].lower()

def test_brute_force_protection(client, user):
    """Test protection against brute force attacks."""
    # Attempt multiple failed logins
    for _ in range(10):
        response = client.post('/auth/login', json={
            'username': user.username,
            'password': 'wrong_password'
        })
    
    # Account should be temporarily locked
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'  # Correct password
    })
    assert response.status_code == 429
    assert 'account temporarily locked' in response.get_json()['message'].lower()

def test_refresh_token(client, user):
    """Test refresh token functionality."""
    # Initial login
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    refresh_token = response.get_json()['data']['refresh_token']
    
    # Use refresh token to get new access token
    headers = {'Authorization': f'Bearer {refresh_token}'}
    response = client.post('/auth/refresh', headers=headers)
    assert response.status_code == 200
    
    data = response.get_json()
    assert 'access_token' in data['data']
    assert data['data']['access_token'] != refresh_token
    
    # Verify new access token works
    headers = {'Authorization': f'Bearer {data["data"]["access_token"]}'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200

def test_refresh_token_reuse(client, user):
    """Test prevention of refresh token reuse."""
    # Initial login
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    refresh_token = response.get_json()['data']['refresh_token']
    
    # First refresh
    headers = {'Authorization': f'Bearer {refresh_token}'}
    response = client.post('/auth/refresh', headers=headers)
    assert response.status_code == 200
    
    # Attempt to reuse the same refresh token
    response = client.post('/auth/refresh', headers=headers)
    assert response.status_code == 401
    assert 'token has been used' in response.get_json()['message'].lower()

def test_token_expiration(client, user):
    """Test token expiration handling."""
    # Initial login
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    access_token = response.get_json()['data']['access_token']
    
    # Mock token expiration (this would normally be handled by time)
    headers = {'Authorization': f'Bearer {access_token}'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    assert 'token has expired' in response.get_json()['message'].lower()

def test_api_versioning(client):
    """Test API version handling."""
    # Test current version
    headers = {'Accept': 'application/json; version=1.0'}
    response = client.post('/auth/register', headers=headers, json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 201
    
    # Test unsupported version
    headers = {'Accept': 'application/json; version=999.0'}
    response = client.post('/auth/register', headers=headers, json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 406
    assert 'unsupported api version' in response.get_json()['message'].lower()

def test_backward_compatibility(client):
    """Test backward compatibility with older API versions."""
    # Test without version (should use latest)
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 201
    
    # Test with older version format
    headers = {'Accept': 'application/vnd.dojopool.v1+json'}
    response = client.post('/auth/register', headers=headers, json={
        'username': 'testuser2',
        'email': 'test2@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 201

def test_error_response_format(client):
    """Test consistency of error response format."""
    test_cases = [
        {
            'endpoint': '/auth/login',
            'data': {},  # Missing credentials
            'expected_status': 400
        },
        {
            'endpoint': '/auth/register',
            'data': {'email': 'invalid'},  # Invalid email
            'expected_status': 400
        },
        {
            'endpoint': '/auth/refresh',
            'data': {},  # No token
            'expected_status': 401
        }
    ]
    
    for test_case in test_cases:
        response = client.post(test_case['endpoint'], json=test_case['data'])
        assert response.status_code == test_case['expected_status']
        
        data = response.get_json()
        # Verify error response structure
        assert 'status' in data
        assert data['status'] == 'error'
        assert 'message' in data
        assert 'code' in data
        assert isinstance(data['message'], str)
        assert isinstance(data['code'], str)

def test_password_complexity(client):
    """Test password complexity requirements."""
    test_data = [
        {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': '12345678'  # Numbers only
        },
        {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'abcdefgh'  # Letters only
        },
        {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'Ab1'  # Too short
        }
    ]
    
    for data in test_data:
        response = client.post('/auth/register', json=data)
        assert response.status_code == 400
        json_data = response.get_json()
        assert 'password' in json_data['message'].lower()
        assert json_data['status'] == 'error'

def test_username_format(client):
    """Test username format validation."""
    test_data = [
        {
            'username': 'test@user',  # Contains @
            'email': 'test@example.com',
            'password': 'ValidPass123!'
        },
        {
            'username': 'test.user.',  # Ends with dot
            'email': 'test@example.com',
            'password': 'ValidPass123!'
        },
        {
            'username': '_testuser',  # Starts with underscore
            'email': 'test@example.com',
            'password': 'ValidPass123!'
        }
    ]
    
    for data in test_data:
        response = client.post('/auth/register', json=data)
        assert response.status_code == 400
        json_data = response.get_json()
        assert 'username' in json_data['message'].lower()
        assert json_data['status'] == 'error'

def test_request_headers(client, user):
    """Test request header validation."""
    # Test missing authorization header
    response = client.get('/auth/me')
    assert response.status_code == 401
    assert 'authorization' in response.get_json()['message'].lower()
    
    # Test malformed authorization header
    headers = {'Authorization': 'NotBearer token123'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    assert 'invalid authorization' in response.get_json()['message'].lower()
    
    # Test empty bearer token
    headers = {'Authorization': 'Bearer '}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    assert 'invalid token' in response.get_json()['message'].lower()

def test_response_headers(client, user):
    """Test API response headers."""
    # Login to test response headers
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    
    # Check security headers
    assert 'X-Content-Type-Options' in response.headers
    assert response.headers['X-Content-Type-Options'] == 'nosniff'
    
    assert 'X-Frame-Options' in response.headers
    assert response.headers['X-Frame-Options'] == 'DENY'
    
    assert 'X-XSS-Protection' in response.headers
    assert response.headers['X-XSS-Protection'] == '1; mode=block'
    
    # Check CORS headers for OPTIONS request
    response = client.options('/auth/login')
    assert 'Access-Control-Allow-Origin' in response.headers
    assert 'Access-Control-Allow-Methods' in response.headers
    assert 'Access-Control-Allow-Headers' in response.headers

def test_registration_throttling(client):
    """Test registration endpoint throttling."""
    # Make multiple registration attempts
    for i in range(5):
        response = client.post('/auth/register', json={
            'username': f'testuser{i}',
            'email': f'test{i}@example.com',
            'password': 'ValidPass123!'
        })
        if response.status_code == 429:
            # If we hit the rate limit before 5 requests, that's fine
            break
    
    # Next request should definitely be throttled
    response = client.post('/auth/register', json={
        'username': 'testuser_final',
        'email': 'test_final@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 429
    json_data = response.get_json()
    assert 'too many requests' in json_data['message'].lower()

def test_concurrent_operations(client, db_session):
    """Test handling of concurrent authentication operations."""
    # Create initial user
    response = client.post('/auth/register', json={
        'username': 'concurrent_user',
        'email': 'concurrent@example.com',
        'password': 'ValidPass123!'
    })
    assert response.status_code == 201
    
    # Test concurrent login attempts
    for _ in range(3):
        response = client.post('/auth/login', json={
            'username': 'concurrent_user',
            'password': 'ValidPass123!'
        })
        assert response.status_code == 200
        assert 'token' in response.get_json()['data']
    
    # Test concurrent profile access
    tokens = []
    for _ in range(3):
        response = client.post('/auth/login', json={
            'username': 'concurrent_user',
            'password': 'ValidPass123!'
        })
        token = response.get_json()['data']['token']
        tokens.append(token)
    
    # All tokens should be valid
    for token in tokens:
        headers = {'Authorization': f'Bearer {token}'}
        response = client.get('/auth/me', headers=headers)
        assert response.status_code == 200

def test_token_blacklisting(client, user):
    """Test token blacklisting after logout."""
    # Login to get token
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Use token to access protected route
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    
    # Logout to blacklist token
    response = client.post('/auth/logout', headers=headers)
    assert response.status_code == 200
    
    # Try to use blacklisted token
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    assert 'invalid or expired token' in response.get_json()['message'].lower()

def test_session_invalidation(client, user):
    """Test session invalidation on password change."""
    # Login to get first token
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token1 = response.get_json()['data']['token']
    headers1 = {'Authorization': f'Bearer {token1}'}
    
    # Change password
    response = client.put('/auth/me', headers=headers1, json={
        'current_password': 'password123',
        'new_password': 'NewPass123!'
    })
    assert response.status_code == 200
    
    # Old token should be invalidated
    response = client.get('/auth/me', headers=headers1)
    assert response.status_code == 401
    
    # Login with new password
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'NewPass123!'
    })
    token2 = response.get_json()['data']['token']
    headers2 = {'Authorization': f'Bearer {token2}'}
    
    # New token should work
    response = client.get('/auth/me', headers=headers2)
    assert response.status_code == 200

def test_account_lockout(client, user):
    """Test account lockout after multiple failed login attempts."""
    # Attempt multiple failed logins
    for _ in range(5):
        response = client.post('/auth/login', json={
            'username': user.username,
            'password': 'wrong_password'
        })
        assert response.status_code in [401, 429]  # Either unauthorized or too many attempts
    
    # Account should be locked now
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'  # Correct password
    })
    assert response.status_code == 429
    assert 'account locked' in response.get_json()['message'].lower()
    
    # Password reset should still work
    response = client.post('/auth/password/reset-request', json={
        'email': user.email
    })
    assert response.status_code == 200
    assert 'reset instructions sent' in response.get_json()['message'].lower()

def test_password_reset_flow(client, user):
    """Test complete password reset flow."""
    # Request password reset
    response = client.post('/auth/password/reset-request', json={
        'email': user.email
    })
    assert response.status_code == 200
    
    # Simulate clicking reset link (normally sent via email)
    # In test environment, we can generate a valid reset token
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    
    # Reset password with token
    response = client.post('/auth/password/reset', json={
        'token': token,
        'new_password': 'NewSecurePass123!'
    })
    assert response.status_code == 200
    
    # Old password should no longer work
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 401
    
    # New password should work
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'NewSecurePass123!'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_account_verification(client, unverified_user):
    """Test account verification process."""
    # Unverified user cannot login
    response = client.post('/auth/login', json={
        'username': unverified_user.username,
        'password': 'password123'
    })
    assert response.status_code == 401
    assert 'account not verified' in response.get_json()['message'].lower()
    
    # Request new verification email
    response = client.post('/auth/verify/resend', json={
        'email': unverified_user.email
    })
    assert response.status_code == 200
    assert 'verification email sent' in response.get_json()['message'].lower()
    
    # Simulate clicking verification link
    # In test environment, we can generate a valid verification token
    response = client.post('/auth/verify', json={
        'token': 'test_verification_token',
        'email': unverified_user.email
    })
    assert response.status_code == 200
    assert 'account verified' in response.get_json()['message'].lower()
    
    # Now user should be able to login
    response = client.post('/auth/login', json={
        'username': unverified_user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_email_change_verification(client, user):
    """Test email change verification process."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Request email change
    new_email = 'newemail@example.com'
    response = client.post('/auth/email/change', headers=headers, json={
        'new_email': new_email
    })
    assert response.status_code == 200
    assert 'verification email sent' in response.get_json()['message'].lower()
    
    # Old email should still work until verified
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['data']['user']['email'] == user.email
    
    # Verify new email
    response = client.post('/auth/email/verify', json={
        'token': 'test_verification_token',
        'email': new_email
    })
    assert response.status_code == 200
    
    # Check that email was updated
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    assert response.get_json()['data']['user']['email'] == new_email

def test_account_deletion(client, user):
    """Test account deletion and cleanup."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Request account deletion
    response = client.delete('/auth/me', headers=headers, json={
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    assert 'account deleted' in response.get_json()['message'].lower()
    
    # Verify account is deleted
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 401
    assert 'user not found' in response.get_json()['message'].lower()
    
    # Old token should be invalidated
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 401
    
    # Verify user data is cleaned up
    response = client.post('/auth/password/reset-request', json={
        'email': user.email
    })
    assert response.status_code == 404
    assert 'email not found' in response.get_json()['message'].lower()

def test_account_deactivation(client, user):
    """Test account deactivation and reactivation."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Deactivate account
    response = client.post('/auth/me/deactivate', headers=headers, json={
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    assert 'account deactivated' in response.get_json()['message'].lower()
    
    # Cannot login while deactivated
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 401
    assert 'account deactivated' in response.get_json()['message'].lower()
    
    # Can still use password reset
    response = client.post('/auth/password/reset-request', json={
        'email': user.email
    })
    assert response.status_code == 200
    
    # Reactivate account
    response = client.post('/auth/reactivate', json={
        'email': user.email,
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'account reactivated' in response.get_json()['message'].lower()
    
    # Can login again
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_oauth_login(client, mocker):
    """Test OAuth login flow."""
    # Mock OAuth provider response
    mock_oauth_data = {
        'id': '12345',
        'email': 'oauth_user@example.com',
        'name': 'OAuth User',
        'picture': 'https://example.com/avatar.jpg'
    }
    mocker.patch('src.auth.oauth.get_oauth_user_info', return_value=mock_oauth_data)
    
    # Test OAuth login
    response = client.post('/auth/oauth/login', json={
        'provider': 'google',
        'token': 'mock_oauth_token'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'token' in data
    assert data['user']['email'] == mock_oauth_data['email']
    
    # Test subsequent login with same OAuth account
    response = client.post('/auth/oauth/login', json={
        'provider': 'google',
        'token': 'another_mock_token'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_oauth_account_linking(client, user):
    """Test linking OAuth account to existing account."""
    # Login with regular account
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Mock OAuth provider response
    mock_oauth_data = {
        'id': '12345',
        'email': user.email,  # Same email as existing account
        'name': 'OAuth User',
        'picture': 'https://example.com/avatar.jpg'
    }
    
    # Link OAuth account
    response = client.post('/auth/oauth/link', headers=headers, json={
        'provider': 'google',
        'token': 'mock_oauth_token',
        'oauth_data': mock_oauth_data
    })
    assert response.status_code == 200
    assert 'account linked' in response.get_json()['message'].lower()
    
    # Can now login with OAuth
    response = client.post('/auth/oauth/login', json={
        'provider': 'google',
        'token': 'another_mock_token'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['user']['username'] == user.username

def test_profile_update(client, user):
    """Test user profile update functionality."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Update profile data
    profile_data = {
        'display_name': 'Test User',
        'bio': 'This is a test bio',
        'location': 'Test City',
        'avatar_url': 'https://example.com/avatar.jpg'
    }
    
    response = client.put('/auth/me/profile', headers=headers, json=profile_data)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['user']['display_name'] == profile_data['display_name']
    assert data['user']['bio'] == profile_data['bio']
    assert data['user']['location'] == profile_data['location']
    assert data['user']['avatar_url'] == profile_data['avatar_url']
    
    # Verify profile was updated
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['user']['display_name'] == profile_data['display_name']

def test_user_preferences(client, user):
    """Test user preferences management."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Set preferences
    preferences = {
        'email_notifications': True,
        'push_notifications': False,
        'theme': 'dark',
        'language': 'en',
        'timezone': 'UTC'
    }
    
    response = client.put('/auth/me/preferences', headers=headers, json=preferences)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['preferences'] == preferences
    
    # Get preferences
    response = client.get('/auth/me/preferences', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['preferences'] == preferences
    
    # Update single preference
    response = client.patch('/auth/me/preferences', headers=headers, json={
        'theme': 'light'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['preferences']['theme'] == 'light'
    assert data['preferences']['email_notifications'] == preferences['email_notifications']

def test_privacy_settings(client, user):
    """Test user privacy settings management."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Set privacy settings
    privacy_settings = {
        'profile_visibility': 'private',
        'show_email': False,
        'show_location': False,
        'allow_friend_requests': True,
        'show_online_status': False
    }
    
    response = client.put('/auth/me/privacy', headers=headers, json=privacy_settings)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['privacy_settings'] == privacy_settings
    
    # Get privacy settings
    response = client.get('/auth/me/privacy', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['privacy_settings'] == privacy_settings
    
    # Update single privacy setting
    response = client.patch('/auth/me/privacy', headers=headers, json={
        'profile_visibility': 'public'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['privacy_settings']['profile_visibility'] == 'public'
    assert data['privacy_settings']['show_email'] == privacy_settings['show_email']

def test_data_export(client, user):
    """Test user data export functionality."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Request data export
    response = client.post('/auth/me/export', headers=headers)
    assert response.status_code == 200
    assert 'export_id' in response.get_json()['data']
    export_id = response.get_json()['data']['export_id']
    
    # Check export status
    response = client.get(f'/auth/me/export/{export_id}', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'status' in data
    assert data['status'] in ['pending', 'processing', 'completed']
    
    # Download export (assuming it's completed)
    response = client.get(f'/auth/me/export/{export_id}/download', headers=headers)
    assert response.status_code in [200, 202]  # 200 if ready, 202 if still processing
    
    if response.status_code == 200:
        assert response.headers['Content-Type'] == 'application/zip'
        assert 'Content-Disposition' in response.headers
        assert 'attachment' in response.headers['Content-Disposition']

def test_mfa_setup(client, user):
    """Test MFA setup and verification."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Initialize MFA setup
    response = client.post('/auth/mfa/setup', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'secret' in data
    assert 'qr_code' in data
    assert 'backup_codes' in data
    
    # Verify MFA setup with valid code
    response = client.post('/auth/mfa/verify', headers=headers, json={
        'code': '123456'  # This would be a valid TOTP code in real scenario
    })
    assert response.status_code == 200
    assert 'mfa enabled' in response.get_json()['message'].lower()
    
    # Try login with MFA enabled
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['requires_mfa'] is True
    assert 'mfa_token' in data
    
    # Complete login with MFA code
    response = client.post('/auth/mfa/validate', json={
        'mfa_token': data['mfa_token'],
        'code': '123456'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_mfa_backup_codes(client, user):
    """Test MFA backup codes functionality."""
    # Login and setup MFA first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Setup MFA
    client.post('/auth/mfa/setup', headers=headers)
    client.post('/auth/mfa/verify', headers=headers, json={'code': '123456'})
    
    # Generate new backup codes
    response = client.post('/auth/mfa/backup-codes/generate', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'backup_codes' in data
    backup_codes = data['backup_codes']
    
    # Login with backup code
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    mfa_token = response.get_json()['data']['mfa_token']
    
    response = client.post('/auth/mfa/validate', json={
        'mfa_token': mfa_token,
        'backup_code': backup_codes[0]
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']
    
    # Verify backup code was consumed
    response = client.post('/auth/mfa/validate', json={
        'mfa_token': mfa_token,
        'backup_code': backup_codes[0]
    })
    assert response.status_code == 401

def test_mfa_disable(client, user):
    """Test MFA disabling functionality."""
    # Login and setup MFA first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Setup MFA
    client.post('/auth/mfa/setup', headers=headers)
    client.post('/auth/mfa/verify', headers=headers, json={'code': '123456'})
    
    # Disable MFA with valid code
    response = client.post('/auth/mfa/disable', headers=headers, json={
        'code': '123456',
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    assert 'mfa disabled' in response.get_json()['message'].lower()
    
    # Verify login no longer requires MFA
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'requires_mfa' not in data or data['requires_mfa'] is False

def test_endpoint_rate_limits(client, user):
    """Test rate limits for specific endpoints."""
    headers = {'X-Forwarded-For': '203.0.113.1'}
    
    # Test password reset rate limiting
    for _ in range(3):
        response = client.post('/auth/password/reset-request', json={
            'email': user.email
        }, headers=headers)
        if response.status_code == 429:
            break
    
    response = client.post('/auth/password/reset-request', json={
        'email': user.email
    }, headers=headers)
    assert response.status_code == 429
    assert 'rate limit' in response.get_json()['message'].lower()
    
    # Test registration rate limiting
    for _ in range(3):
        response = client.post('/auth/register', json={
            'username': f'test_user_{_}',
            'email': f'test{_}@example.com',
            'password': 'ValidPass123!'
        }, headers=headers)
        if response.status_code == 429:
            break
    
    response = client.post('/auth/register', json={
        'username': 'another_user',
        'email': 'another@example.com',
        'password': 'ValidPass123!'
    }, headers=headers)
    assert response.status_code == 429
    assert 'rate limit' in response.get_json()['message'].lower()

def test_rate_limit_reset(client):
    """Test rate limit reset functionality."""
    headers = {'X-Forwarded-For': '203.0.113.1'}
    
    # Make requests until rate limited
    for _ in range(10):
        response = client.post('/auth/login', json={
            'username': 'test',
            'password': 'test'
        }, headers=headers)
        if response.status_code == 429:
            break
    
    # Verify rate limit response headers
    assert 'Retry-After' in response.headers
    assert 'X-RateLimit-Reset' in response.headers
    
    # Verify error response format
    data = response.get_json()
    assert 'retry_after' in data
    assert isinstance(data['retry_after'], int)

def test_security_questions(client, user):
    """Test security questions setup and verification."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Set security questions
    questions = [
        {'question': 'What was your first pet\'s name?', 'answer': 'Fluffy'},
        {'question': 'What city were you born in?', 'answer': 'TestCity'},
        {'question': 'What was your first car?', 'answer': 'Toyota'}
    ]
    
    response = client.post('/auth/security-questions', headers=headers, json={
        'questions': questions,
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    assert 'security questions set' in response.get_json()['message'].lower()
    
    # Verify security questions are set
    response = client.get('/auth/security-questions', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert len(data['questions']) == len(questions)
    assert all('question' in q for q in data['questions'])

def test_account_recovery_with_questions(client, user):
    """Test account recovery using security questions."""
    # Setup security questions first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    questions = [
        {'question': 'What was your first pet\'s name?', 'answer': 'Fluffy'},
        {'question': 'What city were you born in?', 'answer': 'TestCity'}
    ]
    
    client.post('/auth/security-questions', headers=headers, json={
        'questions': questions,
        'password': 'password123'
    })
    
    # Start account recovery
    response = client.post('/auth/recover', json={
        'email': user.email
    })
    assert response.status_code == 200
    recovery_token = response.get_json()['data']['recovery_token']
    
    # Answer security questions
    response = client.post('/auth/recover/verify', json={
        'recovery_token': recovery_token,
        'answers': [
            {'question_id': 1, 'answer': 'Fluffy'},
            {'question_id': 2, 'answer': 'TestCity'}
        ]
    })
    assert response.status_code == 200
    reset_token = response.get_json()['data']['reset_token']
    
    # Reset password with token
    response = client.post('/auth/password/reset', json={
        'token': reset_token,
        'new_password': 'NewSecurePass123!'
    })
    assert response.status_code == 200
    
    # Login with new password
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'NewSecurePass123!'
    })
    assert response.status_code == 200

def test_backup_email_verification(client, user):
    """Test backup email setup and verification."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Add backup email
    response = client.post('/auth/backup-email', headers=headers, json={
        'email': 'backup@example.com',
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    assert 'verification email sent' in response.get_json()['message'].lower()
    
    # Verify backup email (simulate clicking verification link)
    response = client.post('/auth/backup-email/verify', json={
        'token': 'test_verification_token',
        'email': 'backup@example.com'
    })
    assert response.status_code == 200
    
    # Use backup email for recovery
    response = client.post('/auth/recover', json={
        'email': 'backup@example.com'
    })
    assert response.status_code == 200
    assert 'recovery instructions sent' in response.get_json()['message'].lower()

def test_device_management(client, user):
    """Test device management functionality."""
    # Login with device info
    device_info = {
        'device_name': 'Test iPhone',
        'device_type': 'mobile',
        'os': 'iOS 15.0',
        'browser': 'Safari',
        'device_id': 'test-device-uuid'
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'X-Device-ID': device_info['device_id']
    }
    
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'device_info': device_info
    }, headers=headers)
    assert response.status_code == 200
    token = response.get_json()['data']['token']
    auth_headers = {'Authorization': f'Bearer {token}', **headers}
    
    # List devices
    response = client.get('/auth/devices', headers=auth_headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'devices' in data
    assert len(data['devices']) > 0
    
    # Verify device info
    device = next(d for d in data['devices'] if d['device_id'] == device_info['device_id'])
    assert device['device_name'] == device_info['device_name']
    assert device['device_type'] == device_info['device_type']
    assert device['is_current_device'] is True

def test_trusted_devices(client, user):
    """Test trusted devices functionality."""
    # Login with device info
    device_info = {
        'device_name': 'Test MacBook',
        'device_type': 'desktop',
        'os': 'macOS 12.0',
        'browser': 'Chrome',
        'device_id': 'test-macbook-uuid'
    }
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
        'X-Device-ID': device_info['device_id']
    }
    
    # First login requires MFA
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'device_info': device_info
    }, headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['requires_mfa'] is True
    
    # Complete MFA and mark device as trusted
    response = client.post('/auth/mfa/validate', json={
        'mfa_token': data['mfa_token'],
        'code': '123456',
        'trust_device': True
    }, headers=headers)
    assert response.status_code == 200
    token = response.get_json()['data']['token']
    auth_headers = {'Authorization': f'Bearer {token}', **headers}
    
    # Subsequent login from trusted device should not require MFA
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'device_info': device_info
    }, headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'requires_mfa' not in data or data['requires_mfa'] is False

def test_device_revocation(client, user):
    """Test device access revocation."""
    # Login with two devices
    devices = [
        {
            'device_name': 'Device 1',
            'device_id': 'device-1-uuid',
            'device_type': 'mobile'
        },
        {
            'device_name': 'Device 2',
            'device_id': 'device-2-uuid',
            'device_type': 'desktop'
        }
    ]
    
    tokens = []
    for device in devices:
        headers = {'X-Device-ID': device['device_id']}
        response = client.post('/auth/login', json={
            'username': user.username,
            'password': 'password123',
            'device_info': device
        }, headers=headers)
        token = response.get_json()['data']['token']
        tokens.append((token, headers))
    
    # Revoke access for first device
    auth_headers = {'Authorization': f'Bearer {tokens[1][0]}', **tokens[1][1]}
    response = client.post('/auth/devices/revoke', headers=auth_headers, json={
        'device_id': devices[0]['device_id']
    })
    assert response.status_code == 200
    
    # First device's token should be invalid
    headers1 = {'Authorization': f'Bearer {tokens[0][0]}', **tokens[0][1]}
    response = client.get('/auth/me', headers=headers1)
    assert response.status_code == 401
    
    # Second device's token should still work
    response = client.get('/auth/me', headers=auth_headers)
    assert response.status_code == 200

def test_security_audit_log(client, user):
    """Test security audit logging functionality."""
    # Login to generate some audit events
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Change password to generate another event
    response = client.put('/auth/me', headers=headers, json={
        'current_password': 'password123',
        'new_password': 'NewPass123!'
    })
    assert response.status_code == 200
    
    # Get audit log
    response = client.get('/auth/security/audit-log', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'events' in data
    
    # Verify login event
    login_event = next(e for e in data['events'] if e['type'] == 'login_success')
    assert login_event is not None
    assert 'timestamp' in login_event
    assert 'ip_address' in login_event
    assert 'user_agent' in login_event
    
    # Verify password change event
    password_event = next(e for e in data['events'] if e['type'] == 'password_changed')
    assert password_event is not None
    assert 'timestamp' in password_event

def test_security_notifications(client, user):
    """Test security notification settings and delivery."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Configure notification settings
    settings = {
        'notify_on_login': True,
        'notify_on_password_change': True,
        'notify_on_new_device': True,
        'notification_methods': ['email', 'in_app']
    }
    
    response = client.put('/auth/security/notifications', headers=headers, json=settings)
    assert response.status_code == 200
    
    # Login from new device to trigger notification
    device_headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        'X-Device-ID': 'new-device-uuid'
    }
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    }, headers=device_headers)
    assert response.status_code == 200
    
    # Check notifications
    response = client.get('/auth/notifications', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'notifications' in data
    
    # Verify new device login notification
    login_notification = next(n for n in data['notifications'] if n['type'] == 'new_device_login')
    assert login_notification is not None
    assert 'device_info' in login_notification
    assert login_notification['is_read'] is False

def test_activity_log(client, user):
    """Test user activity logging."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Perform various actions
    client.get('/auth/me', headers=headers)
    client.put('/auth/me/profile', headers=headers, json={
        'display_name': 'Updated Name'
    })
    client.get('/auth/security/audit-log', headers=headers)
    
    # Get activity log
    response = client.get('/auth/activity-log', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'activities' in data
    
    # Verify activities are logged
    activities = data['activities']
    assert len(activities) >= 3  # Should have at least login, profile view, and profile update
    
    # Verify activity details
    profile_update = next(a for a in activities if a['type'] == 'profile_update')
    assert profile_update is not None
    assert 'timestamp' in profile_update
    assert 'changes' in profile_update
    
    # Test activity filtering
    response = client.get('/auth/activity-log?type=profile_update', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert all(a['type'] == 'profile_update' for a in data['activities'])

def test_api_version_negotiation(client):
    """Test API version negotiation."""
    # Test with explicit version
    headers = {'Accept': 'application/json; version=1.0'}
    response = client.get('/auth/api-info', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['version'] == '1.0'
    
    # Test with version range
    headers = {'Accept': 'application/json; version=1.x'}
    response = client.get('/auth/api-info', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['version'].startswith('1.')
    
    # Test with unsupported version
    headers = {'Accept': 'application/json; version=999.0'}
    response = client.get('/auth/api-info', headers=headers)
    assert response.status_code == 406
    assert 'unsupported version' in response.get_json()['message'].lower()

def test_api_deprecation_notices(client):
    """Test API deprecation notices."""
    # Test with deprecated version
    headers = {'Accept': 'application/json; version=0.9'}
    response = client.get('/auth/api-info', headers=headers)
    assert response.status_code == 200
    assert 'Deprecation' in response.headers
    assert 'Sunset' in response.headers
    assert 'Link' in response.headers  # Should contain link to newer version
    
    # Verify warning in response
    data = response.get_json()
    assert 'warnings' in data
    assert any('deprecated' in w.lower() for w in data['warnings'])
    
    # Test with current version
    headers = {'Accept': 'application/json; version=1.0'}
    response = client.get('/auth/api-info', headers=headers)
    assert response.status_code == 200
    assert 'Deprecation' not in response.headers

def test_api_feature_flags(client, user):
    """Test API feature flags and capabilities."""
    response = client.get('/auth/api-info')
    assert response.status_code == 200
    data = response.get_json()['data']
    
    # Verify feature flags
    assert 'features' in data
    features = data['features']
    assert 'mfa_support' in features
    assert 'oauth_providers' in features
    assert 'device_management' in features
    
    # Test feature-specific endpoint
    if features.get('mfa_support'):
        response = client.post('/auth/mfa/setup')
        assert response.status_code in [401, 403]  # Should fail auth, not 404
    
    # Test deprecated feature
    if not features.get('legacy_auth'):
        response = client.post('/auth/legacy/login')
        assert response.status_code == 404

def test_api_compatibility_modes(client, user):
    """Test API compatibility modes."""
    # Test with compatibility mode header
    headers = {
        'Accept': 'application/json',
        'X-API-Compatibility': 'legacy'
    }
    
    # Legacy format login (old password hashing)
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123',
        'hash_version': 1
    }, headers=headers)
    assert response.status_code == 200
    data = response.get_json()
    assert 'auth_token' in data  # Old response format
    
    # Modern format login
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert 'token' in data  # New response format

def test_password_history(client, user):
    """Test password history and reuse prevention."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Change password multiple times
    passwords = ['NewPass123!', 'AnotherPass456!', 'DifferentPass789!']
    for new_password in passwords:
        response = client.put('/auth/me/password', headers=headers, json={
            'current_password': 'password123',
            'new_password': new_password
        })
        assert response.status_code == 200
    
    # Try to reuse a recent password
    response = client.put('/auth/me/password', headers=headers, json={
        'current_password': passwords[-1],
        'new_password': passwords[0]  # Try to reuse first new password
    })
    assert response.status_code == 400
    assert 'password was recently used' in response.get_json()['message'].lower()

def test_password_expiration(client, user):
    """Test password expiration policies."""
    # Login with expired password
    user.password_changed_at = datetime.now() - timedelta(days=91)  # Assuming 90-day policy
    
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['password_expired'] is True
    assert 'temporary_token' in data
    
    # Try to access protected route with expired password
    headers = {'Authorization': f'Bearer {data["temporary_token"]}'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 403
    assert 'password must be changed' in response.get_json()['message'].lower()
    
    # Change expired password
    response = client.put('/auth/me/password', headers=headers, json={
        'current_password': 'password123',
        'new_password': 'NewSecurePass123!'
    })
    assert response.status_code == 200
    assert 'token' in response.get_json()['data']

def test_gdpr_compliance(client, user):
    """Test GDPR compliance features."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Request data portability export
    response = client.post('/auth/gdpr/export', headers=headers)
    assert response.status_code == 200
    assert 'export_id' in response.get_json()['data']
    
    # Request right to be forgotten
    response = client.post('/auth/gdpr/forget-me', headers=headers, json={
        'password': 'password123',
        'confirmation': 'DELETE MY ACCOUNT AND DATA'
    })
    assert response.status_code == 200
    
    # Verify account and data are scheduled for deletion
    response = client.get('/auth/gdpr/deletion-status', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['deletion_scheduled'] is True
    assert 'scheduled_date' in data
    
    # Cancel deletion within grace period
    response = client.post('/auth/gdpr/cancel-deletion', headers=headers)
    assert response.status_code == 200

def test_consent_management(client, user):
    """Test user consent management."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get current consents
    response = client.get('/auth/consents', headers=headers)
    assert response.status_code == 200
    assert 'consents' in response.get_json()['data']
    
    # Update consent preferences
    consents = {
        'marketing_emails': False,
        'data_analytics': True,
        'third_party_sharing': False
    }
    response = client.put('/auth/consents', headers=headers, json=consents)
    assert response.status_code == 200
    
    # Verify consent history
    response = client.get('/auth/consents/history', headers=headers)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert len(data['history']) > 0
    assert 'timestamp' in data['history'][0]
    assert 'changes' in data['history'][0]

def test_oauth_account_merging(client):
    """Test OAuth account merging scenarios."""
    # Create user with email
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 201
    
    # Attempt OAuth login with same email
    oauth_data = {
        'provider': 'google',
        'token': 'mock_token',
        'profile': {
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/pic.jpg'
        }
    }
    
    response = client.post('/auth/oauth/login', json=oauth_data)
    assert response.status_code == 200
    data = response.get_json()['data']
    assert data['accounts_merged'] is True
    assert 'token' in data
    
    # Verify merged account details
    headers = {'Authorization': f'Bearer {data["token"]}'}
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    user_data = response.get_json()['data']['user']
    assert 'oauth_providers' in user_data
    assert 'google' in user_data['oauth_providers']

def test_oauth_account_unlinking(client, user):
    """Test OAuth account unlinking."""
    # Login first
    response = client.post('/auth/login', json={
        'username': user.username,
        'password': 'password123'
    })
    token = response.get_json()['data']['token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Link OAuth account
    oauth_data = {
        'provider': 'google',
        'token': 'mock_token',
        'profile': {
            'email': user.email,
            'name': 'Test User',
            'picture': 'https://example.com/pic.jpg'
        }
    }
    response = client.post('/auth/oauth/link', headers=headers, json=oauth_data)
    assert response.status_code == 200
    
    # Unlink OAuth account
    response = client.post('/auth/oauth/unlink', headers=headers, json={
        'provider': 'google',
        'password': 'password123'  # Require password confirmation
    })
    assert response.status_code == 200
    
    # Verify OAuth account is unlinked
    response = client.get('/auth/me', headers=headers)
    assert response.status_code == 200
    user_data = response.get_json()['data']['user']
    assert 'oauth_providers' not in user_data or 'google' not in user_data['oauth_providers']

def test_age_verification(client):
    """Test age verification during registration."""
    # Test registration with underage user
    response = client.post('/auth/register', json={
        'username': 'younguser',
        'email': 'young@example.com',
        'password': 'password123',
        'birth_date': '2015-01-01'  # Underage
    })
    assert response.status_code == 400
    assert 'minimum age requirement' in response.get_json()['message'].lower()
    
    # Test registration with adult user
    response = client.post('/auth/register', json={
        'username': 'adultuser',
        'email': 'adult@example.com',
        'password': 'password123',
        'birth_date': '1990-01-01'  # Adult
    })
    assert response.status_code == 201
    
    # Test registration with parental consent
    response = client.post('/auth/register', json={
        'username': 'teenuser',
        'email': 'teen@example.com',
        'password': 'password123',
        'birth_date': '2010-01-01',  # Teen
        'parental_consent': {
            'guardian_email': 'parent@example.com',
            'guardian_name': 'Parent Name',
            'consent_given': True
        }
    })
    assert response.status_code == 201
    data = response.get_json()['data']
    assert data['requires_guardian_verification'] is True