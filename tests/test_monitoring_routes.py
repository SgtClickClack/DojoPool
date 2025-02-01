"""Tests for monitoring routes."""

import json
from datetime import datetime
from unittest.mock import patch

import pytest

from src.dojopool.core.monitoring.metrics_monitor import (
    Alert,
    AlertSeverity,
    GameMetrics,
    GameMetricsMonitor,
)


@pytest.fixture
def app():
    """Create test app."""
    from src.dojopool.app import create_app

    app = create_app("testing")
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Create auth headers for testing."""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
def mock_metrics():
    """Create mock metrics data."""
    return GameMetrics(
        active_players=5,
        active_games=2,
        total_games_completed=10,
        completion_rate=0.8,
        average_completion_time=300.0,
        average_score=85.5,
        player_retention=0.75,
        error_count=2,
        warning_count=1,
        error_rate=0.1,
    )


@pytest.fixture
def mock_alert():
    """Create mock alert data."""
    return Alert(
        id="test-alert-1",
        severity=AlertSeverity.WARNING,
        message="Test alert",
        timestamp=datetime.utcnow(),
        details={"test": "details"},
    )


def test_get_game_metrics(client, auth_headers, mock_metrics):
    """Test getting game metrics."""
    with patch.object(GameMetricsMonitor, "get_metrics", return_value=mock_metrics):
        response = client.get("/api/monitoring/metrics/game123", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        metrics = data["data"]
        assert metrics["active_players"] == 5
        assert metrics["active_games"] == 2
        assert metrics["total_games_completed"] == 10
        assert metrics["completion_rate"] == 0.8
        assert metrics["average_score"] == 85.5


def test_get_game_metrics_error(client, auth_headers):
    """Test error handling when getting metrics."""
    with patch.object(GameMetricsMonitor, "get_metrics", side_effect=Exception("Test error")):
        response = client.get("/api/monitoring/metrics/game123", headers=auth_headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert not data["success"]
        assert "Test error" in data["error"]


def test_get_alerts(client, auth_headers, mock_alert):
    """Test getting alerts."""
    with patch.object(GameMetricsMonitor, "get_alerts", return_value=[mock_alert]):
        response = client.get("/api/monitoring/alerts", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        alerts = data["data"]
        assert len(alerts) == 1
        assert alerts[0]["id"] == "test-alert-1"
        assert alerts[0]["severity"] == "warning"
        assert alerts[0]["message"] == "Test alert"


def test_get_alerts_with_severity(client, auth_headers, mock_alert):
    """Test getting alerts filtered by severity."""
    with patch.object(GameMetricsMonitor, "get_alerts", return_value=[mock_alert]):
        response = client.get("/api/monitoring/alerts?severity=warning", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        alerts = data["data"]
        assert len(alerts) == 1
        assert alerts[0]["severity"] == "warning"


def test_acknowledge_alert(client, auth_headers):
    """Test acknowledging an alert."""
    with patch.object(GameMetricsMonitor, "acknowledge_alert", return_value=True):
        response = client.post(
            "/api/monitoring/alerts/test-alert-1/acknowledge",
            headers=auth_headers,
            json={"user_id": "user123"},
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        assert data["message"] == "Alert acknowledged"


def test_acknowledge_alert_missing_user(client, auth_headers):
    """Test error handling when acknowledging alert without user ID."""
    response = client.post(
        "/api/monitoring/alerts/test-alert-1/acknowledge", headers=auth_headers, json={}
    )

    assert response.status_code == 400
    data = json.loads(response.data)
    assert not data["success"]
    assert "user_id is required" in data["error"]


def test_record_game_completion(client, auth_headers):
    """Test recording game completion."""
    with patch.object(GameMetricsMonitor, "record_game_completion"):
        response = client.post(
            "/api/monitoring/metrics/game123/record-completion",
            headers=auth_headers,
            json={"score": 100, "time": 300},
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        assert data["message"] == "Game completion recorded"


def test_record_game_completion_missing_data(client, auth_headers):
    """Test error handling when recording completion with missing data."""
    response = client.post(
        "/api/monitoring/metrics/game123/record-completion",
        headers=auth_headers,
        json={"score": 100},  # Missing time
    )

    assert response.status_code == 400
    data = json.loads(response.data)
    assert not data["success"]
    assert "score and time are required" in data["error"]


def test_record_error(client, auth_headers):
    """Test recording an error."""
    with patch.object(GameMetricsMonitor, "record_error"):
        response = client.post(
            "/api/monitoring/metrics/game123/record-error",
            headers=auth_headers,
            json={
                "type": "validation_error",
                "message": "Invalid move",
                "details": {"move": "illegal"},
            },
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"]
        assert data["message"] == "Error recorded"


def test_record_error_missing_data(client, auth_headers):
    """Test error handling when recording error with missing data."""
    response = client.post(
        "/api/monitoring/metrics/game123/record-error",
        headers=auth_headers,
        json={"type": "validation_error"},  # Missing message
    )

    assert response.status_code == 400
    data = json.loads(response.data)
    assert not data["success"]
    assert "type and message are required" in data["error"]
