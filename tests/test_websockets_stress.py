"""Tests for WebSocket stress testing."""
import pytest
from dojopool.websockets.testing import mock_game_client, mock_tournament_client
from dojopool.websockets.metrics import metrics_collector
from dojopool.websockets.errors import WebSocketError

def test_game_client_stress():
    """Test game client under stress."""
    clients = []
    try:
        # Create multiple clients
        for i in range(100):
            client = mock_game_client(
                game_id=1,
                user_id=i,
                token=f"token_{i}"
            )
            clients.append(client)
            
        # Simulate heavy traffic
        for client in clients:
            for _ in range(100):
                client.send_message("test message")
                
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 10000
        assert metrics["error_count"] == 0
        
    finally:
        # Cleanup
        for client in clients:
            client.disconnect()

def test_tournament_client_stress():
    """Test tournament client under stress."""
    clients = []
    try:
        # Create multiple clients
        for i in range(100):
            client = mock_tournament_client(
                tournament_id=1,
                user_id=i,
                token=f"token_{i}"
            )
            clients.append(client)
            
        # Simulate heavy traffic
        for client in clients:
            for _ in range(100):
                client.send_message("test message")
                
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 10000
        assert metrics["error_count"] == 0
        
    finally:
        # Cleanup
        for client in clients:
            client.disconnect() 