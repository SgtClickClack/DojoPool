"""Integration test module."""
import pytest
from dojopool.models import User, Game, Match, Location
from dojopool.core.extensions import db

def test_game_flow(app, client, auth_headers):
    """Test complete game flow."""
    # Create users
    player1 = User(username="player1", email="player1@example.com")
    player2 = User(username="player2", email="player2@example.com")
    db.session.add_all([player1, player2])
    db.session.commit()
    
    # Create game
    game = Game(
        player1_id=player1.id,
        player2_id=player2.id,
        game_type="eight_ball",
        status="pending"
    )
    db.session.add(game)
    db.session.commit()
    
    # Start game
    game.status = "in_progress"
    db.session.commit()
    
    # Complete game
    game.status = "completed"
    game.winner_id = player1.id
    game.player1_score = 7
    game.player2_score = 5
    db.session.commit()
    
    # Verify game state
    assert game.status == "completed"
    assert game.winner_id == player1.id
    assert game.player1_score == 7
    assert game.player2_score == 5

def test_match_flow(app, client, auth_headers):
    """Test complete match flow."""
    # Create users and location
    player1 = User(username="player1", email="player1@example.com")
    player2 = User(username="player2", email="player2@example.com")
    location = Location(name="Test Location", address="123 Test St")
    db.session.add_all([player1, player2, location])
    db.session.commit()
    
    # Create match
    match = Match(
        player1_id=player1.id,
        player2_id=player2.id,
        location_id=location.id,
        game_type="eight_ball",
        status="scheduled"
    )
    db.session.add(match)
    db.session.commit()
    
    # Confirm match
    match.status = "confirmed"
    db.session.commit()
    
    # Start match
    match.status = "in_progress"
    db.session.commit()
    
    # Complete match
    match.status = "completed"
    match.winner_id = player1.id
    match.player1_score = 3
    match.player2_score = 1
    db.session.commit()
    
    # Verify match state
    assert match.status == "completed"
    assert match.winner_id == player1.id
    assert match.player1_score == 3
    assert match.player2_score == 1 