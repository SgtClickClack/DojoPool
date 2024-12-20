"""API test configuration and fixtures."""
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
def api_session(db_session):
    """Create a new API session for testing."""
    return db_session

@pytest.fixture(scope='function')
def api_client(client, api_headers):
    """Create a test client with API headers."""
    client.environ_base.update(api_headers)
    return client

@pytest.fixture(scope='function')
def auth_client(client, auth_headers):
    """Create an authenticated test client."""
    client.environ_base.update(auth_headers)
    return client 