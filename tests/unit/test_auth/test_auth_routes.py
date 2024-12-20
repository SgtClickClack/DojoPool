"""Test suite for authentication routes."""

import pytest
from flask import url_for
from src.models.user import User
from src.models.token import Token
from datetime import datetime, timedelta

def test_register_get(client):
    """Test GET request to register page."""
    response = client.get(url_for('auth.register'))
    assert response.status_code == 200
    assert b'Register' in response.data

def test_register_post_success(client, app):
    """Test successful user registration."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123',
        'confirm_password': 'TestPass123'
    }
    response = client.post(url_for('auth.register'), data=data)
    assert response.status_code == 302
    assert response.headers['Location'] == url_for('auth.login')
    
    # Verify user was created
    with app.app_context():
        user = User.query.filter_by(username='testuser').first()
        assert user is not None
        assert user.email == 'test@example.com'
        assert not user.is_verified

def test_register_post_password_mismatch(client):
    """Test registration with mismatched passwords."""
    data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'TestPass123',
        'confirm_password': 'DifferentPass123'
    }
    response = client.post(url_for('auth.register'), data=data)
    assert response.status_code == 302
    assert b'Passwords do not match' in response.data

def test_login_get(client):
    """Test GET request to login page."""
    response = client.get(url_for('auth.login'))
    assert response.status_code == 200
    assert b'Login' in response.data

def test_login_post_success(client, db_session):
    """Test successful login."""
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User',
        email_verified=True
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()

    response = client.post(url_for('auth.login'), data={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 302

def test_login_post_unverified(client, unverified_user):
    """Test login attempt with unverified user."""
    data = {
        'username': unverified_user.username,
        'password': 'password123'
    }
    response = client.post(url_for('auth.login'), data=data)
    assert response.status_code == 200
    assert b'verify your email' in response.data

def test_verify_email_success(client, db_session):
    """Test successful email verification."""
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User',
        email_verified=False
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()

    token = Token(
        user_id=user.id,
        token_type='verify_email',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db_session.add(token)
    db_session.commit()

    response = client.get(url_for('auth.verify_email', token='test-token'))
    assert response.status_code == 302
    assert user.email_verified is True

def test_verify_email_invalid_token(client):
    """Test email verification with invalid token."""
    response = client.get(url_for('auth.verify_email', token='invalid'))
    assert response.status_code == 302
    assert response.headers['Location'] == url_for('auth.login')

def test_resend_verification_success(client, db_session):
    """Test successful resend of verification email."""
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User',
        email_verified=False
    )
    user.set_password('password123')
    db_session.add(user)
    db_session.commit()

    response = client.post(url_for('auth.resend_verification'), data={
        'email': 'test@example.com'
    })
    assert response.status_code == 302

def test_forgot_password_get(client):
    """Test GET request to forgot password page."""
    response = client.get(url_for('auth.forgot_password'))
    assert response.status_code == 200
    assert b'Forgot Password' in response.data

def test_forgot_password_post(client, user):
    """Test password reset request."""
    data = {'email': user.email}
    response = client.post(url_for('auth.forgot_password'), data=data)
    assert response.status_code == 302
    assert response.headers['Location'] == url_for('auth.login')

def test_reset_password_get(client, app, user):
    """Test GET request to reset password page."""
    with app.app_context():
        token = Token.generate_token(user.id, 'reset_password')
        response = client.get(url_for('auth.reset_password', token=token.token))
        assert response.status_code == 200
        assert b'Reset Password' in response.data

def test_reset_password_post_success(client, app, user):
    """Test successful password reset."""
    with app.app_context():
        token = Token.generate_token(user.id, 'reset_password')
        data = {
            'password': 'NewPass123',
            'confirm_password': 'NewPass123'
        }
        response = client.post(
            url_for('auth.reset_password', token=token.token),
            data=data
        )
        assert response.status_code == 302
        assert response.headers['Location'] == url_for('auth.login')
        
        # Verify password was changed
        user = User.query.get(user.id)
        assert user.check_password('NewPass123') 