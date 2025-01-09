import pytest
from datetime import datetime, timedelta
from flask_login import current_user
from sqlalchemy.exc import SQLAlchemyError
from dojopool.models import User, Token, Role
from dojopool.auth.utils import (
    hash_password,
    verify_password,
    generate_token,
    verify_token
)

@pytest.fixture
def user_data():
    """Test user data."""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'Test123!@#',
        'first_name': 'Test',
        'last_name': 'User'
    }

def test_user_registration(client, user_data, db_session):
    """Test user registration process."""
    try:
        response = client.post('/auth/register', json=user_data)
        assert response.status_code == 201
        
        # Check user was created
        user = User.query.filter_by(email=user_data['email']).first()
        assert user is not None
        assert user.username == user_data['username']
        assert not user.is_verified
        
        # Check verification email was sent
        assert 'verification_email_sent' in response.json
        
        # Check user role was assigned
        assert any(role.name == 'user' for role in user.roles)
        
    except SQLAlchemyError as e:
        db_session.rollback()
        pytest.fail(f"Database error: {str(e)}")

def test_user_registration_validation(client, user_data):
    """Test user registration validation."""
    # Test missing fields
    for field in ['username', 'email', 'password']:
        invalid_data = user_data.copy()
        del invalid_data[field]
        response = client.post('/auth/register', json=invalid_data)
        assert response.status_code == 400
        assert field in response.json['errors']
    
    # Test invalid email
    invalid_data = user_data.copy()
    invalid_data['email'] = 'invalid_email'
    response = client.post('/auth/register', json=invalid_data)
    assert response.status_code == 400
    assert 'email' in response.json['errors']
    
    # Test duplicate email
    response = client.post('/auth/register', json=user_data)
    assert response.status_code == 201
    response = client.post('/auth/register', json=user_data)
    assert response.status_code == 400
    assert 'email' in response.json['errors']

