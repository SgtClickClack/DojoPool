"""
Integration tests for the threat detection system.
Tests the interaction between security monitor and threat detection.
"""

import time

import pytest
import redis

from dojopool.core.monitoring.security_monitor import (
    SecurityEventType,
    SecurityMonitor,
    SecuritySeverity,
)
from dojopool.core.security import security_config as config
from dojopool.core.security.threat_detection import ThreatDetector


class MockRequest:
    """Mock Flask request for testing."""

    def __init__(
        self,
        path: str,
        method: str,
        remote_addr: str,
        headers: dict = None,
        json_data: dict = None,
    ):
        self.path = path
        self.method = method
        self.remote_addr = remote_addr
        self.headers = headers or {}
        self._json = json_data
        self.args = {}

    def get_json(self):
        return self._json


@pytest.fixture
def redis_client():
    """Create Redis client for testing."""
    return redis.Redis(
        host=config.REDIS_HOST,
        port=config.REDIS_PORT,
        db=15,  # Use separate DB for testing
    )


@pytest.fixture
def threat_detector(redis_client):
    """Create threat detector instance."""
    detector = ThreatDetector(redis_client=redis_client)
    return detector


@pytest.fixture
def security_monitor():
    """Create security monitor instance."""
    return SecurityMonitor()


def test_full_threat_detection_cycle(threat_detector, security_monitor, redis_client):
    """Test complete threat detection cycle with security monitor."""
    # Create suspicious request
    request = MockRequest(
        path="/api/users",
        method="POST",
        remote_addr="192.168.1.100",
        json_data={"query": "SELECT * FROM users;"},
    )

    # Monitor request
    security_event = security_monitor.monitor_request(request)
    assert security_event is not None
    assert security_event.event_type == SecurityEventType.INJECTION_ATTEMPT

    # Detect threats
    threat = threat_detector.detect_threats(security_event)
    assert threat is not None
    assert threat.threat_type == "SQL_INJECTION"
    assert threat.severity == SecuritySeverity.HIGH.value

    # Verify Redis storage
    threat_key = f"threat:{threat.source_ip}"
    stored_threat = redis_client.get(threat_key)
    assert stored_threat is not None

    # Verify IP blocking
    block_key = f"blocked_ip:{threat.source_ip}"
    assert redis_client.exists(block_key)


def test_rate_limiting_integration(security_monitor, redis_client):
    """Test rate limiting integration with Redis."""
    ip = "192.168.1.101"

    # Simulate multiple requests
    for _ in range(config.RATE_LIMITS["api"]["requests_per_minute"] + 1):
        request = MockRequest(path="/api/data", method="GET", remote_addr=ip)
        event = security_monitor.monitor_request(request)
        if event:
            assert event.event_type == SecurityEventType.RATE_LIMIT_EXCEEDED
            break

    # Verify rate limit data in Redis
    rate_key = f"rate_limit:{ip}"
    assert redis_client.exists(rate_key)


def test_threat_pattern_detection(threat_detector, security_monitor):
    """Test threat pattern detection integration."""
    # Test different threat patterns
    patterns = [
        # SQL Injection
        {
            "path": "/api/query",
            "method": "POST",
            "json_data": {"query": "UNION SELECT * FROM users"},
        },
        # XSS Attempt
        {
            "path": "/api/comment",
            "method": "POST",
            "json_data": {"content": "<script>alert('xss')</script>"},
        },
        # Path Traversal
        {"path": "/api/file/../../../etc/passwd", "method": "GET", "json_data": None},
    ]

    for pattern in patterns:
        request = MockRequest(
            path=pattern["path"],
            method=pattern["method"],
            remote_addr="192.168.1.102",
            json_data=pattern["json_data"],
        )

        security_event = security_monitor.monitor_request(request)
        assert security_event is not None

        threat = threat_detector.detect_threats(security_event)
        assert threat is not None
        assert threat.confidence >= 0.7


def test_anomaly_detection_integration(threat_detector, security_monitor, redis_client):
    """Test anomaly detection with historical data."""
    ip = "192.168.1.103"

    # Simulate normal behavior
    for _ in range(5):
        request = MockRequest(path="/api/data", method="GET", remote_addr=ip)
        security_monitor.monitor_request(request)

    # Simulate anomalous behavior
    for _ in range(50):  # Sudden burst of requests
        request = MockRequest(
            path="/api/admin",
            method="POST",
            remote_addr=ip,
            json_data={"action": "delete"},
        )
        event = security_monitor.monitor_request(request)
        if event:
            threat = threat_detector.detect_threats(event)
            if threat:
                assert threat.threat_type == "ANOMALOUS_BEHAVIOR"
                assert threat.anomaly_score > config.ANOMALY_THRESHOLD
                break


def test_recovery_from_block(threat_detector, security_monitor, redis_client):
    """Test IP block recovery process."""
    ip = "192.168.1.104"

    # Create high-severity threat
    request = MockRequest(
        path="/api/users",
        method="POST",
        remote_addr=ip,
        json_data={"query": "DROP TABLE users;"},
    )

    # Get blocked
    event = security_monitor.monitor_request(request)
    threat = threat_detector.detect_threats(event)
    assert threat is not None
    assert threat.automated_response == "BLOCK_IP"

    # Verify block
    block_key = f"blocked_ip:{ip}"
    assert redis_client.exists(block_key)

    # Wait for block to expire
    time.sleep(1)  # Reduced for testing
    redis_client.delete(block_key)

    # Try normal request
    normal_request = MockRequest(path="/api/data", method="GET", remote_addr=ip)
    event = security_monitor.monitor_request(normal_request)
    assert event is None


def test_threat_metrics_integration(threat_detector, security_monitor, redis_client):
    """Test threat detection metrics integration."""
    ip = "192.168.1.105"

    # Create security event
    request = MockRequest(
        path="/api/users",
        method="POST",
        remote_addr=ip,
        json_data={"query": "SELECT * FROM users;"},
    )

    event = security_monitor.monitor_request(request)
    threat = threat_detector.detect_threats(event)

    # Verify metrics in Redis
    assert redis_client.exists(f"threat_count:{ip}")
    assert redis_client.exists(f"anomaly_score:{ip}")

    # Verify threat response time
    assert redis_client.exists(f"threat_response_time:{threat.threat_type}")


def test_cleanup_after_tests(redis_client):
    """Clean up test data from Redis."""
    redis_client.flushdb()  # Clean test database
