from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from dojopool.core.venue.qr_alerts import (
    Alert,
    AlertConfig,
    AlertSeverity,
    AlertType,
    QRAlertManager,
)


@pytest.fixture
def alert_manager():
    """Create a test instance of QRAlertManager."""
    manager = QRAlertManager()
    # Stop the monitoring thread for testing
    manager._stop_monitoring = True
    manager._monitor_thread.join()
    return manager


@pytest.fixture
def mock_stats():
    """Create mock statistics for testing."""
    return {
        "total_scans": 100,
        "successful_scans": 80,
        "failed_scans": 20,
        "success_rate": 0.8,
        "avg_scan_duration": 2.5,
        "error_types": {"expired": 10, "invalid_signature": 5, "malformed": 5},
    }


def test_alert_creation(alert_manager):
    """Test basic alert creation."""
    alert_manager._create_alert(
        AlertType.HIGH_ERROR_RATE,
        "Test alert",
        venue_id="test_venue",
        details={"error_rate": 0.3},
    )

    assert len(alert_manager.alerts) == 1
    alert = alert_manager.alerts[0]
    assert alert.type == AlertType.HIGH_ERROR_RATE
    assert alert.message == "Test alert"
    assert alert.venue_id == "test_venue"
    assert alert.details == {"error_rate": 0.3}
    assert not alert.acknowledged


def test_alert_acknowledgment(alert_manager):
    """Test alert acknowledgment."""
    # Create test alert
    alert_manager._create_alert(AlertType.HIGH_ERROR_RATE, "Test alert")

    # Acknowledge alert
    result = alert_manager.acknowledge_alert(0, "test_user")
    assert result is True

    alert = alert_manager.alerts[0]
    assert alert.acknowledged
    assert alert.acknowledged_by == "test_user"
    assert isinstance(alert.acknowledged_at, datetime)


def test_alert_filtering(alert_manager):
    """Test alert filtering functionality."""
    # Create test alerts
    alert_manager._create_alert(
        AlertType.HIGH_ERROR_RATE,
        "Error alert",
        venue_id="venue1",
        severity=AlertSeverity.ERROR,
    )
    alert_manager._create_alert(
        AlertType.SLOW_SCAN_TIME,
        "Warning alert",
        venue_id="venue2",
        severity=AlertSeverity.WARNING,
    )

    # Test venue filtering
    venue1_alerts = alert_manager.get_alerts(venue_id="venue1")
    assert len(venue1_alerts) == 1
    assert venue1_alerts[0].venue_id == "venue1"

    # Test severity filtering
    error_alerts = alert_manager.get_alerts(severity=AlertSeverity.ERROR)
    assert len(error_alerts) == 1
    assert error_alerts[0].severity == AlertSeverity.ERROR

    # Test acknowledged filtering
    alert_manager.acknowledge_alert(0, "test_user")
    active_alerts = alert_manager.get_alerts(include_acknowledged=False)
    assert len(active_alerts) == 1
    assert not active_alerts[0].acknowledged


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_high_error_rate_detection(mock_qr_stats, alert_manager, mock_stats):
    """Test detection of high error rates."""
    # Configure mock
    mock_stats_with_high_errors = mock_stats.copy()
    mock_stats_with_high_errors.update(
        {"total_scans": 100, "failed_scans": 30}
    )  # 30% error rate
    mock_qr_stats.get_venue_stats.return_value = mock_stats_with_high_errors
    mock_qr_stats.venue_stats = {"test_venue": {}}

    # Run alert check
    alert_manager._check_alerts()

    # Verify alert was created
    assert len(alert_manager.alerts) == 1
    alert = alert_manager.alerts[0]
    assert alert.type == AlertType.HIGH_ERROR_RATE
    assert alert.severity == AlertSeverity.ERROR


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_slow_scan_time_detection(mock_qr_stats, alert_manager, mock_stats):
    """Test detection of slow scan times."""
    # Configure mock
    mock_stats_with_slow_scans = mock_stats.copy()
    mock_stats_with_slow_scans["avg_scan_duration"] = 6.0  # 6 seconds
    mock_qr_stats.get_venue_stats.return_value = mock_stats_with_slow_scans
    mock_qr_stats.venue_stats = {"test_venue": {}}

    # Run alert check
    alert_manager._check_alerts()

    # Verify alert was created
    assert len(alert_manager.alerts) == 1
    alert = alert_manager.alerts[0]
    assert alert.type == AlertType.SLOW_SCAN_TIME
    assert alert.severity == AlertSeverity.WARNING


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_repeated_errors_detection(mock_qr_stats, alert_manager):
    """Test detection of repeated errors."""
    # Configure mock
    mock_error_report = {
        "total_errors": 5,
        "errors": [
            {
                "error_type": "expired",
                "timestamp": (datetime.utcnow() - timedelta(minutes=1)).isoformat(),
                "venue_id": "test_venue",
            }
        ]
        * 5,  # 5 identical errors
    }
    mock_qr_stats.get_error_report.return_value = mock_error_report
    mock_qr_stats.venue_stats = {"test_venue": {}}

    # Run alert check
    alert_manager._check_alerts()

    # Verify alert was created
    assert len(alert_manager.alerts) == 1
    alert = alert_manager.alerts[0]
    assert alert.type == AlertType.REPEATED_ERRORS
    assert alert.severity == AlertSeverity.ERROR


def test_alert_notification(alert_manager):
    """Test alert notification handlers."""
    # Create mock handler
    mock_handler = Mock()
    alert_manager.register_handler("email", mock_handler)

    # Create alert
    alert_manager._create_alert(AlertType.HIGH_ERROR_RATE, "Test alert")

    # Verify handler was called
    mock_handler.assert_called_once()
    alert_arg = mock_handler.call_args[0][0]
    assert isinstance(alert_arg, Alert)
    assert alert_arg.type == AlertType.HIGH_ERROR_RATE


def test_alert_configuration(alert_manager):
    """Test alert configuration updates."""
    # Update configuration
    new_config = AlertConfig(
        enabled=True,
        severity=AlertSeverity.CRITICAL,
        threshold=0.5,
        cooldown=600,
        notify_channels=["email", "slack"],
    )
    alert_manager.configure_alert(AlertType.HIGH_ERROR_RATE, new_config)

    # Verify configuration
    config = alert_manager.alert_configs[AlertType.HIGH_ERROR_RATE]
    assert config.severity == AlertSeverity.CRITICAL
    assert config.threshold == 0.5
    assert config.cooldown == 600
    assert config.notify_channels == ["email", "slack"]


def test_alert_cooldown(alert_manager):
    """Test alert cooldown period."""
    # Create initial alert
    alert_manager._create_alert(
        AlertType.HIGH_ERROR_RATE, "Test alert", venue_id="test_venue"
    )

    # Attempt to create duplicate alert
    alert_manager._create_alert(
        AlertType.HIGH_ERROR_RATE, "Test alert", venue_id="test_venue"
    )

    # Verify only one alert was created
    assert len(alert_manager.alerts) == 1


def test_invalid_alert_acknowledgment(alert_manager):
    """Test invalid alert acknowledgment attempts."""
    # Test invalid alert ID
    result = alert_manager.acknowledge_alert(999, "test_user")
    assert result is False

    # Create and acknowledge alert
    alert_manager._create_alert(AlertType.HIGH_ERROR_RATE, "Test alert")
    alert_manager.acknowledge_alert(0, "test_user")

    # Test acknowledging already acknowledged alert
    result = alert_manager.acknowledge_alert(0, "test_user")
    assert result is False
