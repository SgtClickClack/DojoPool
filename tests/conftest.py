"""Test configuration and fixtures."""
import pytest
from datetime import datetime, timedelta
from flask import current_app
from sqlalchemy import event
from sqlalchemy.exc import SQLAlchemyError
from src.app import create_app
from src.config.testing import TestingConfig
from src.core.database import db, _make_scoped_session
from src.models import User, Role, Token
from src.ai import init_ai_service
from tests.base import TestBase
from tests.utils import TestDataBuilder, cleanup_after_test
from tests.factories import (
    UserFactory, GameFactory, TournamentFactory, VenueFactory,
    RoleFactory, LocationFactory, MatchFactory, SessionFactory,
    TestData
)

class MockAIService:
    """Mock AI service for testing."""
    
    def __init__(self, api_key=None):
        """Initialize mock AI service."""
        self.api_key = api_key
    
    def is_configured(self) -> bool:
        """Check if service is properly configured."""
        return True
    
    def generate_text(self, prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """Generate mock text."""
        return "This is a mock response for testing."
    
    def generate_chat_response(self, messages: list, temperature: float = 0.7) -> str:
        """Generate mock chat response."""
        return "This is a mock chat response for testing."

@pytest.fixture(scope='session', autouse=True)
def app():
    """Create and configure a test Flask application."""
    app = create_app(TestingConfig)
    
    # Push an application context
    ctx = app.app_context()
    ctx.push()
    
    try:
        # Import all models to ensure they are registered
        from src.models import (
            User, Game, Tournament, Venue, Role, Location, Match,
            Achievement, UserAchievement, Rating, Leaderboard, UserReward,
            Review, ReviewResponse, ReviewReport, ReviewVote, Notification,
            Session, Token
        )
        
        # Initialize the database
        db.drop_all()
        db.create_all()
        
        # Create default roles
        with db.session.begin():
            roles = ['admin', 'user', 'moderator']
            for role_name in roles:
                if not Role.query.filter_by(name=role_name).first():
                    role = Role(name=role_name, description=f'{role_name} role')
                    db.session.add(role)
            db.session.commit()  # Explicitly commit the roles
        
        # Initialize mock AI service
        mock_service = MockAIService(api_key='test-openai-key')
        init_ai_service._instance = mock_service
        
        yield app
        
    except SQLAlchemyError as e:
        app.logger.error(f"Database initialization error: {str(e)}")
        raise
    finally:
        # Clean up
        db.session.remove()
        db.drop_all()
        ctx.pop()
        # Reset AI service instance
        init_ai_service._instance = None

@pytest.fixture(scope='session')
def _db(app):
    """Create a database instance for pytest-flask-sqlalchemy."""
    return db

@pytest.fixture(scope='function')
def db_session(app, _db):
    """Create a new database session for a test."""
    # Ensure we have an application context
    with app.app_context():
        # Connect to the database and begin a transaction
        connection = _db.engine.connect()
        transaction = connection.begin()
        
        # Create a session bound to the connection
        session = _make_scoped_session(bind=connection)
        _db.session = session
        
        # Begin a nested transaction (using SAVEPOINT)
        nested = connection.begin_nested()
        
        # If the application code calls session.commit, it will end the nested
        # transaction. Need to start a new one when that happens.
        @event.listens_for(session, 'after_transaction_end')
        def end_savepoint(session, transaction):
            nonlocal nested
            if not nested.is_active:
                nested = connection.begin_nested()
        
        try:
            # Ensure tables exist
            _db.create_all()
            
            # Create default roles if they don't exist
            from src.models import Role
            roles = ['admin', 'user', 'moderator']
            for role_name in roles:
                if not session.query(Role).filter_by(name=role_name).first():
                    role = Role(name=role_name, description=f'{role_name} role')
                    session.add(role)
            session.commit()
            
            yield session
        except:
            session.rollback()
            raise
        finally:
            # Remove the session
            session.close()
            
            try:
                # Rollback the overall transaction, restoring the state before the test ran
                transaction.rollback()
                
                # Close the connection
                connection.close()
            except:
                pass  # Ignore errors during cleanup
            
            # Remove the session
            _db.session.remove()

@pytest.fixture(scope='function')
def client(app):
    """Create a test client for the app."""
    return app.test_client()

@pytest.fixture(scope='function')
def runner(app):
    """Create a test CLI runner for the app."""
    return app.test_cli_runner()

@pytest.fixture(scope='function')
def test_data_builder(db_session):
    """Create a test data builder instance."""
    return TestDataBuilder(db_session)

@pytest.fixture(scope='function')
def test_user(test_data_builder):
    """Create a test user."""
    return test_data_builder.create_user('testuser', 'test@example.com')

@pytest.fixture(scope='function')
def test_admin(test_data_builder):
    """Create a test admin user."""
    return test_data_builder.create_user('admin', 'admin@example.com', role_name='admin')

@pytest.fixture(scope='function')
def test_token(db_session, test_user):
    """Create a test token."""
    try:
        token = Token(
            user_id=test_user.id,
            token_type='access',
            token='test-token',
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db_session.add(token)
        db_session.commit()
        return token
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def auth_headers(test_user):
    """Authentication headers for testing."""
    token = Token.generate_token(test_user.id, 'access', expires_in=3600)
    return {
        'Authorization': f'Bearer {token.token}',
        'Content-Type': 'application/json'
    }

@pytest.fixture(scope='function')
def admin_headers(test_admin):
    """Authentication headers for admin testing."""
    token = Token.generate_token(test_admin.id, 'access', expires_in=3600)
    return {
        'Authorization': f'Bearer {token.token}',
        'Content-Type': 'application/json'
    }

@pytest.fixture(scope='function')
def api_headers():
    """API headers for testing."""
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': '1.0'
    }

@pytest.fixture(scope='function')
def test_session(db_session, test_user):
    """Create a test session."""
    try:
        session = SessionFactory(user=test_user)
        db_session.add(session)
        db_session.commit()
        return session
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def test_location(db_session):
    """Create a test location."""
    try:
        location = LocationFactory()
        db_session.add(location)
        db_session.commit()
        return location
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def test_venue(db_session, test_user, test_location):
    """Create a test venue."""
    try:
        venue = VenueFactory(owner=test_user, location=test_location)
        db_session.add(venue)
        db_session.commit()
        return venue
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def test_match(db_session, test_user, test_venue):
    """Create a test match."""
    try:
        match = MatchFactory(
            player1=test_user,
            player2=test_user,  # Using same user for simplicity
            venue=test_venue
        )
        db_session.add(match)
        db_session.commit()
        return match
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def test_game(db_session, test_user, test_venue, test_match):
    """Create a test game."""
    try:
        game = GameFactory(
            player1=test_user,
            player2=test_user,  # Using same user for simplicity
            venue=test_venue,
            match=test_match
        )
        db_session.add(game)
        db_session.commit()
        return game
    except SQLAlchemyError as e:
        db_session.rollback()
        raise

@pytest.fixture(scope='function')
def test_tournament(db_session, test_user, test_venue):
    """Create a test tournament."""
    try:
        tournament = TournamentFactory(
            organizer=test_user,
            venue=test_venue
        )
        db_session.add(tournament)
        db_session.commit()
        return tournament
    except SQLAlchemyError as e:
        db_session.rollback()
        raise