import pytest
import time
import psutil
import os
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.models import db, User, Game, Match, Location, Role
from src.config import Config
from src.app import create_app
from src.models import db as _db
from src.config.testing import TestingConfig
import tempfile
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask import current_app
from werkzeug.local import LocalStack
from src.core.database import _make_scoped_session
from tests.conftest import (
    app, client, runner, _db, db_session, auth_headers,
    api_headers, test_user, test_session, test_location,
    test_venue, test_match, test_game, test_tournament
)
from tests.factories import (
    UserFactory, GameFactory, TournamentFactory, VenueFactory,
    RoleFactory, LocationFactory, MatchFactory, SessionFactory
)

class TestConfig:
    """Test configuration."""
    TESTING = True
    DEBUG = False
    
    # Create a temporary database file
    db_fd, db_path = tempfile.mkstemp()
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{db_path}'
    
    # Database settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    
    # Security settings
    WTF_CSRF_ENABLED = False
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-jwt-secret'
    
    # API keys
    MAIL_DEFAULT_SENDER = 'test@example.com'
    SENDGRID_API_KEY = 'test-sendgrid-key'
    GOOGLE_CLIENT_ID = 'test-google-client-id'
    GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    
    # Performance specific settings
    SQLALCHEMY_POOL_SIZE = 5
    SQLALCHEMY_MAX_OVERFLOW = 10
    SQLALCHEMY_POOL_TIMEOUT = 30
    SQLALCHEMY_POOL_RECYCLE = 1800
    
    @classmethod
    def cleanup(cls):
        """Clean up temporary files."""
        os.close(cls.db_fd)
        os.unlink(cls.db_path)

@pytest.fixture(scope='session')
def app():
    """Create and configure a test Flask application."""
    app = create_app(TestConfig)
    
    with app.app_context():
        # Drop all tables to ensure a clean state
        db.drop_all()
        # Create all tables
        db.create_all()
        
        # Create default roles
        default_roles = [
            Role(name='admin', description='Administrator role'),
            Role(name='user', description='Regular user role'),
            Role(name='moderator', description='Moderator role')
        ]
        for role in default_roles:
            if not Role.query.filter_by(name=role.name).first():
                db.session.add(role)
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise e
    
    yield app
    
    # Cleanup after all tests
    with app.app_context():
        db.session.remove()
        db.drop_all()
        TestConfig.cleanup()

@pytest.fixture(scope='session')
def db(app):
    """Create database for the tests."""
    return db

@pytest.fixture(scope='function')
def db_session(app, db):
    """Create a new database session for a test."""
    # Create a connection and transaction
    connection = db.engine.connect()
    transaction = connection.begin()
    
    # Create a session bound to the connection
    session = _make_scoped_session(bind=connection)
    db.session = session  # Replace the session
    
    # Begin a nested transaction (using SAVEPOINT)
    nested = connection.begin_nested()
    
    # If the application code calls session.commit, it will end the nested
    # transaction. Need to restart the savepoint in that case.
    @session.event.listens_for(session, 'after_transaction_end')
    def restart_savepoint(session, transaction):
        nonlocal nested
        if not nested.is_active:
            nested = connection.begin_nested()
    
    yield session
    
    # Rollback everything
    session.remove()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope='function')
def test_user(db_session):
    """Create a test user."""
    # Get the default user role
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Regular user role')
        db_session.add(user_role)
        db_session.commit()
    
    user = User(
        username='testuser',
        email='test@example.com',
        email_verified=True,
        first_name='Test',
        last_name='User'
    )
    user.set_password('password123')
    user.roles.append(user_role)  # Associate user with the user role
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture(scope='function')
def connection_pool():
    """Create a database connection pool for testing."""
    engine = create_engine(
        'sqlite:///:memory:',
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800
    )
    Session = sessionmaker(bind=engine)
    return Session()

@pytest.fixture(scope='function')
def cache(app):
    """Configure and return cache for testing."""
    from flask_caching import Cache
    cache = Cache(app, config={
        'CACHE_TYPE': 'simple',
        'CACHE_DEFAULT_TIMEOUT': 300
    })
    return cache

@pytest.fixture(scope='function')
def rate_limiter(app):
    """Configure and return rate limiter for testing."""
    from flask_limiter import Limiter
    from flask_limiter.util import get_remote_address
    
    limiter = Limiter(
        app,
        key_func=get_remote_address,
        default_limits=["100 per minute", "5000 per hour"]
    )
    return limiter 

@pytest.fixture(scope='function')
def perf_session(db_session):
    """Create a new performance test session."""
    return db_session

@pytest.fixture(scope='function')
def perf_client(client):
    """Create a test client for performance tests."""
    return client

@pytest.fixture(scope='function')
def perf_data(db_session):
    """Create a large dataset for performance testing."""
    data = {
        'users': [],
        'venues': [],
        'tournaments': [],
        'matches': [],
        'games': []
    }
    
    # Get the default user role
    user_role = Role.query.filter_by(name='user').first()
    if not user_role:
        user_role = Role(name='user', description='Regular user role')
        db_session.add(user_role)
        db_session.commit()
    
    # Create users
    for i in range(100):
        user = UserFactory(
            username=f'perfuser{i}',
            email=f'perfuser{i}@example.com',
            email_verified=True,
            roles=[user_role]  # Associate each user with the user role
        )
        db_session.add(user)
        data['users'].append(user)
    
    # Create venues
    for i in range(20):
        location = LocationFactory()
        db_session.add(location)
        venue = VenueFactory(
            owner=data['users'][i % len(data['users'])],
            location=location
        )
        db_session.add(venue)
        data['venues'].append(venue)
    
    # Create tournaments
    for i in range(10):
        tournament = TournamentFactory(
            organizer=data['users'][i % len(data['users'])],
            venue=data['venues'][i % len(data['venues'])]
        )
        db_session.add(tournament)
        data['tournaments'].append(tournament)
    
    # Create matches and games
    for i in range(200):
        match = MatchFactory(
            player1=data['users'][i % len(data['users'])],
            player2=data['users'][(i + 1) % len(data['users'])],
            venue=data['venues'][i % len(data['venues'])]
        )
        db_session.add(match)
        data['matches'].append(match)
        
        game = GameFactory(
            player1=match.player1,
            player2=match.player2,
            venue=match.venue,
            match=match
        )
        db_session.add(game)
        data['games'].append(game)
    
    db_session.commit()
    return data