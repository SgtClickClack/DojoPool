"""Tests for WebSocket functionality."""
import pytest
from dojopool.websockets.testing import (
    mock_game_client,
    mock_tournament_client
)
from dojopool.websockets.errors import (
    WebSocketError,
    ConnectionError,
    AuthenticationError
)

def test_game_client():
    """Test game client functionality."""
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    
    try:
        # Test connection
        client.connect()
        assert client.is_connected()
        
        # Test message sending
        client.send_message("test message")
        assert client.last_message == "test message"
        
        # Test game actions
        client.join_game()
        assert client.in_game
        
        client.update_score(5, 3)
        assert client.score == (5, 3)
        
    finally:
        client.disconnect()

def test_tournament_client():
    """Test tournament client functionality."""
    client = mock_tournament_client(
        tournament_id=1,
        user_id=1,
        token="valid_token"
    )
    
    try:
        # Test connection
        client.connect()
        assert client.is_connected()
        
        # Test message sending
        client.send_message("test message")
        assert client.last_message == "test message"
        
        # Test tournament actions
        client.join_tournament()
        assert client.in_tournament
        
        client.update_status("ready")
        assert client.status == "ready"
        
    finally:
        client.disconnect()

def test_error_handling():
    """Test WebSocket error handling."""
    # Test connection error
    with pytest.raises(ConnectionError):
        client = mock_game_client(
            game_id=1,
            user_id=1,
            token="valid_token"
        )
        client.disconnect()  # Disconnect before connecting
        client.send_message("test")
    
    # Test authentication error
    with pytest.raises(AuthenticationError):
        mock_game_client(
            game_id=1,
            user_id=1,
            token="invalid_token"
        )
    
    # Test general WebSocket error
    with pytest.raises(WebSocketError):
        client = mock_game_client(
            game_id=1,
            user_id=1,
            token="valid_token"
        )
        client.update_score(-1, -1)  # Invalid scores 