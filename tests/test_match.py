"""
Unit tests for the Match Module.
"""

from datetime import datetime
import pytest
from flask import Flask
from src.dojopool.models.match import Match
from src.dojopool.core.database.models import User
from src.dojopool.core.extensions import db
from src.dojopool.core.config.testing import TestingConfig

@pytest.fixture
def app():
    """Create a Flask application for testing."""
    app = Flask(__name__)
    app.config.from_object(TestingConfig)
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def test_users(app):
    """Create test users."""
    with app.app_context():
        user1 = User(username="Alice", email="alice@test.com", password_hash="hash1")
        user2 = User(username="Bob", email="bob@test.com", password_hash="hash2")
        db.session.add_all([user1, user2])
        db.session.commit()
        return user1, user2

@pytest.fixture
def test_match(test_users, app):
    """Create a test match."""
    with app.app_context():
        user1, user2 = test_users
        match = Match()
        match.tournament_id = 1
        match.round = 1
        match.match_number = 1
        match.player1_id = user1.id
        match.player2_id = user2.id
        match.status = "completed"
        match.score = "5-3"
        match.start_time = datetime(2023, 1, 1)
        match.end_time = datetime(2023, 1, 1, 0, 30)
        db.session.add(match)
        db.session.commit()
        return match

def test_match_repr(test_match, app):
    """Test the string representation of a match."""
    with app.app_context():
        rep = repr(test_match)
        assert "Alice" in rep
        assert "Bob" in rep
        assert "Match" in rep 