"""Test fixtures for model tests."""
import pytest
from datetime import datetime, timedelta
from src.models import User, Token, Location, Game, Match
from tests.conftest import (
    app, client, runner, _db, db_session, auth_headers,
    api_headers, test_user, test_session, test_location,
    test_venue, test_match, test_game, test_tournament
)

@pytest.fixture(scope='function')
def model_session(db_session):
    """Create a new session for model tests."""
    return db_session

@pytest.fixture(scope='function')
def user_factory(model_session):
    """Factory for creating test users."""
    def create_user(**kwargs):
        defaults = {
            'username': 'testuser',
            'email': 'test@example.com',
            'is_verified': True
        }
        defaults.update(kwargs)
        user = User(**defaults)
        user.set_password('password123')
        model_session.add(user)
        model_session.commit()
        return user
    return create_user

@pytest.fixture(scope='function')
def location_factory(model_session):
    """Factory for creating test locations."""
    def create_location(**kwargs):
        defaults = {
            'name': 'Test Location',
            'address': '123 Test St',
            'city': 'Test City',
            'state': 'TS',
            'country': 'Test Country'
        }
        defaults.update(kwargs)
        location = Location(**defaults)
        model_session.add(location)
        model_session.commit()
        return location
    return create_location

@pytest.fixture(scope='function')
def game_factory(model_session, user_factory):
    """Factory for creating test games."""
    def create_game(**kwargs):
        if 'player1' not in kwargs:
            kwargs['player1'] = user_factory()
        if 'player2' not in kwargs:
            kwargs['player2'] = user_factory()
            
        defaults = {
            'game_type': 'eight_ball',
            'status': 'pending',
            'is_ranked': True
        }
        defaults.update(kwargs)
        game = Game(**defaults)
        model_session.add(game)
        model_session.commit()
        return game
    return create_game

@pytest.fixture(scope='function')
def match_factory(model_session, user_factory, location_factory):
    """Factory for creating test matches."""
    def create_match(**kwargs):
        if 'player1' not in kwargs:
            kwargs['player1'] = user_factory()
        if 'player2' not in kwargs:
            kwargs['player2'] = user_factory()
        if 'location' not in kwargs:
            kwargs['location'] = location_factory()
        if 'scheduled_time' not in kwargs:
            kwargs['scheduled_time'] = datetime.now() + timedelta(days=1)
            
        defaults = {
            'game_type': 'eight_ball',
            'status': 'scheduled'
        }
        defaults.update(kwargs)
        match = Match(**defaults)
        model_session.add(match)
        model_session.commit()
        return match
    return create_match

@pytest.fixture(scope='function')
def sample_user(user_factory):
    """Create a sample user for testing."""
    return user_factory(
        username='sampleuser',
        email='sample@example.com',
        password='samplepass123'
    )

@pytest.fixture(scope='function')
def sample_location(location_factory):
    """Create a sample location for testing."""
    return location_factory(
        name='Sample Pool Hall',
        address='123 Sample St',
        city='Sample City'
    )

@pytest.fixture(scope='function')
def sample_game(game_factory, sample_user):
    """Create a sample game for testing."""
    return game_factory(
        player1=sample_user,
        game_type='eight_ball',
        status='in_progress'
    )

@pytest.fixture(scope='function')
def sample_match(match_factory, sample_user, sample_location):
    """Create a sample match for testing."""
    return match_factory(
        player1=sample_user,
        location=sample_location,
        game_type='eight_ball',
        status='scheduled'
    )

@pytest.fixture(scope='function')
def completed_game(game_factory, sample_user):
    """Create a completed game for testing."""
    player2 = user_factory()(username='opponent')
    game = game_factory(
        player1=sample_user,
        player2=player2,
        status='completed',
        player1_score=7,
        player2_score=5,
        winner_id=sample_user.id
    )
    return game 