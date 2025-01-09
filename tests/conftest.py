"""Test configuration file."""
import os
import tempfile

import pytest
from flask import Flask
from flask_sqlalchemy import SQLAlchemy

from dojopool.core.extensions import db
from dojopool.models import (
    User,
    Game,
    Tournament,
    TournamentPlayer,
    TournamentGame,
    TournamentRound,
    TournamentBracket,
    TournamentType,
    GameType,
    GameMode,
    GameStatus,
    TournamentStatus,
    TournamentFormat,
    TournamentRoundType,
    TournamentBracketType,
)
from dojopool.config import TestingConfig

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    app = Flask(__name__)
    app.config.from_object(TestingConfig)
    app.config.update({
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'TESTING': True,
    })

    # Initialize Flask extensions
    db.init_app(app)

    # Create the database and load test data
    with app.app_context():
        db.create_all()

    yield app

    # Close and remove the temporary database
    os.close(db_fd)
    os.unlink(db_path)

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
def game(_db, user):
    """Create a game for testing."""
    game = Game(
        player1_id=user.id,
        player2_id=user.id,
        game_type=GameType.EIGHT_BALL,
        game_mode=GameMode.CASUAL,
        status=GameStatus.IN_PROGRESS
    )
    _db.session.add(game)
    _db.session.commit()
    return game

@pytest.fixture
def tournament(_db, user):
    """Create a tournament for testing."""
    tournament = Tournament(
        name='Test Tournament',
        organizer_id=user.id,
        tournament_type=TournamentType.SINGLE_ELIMINATION,
        game_type=GameType.EIGHT_BALL,
        format=TournamentFormat.BRACKET,
        status=TournamentStatus.REGISTRATION_OPEN
    )
    _db.session.add(tournament)
    _db.session.commit()
    return tournament

@pytest.fixture
def tournament_player(_db, tournament, user):
    """Create a tournament player for testing."""
    tournament_player = TournamentPlayer(
        tournament_id=tournament.id,
        player_id=user.id
    )
    _db.session.add(tournament_player)
    _db.session.commit()
    return tournament_player

@pytest.fixture
def tournament_game(_db, tournament, game):
    """Create a tournament game for testing."""
    tournament_game = TournamentGame(
        tournament_id=tournament.id,
        game_id=game.id
    )
    _db.session.add(tournament_game)
    _db.session.commit()
    return tournament_game

@pytest.fixture
def tournament_round(_db, tournament):
    """Create a tournament round for testing."""
    tournament_round = TournamentRound(
        tournament_id=tournament.id,
        round_number=1,
        round_type=TournamentRoundType.WINNERS
    )
    _db.session.add(tournament_round)
    _db.session.commit()
    return tournament_round

@pytest.fixture
def tournament_bracket(_db, tournament_round, tournament_game):
    """Create a tournament bracket for testing."""
    tournament_bracket = TournamentBracket(
        tournament_round_id=tournament_round.id,
        tournament_game_id=tournament_game.id,
        bracket_type=TournamentBracketType.WINNERS
    )
    _db.session.add(tournament_bracket)
    _db.session.commit()
    return tournament_bracket