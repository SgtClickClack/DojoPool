"""Tests for WebSocket validation."""
import pytest
from dojopool.websockets.testing import mock_game_client, mock_tournament_client
from dojopool.websockets.errors import WebSocketError

def test_game_client_validation():
    """Test game client validation."""
    # Test valid game client
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    assert client.is_valid()
    
    # Test invalid game client
    with pytest.raises(WebSocketError):
        mock_game_client(
            game_id=-1,  # Invalid game ID
            user_id=1,
            token="valid_token"
        )

def test_tournament_client_validation():
    """Test tournament client validation."""
    # Test valid tournament client
    client = mock_tournament_client(
        tournament_id=1,
        user_id=1,
        token="valid_token"
    )
    assert client.is_valid()
    
    # Test invalid tournament client
    with pytest.raises(WebSocketError):
        mock_tournament_client(
            tournament_id=-1,  # Invalid tournament ID
            user_id=1,
            token="valid_token"
        ) 