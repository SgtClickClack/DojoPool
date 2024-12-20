"""Unit tests for authentication functionality."""

import pytest
from src.core.auth.service import auth_service
from src.core.auth.exceptions import AuthenticationError, RegistrationError

def test_user_registration(session):
    """Test user registration process."""
    # Test successful registration
    user = auth_service.register(
        username='newuser',
        email='new@example.com',
        password='StrongPass123!'
    )
    assert user.username == 'newuser'
    assert user.email == 'new@example.com'
    assert user.check_password('StrongPass123!')

    # Test duplicate username
    with pytest.raises(RegistrationError):
        auth_service.register(
            username='newuser',
            email='another@example.com',
            password='StrongPass123!'
        )

    # Test duplicate email
    with pytest.raises(RegistrationError):
        auth_service.register(
            username='anotheruser',
            email='new@example.com',
            password='StrongPass123!'
        )

def test_user_authentication(session, user):
    """Test user authentication process."""
    # Test successful authentication
    user, access_token, refresh_token = auth_service.authenticate(
        email='test@example.com',
        password='password123',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )
    assert user is not None
    assert access_token is not None
    assert refresh_token is not None

    # Test invalid password
    with pytest.raises(AuthenticationError):
        auth_service.authenticate(
            email='test@example.com',
            password='wrongpass',
            device_info={'device': 'test'},
            ip_address='127.0.0.1'
        )

    # Test non-existent user
    with pytest.raises(AuthenticationError):
        auth_service.authenticate(
            email='nonexistent@example.com',
            password='password123',
            device_info={'device': 'test'},
            ip_address='127.0.0.1'
        )

def test_token_refresh(session, user):
    """Test token refresh functionality."""
    # Get initial tokens
    _, access_token, refresh_token = auth_service.authenticate(
        email='test@example.com',
        password='password123',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )

    # Test successful token refresh
    new_access_token, new_refresh_token = auth_service.refresh_token(refresh_token)
    assert new_access_token != access_token
    assert new_refresh_token != refresh_token

    # Test invalid refresh token
    with pytest.raises(AuthenticationError):
        auth_service.refresh_token('invalid-token')

def test_user_logout(session, user):
    """Test user logout functionality."""
    # Authenticate user
    _, _, refresh_token = auth_service.authenticate(
        email='test@example.com',
        password='password123',
        device_info={'device': 'test'},
        ip_address='127.0.0.1'
    )

    # Test successful logout
    auth_service.logout(refresh_token)

    # Verify token is invalidated
    with pytest.raises(AuthenticationError):
        auth_service.refresh_token(refresh_token) 