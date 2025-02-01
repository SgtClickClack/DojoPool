"""Tests for performance monitoring system."""

from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest

from src.dojopool.core.monitoring.metrics_monitor import AlertSeverity
from src.dojopool.core.monitoring.performance import PerformanceMetrics, PerformanceMonitor


@pytest.fixture
def monitor():
    """Create test monitor instance."""
    monitor = PerformanceMonitor(interval=1)
    monitor.start()
    yield monitor
    monitor.stop()


@pytest.fixture
def mock_psutil():
    """Create mock psutil data."""
    cpu = MagicMock()
    cpu.return_value = 50.0

    memory = MagicMock()
    memory.percent = 60.0
    memory.available = 8 * 1024 * 1024 * 1024  # 8 GB

    disk = MagicMock()
    disk.percent = 70.0

    network = MagicMock()
    network.bytes_sent = 1024 * 1024 * 100  # 100 MB
    network.bytes_recv = 1024 * 1024 * 200  # 200 MB

    with (
        patch("psutil.cpu_percent", cpu),
        patch("psutil.virtual_memory", return_value=memory),
        patch("psutil.disk_usage", return_value=disk),
        patch("psutil.net_io_counters", return_value=network),
        patch("psutil.pids", return_value=range(100)),
    ):
        yield


def test_collect_metrics(monitor, mock_psutil):
    """Test collecting performance metrics."""
    metrics = monitor._collect_metrics()

    assert isinstance(metrics, PerformanceMetrics)
    assert metrics.cpu_usage == 50.0
    assert metrics.memory_usage == 60.0
    assert metrics.memory_available == 8.0  # GB
    assert metrics.disk_usage == 70.0
    assert metrics.network_sent == 100.0  # MB
    assert metrics.network_received == 200.0  # MB
    assert metrics.process_count == 100


def test_metrics_history(monitor, mock_psutil):
    """Test metrics history management."""
    # Collect some metrics
    for _ in range(5):
        monitor._process_metrics(monitor._collect_metrics())

    assert len(monitor.metrics_history) == 5

    # Test history size limit
    original_max = monitor.max_history_size
    monitor.max_history_size = 3
    monitor._process_metrics(monitor._collect_metrics())

    assert len(monitor.metrics_history) == 3
    monitor.max_history_size = original_max


def test_alert_thresholds(monitor):
    """Test alert threshold management."""
    # Set custom threshold
    monitor.set_alert_threshold("cpu_usage", 90.0)
    assert monitor.alert_thresholds["cpu_usage"] == 90.0

    # Test invalid metric
    monitor.set_alert_threshold("invalid_metric", 50.0)
    assert "invalid_metric" not in monitor.alert_thresholds


@patch("src.dojopool.core.monitoring.metrics_monitor.metrics_monitor.add_alert")
def test_threshold_alerts(mock_add_alert, monitor, mock_psutil):
    """Test threshold-based alerting."""
    # Set low thresholds to trigger alerts
    monitor.alert_thresholds.update({"cpu_usage": 40.0, "memory_usage": 50.0, "disk_usage": 60.0})

    monitor._process_metrics(monitor._collect_metrics())

    # Should trigger all three alerts
    assert mock_add_alert.call_count == 3

    # Verify alert types
    alerts = [call.args for call in mock_add_alert.call_args_list]
    alert_types = [args[0] for args, _ in alerts]
    assert all(t == AlertSeverity.WARNING for t in alert_types)


def test_get_metrics_filtering(monitor, mock_psutil):
    """Test getting metrics with time filters."""
    base_time = datetime.utcnow()

    # Create metrics at different times
    for i in range(5):
        metrics = monitor._collect_metrics()
        metrics.timestamp = base_time + timedelta(minutes=i)
        monitor._process_metrics(metrics)

    # Test time range filtering
    start_time = base_time + timedelta(minutes=1)
    end_time = base_time + timedelta(minutes=3)

    filtered = monitor.get_metrics(start_time, end_time)
    assert len(filtered) == 3

    # Verify timestamps are within range
    for metrics in filtered:
        assert start_time <= metrics.timestamp <= end_time


def test_metrics_callback(monitor, mock_psutil):
    """Test metrics update callback."""
    callback_called = False
    callback_metrics = None

    def on_update(metrics):
        nonlocal callback_called, callback_metrics
        callback_called = True
        callback_metrics = metrics

    monitor.on_metrics_update = on_update
    monitor._process_metrics(monitor._collect_metrics())

    assert callback_called
    assert isinstance(callback_metrics, PerformanceMetrics)


def test_error_handling(monitor):
    """Test error handling in monitoring loop."""
    with (
        patch(
            "src.dojopool.core.monitoring.metrics_monitor.metrics_monitor.add_alert"
        ) as mock_add_alert,
        patch.object(monitor, "_collect_metrics", side_effect=Exception("Test error")),
    ):

        monitor._monitor_loop()

        mock_add_alert.assert_called_once()
        args = mock_add_alert.call_args[0]
        assert args[0] == AlertSeverity.ERROR
        assert "Performance monitoring error" in args[1]
