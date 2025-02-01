"""Tests for the monitoring system."""

import pytest
from datetime import datetime
from unittest.mock import Mock, patch

from dojopool.core.monitoring import MetricsSnapshot, MetricsCollector


@pytest.fixture
def mock_psutil():
    """Mock psutil for testing."""
    with (
        patch("psutil.cpu_percent") as mock_cpu,
        patch("psutil.virtual_memory") as mock_mem,
        patch("psutil.disk_usage") as mock_disk,
        patch("psutil.net_io_counters") as mock_net,
    ):

        # Configure mocks
        mock_cpu.return_value = 50.0

        mock_mem_obj = Mock()
        mock_mem_obj.percent = 60.0
        mock_mem.return_value = mock_mem_obj

        mock_disk_obj = Mock()
        mock_disk_obj.percent = 70.0
        mock_disk.return_value = mock_disk_obj

        mock_net_obj = Mock()
        mock_net_obj.bytes_sent = 1000
        mock_net_obj.bytes_recv = 2000
        mock_net.return_value = mock_net_obj

        yield {"cpu": mock_cpu, "memory": mock_mem, "disk": mock_disk, "net": mock_net}


def test_metrics_snapshot_creation():
    """Test creating a MetricsSnapshot."""
    timestamp = datetime.now()
    snapshot = MetricsSnapshot(
        timestamp=timestamp,
        cpu_usage=50.0,
        memory_usage=60.0,
        disk_usage=70.0,
        network_io={"bytes_sent": 1000.0, "bytes_recv": 2000.0},
    )

    assert snapshot.timestamp == timestamp
    assert snapshot.cpu_usage == 50.0
    assert snapshot.memory_usage == 60.0
    assert snapshot.disk_usage == 70.0
    assert snapshot.network_io["bytes_sent"] == 1000.0
    assert snapshot.network_io["bytes_recv"] == 2000.0
    assert snapshot.gpu_usage is None
    assert snapshot.custom_metrics is None


def test_metrics_snapshot_to_dict():
    """Test converting MetricsSnapshot to dictionary."""
    timestamp = datetime.now()
    snapshot = MetricsSnapshot(
        timestamp=timestamp,
        cpu_usage=50.0,
        memory_usage=60.0,
        disk_usage=70.0,
        network_io={"bytes_sent": 1000.0, "bytes_recv": 2000.0},
        gpu_usage=80.0,
        custom_metrics={"test_metric": 90.0},
    )

    data = snapshot.to_dict()
    assert data["timestamp"] == timestamp.isoformat()
    assert data["cpu_usage"] == 50.0
    assert data["memory_usage"] == 60.0
    assert data["disk_usage"] == 70.0
    assert data["network_io"]["bytes_sent"] == 1000.0
    assert data["network_io"]["bytes_recv"] == 2000.0
    assert data["gpu_usage"] == 80.0
    assert data["custom_metrics"]["test_metric"] == 90.0


def test_metrics_snapshot_from_dict():
    """Test creating MetricsSnapshot from dictionary."""
    timestamp = datetime.now()
    data = {
        "timestamp": timestamp.isoformat(),
        "cpu_usage": 50.0,
        "memory_usage": 60.0,
        "disk_usage": 70.0,
        "network_io": {"bytes_sent": 1000.0, "bytes_recv": 2000.0},
        "gpu_usage": 80.0,
        "custom_metrics": {"test_metric": 90.0},
    }

    snapshot = MetricsSnapshot.from_dict(data)
    assert snapshot.timestamp == timestamp
    assert snapshot.cpu_usage == 50.0
    assert snapshot.memory_usage == 60.0
    assert snapshot.disk_usage == 70.0
    assert snapshot.network_io["bytes_sent"] == 1000.0
    assert snapshot.network_io["bytes_recv"] == 2000.0
    assert snapshot.gpu_usage == 80.0
    assert snapshot.custom_metrics["test_metric"] == 90.0


def test_metrics_collector_basic(mock_psutil):
    """Test basic metrics collection."""
    collector = MetricsCollector()
    snapshot = collector.collect()

    assert snapshot.cpu_usage == 50.0
    assert snapshot.memory_usage == 60.0
    assert snapshot.disk_usage == 70.0
    assert snapshot.network_io["bytes_sent"] == 1000.0
    assert snapshot.network_io["bytes_recv"] == 2000.0


@patch("GPUtil.getGPUs")
def test_metrics_collector_with_gpu(mock_gputil, mock_psutil):
    """Test metrics collection with GPU."""
    mock_gpu = Mock()
    mock_gpu.load = 0.8
    mock_gputil.return_value = [mock_gpu]

    collector = MetricsCollector()
    snapshot = collector.collect_with_gpu()

    assert snapshot.gpu_usage == 80.0  # 0.8 * 100


def test_metrics_collector_without_gpu(mock_psutil):
    """Test metrics collection without GPU."""
    with patch.dict("sys.modules", {"GPUtil": None}):
        collector = MetricsCollector()
        snapshot = collector.collect_with_gpu()
        assert snapshot.gpu_usage is None
