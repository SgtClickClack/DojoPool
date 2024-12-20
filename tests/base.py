"""Base test class for all tests."""
import pytest
from flask import current_app
from src.app import create_app
from src.config.testing import TestingConfig
from src.core.database import db, init_db, _make_scoped_session
from tests.factories import (
    UserFactory, GameFactory, TournamentFactory, VenueFactory,
    RoleFactory, LocationFactory, MatchFactory, SessionFactory,
    TestData
)

class TestBase:
    """Base test class that provides application context and database setup."""
    
    @pytest.fixture(autouse=True)
    def setup(self, app, db_session):
        """Set up test environment before each test."""
        # Store the app instance
        self.app = app
        
        # Create a test client
        self.client = self.app.test_client()
        
        # Store the database session
        self.db = db_session
        
        # Push an application context
        self.app_context = self.app.app_context()
        self.app_context.push()
        
        # Set up test data
        self.setup_test_data()
        
        yield
        
        # Clean up
        self.db.rollback()
        self.db.remove()
        self.app_context.pop()
    
    def setup_test_data(self):
        """Set up test data for the test case."""
        # Create roles
        self.roles = TestData.create_roles()
        
        # Create users
        self.users = TestData.create_users(self.roles)
        
        # Create venues
        self.venues = TestData.create_venues(self.users['admin'])
        
        # Create a tournament
        self.tournament = TestData.create_tournament(
            organizer=self.users['admin'],
            venue=self.venues[0]
        )
        
        # Create a game
        self.game = TestData.create_game(
            player1=self.users['user'],
            player2=self.users['moderator'],
            venue=self.venues[0]
        )
        
        # Commit all changes
        self.db.commit()
    
    @staticmethod
    def create_app():
        """Create and configure a test Flask application."""
        app = create_app(TestingConfig)
        
        # Initialize database
        with app.app_context():
            init_db(app, drop_tables=True)
        
        return app