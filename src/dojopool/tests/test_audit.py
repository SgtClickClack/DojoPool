"""Tests for audit logging system."""

import json
import os
from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from dojopool.core.venue.audit import AuditEventType, AuditLogger


@pytest.fixture
def test_log_dir(tmpdir):
    """Create a temporary directory for test logs."""
    log_dir = os.path.join(str(tmpdir), "audit")
    os.makedirs(log_dir)
    return log_dir


@pytest.fixture
def audit_logger(test_log_dir):
    """Create a test instance of AuditLogger."""
    logger = AuditLogger(log_dir=test_log_dir, retention_days=7, max_file_size_mb=1)
    # Stop the cleanup thread for testing
    logger._stop_cleanup = True
    logger._cleanup_thread.join()
    return logger


def test_basic_logging(audit_logger):
    """Test basic event logging."""
    # Log test event
    audit_logger.log_event(
        event_type=AuditEventType.QR_GENERATE,
        user_id="test_user",
        ip_address="127.0.0.1",
        resource_id="qr123",
        action="generate",
        status="success",
        details={"size": 10},
        venue_id="venue1",
        table_id="table1",
    )

    # Get events
    events = audit_logger.get_events()
    assert len(events) == 1

    event = events[0]
    assert event["event_type"] == AuditEventType.QR_GENERATE.value
    assert event["user_id"] == "test_user"
    assert event["ip_address"] == "127.0.0.1"
    assert event["resource_id"] == "qr123"
    assert event["venue_id"] == "venue1"
    assert event["table_id"] == "table1"
    assert event["details"] == {"size": 10}


def test_event_filtering(audit_logger):
    """Test event filtering functionality."""
    # Log multiple events
    audit_logger.log_event(
        event_type=AuditEventType.QR_GENERATE,
        user_id="user1",
        ip_address="1.1.1.1",
        resource_id="qr1",
        action="generate",
        status="success",
        details={},
        venue_id="venue1",
    )

    audit_logger.log_event(
        event_type=AuditEventType.QR_VERIFY,
        user_id="user2",
        ip_address="2.2.2.2",
        resource_id="qr2",
        action="verify",
        status="failure",
        details={},
        venue_id="venue2",
    )

    # Test event type filter
    events = audit_logger.get_events(event_type=AuditEventType.QR_GENERATE)
    assert len(events) == 1
    assert events[0]["event_type"] == AuditEventType.QR_GENERATE.value

    # Test user filter
    events = audit_logger.get_events(user_id="user1")
    assert len(events) == 1
    assert events[0]["user_id"] == "user1"

    # Test venue filter
    events = audit_logger.get_events(venue_id="venue2")
    assert len(events) == 1
    assert events[0]["venue_id"] == "venue2"

    # Test status filter
    events = audit_logger.get_events(status="failure")
    assert len(events) == 1
    assert events[0]["status"] == "failure"


def test_time_range_filtering(audit_logger):
    """Test time range filtering."""
    # Log events with different timestamps
    with patch("datetime.datetime") as mock_datetime:
        # First event (1 hour ago)
        mock_datetime.utcnow.return_value = datetime.utcnow() - timedelta(hours=1)
        audit_logger.log_event(
            event_type=AuditEventType.QR_GENERATE,
            user_id="user1",
            ip_address="1.1.1.1",
            resource_id="qr1",
            action="generate",
            status="success",
            details={},
        )

        # Second event (current)
        mock_datetime.utcnow.return_value = datetime.utcnow()
        audit_logger.log_event(
            event_type=AuditEventType.QR_VERIFY,
            user_id="user2",
            ip_address="2.2.2.2",
            resource_id="qr2",
            action="verify",
            status="success",
            details={},
        )

    # Test time range filter
    start_time = datetime.utcnow() - timedelta(minutes=30)
    events = audit_logger.get_events(start_time=start_time)
    assert len(events) == 1
    assert events[0]["event_type"] == AuditEventType.QR_VERIFY.value


def test_file_rotation(audit_logger):
    """Test log file rotation."""
    # Generate large events to trigger size-based rotation
    large_details = {"data": "x" * 1000}  # 1KB of data

    for _ in range(10):  # Should exceed 1MB limit
        audit_logger.log_event(
            event_type=AuditEventType.QR_GENERATE,
            user_id="test_user",
            ip_address="1.1.1.1",
            resource_id="qr1",
            action="generate",
            status="success",
            details=large_details,
        )

    # Verify multiple log files were created
    log_files = os.listdir(audit_logger.log_dir)
    assert len(log_files) > 1

    # Verify all events are still accessible
    events = audit_logger.get_events()
    assert len(events) == 10


