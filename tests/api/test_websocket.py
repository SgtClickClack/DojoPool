"""Tests for WebSocket API functionality."""
import pytest
from dojopool.core.websocket import WebSocketManager
from dojopool.models import Game, User
from dojopool.core.db import db

def test_websocket_connection(client, auth_headers):
    """Test WebSocket connection."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user.id,
        status="created"
    )
    db.session.add(game)
    db.session.commit()
    
    # Connect to WebSocket
    ws = client.websocket_connect(
        f"/ws/games/{game.id}",
        headers=auth_headers
    )
    assert ws.connected
    
    # Send message
    ws.send_json({
        "type": "ready",
        "data": {"player_id": user.id}
    })
    
    # Receive response
    response = ws.receive_json()
    assert response["type"] == "player_ready"
    assert response["data"]["player_id"] == user.id
    
    # Close connection
    ws.close()
    assert not ws.connected

def test_game_state_updates(client, auth_headers):
    """Test game state updates via WebSocket."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user.id,
        status="in_progress"
    )
    db.session.add(game)
    db.session.commit()
    
    # Connect to WebSocket
    ws = client.websocket_connect(
        f"/ws/games/{game.id}",
        headers=auth_headers
    )
    assert ws.connected
    
    # Take shot
    ws.send_json({
        "type": "shot",
        "data": {
            "power": 0.8,
            "angle": 45.0,
            "player_id": user.id
        }
    })
    
    # Receive game state update
    response = ws.receive_json()
    assert response["type"] == "game_state"
    assert "balls" in response["data"]
    assert "score" in response["data"]
    
    # Close connection
    ws.close()
    assert not ws.connected