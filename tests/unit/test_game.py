"""Test game module."""

import pytest
from datetime import datetime
from src.models.game import Game
from src.models.user import User
from src.models.venue import Venue

@pytest.fixture
def game_state():
    """Create a game state for testing."""
    return {
        'player1': 'John',
        'player2': 'Jane',
        'score1': 0,
        'score2': 0,
        'game_type': '8-ball',
        'status': 'in_progress',
        'current_player': 'player1',
        'balls_on_table': list(range(1, 16)),
        'last_shot': None,
        'fouls': 0,
        'timestamp': datetime.utcnow().isoformat()
    }

def test_game_event_handling(db, game_state):
    """Test game event handling."""
    # Create test users
    player1 = User(username='John', email='john@example.com')
    player2 = User(username='Jane', email='jane@example.com')
    db.session.add_all([player1, player2])
    
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create test game
    game = Game(
        player1=player1,
        player2=player2,
        venue=venue,
        game_type='8-ball'
    )
    db.session.add(game)
    db.session.commit()
    
    # Test game state update
    game.update_state(game_state)
    assert game.status == 'in_progress'
    assert game.current_player == 'player1'
    assert game.score1 == 0
    assert game.score2 == 0

def test_game_state_transitions(db, game_state):
    """Test game state transitions."""
    # Create test users
    player1 = User(username='John', email='john@example.com')
    player2 = User(username='Jane', email='jane@example.com')
    db.session.add_all([player1, player2])
    
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create test game
    game = Game(
        player1=player1,
        player2=player2,
        venue=venue,
        game_type='8-ball'
    )
    db.session.add(game)
    db.session.commit()
    
    # Test initial state
    assert game.status == 'pending'
    
    # Test start game
    game.start()
    assert game.status == 'in_progress'
    
    # Test pause game
    game.pause()
    assert game.status == 'paused'
    
    # Test resume game
    game.resume()
    assert game.status == 'in_progress'
    
    # Test end game
    game.end(winner=player1)
    assert game.status == 'completed'
    assert game.winner == player1

def test_game_scoring(db, game_state):
    """Test game scoring."""
    # Create test users
    player1 = User(username='John', email='john@example.com')
    player2 = User(username='Jane', email='jane@example.com')
    db.session.add_all([player1, player2])
    
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create test game
    game = Game(
        player1=player1,
        player2=player2,
        venue=venue,
        game_type='8-ball'
    )
    db.session.add(game)
    db.session.commit()
    
    # Test score update
    game.update_score(1, 0)
    assert game.score1 == 1
    assert game.score2 == 0
    
    game.update_score(1, 1)
    assert game.score1 == 1
    assert game.score2 == 1
    
    # Test invalid score update
    with pytest.raises(ValueError):
        game.update_score(-1, 0)
    
    with pytest.raises(ValueError):
        game.update_score(0, -1)