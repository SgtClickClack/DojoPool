"""Test suite for Token model."""

from datetime import datetime, timedelta
import pytest
from src.models import Token

def test_new_token():
    """Test creating a new token."""
    token = Token(
        user_id=1,
        token_type='access',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    assert token.user_id == 1
    assert token.token_type == 'access'
    assert token.token == 'test-token'
    assert not token.revoked

def test_token_repr():
    """Test token string representation."""
    token = Token(
        user_id=1,
        token_type='access',
        token='test-token'
    )
    assert str(token) == '<Token access:test-tok...>'

def test_token_is_expired():
    """Test token expiration check."""
    token = Token(
        user_id=1,
        token_type='access',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    assert token.is_valid()

def test_generate_token(app, db_session):
    """Test token generation."""
    with app.app_context():
        token = Token.generate_token(1, 'access', 3600)
        assert token.user_id == 1
        assert token.token_type == 'access'
        assert token.is_valid()
        
        # Verify token was saved to database
        saved_token = Token.query.get(token.id)
        assert saved_token is not None
        assert saved_token.token == token.token

def test_generate_token_custom_expiry(app, db_session):
    """Test token generation with custom expiry."""
    with app.app_context():
        token = Token.generate_token(1, 'access', expires_in=7200)
        assert token.user_id == 1
        assert token.token_type == 'access'
        assert token.is_valid()
        
        # Verify custom expiry
        expected_expiry = datetime.utcnow() + timedelta(seconds=7200)
        assert abs((token.expires_at - expected_expiry).total_seconds()) < 1

def test_verify_token():
    """Test token verification."""
    token = Token(
        user_id=1,
        token_type='verify_email',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    assert token.is_valid()

def test_verify_token_expired():
    """Test expired token verification."""
    token = Token(
        user_id=1,
        token_type='access',
        token='test-token',
        expires_at=datetime.utcnow() - timedelta(hours=1)
    )
    assert not token.is_valid()

def test_verify_token_wrong_type():
    """Test token verification with wrong type."""
    token = Token(
        user_id=1,
        token_type='access',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    assert token.token_type == 'access'
    assert token.is_valid()

def test_verify_token_invalid(app):
    """Test verification with invalid token string."""
    with app.app_context():
        user_id = Token.verify_token('invalid_token', 'verify_email')
        assert user_id is None 