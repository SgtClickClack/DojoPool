"""Tests for validation integration functionality."""
import pytest
from dojopool.core.validation import get_validator
from dojopool.core.validation.schemas import UserSchema, LoginSchema

def test_user_validation():
    """Test user validation."""
    # Create validator
    validator = get_validator()
    
    # Test valid user data
    valid_user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Password123!"
    }
    result = validator.validate(valid_user_data, UserSchema)
    assert result.is_valid
    assert not result.errors
    
    # Test invalid user data
    invalid_user_data = {
        "username": "",  # Empty username
        "email": "invalid-email",
        "password": "short"  # Too short password
    }
    result = validator.validate(invalid_user_data, UserSchema)
    assert not result.is_valid
    assert len(result.errors) == 3

def test_login_validation():
    """Test login validation."""
    # Create validator
    validator = get_validator()
    
    # Test valid login data
    valid_login_data = {
        "username": "testuser",
        "password": "Password123!"
    }
    result = validator.validate(valid_login_data, LoginSchema)
    assert result.is_valid
    assert not result.errors
    
    # Test invalid login data
    invalid_login_data = {
        "username": "",  # Empty username
        "password": ""   # Empty password
    }
    result = validator.validate(invalid_login_data, LoginSchema)
    assert not result.is_valid
    assert len(result.errors) == 2

def test_custom_validation_rules():
    """Test custom validation rules."""
    # Create validator with custom rules
    validator = get_validator(custom_rules={
        "min_length": 8,
        "require_special_chars": True,
        "require_numbers": True
    })
    
    # Test password validation with custom rules
    valid_password = {
        "username": "testuser",
        "password": "Password123!"  # Meets all requirements
    }
    result = validator.validate(valid_password, LoginSchema)
    assert result.is_valid
    
    invalid_password = {
        "username": "testuser",
        "password": "simple"  # Doesn't meet requirements
    }
    result = validator.validate(invalid_password, LoginSchema)
    assert not result.is_valid
    assert "password" in result.errors 