import pytest
from datetime import datetime
from dojopool.models.game import Game
from dojopool.models.user import User

def test_game_creation(db_session):
    """Test basic game creation."""
    game = Game(
        game_type="eight_ball",
        is_ranked=True,
        status="pending"
    )
    db_session.add(game)
    db_session.commit()

    assert game.id is not None
    assert game.game_type == "eight_ball"
    assert game.is_ranked is True
    assert game.status == "pending"
    assert isinstance(game.created_at, datetime)

def test_game_status_transitions(db_session):
    """Test game status transitions."""
    game = Game(game_type="eight_ball", status="pending")
    db_session.add(game)
    db_session.commit()

    # Test valid transitions
    game.status = "in_progress"
    db_session.commit()
    assert game.status == "in_progress"

    game.status = "completed"
    db_session.commit()
    assert game.status == "completed"

    # Test invalid transition
    with pytest.raises(ValueError):
        game.status = "invalid_status"

def test_game_player_assignment(db_session, user_factory):
    """Test assigning players to a game."""
    player1 = user_factory()
    player2 = user_factory()
    
    game = Game(
        game_type="eight_ball",
        status="pending",
        player1=player1,
        player2=player2
    )
    db_session.add(game)
    db_session.commit()

    assert game.player1_id == player1.id
    assert game.player2_id == player2.id
    assert game.player1.username == player1.username
    assert game.player2.username == player2.username

def test_game_validation(db_session):
    """Test game validation rules."""
    # Test invalid game type
    with pytest.raises(ValueError):
        Game(game_type="invalid_type")

    # Test valid game types
    valid_types = ["eight_ball", "nine_ball", "snooker"]
    for game_type in valid_types:
        game = Game(game_type=game_type)
        assert game.game_type == game_type

def test_game_scoring(db_session, user_factory):
    """Test game scoring functionality."""
    player1 = user_factory()
    player2 = user_factory()
    
    game = Game(
        game_type="eight_ball",
        status="in_progress",
        player1=player1,
        player2=player2
    )
    db_session.add(game)
    db_session.commit()

    # Test score updates
    game.player1_score = 7
    game.player2_score = 5
    db_session.commit()

    assert game.player1_score == 7
    assert game.player2_score == 5

    # Test invalid scores
    with pytest.raises(ValueError):
        game.player1_score = -1

def test_game_completion(db_session, user_factory):
    """Test game completion logic."""
    player1 = user_factory()
    player2 = user_factory()
    
    game = Game(
        game_type="eight_ball",
        status="in_progress",
        player1=player1,
        player2=player2
    )
    db_session.add(game)
    db_session.commit()

    # Complete the game
    game.complete_game(winner=player1)
    
    assert game.status == "completed"
    assert game.winner_id == player1.id
    assert game.completed_at is not None

def test_game_serialization(db_session, user_factory):
    """Test game serialization to dict."""
    player1 = user_factory()
    player2 = user_factory()
    
    game = Game(
        game_type="eight_ball",
        status="in_progress",
        player1=player1,
        player2=player2,
        player1_score=5,
        player2_score=3
    )
    db_session.add(game)
    db_session.commit()

    game_dict = game.to_dict()
    
    assert game_dict["id"] == game.id
    assert game_dict["game_type"] == "eight_ball"
    assert game_dict["status"] == "in_progress"
    assert game_dict["player1"]["id"] == player1.id
    assert game_dict["player2"]["id"] == player2.id
    assert game_dict["player1_score"] == 5
    assert game_dict["player2_score"] == 3 