def test_date_based_rotation(audit_logger):
    """Test date-based log rotation."""
    # Log event for yesterday
    with patch("datetime.datetime") as mock_datetime:
        yesterday = datetime.utcnow() - timedelta(days=1)
        mock_datetime.utcnow.return_value = yesterday

        audit_logger.log_event(
            event_type=AuditEventType.QR_GENERATE,
            user_id="test_user",
            ip_address="1.1.1.1",
            resource_id="qr1",
            action="generate",
            status="success",
            details={},
        )

        # Force rotation check
        audit_logger._check_rotation()

    # Log event for today
    audit_logger.log_event(
        event_type=AuditEventType.QR_VERIFY,
        user_id="test_user",
        ip_address="1.1.1.1",
        resource_id="qr2",
        action="verify",
        status="success",
        details={},
    )

    # Verify both log files exist
    log_files = os.listdir(audit_logger.log_dir)
    assert len(log_files) == 2

    # Verify all events are accessible
    events = audit_logger.get_events()
    assert len(events) == 2


def test_export_json(audit_logger):
    """Test JSON export functionality."""
    # Log test events
    audit_logger.log_event(
        event_type=AuditEventType.QR_GENERATE,
        user_id="user1",
        ip_address="1.1.1.1",
        resource_id="qr1",
        action="generate",
        status="success",
        details={"size": 10},
    )

    # Export to JSON
    json_data = audit_logger.export_events(format="json")
    assert json_data is not None

    # Parse and verify
    data = json.loads(json_data.decode())
    assert "generated_at" in data
    assert "events" in data
    assert len(data["events"]) == 1
    assert data["events"][0]["user_id"] == "user1"


def test_export_csv(audit_logger):
    """Test CSV export functionality."""
    # Log test events
    audit_logger.log_event(
        event_type=AuditEventType.QR_GENERATE,
        user_id="user1",
        ip_address="1.1.1.1",
        resource_id="qr1",
        action="generate",
        status="success",
        details={"size": 10},
    )

    # Export to CSV
    csv_data = audit_logger.export_events(format="csv")
    assert csv_data is not None

    # Verify CSV content
    lines = csv_data.decode().strip().split("\n")
    assert len(lines) == 2  # Header + 1 event
    assert "Timestamp,Event Type,User ID" in lines[0]
    assert "user1" in lines[1]


def test_cleanup_old_logs(audit_logger):
    """Test cleanup of old log files."""
    # Create old log files
    old_date = datetime.utcnow().date() - timedelta(days=30)
    old_file = os.path.join(audit_logger.log_dir, f"audit_{old_date.isoformat()}.log")
    with open(old_file, "w") as f:
        f.write("test")

    # Run cleanup
    audit_logger._cleanup_old_logs()

    # Verify old file was removed
    assert not os.path.exists(old_file)


def test_concurrent_logging(audit_logger):
    """Test concurrent event logging."""
    import threading

    def log_events():
        for i in range(10):
            audit_logger.log_event(
                event_type=AuditEventType.QR_GENERATE,
                user_id=f"user{i}",
                ip_address="1.1.1.1",
                resource_id=f"qr{i}",
                action="generate",
                status="success",
                details={},
            )

    # Create multiple threads
    threads = [threading.Thread(target=log_events) for _ in range(5)]

    # Start threads
    for thread in threads:
        thread.start()

    # Wait for completion
    for thread in threads:
        thread.join()

    # Verify all events were logged
    events = audit_logger.get_events()
    assert len(events) == 50  # 5 threads * 10 events


def test_invalid_log_file(audit_logger):
    """Test handling of invalid log files."""
    # Create invalid log file
    invalid_file = os.path.join(audit_logger.log_dir, "audit_invalid.log")
    with open(invalid_file, "w") as f:
        f.write('invalid json\n{"valid": "json"}\n')

    # Attempt to read events
    events = audit_logger.get_events()

    # Should only get valid JSON entries
    assert len(events) == 1
    assert events[0]["valid"] == "json"
