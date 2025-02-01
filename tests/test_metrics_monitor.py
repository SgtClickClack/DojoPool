"""Tests for the unified metrics monitoring system."""

import pytest

from src.dojopool.core.monitoring.metrics_monitor import (
    AlertSeverity,
    GameMetricsMonitor,
)


@pytest.fixture
def monitor():
    """Create a fresh metrics monitor instance for each test."""
    monitor = GameMetricsMonitor()
    monitor._initialize()  # Reset the singleton
    return monitor


def test_singleton_instance():
    """Test that GameMetricsMonitor is a singleton."""
    monitor1 = GameMetricsMonitor()
    monitor2 = GameMetricsMonitor()
    assert monitor1 is monitor2


def test_add_alert(monitor):
    """Test adding alerts."""
    # Add alert
    alert = monitor.add_alert(AlertSeverity.WARNING, "Test alert", {"test": "details"})

    # Verify alert was added
    assert len(monitor.alerts) == 1
    assert monitor.alerts[0] is alert
    assert alert.severity == AlertSeverity.WARNING
    assert alert.message == "Test alert"
    assert alert.details == {"test": "details"}
    assert not alert.acknowledged


def test_acknowledge_alert(monitor):
    """Test acknowledging alerts."""
    # Add and acknowledge alert
    alert = monitor.add_alert(AlertSeverity.INFO, "Test alert")
    success = monitor.acknowledge_alert(alert.id, "user123")

    # Verify acknowledgment
    assert success
    assert alert.acknowledged
    assert alert.acknowledged_by == "user123"
    assert alert.acknowledged_at is not None


def test_get_alerts_with_filter(monitor):
    """Test getting alerts with severity filter."""
    # Add alerts of different severities
    alert1 = monitor.add_alert(AlertSeverity.INFO, "Info alert")
    alert2 = monitor.add_alert(AlertSeverity.WARNING, "Warning alert")
    alert3 = monitor.add_alert(AlertSeverity.ERROR, "Error alert")

    # Get filtered alerts
    info_alerts = monitor.get_alerts(AlertSeverity.INFO)
    warning_alerts = monitor.get_alerts(AlertSeverity.WARNING)
    error_alerts = monitor.get_alerts(AlertSeverity.ERROR)

    # Verify filtering
    assert len(info_alerts) == 1
    assert len(warning_alerts) == 1
    assert len(error_alerts) == 1
    assert info_alerts[0] is alert1
    assert warning_alerts[0] is alert2
    assert error_alerts[0] is alert3


def test_record_game_completion(monitor):
    """Test recording game completions."""
    game_id = "game123"

    # Record completion
    monitor.record_game_completion(game_id, score=100, time=300)

    # Verify metrics
    metrics = monitor.get_metrics(game_id)
    assert metrics.total_games_completed == 1
    assert metrics.average_score == 100
    assert metrics.average_completion_time == 300

    # Record another completion
    monitor.record_game_completion(game_id, score=200, time=400)

    # Verify updated metrics
    metrics = monitor.get_metrics(game_id)
    assert metrics.total_games_completed == 2
    assert metrics.average_score == 150  # (100 + 200) / 2
    assert metrics.average_completion_time == 350  # (300 + 400) / 2


def test_record_error(monitor):
    """Test recording errors."""
    game_id = "game123"

    # Record error
    monitor.record_error(game_id, "test_error", "Test error message", {"detail": "test"})

    # Verify metrics
    metrics = monitor.get_metrics(game_id)
    assert metrics.error_count == 1
    assert metrics.last_error is not None
    assert metrics.last_error["type"] == "test_error"
    assert metrics.last_error["message"] == "Test error message"

    # Verify alert was created
    alerts = monitor.get_alerts(AlertSeverity.ERROR)
    assert len(alerts) == 1
    assert game_id in alerts[0].message
    assert alerts[0].details["error_type"] == "test_error"


def test_error_rate_calculation(monitor):
    """Test error rate calculation over time window."""
    game_id = "game123"

    # Record multiple errors
    for _ in range(5):
        monitor.record_error(game_id, "test_error", "Test error")

    # Verify error rate (5 errors in 5 minutes = 1 error per minute)
    metrics = monitor.get_metrics(game_id)
    assert metrics.error_rate == 1.0


def test_clear_metrics(monitor):
    """Test clearing metrics for a game."""
    game_id = "game123"

    # Add some data
    monitor.record_game_completion(game_id, 100, 300)
    monitor.record_error(game_id, "test_error", "Test error")

    # Clear metrics
    monitor.clear_metrics(game_id)

    # Verify metrics were cleared
    metrics = monitor.get_metrics(game_id)
    assert metrics.total_games_completed == 0
    assert metrics.error_count == 0
    assert metrics.last_error is None
