"""Tests for game API endpoints."""
import pytest
from dojopool.models import Game, User
from dojopool.core.db import db
from dojopool.core.game.state import GameState, GameStatus
from dojopool.core.game.shot import Shot, ShotType

def test_create_game(client, auth_headers):
    """Test game creation."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    game_data = {
        "game_type": "eight_ball",
        "creator_id": user.id
    }
    
    response = client.post(
        "/api/games",
        json=game_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json["game_type"] == game_data["game_type"]
    assert response.json["creator_id"] == game_data["creator_id"]
    
    # Verify game was created in database
    game = Game.query.filter_by(creator_id=user.id).first()
    assert game is not None
    assert game.game_type == game_data["game_type"]

def test_get_game(client):
    """Test getting game details."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user.id,
        status=GameStatus.CREATED
    )
    db.session.add(game)
    db.session.commit()
    
    response = client.get(f"/api/games/{game.id}")
    assert response.status_code == 200
    assert response.json["game_type"] == game.game_type
    assert response.json["creator_id"] == game.creator_id
    assert response.json["status"] == GameStatus.CREATED

def test_update_game(client, auth_headers):
    """Test updating game details."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user.id,
        status=GameStatus.CREATED
    )
    db.session.add(game)
    db.session.commit()
    
    update_data = {
        "status": GameStatus.IN_PROGRESS
    }
    
    response = client.put(
        f"/api/games/{game.id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json["status"] == GameStatus.IN_PROGRESS
    
    # Verify game was updated in database
    game = Game.query.get(game.id)
    assert game.status == GameStatus.IN_PROGRESS

def test_take_shot(client, auth_headers):
    """Test taking a shot."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user.id,
        status=GameStatus.IN_PROGRESS
    )
    db.session.add(game)
    db.session.commit()
    
    shot_data = {
        "type": ShotType.NORMAL,
        "power": 0.8,
        "angle": 45.0,
        "player_id": user.id
    }
    
    response = client.post(
        f"/api/games/{game.id}/shots",
        json=shot_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert "result" in response.json
    assert "game_state" in response.json 