"""Integration test configuration and fixtures."""
import pytest
from flask import current_app
from sqlalchemy import event
from src.core.database import db, _make_scoped_session
from src.models import User, Role, Token
from tests.conftest import (
    app, _db, db_session, client, test_user,
    auth_headers, api_headers
)

@pytest.fixture(scope='function')
def integration_session(db_session):
    """Create a new integration test session."""
    return db_session

@pytest.fixture(scope='function')
def integration_client(client):
    """Create a test client for integration tests."""
    return client

@pytest.fixture(scope='function')
def auth_integration_client(client, auth_headers):
    """Create an authenticated test client for integration tests."""
    client.environ_base.update(auth_headers)
    return client