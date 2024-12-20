"""Test fixtures for authentication tests."""

import pytest
from src.models.user import User
from src.models.role import Role
from tests.conftest import (
    app, client, runner, _db, db_session, auth_headers,
    api_headers, test_user
)

@pytest.fixture(scope='function')
def auth_user(db_session):
    """Create a verified test user."""
    # Get the default user role
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Regular user role')
        db_session.add(user_role)
        db_session.commit()
    
    user = User(
        username='testuser',
        email='test@example.com',
        email_verified=True
    )
    user.set_password('password123')
    user.roles.append(user_role)  # Associate user with the user role
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture(scope='function')
def unverified_user(db_session):
    """Create an unverified test user."""
    # Get the default user role
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Regular user role')
        db_session.add(user_role)
        db_session.commit()
    
    user = User(
        username='unverified',
        email='unverified@example.com',
        email_verified=False
    )
    user.set_password('password123')
    user.roles.append(user_role)  # Associate user with the user role
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture(scope='function')
def auth_client(client, auth_user):
    """Create an authenticated test client."""
    with client:
        client.post('/auth/login', data={
            'username': auth_user.username,
            'password': 'password123'
        })
        yield client