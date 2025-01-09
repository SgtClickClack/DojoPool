"""Tests for leaderboard API endpoints."""
import pytest
from dojopool.models import Leaderboard, User, Game
from dojopool.core.db import db

def test_get_leaderboard(client):
    """Test getting leaderboard."""
    # Create test users
    user1 = User(username="user1", email="user1@example.com")
    user1.set_password("password123")
    user2 = User(username="user2", email="user2@example.com")
    user2.set_password("password123")
    db.session.add_all([user1, user2])
    db.session.commit()
    
    # Create leaderboard entries
    entry1 = Leaderboard(
        user_id=user1.id,
        wins=5,
        losses=2,
        points=150
    )
    entry2 = Leaderboard(
        user_id=user2.id,
        wins=3,
        losses=4,
        points=90
    )
    db.session.add_all([entry1, entry2])
    db.session.commit()
    
    response = client.get("/api/leaderboard")
    assert response.status_code == 200
    assert len(response.json["entries"]) == 2
    assert response.json["entries"][0]["points"] > response.json["entries"][1]["points"]

def test_get_user_stats(client):
    """Test getting user stats."""
    # Create test user
    user = User(username="testuser", email="test@example.com")
    user.set_password("password123")
    db.session.add(user)
    db.session.commit()
    
    # Create leaderboard entry
    entry = Leaderboard(
        user_id=user.id,
        wins=5,
        losses=2,
        points=150
    )
    db.session.add(entry)
    db.session.commit()
    
    response = client.get(f"/api/leaderboard/users/{user.id}")
    assert response.status_code == 200
    assert response.json["wins"] == 5
    assert response.json["losses"] == 2
    assert response.json["points"] == 150

def test_update_leaderboard(client, auth_headers):
    """Test updating leaderboard after game."""
    # Create test users
    user1 = User(username="user1", email="user1@example.com")
    user1.set_password("password123")
    user2 = User(username="user2", email="user2@example.com")
    user2.set_password("password123")
    db.session.add_all([user1, user2])
    db.session.commit()
    
    # Create game
    game = Game(
        game_type="eight_ball",
        creator_id=user1.id,
        opponent_id=user2.id,
        winner_id=user1.id,
        status="completed"
    )
    db.session.add(game)
    db.session.commit()
    
    # Update leaderboard
    response = client.post(
        "/api/leaderboard/update",
        json={"game_id": game.id},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify leaderboard entries
    entry1 = Leaderboard.query.filter_by(user_id=user1.id).first()
    assert entry1.wins == 1
    assert entry1.losses == 0
    
    entry2 = Leaderboard.query.filter_by(user_id=user2.id).first()
    assert entry2.wins == 0
    assert entry2.losses == 1 