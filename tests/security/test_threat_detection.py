"""
Unit tests for the threat detection system.
"""

from datetime import datetime
from unittest.mock import Mock, patch

import numpy as np
import pytest
import redis

from dojopool.core.monitoring.security_monitor import (
    SecurityEvent,
    SecurityEventType,
    SecuritySeverity,
)
from dojopool.core.security.threat_detection import ThreatDetector, ThreatEvent


@pytest.fixture
def redis_mock():
    return Mock(spec=redis.Redis)


@pytest.fixture
def threat_detector(redis_mock):
    with patch("dojopool.core.security.threat_detection.joblib.load") as mock_load:
        # Mock the model
        mock_model = Mock()
        mock_model.score_samples.return_value = np.array([0.5])
        mock_load.return_value = mock_model

        detector = ThreatDetector(redis_client=redis_mock)
        detector.model = mock_model
        return detector


@pytest.fixture
def sample_security_event():
    return SecurityEvent(
        timestamp=datetime.now(),
        event_type=SecurityEventType.SUSPICIOUS_REQUEST,
        severity=SecuritySeverity.MEDIUM,
        source_ip="192.168.1.100",
        details={
            "path": "/api/users",
            "method": "POST",
            "payload": {"username": "test"},
        },
    )


def test_threat_detector_initialization(threat_detector):
    """Test threat detector initialization."""
    assert threat_detector is not None
    assert threat_detector.model is not None
    assert threat_detector.redis is not None


def test_feature_extraction(threat_detector, sample_security_event):
    """Test feature extraction from security event."""
    features = threat_detector.extract_features(sample_security_event)
    assert isinstance(features, np.ndarray)
    assert features.shape == (1, 8)  # Expected feature count


def test_threat_detection_normal_behavior(
    threat_detector, sample_security_event, redis_mock
):
    """Test threat detection with normal behavior."""
    # Mock normal behavior scores
    threat_detector.model.score_samples.return_value = np.array([0.9])

    # Mock Redis data
    redis_mock.get.return_value = "5"  # Mock request count

    threat = threat_detector.detect_threats(sample_security_event)
    assert threat is None


def test_threat_detection_anomalous_behavior(
    threat_detector, sample_security_event, redis_mock
):
    """Test threat detection with anomalous behavior."""
    # Mock anomalous behavior scores
    threat_detector.model.score_samples.return_value = np.array([-0.9])

    # Mock Redis data
    redis_mock.get.return_value = "100"  # High request count

    threat = threat_detector.detect_threats(sample_security_event)
    assert isinstance(threat, ThreatEvent)
    assert threat.threat_type == "ANOMALOUS_BEHAVIOR"
    assert threat.severity == SecuritySeverity.HIGH.value


def test_pattern_matching(threat_detector, sample_security_event):
    """Test threat pattern matching."""
    # Create a security event with SQL injection pattern
    sql_event = SecurityEvent(
        timestamp=datetime.now(),
        event_type=SecurityEventType.SUSPICIOUS_REQUEST,
        severity=SecuritySeverity.HIGH,
        source_ip="192.168.1.100",
        details={
            "path": "/api/users",
            "method": "POST",
            "payload": {"query": "SELECT * FROM users;"},
        },
    )

    pattern_match = threat_detector._check_threat_patterns(sql_event)
    assert pattern_match is not None
    assert pattern_match["pattern_name"] == "SQL_INJECTION"
    assert pattern_match["confidence"] >= 0.8


def test_threat_handling(threat_detector, sample_security_event, redis_mock):
    """Test threat handling and response."""
    threat = ThreatEvent(
        timestamp=datetime.now(),
        threat_type="BRUTE_FORCE",
        severity=SecuritySeverity.HIGH.value,
        source_ip="192.168.1.100",
        details={},
        anomaly_score=0.95,
        confidence=0.9,
        automated_response="BLOCK_IP",
    )

    threat_detector._handle_threat(threat)

    # Verify Redis calls
    redis_mock.setex.assert_called()
    assert "blocked_ip:192.168.1.100" in str(redis_mock.setex.call_args)


def test_automated_response_determination(threat_detector):
    """Test automated response determination based on severity."""
    high_response = threat_detector._determine_response(SecuritySeverity.HIGH.value)
    assert high_response == "BLOCK_IP"

    medium_response = threat_detector._determine_response(SecuritySeverity.MEDIUM.value)
    assert medium_response == "INCREASE_MONITORING"

    low_response = threat_detector._determine_response(SecuritySeverity.LOW.value)
    assert low_response == "LOG_ONLY"


def test_feature_helper_methods(threat_detector, redis_mock):
    """Test feature extraction helper methods."""
    ip = "192.168.1.100"

    # Test request count
    redis_mock.get.return_value = "10"
    assert threat_detector._get_request_count(ip) == 10

    # Test error rate
    redis_mock.get.side_effect = ["5", "20"]  # errors, requests
    assert threat_detector._get_error_rate(ip) == 0.25

    # Test location risk
    redis_mock.get.return_value = "0.8"
    assert threat_detector._get_location_risk(ip) == 0.8


def test_model_retraining(threat_detector):
    """Test model retraining functionality."""
    with patch("numpy.load") as mock_load:
        # Mock training data
        mock_load.return_value = np.array([[1, 2, 3], [4, 5, 6]])

        threat_detector._train_initial_model()
        assert threat_detector.model is not None


def test_threat_event_creation(threat_detector, sample_security_event):
    """Test threat event creation with different scenarios."""
    # Test high severity threat
    threat = threat_detector._create_threat_event(
        sample_security_event,
        anomaly_score=0.95,
        pattern_match={"pattern_name": "SQL_INJECTION", "confidence": 0.9},
    )
    assert threat.severity == SecuritySeverity.HIGH.value
    assert threat.automated_response == "BLOCK_IP"

    # Test medium severity threat
    threat = threat_detector._create_threat_event(
        sample_security_event, anomaly_score=0.75, pattern_match=None
    )
    assert threat.severity == SecuritySeverity.MEDIUM.value
    assert threat.automated_response == "INCREASE_MONITORING"


def test_error_handling(threat_detector, sample_security_event, redis_mock):
    """Test error handling in threat detection."""
    # Simulate Redis error
    redis_mock.get.side_effect = redis.RedisError("Connection failed")

    # Should handle error gracefully
    threat = threat_detector.detect_threats(sample_security_event)
    assert threat is None


def test_threat_notification(threat_detector):
    """Test threat notification functionality."""
    with patch(
        "dojopool.core.security.threat_detection.send_notification"
    ) as mock_notify:
        threat = ThreatEvent(
            timestamp=datetime.now(),
            threat_type="SQL_INJECTION",
            severity=SecuritySeverity.HIGH.value,
            source_ip="192.168.1.100",
            details={},
            anomaly_score=0.95,
            confidence=0.9,
        )

        threat_detector._send_threat_notification(threat)
        mock_notify.assert_called_once()
