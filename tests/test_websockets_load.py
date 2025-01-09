"""Tests for WebSocket load testing."""
import pytest
from dojopool.websockets.testing import mock_game_client, mock_tournament_client
from dojopool.websockets.metrics import metrics_collector

def test_game_client_load():
    """Test game client under load."""
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
            
        # Simulate load
        for client in clients:
            for _ in range(100):
                client.send_message("test")
                
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 10000
        assert metrics["error_count"] == 0
        assert metrics["average_latency"] < 100  # Less than 100ms
        
    finally:
        # Cleanup
        for client in clients:
            client.disconnect()

def test_tournament_client_load():
    """Test tournament client under load."""
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
            
        # Simulate load
        for client in clients:
            for _ in range(100):
                client.send_message("test")
                
        # Check metrics
        metrics = metrics_collector.get_metrics()
        assert metrics["total_messages"] >= 10000
        assert metrics["error_count"] == 0
        assert metrics["average_latency"] < 100  # Less than 100ms
        
    finally:
        # Cleanup
        for client in clients:
            client.disconnect() 