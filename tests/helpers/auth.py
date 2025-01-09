"""Helper functions for authentication testing."""
from dojopool.core.auth.service import auth_service
from dojopool.models import User, Role
from dojopool.core.db import db

def create_test_user(username="testuser", email="test@example.com", password="password123"):
    """Create a test user."""
    user = User(
        username=username,
        email=email
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user

def create_test_role(name="test_role", description="Test role"):
    """Create a test role."""
    role = Role(
        name=name,
        description=description
    )
    db.session.add(role)
    db.session.commit()
    return role

def assign_role_to_user(user, role):
    """Assign a role to a user."""
    user.roles.append(role)
    db.session.commit()

def create_auth_token(user):
    """Create an authentication token for a user."""
    return auth_service.create_token(user)

def get_auth_headers(user):
    """Get authentication headers for a user."""
    token = create_auth_token(user)
    return {"Authorization": f"Bearer {token}"} 