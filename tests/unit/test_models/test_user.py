"""Test suite for User model."""

from datetime import datetime
import pytest
from src.models import User

def test_new_user():
    """Test creating a new user."""
    user = User(
        username='testuser',
        email='test@example.com',
        first_name='Test',
        last_name='User',
        email_verified=True
    )
    user.set_password('password123')
    assert user.username == 'testuser'
    assert user.email == 'test@example.com'
    assert user.first_name == 'Test'
    assert user.last_name == 'User'
    assert user.email_verified is True
    assert user.check_password('password123')

def test_user_password():
    """Test user password hashing and verification."""
    user = User(username='testuser', email='test@example.com')
    user.set_password('password123')
    
    assert user.password_hash is not None
    assert user.password_hash != 'password123'
    assert user.check_password('password123')
    assert not user.check_password('wrongpassword')

def test_user_repr():
    """Test user string representation."""
    user = User(username='testuser', email='test@example.com')
    assert str(user) == '<User testuser>'

def test_user_is_active():
    """Test user is_active property."""
    user = User(username='testuser', email='test@example.com')
    assert user.is_active

def test_user_is_anonymous():
    """Test user is_anonymous property."""
    user = User(username='testuser', email='test@example.com')
    assert not user.is_anonymous

def test_user_get_id():
    """Test user get_id method."""
    user = User(username='testuser', email='test@example.com')
    user.id = 1
    assert user.get_id() == '1'

def test_update_last_login(app):
    """Test updating user's last login timestamp."""
    user = User(username='testuser', email='test@example.com')
    
    with app.app_context():
        before = datetime.utcnow()
        user.update_last_login()
        after = datetime.utcnow()
        
        assert user.last_login is not None
        assert before <= user.last_login <= after 