def test_user_login(client, sample_user):
    """Test user login process."""
    response = client.post('/auth/login', json={
        'email': sample_user.email,
        'password': 'samplepass123'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'refresh_token' in response.json
    
    # Check session
    with client:
        client.get('/')
        assert current_user.is_authenticated
        assert current_user.id == sample_user.id

def test_password_hashing():
    """Test password hashing functionality."""
    user = User(username='test', email='test@example.com')
    user.set_password('password123')
    
    assert user.password_hash is not None
    assert user.password_hash != 'password123'
    assert user.check_password('password123') is True
    assert user.check_password('wrongpassword') is False

def test_token_generation_and_verification(app, db_session):
    """Test token generation and verification."""
    with app.app_context():
        try:
            user = User(username='test', email='test@example.com')
            user.set_password('password123')
            db_session.add(user)
            db_session.commit()
            
            token = Token.generate_token(user.id, 'access', expires_in=3600)
            assert token is not None
            assert token.user_id == user.id
            assert token.token_type == 'access'
            assert token.is_valid()
            
            verified_token = Token.verify_token(token.token, 'access')
            assert verified_token is not None
            assert verified_token.user_id == user.id
            
        except SQLAlchemyError as e:
            db_session.rollback()
            pytest.fail(f"Database error: {str(e)}")

def test_email_verification(client, sample_user, db_session):
    """Test email verification process."""
    try:
        # Generate verification token
        token = Token.generate_token(sample_user.id, 'verify_email', expires_in=3600)
        
        response = client.get(f'/auth/verify-email/{token.token}')
        assert response.status_code == 200
        
        # Check user is verified
        db_session.refresh(sample_user)
        assert sample_user.is_verified
        
    except SQLAlchemyError as e:
        db_session.rollback()
        pytest.fail(f"Database error: {str(e)}")

def test_password_reset(client, sample_user, db_session):
    """Test password reset process."""
    try:
        # Request password reset
        response = client.post('/auth/forgot-password', json={
            'email': sample_user.email
        })
        assert response.status_code == 200
        
        # Get reset token
        token = Token.query.filter_by(
            user_id=sample_user.id,
            token_type='reset_password'
        ).first()
        assert token is not None
        
        # Reset password
        new_password = "NewSecurePass123!@#"
        response = client.post(f'/auth/reset-password/{token.token}', json={
            'password': new_password
        })
        assert response.status_code == 200
        
        # Try logging in with new password
        response = client.post('/auth/login', json={
            'email': sample_user.email,
            'password': new_password
        })
        assert response.status_code == 200
        
    except SQLAlchemyError as e:
        db_session.rollback()
        pytest.fail(f"Database error: {str(e)}")

def test_token_refresh(client, auth_headers):
    """Test token refresh functionality."""
    response = client.post('/auth/refresh', headers=auth_headers)
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert response.json['access_token'] != auth_headers['Authorization'].split()[1]

def test_logout(client, auth_headers):
    """Test logout functionality."""
    # Single device logout
    response = client.post('/auth/logout', headers=auth_headers)
    assert response.status_code == 200
    
    # Verify token is invalidated
    response = client.get('/api/v1/users/profile', headers=auth_headers)
    assert response.status_code == 401
    
    # Test logout all devices
    response = client.post('/auth/logout-all', headers=auth_headers)
    assert response.status_code == 200

def test_session_management(client, sample_user):
    """Test session management."""
    with client:
        # Login
        response = client.post('/auth/login', json={
            'email': sample_user.email,
            'password': 'samplepass123'
        })
        assert response.status_code == 200
        
        # Access protected route
        response = client.get('/api/v1/users/me')
        assert response.status_code == 200
        
        # Logout
        response = client.post('/auth/logout')
        assert response.status_code == 200
        
        # Verify access is denied after logout
        response = client.get('/api/v1/users/me')
        assert response.status_code == 401

def test_remember_me(client, sample_user):
    """Test remember me functionality."""
    with client:
        response = client.post('/auth/login', json={
            'email': sample_user.email,
            'password': 'samplepass123',
            'remember': True
        })
        assert response.status_code == 200
        
        # Check session duration
        cookie = next(
            (cookie for cookie in client.cookie_jar if cookie.name == 'session'),
            None
        )
        assert cookie is not None
        assert cookie.expires > datetime.now() + timedelta(days=29)

def test_invalid_login_attempts(client, sample_user):
    """Test invalid login attempts handling."""
    for _ in range(5):
        response = client.post('/auth/login', json={
            'email': sample_user.email,
            'password': 'wrong_password'
        })
        assert response.status_code == 401
    
    # Account should be temporarily locked
    response = client.post('/auth/login', json={
        'email': sample_user.email,
        'password': 'samplepass123'
    })
    assert response.status_code == 429
    assert 'retry_after' in response.json

def test_password_validation(client):
    """Test password validation rules."""
    weak_passwords = [
        'short',           # Too short
        'nouppercasenum', # No uppercase or numbers
        'NoSpecialChar1', # No special characters
        'Only1234567890', # Only numbers
        'Common_password1' # Common password
    ]
    
    for password in weak_passwords:
        response = client.post('/auth/register', json={
            'username': 'testuser',
            'email': 'test@example.com',
            'password': password
        })
        assert response.status_code == 400
        assert 'password' in response.json['errors']

def test_oauth_login(client, mocker):
    """Test OAuth login functionality."""
    # Mock OAuth provider response
    mock_oauth = mocker.patch('src.auth.oauth.google')
    mock_oauth.authorize_access_token.return_value = {
        'userinfo': {
            'email': 'oauth@example.com',
            'name': 'OAuth User'
        }
    }
    
    # Test OAuth callback
    response = client.get('/auth/google/callback')
    assert response.status_code == 200
    
    # Check user was created
    user = User.query.filter_by(email='oauth@example.com').first()
    assert user is not None
    assert user.is_verified

def test_concurrent_sessions(client, sample_user):
    """Test handling of concurrent sessions."""
    # Login from multiple devices
    sessions = []
    for _ in range(3):
        response = client.post('/auth/login', json={
            'email': sample_user.email,
            'password': 'samplepass123'
        })
        assert response.status_code == 200
        sessions.append(response.json['access_token'])
    
    # Verify all sessions are active
    for token in sessions:
        response = client.get('/api/v1/users/me', headers={
            'Authorization': f'Bearer {token}'
        })
        assert response.status_code == 200

def test_session_expiry(client, sample_user):
    """Test session expiry handling."""
    # Login with short expiry token
    response = client.post('/auth/login', json={
        'email': sample_user.email,
        'password': 'samplepass123',
        'token_expiry': 1  # 1 second expiry
    })
    assert response.status_code == 200
    token = response.json['access_token']
    
    # Wait for token to expire
    import time
    time.sleep(2)
    
    # Verify token is expired
    response = client.get('/api/v1/users/me', headers={
        'Authorization': f'Bearer {token}'
    })
    assert response.status_code == 401

def test_role_based_access(client, test_user, test_admin):
    """Test role-based access control."""
    # Regular user access
    response = client.post('/auth/login', json={
        'email': test_user.email,
        'password': 'password123'
    })
    assert response.status_code == 200
    user_token = response.json['access_token']
    
    # Admin user access
    response = client.post('/auth/login', json={
        'email': test_admin.email,
        'password': 'admin123'
    })
    assert response.status_code == 200
    admin_token = response.json['access_token']
    
    # Test admin-only endpoint
    response = client.get('/api/v1/admin/users', headers={
        'Authorization': f'Bearer {user_token}'
    })
    assert response.status_code == 403
    
    response = client.get('/api/v1/admin/users', headers={
        'Authorization': f'Bearer {admin_token}'
    })
    assert response.status_code == 200