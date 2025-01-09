"""Tests for game flow integration functionality."""
import pytest
from dojopool.core.auth.service import auth_service
from dojopool.core.game.state import GameState, GameStatus
from dojopool.core.game.events import GameEvent
from dojopool.core.game.shot import Shot, ShotType, ShotResult
from dojopool.models import User, Match
from dojopool.core.db import db

def test_game_flow():
    """Test complete game flow."""
    # Create test users
    player1 = User(username="player1", email="player1@test.com")
    player2 = User(username="player2", email="player2@test.com")
    db.session.add_all([player1, player2])
    db.session.commit()
    
    # Initialize game
    game_state = GameState.create_new(
        game_type="eight_ball",
        player1_id=player1.id,
        player2_id=player2.id
    )
    assert game_state.status == GameStatus.INITIALIZED
    
    # Start game
    game_state.start()
    assert game_state.status == GameStatus.IN_PROGRESS
    
    # Take shots
    shot = Shot(
        type=ShotType.NORMAL,
        power=0.8,
        angle=45.0,
        player_id=player1.id
    )
    event = game_state.process_shot(shot)
    assert isinstance(event, GameEvent)
    assert event.player_id == player1.id
    
    # End game
    game_state.end(winner_id=player1.id)
    assert game_state.status == GameStatus.COMPLETED
    assert game_state.winner_id == player1.id
    
    # Check match record
    match = Match.query.filter_by(
        player1_id=player1.id,
        player2_id=player2.id
    ).first()
    assert match is not None
    assert match.winner_id == player1.id

def test_game_validation():
    """Test game validation."""
    # Create test user
    player = User(username="player1", email="player1@test.com")
    db.session.add(player)
    db.session.commit()
    
    # Initialize game
    game_state = GameState.create_new(
        game_type="eight_ball",
        player1_id=player.id
    )
    
    # Test invalid shot
    invalid_shot = Shot(
        type=ShotType.NORMAL,
        power=2.0,  # Invalid power
        angle=400.0,  # Invalid angle
        player_id=player.id
    )
    with pytest.raises(ValueError):
        game_state.process_shot(invalid_shot)
    
    # Test valid shot
    valid_shot = Shot(
        type=ShotType.NORMAL,
        power=0.5,
        angle=30.0,
        player_id=player.id
    )
    event = game_state.process_shot(valid_shot)
    assert isinstance(event, GameEvent)
    assert event.player_id == player.id 