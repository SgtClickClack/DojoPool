import pytest
from datetime import datetime, timedelta
from dojopool.core.models import User, Game, Venue, Tournament
from dojopool.core.game.state import GameState, GameType, GameStatus
from dojopool.core.game.shot import Shot, ShotType, ShotResult
from dojopool.core.game.events import GameEvent, EventType
from dojopool.core.extensions import db

def test_user_creation(session):
    """Test user model creation and validation."""
    user = User(
        username="testuser",
        email="test@example.com",
        password="securepass"
    )
    session.add(user)
    session.commit()

    assert user.id is not None
    assert user.username == "testuser"
    assert user.email == "test@example.com"
    assert user.check_password("securepass")
    assert user.created_at is not None

def test_venue_creation(session):
    """Test venue model creation and validation."""
    venue = Venue(
        name="Test Venue",
        address="123 Test St",
        city="Test City",
        state="TS",
        zip_code="12345",
        phone="123-456-7890"
    )
    session.add(venue)
    session.commit()

    assert venue.id is not None
    assert venue.name == "Test Venue"
    assert venue.address == "123 Test St"
    assert venue.active is True

def test_game_creation(session, user):
    """Test game model creation and validation."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game = Game(
        venue_id=venue.id,
        created_by_id=user.id,
        game_type="8ball",
        status="active"
    )
    session.add(game)
    session.commit()

    assert game.id is not None
    assert game.venue_id == venue.id
    assert game.created_by_id == user.id
    assert game.game_type == "8ball"
    assert game.status == "active"

def test_tournament_creation(session, user):
    """Test tournament model creation and validation."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    tournament = Tournament(
        name="Test Tournament",
        venue_id=venue.id,
        organizer_id=user.id,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        max_participants=32,
        tournament_type="single_elimination"
    )
    session.add(tournament)
    session.commit()

    assert tournament.id is not None
    assert tournament.name == "Test Tournament"
    assert tournament.venue_id == venue.id
    assert tournament.organizer_id == user.id
    assert tournament.max_participants == 32

def test_user_game_relationship(session, user):
    """Test relationship between users and games."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game = Game(
        venue_id=venue.id,
        created_by_id=user.id,
        game_type="8ball",
        status="active"
    )
    session.add(game)
    session.commit()

    assert game in user.created_games
    assert game.created_by == user

def test_venue_tournament_relationship(session, user):
    """Test relationship between venues and tournaments."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    tournament = Tournament(
        name="Test Tournament",
        venue_id=venue.id,
        organizer_id=user.id,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        tournament_type="single_elimination"
    )
    session.add(tournament)
    session.commit()

    assert tournament in venue.tournaments
    assert tournament.venue == venue 

def test_shot_creation(session, user):
    """Test shot model creation and validation."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game_state = GameState(game_type=GameType.EIGHT_BALL.value, venue_id=venue.id)
    session.add(game_state)
    session.commit()

    shot = Shot(
        game_id=game_state.id,
        player_id=user.id,
        shot_type=ShotType.POWER,
        result=ShotResult.MADE,
        difficulty=0.8,
        speed=15.5,
        angle=45.0
    )
    session.add(shot)
    session.commit()

    assert shot.id is not None
    assert shot.game_id == game_state.id
    assert shot.player_id == user.id
    assert shot.shot_type == ShotType.POWER.value
    assert shot.result == ShotResult.MADE.value
    assert shot.was_successful is True

def test_shot_statistics(session, user):
    """Test shot statistics calculation."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game_state = GameState(game_type=GameType.EIGHT_BALL.value, venue_id=venue.id)
    session.add(game_state)
    session.commit()

    # Create multiple shots with different results
    shots = [
        Shot(game_id=game_state.id, player_id=user.id, shot_type=ShotType.POWER, result=ShotResult.MADE),
        Shot(game_id=game_state.id, player_id=user.id, shot_type=ShotType.BANK, result=ShotResult.MISSED),
        Shot(game_id=game_state.id, player_id=user.id, shot_type=ShotType.SAFETY, result=ShotResult.SAFETY_SUCCESS)
    ]
    for shot in shots:
        session.add(shot)
    session.commit()

    stats = Shot.get_player_stats(user.id)
    assert stats['total_shots'] == 3
    assert stats['successful_shots'] == 2
    assert stats['success_rate'] == 2/3
    assert stats['shot_types']['power'] == 1
    assert stats['shot_types']['bank'] == 1
    assert stats['shot_types']['safety'] == 1

def test_game_event_creation(session, user):
    """Test game event model creation and tracking."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game_state = GameState(game_type=GameType.EIGHT_BALL.value, venue_id=venue.id)
    session.add(game_state)
    session.commit()

    event = GameEvent(
        game_id=game_state.id,
        event_type=EventType.GAME_STARTED,
        player_id=user.id,
        data={'first_break': True}
    )
    session.add(event)
    session.commit()

    assert event.id is not None
    assert event.game_id == game_state.id
    assert event.event_type == EventType.GAME_STARTED.value
    assert event.player_id == user.id
    assert event.data['first_break'] is True

def test_game_state_transitions(session, user):
    """Test game state transitions and validation."""
    venue = Venue(name="Test Venue", address="123 Test St")
    session.add(venue)
    session.commit()

    game_state = GameState(game_type=GameType.EIGHT_BALL.value, venue_id=venue.id)
    session.add(game_state)
    session.commit()

    # Test game start
    game_state.start_game(user.id)
    assert game_state.status == GameStatus.ACTIVE.value
    assert game_state.current_player_id == user.id

    # Test game pause
    game_state.pause_game()
    assert game_state.status == GameStatus.PAUSED.value

    # Test game resume
    game_state.resume_game()
    assert game_state.status == GameStatus.ACTIVE.value

    # Test game end
    game_state.end_game(user.id)
    assert game_state.status == GameStatus.COMPLETED.value
    assert game_state.winner_id == user.id

    # Test invalid transitions
    with pytest.raises(ValueError):
        game_state.start_game(user.id)  # Can't start a completed game

    with pytest.raises(ValueError):
        game_state.pause_game()  # Can't pause a completed game