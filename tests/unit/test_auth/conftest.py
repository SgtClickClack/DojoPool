"""Auth test configuration file."""
import pytest
from datetime import datetime, timedelta
from flask import Flask

from dojopool.models import User, Role, Token
from dojopool.core.extensions import db

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = Flask(__name__)
    app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'SECRET_KEY': 'test-secret-key',
    })

    # Initialize Flask extensions
    db.init_app(app)

    # Create the database and load test data
    with app.app_context():
        db.create_all()

    yield app

    # Clean up
    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()

@pytest.fixture
def _db(app):
    """Create and configure a new database for each test."""
    with app.app_context():
        db.create_all()

    yield db

    with app.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture
def user(_db):
    """Create a user for testing."""
    user = User(
        username='test_user',
        email='test@example.com',
        password='test_password'
    )
    _db.session.add(user)
    _db.session.commit()
    return user

@pytest.fixture
def admin(_db):
    """Create an admin user for testing."""
    admin = User(
        username='admin_user',
        email='admin@example.com',
        password='admin_password',
        is_admin=True
    )
    _db.session.add(admin)
    _db.session.commit()
    return admin

@pytest.fixture
def token(user):
    """Create a token for testing."""
    token = Token(
        user_id=user.id,
        token_type='access',
        token='test-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.session.add(token)
    db.session.commit()
    return token

@pytest.fixture
def auth_headers(token):
    """Authentication headers for testing."""
    return {
        'Authorization': f'Bearer {token.token}',
        'Content-Type': 'application/json'
    }

@pytest.fixture
def admin_token(admin):
    """Create a token for admin testing."""
    token = Token(
        user_id=admin.id,
        token_type='access',
        token='admin-token',
        expires_at=datetime.utcnow() + timedelta(hours=1)
    )
    db.session.add(token)
    db.session.commit()
    return token

@pytest.fixture
def admin_headers(admin_token):
    """Authentication headers for admin testing."""
    return {
        'Authorization': f'Bearer {admin_token.token}',
        'Content-Type': 'application/json'
    }