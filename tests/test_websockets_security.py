"""Tests for WebSocket security."""
import pytest
from dojopool.websockets.testing import mock_game_client, mock_tournament_client
from dojopool.websockets.errors import WebSocketError
from dojopool.websockets.middleware import require_auth, rate_limit

def test_authentication():
    """Test WebSocket authentication."""
    # Test with valid token
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    assert client.is_authenticated()
    
    # Test with invalid token
    with pytest.raises(WebSocketError):
        mock_game_client(
            game_id=1,
            user_id=1,
            token="invalid_token"
        )

def test_rate_limiting():
    """Test WebSocket rate limiting."""
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    
    # Test within rate limit
    for _ in range(10):
        client.send_message("test")
    assert client.is_connected()
    
    # Test exceeding rate limit
    with pytest.raises(WebSocketError):
        for _ in range(100):
            client.send_message("test")

def test_authorization():
    """Test WebSocket authorization."""
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    
    # Test authorized action
    client.send_message("test")
    assert client.is_connected()
    
    # Test unauthorized action
    with pytest.raises(WebSocketError):
        client.send_admin_command("test") 