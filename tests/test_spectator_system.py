"""Tests for spectator system functionality."""
import pytest
from dojopool.spectator.spectator_system import SpectatorSystem

def test_spectator_system():
    """Test spectator system functionality."""
    system = SpectatorSystem()
    
    # Test adding spectators
    system.add_spectator(game_id=1, user_id=1)
    system.add_spectator(game_id=1, user_id=2)
    assert system.get_spectator_count(game_id=1) == 2
    
    # Test removing spectators
    system.remove_spectator(game_id=1, user_id=1)
    assert system.get_spectator_count(game_id=1) == 1
    
    # Test getting spectators
    spectators = system.get_spectators(game_id=1)
    assert len(spectators) == 1
    assert spectators[0] == 2

def test_spectator_limits():
    """Test spectator system limits."""
    system = SpectatorSystem()
    
    # Test maximum spectators per game
    for i in range(10):
        system.add_spectator(game_id=1, user_id=i)
    
    with pytest.raises(ValueError):
        system.add_spectator(game_id=1, user_id=10)  # Exceeds limit
    
    # Test removing non-existent spectator
    with pytest.raises(ValueError):
        system.remove_spectator(game_id=1, user_id=20)

def test_spectator_notifications():
    """Test spectator system notifications."""
    system = SpectatorSystem()
    
    # Add spectators
    system.add_spectator(game_id=1, user_id=1)
    system.add_spectator(game_id=1, user_id=2)
    
    # Test sending notifications
    notifications = system.notify_spectators(game_id=1, message="Game update")
    assert len(notifications) == 2
    assert all(n["message"] == "Game update" for n in notifications)