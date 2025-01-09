"""Tests for API endpoints integration functionality."""
import pytest
from dojopool.core.game.state import GameType, GameStatus
from dojopool.core.game.shot import ShotType, ShotResult
from dojopool.models import User, Game
from dojopool.core.db import db

def test_game_endpoints():
    """Test game-related API endpoints."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type=GameType.EIGHT_BALL,
        creator_id=user.id,
        status=GameStatus.CREATED
    )
    db.session.add(game)
    db.session.commit()
    
    # Get game details
    response = client.get(f"/api/games/{game.id}")
    assert response.status_code == 200
    assert response.json["status"] == GameStatus.CREATED
    
    # Update game
    response = client.put(
        f"/api/games/{game.id}",
        json={"status": GameStatus.IN_PROGRESS}
    )
    assert response.status_code == 200
    
    # Delete game
    response = client.delete(f"/api/games/{game.id}")
    assert response.status_code == 204

def test_shot_endpoints():
    """Test shot-related API endpoints."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type=GameType.EIGHT_BALL,
        creator_id=user.id,
        status=GameStatus.IN_PROGRESS
    )
    db.session.add(game)
    db.session.commit()
    
    # Take shot
    shot_data = {
        "type": ShotType.NORMAL,
        "power": 0.8,
        "angle": 45.0
    }
    response = client.post(
        f"/api/games/{game.id}/shots",
        json=shot_data
    )
    assert response.status_code == 200
    assert response.json["result"] == ShotResult.SUCCESS