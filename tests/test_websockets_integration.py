"""Tests for WebSocket integration."""
import pytest
from dojopool.websockets.testing import (
    mock_game_client,
    mock_tournament_client
)
from dojopool.websockets.errors import WebSocketError
from dojopool.websockets.rooms import room_manager
from dojopool.websockets.metrics import metrics_collector

def test_game_integration():
    """Test game WebSocket integration."""
    # Create clients
    player1 = mock_game_client(game_id=1, user_id=1, token="token_1")
    player2 = mock_game_client(game_id=1, user_id=2, token="token_2")
    
    try:
        # Join game
        player1.join_game()
        player2.join_game()
        
        # Send messages
        player1.send_message("Hello from player 1")
        player2.send_message("Hello from player 2")
        
        # Update scores
        player1.update_score(5, 3)
        player2.update_score(7, 5)
        
        # Verify room state
        room = room_manager.get_room("game_1")
        assert room is not None
        assert len(room.clients) == 2
        
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 4
        assert metrics["error_count"] == 0
        
    finally:
        # Cleanup
        player1.disconnect()
        player2.disconnect()

def test_tournament_integration():
    """Test tournament WebSocket integration."""
    # Create clients
    player1 = mock_tournament_client(tournament_id=1, user_id=1, token="token_1")
    player2 = mock_tournament_client(tournament_id=1, user_id=2, token="token_2")
    
    try:
        # Join tournament
        player1.join_tournament()
        player2.join_tournament()
        
        # Send messages
        player1.send_message("Hello from player 1")
        player2.send_message("Hello from player 2")
        
        # Update tournament state
        player1.update_status("ready")
        player2.update_status("ready")
        
        # Verify room state
        room = room_manager.get_room("tournament_1")
        assert room is not None
        assert len(room.clients) == 2
        
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 4
        assert metrics["error_count"] == 0
        
    finally:
        # Cleanup
        player1.disconnect()
        player2.disconnect() 