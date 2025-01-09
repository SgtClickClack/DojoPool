"""Tests for WebSocket performance."""
import pytest
from dojopool.websockets.testing import mock_game_client, mock_tournament_client
from dojopool.websockets.metrics import metrics_collector

def test_game_client_performance():
    """Test game client performance."""
    client = mock_game_client(
        game_id=1,
        user_id=1,
        token="valid_token"
    )
    
    # Measure message latency
    start_time = metrics_collector.start_timer()
    client.send_message("test")
    latency = metrics_collector.end_timer(start_time)
    
    assert latency < 100  # Less than 100ms
    
    # Measure message throughput
    start_time = metrics_collector.start_timer()
    for _ in range(1000):
        client.send_message("test")
    throughput = metrics_collector.calculate_throughput(1000, start_time)
    
    assert throughput > 100  # More than 100 messages per second

def test_tournament_client_performance():
    """Test tournament client performance."""
    client = mock_tournament_client(
        tournament_id=1,
        user_id=1,
        token="valid_token"
    )
    
    # Measure message latency
    start_time = metrics_collector.start_timer()
    client.send_message("test")
    latency = metrics_collector.end_timer(start_time)
    
    assert latency < 100  # Less than 100ms
    
    # Measure message throughput
    start_time = metrics_collector.start_timer()
    for _ in range(1000):
        client.send_message("test")
    throughput = metrics_collector.calculate_throughput(1000, start_time)
    
    assert throughput > 100  # More than 100 messages per second 