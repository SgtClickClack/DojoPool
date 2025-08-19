"""
Real-time threat detection system for DojoPool.
Implements ML-based anomaly detection and automated response mechanisms.
"""

import json
import logging
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import redis
from prometheus_client import Counter, Gauge, Histogram
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from ..utils.notifications import send_notification
from ...utils.monitoring import REGISTRY
from . import security_config as config
from .types import SecurityEvent, SecuritySeverity, ThreatEvent

# Metrics
THREAT_DETECTION_COUNTER = Counter(
    "threat_detection_total",
    "Total threats detected",
    ["threat_type", "severity", "status"],
    registry=REGISTRY,
)

THREAT_DETECTION_LATENCY = Histogram(
    "threat_detection_seconds", "Time taken to detect threats", ["threat_type"], registry=REGISTRY
)

ANOMALY_SCORE_GAUGE = Gauge(
    "threat_anomaly_score", "Current anomaly score", ["threat_type"], registry=REGISTRY
)


@dataclass
class ThreatEvent:
    """Represents a detected threat."""

    timestamp: datetime
    threat_type: str
    severity: str
    source_ip: str
    details: Dict[str, Any]
    anomaly_score: float
    confidence: float
    automated_response: Optional[str] = None


class ThreatDetector:
    """Real-time threat detection using ML-based anomaly detection."""

    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize threat detector."""
        self.logger = logging.getLogger("threat_detector")
        self.model_path = Path(config.ML_MODEL_PATH)
        self.redis = redis_client or redis.Redis(
            host=config.REDIS_HOST, port=config.REDIS_PORT, db=config.REDIS_DB
        )

        # Load or train ML model
        self._load_or_train_model()

        # Initialize feature scaler
        self.scaler = StandardScaler()

        # Cache for recent events
        self.event_cache = {}

        # Threat patterns
        self.threat_patterns = self._load_threat_patterns()

    def _load_or_train_model(self) -> None:
        """Load existing ML model or train a new one."""
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)
            self.logger.info("Loaded existing anomaly detection model")
        else:
            self.model = IsolationForest(n_estimators=100, contamination=0.1, random_state=42)
            self.logger.info("Created new anomaly detection model")
            self._train_initial_model()

    def _train_initial_model(self) -> None:
        """Train model with initial normal behavior data."""
        try:
            # Load historical normal behavior data
            normal_data = self._load_normal_behavior_data()
            if normal_data.size > 0:
                # Fit model
                self.model.fit(normal_data)
                # Save model
                joblib.dump(self.model, self.model_path)
                self.logger.info("Trained and saved initial model")
            else:
                self.logger.warning("No historical data available for initial training")
        except Exception as e:
            self.logger.error(f"Error training initial model: {e}")

    def _load_normal_behavior_data(self) -> np.ndarray:
        """Load historical normal behavior data."""
        try:
            # Load from configured data source
            data_path = Path(config.NORMAL_BEHAVIOR_DATA_PATH)
            if data_path.exists():
                return np.load(data_path)
            return np.array([])
        except Exception as e:
            self.logger.error(f"Error loading normal behavior data: {e}")
            return np.array([])

    def _load_threat_patterns(self) -> Dict[str, Dict]:
        """Load threat detection patterns."""
        try:
            with open(config.THREAT_PATTERNS_PATH) as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"Error loading threat patterns: {e}")
            return {}

    def extract_features(self, event: SecurityEvent) -> np.ndarray:
        """Extract features from security event for anomaly detection."""
        features = []

        # Request timing features
        hour = event.timestamp.hour
        is_business_hours = 9 <= hour <= 17
        is_weekend = event.timestamp.weekday() >= 5

        # Request pattern features
        request_count = self._get_request_count(event.source_ip)
        error_rate = self._get_error_rate(event.source_ip)

        # Location-based features
        location_risk = self._get_location_risk(event.source_ip)

        # Behavior features
        session_duration = self._get_session_duration(event.source_ip)
        action_frequency = self._get_action_frequency(event.source_ip)

        features.extend(
            [
                hour,
                int(is_business_hours),
                int(is_weekend),
                request_count,
                error_rate,
                location_risk,
                session_duration,
                action_frequency,
            ]
        )

        return np.array(features).reshape(1, -1)

    def detect_threats(self, event: SecurityEvent) -> Optional[ThreatEvent]:
        """Detect threats from security event using ML and pattern matching."""
        start_time = time.time()

        try:
            # Extract features
            features = self.extract_features(event)

            # Scale features
            scaled_features = self.scaler.fit_transform(features)

            # Get anomaly score (-1 for anomalies, 1 for normal)
            anomaly_score = self.model.score_samples(scaled_features)[0]

            # Convert to normalized score (0 to 1, higher means more anomalous)
            normalized_score = 1 - (anomaly_score + 1) / 2

            # Update anomaly score metric
            ANOMALY_SCORE_GAUGE.labels(threat_type=self._determine_threat_type(event)).set(
                normalized_score
            )

            # Check if anomalous (using threshold from config)
            is_anomaly = normalized_score > config.ANOMALY_THRESHOLD

            # Pattern matching
            pattern_match = self._check_threat_patterns(event)

            # Combine ML and pattern detection
            if is_anomaly or pattern_match:
                threat = self._create_threat_event(event, normalized_score, pattern_match)

                # Record detection time
                THREAT_DETECTION_LATENCY.labels(threat_type=threat.threat_type).observe(
                    time.time() - start_time
                )

                # Update counter
                THREAT_DETECTION_COUNTER.labels(
                    threat_type=threat.threat_type, severity=threat.severity, status="detected"
                ).inc()

                # Handle threat
                self._handle_threat(threat)

                return threat

            return None

        except Exception as e:
            self.logger.error(f"Error in threat detection: {e}")
            return None

    def _check_threat_patterns(self, event: SecurityEvent) -> Optional[Dict]:
        """Check for known threat patterns."""
        for pattern_name, pattern in self.threat_patterns.items():
            if self._matches_pattern(event, pattern):
                return {"pattern_name": pattern_name, "confidence": pattern.get("confidence", 0.8)}
        return None

    def _matches_pattern(self, event: SecurityEvent, pattern: Dict) -> bool:
        """Check if event matches a threat pattern."""
        try:
            conditions = pattern.get("conditions", {})

            # Check each condition
            for field, expected in conditions.items():
                actual = getattr(event, field, None)
                if actual != expected:
                    return False

            return True
        except Exception as e:
            self.logger.error(f"Error matching pattern: {e}")
            return False

    def _create_threat_event(
        self, event: SecurityEvent, anomaly_score: float, pattern_match: Optional[Dict]
    ) -> ThreatEvent:
        """Create threat event from detection results."""
        severity = self._determine_severity(anomaly_score, pattern_match)

        return ThreatEvent(
            timestamp=datetime.now(),
            threat_type=self._determine_threat_type(event, pattern_match),
            severity=severity,
            source_ip=event.source_ip,
            details={
                "security_event": event.__dict__,
                "pattern_match": pattern_match,
                "anomaly_score": anomaly_score,
            },
            anomaly_score=anomaly_score,
            confidence=pattern_match["confidence"] if pattern_match else 0.6,
            automated_response=self._determine_response(severity),
        )

    def _determine_severity(self, anomaly_score: float, pattern_match: Optional[Dict]) -> str:
        """Determine threat severity based on detection results."""
        if pattern_match:
            return SecuritySeverity.HIGH.value
        elif anomaly_score > config.HIGH_RISK_THRESHOLD:
            return SecuritySeverity.HIGH.value
        elif anomaly_score > config.MEDIUM_RISK_THRESHOLD:
            return SecuritySeverity.MEDIUM.value
        return SecuritySeverity.LOW.value

    def _determine_threat_type(self, event: SecurityEvent, pattern_match: Optional[Dict]) -> str:
        """Determine threat type based on detection results."""
        if pattern_match:
            return pattern_match["pattern_name"]
        return "ANOMALOUS_BEHAVIOR"

    def _determine_response(self, severity: str) -> str:
        """Determine automated response based on severity."""
        if severity == SecuritySeverity.HIGH.value:
            return "BLOCK_IP"
        elif severity == SecuritySeverity.MEDIUM.value:
            return "INCREASE_MONITORING"
        return "LOG_ONLY"

    def _handle_threat(self, threat: ThreatEvent) -> None:
        """Handle detected threat."""
        try:
            # Log threat
            self.logger.warning(f"Threat detected: {threat}")

            # Store in Redis for real-time access
            self.redis.setex(
                f"threat:{threat.source_ip}", config.THREAT_CACHE_TTL, json.dumps(threat.__dict__)
            )

            # Send notification
            self._send_threat_notification(threat)

            # Execute automated response
            self._execute_response(threat)

        except Exception as e:
            self.logger.error(f"Error handling threat: {e}")

    def _send_threat_notification(self, threat: ThreatEvent) -> None:
        """Send notification about detected threat."""
        subject = f"Security Threat Detected - {threat.threat_type}"
        message = (
            f"Severity: {threat.severity}\n"
            f"Source IP: {threat.source_ip}\n"
            f"Anomaly Score: {threat.anomaly_score:.2f}\n"
            f"Confidence: {threat.confidence:.2f}\n"
            f"Automated Response: {threat.automated_response}\n"
            f"Details: {json.dumps(threat.details, indent=2)}"
        )

        send_notification(
            subject=subject,
            message=message,
            email=config.SECURITY_NOTIFICATION_EMAIL,
            slack_webhook=config.SECURITY_SLACK_WEBHOOK,
        )

    def _execute_response(self, threat: ThreatEvent) -> None:
        """Execute automated response to threat."""
        if threat.automated_response == "BLOCK_IP":
            self._block_ip(threat.source_ip)
        elif threat.automated_response == "INCREASE_MONITORING":
            self._increase_monitoring(threat.source_ip)

    def _block_ip(self, ip: str) -> None:
        """Block an IP address."""
        try:
            self.redis.setex(f"blocked_ip:{ip}", config.IP_BLOCK_DURATION, "blocked")
            self.logger.info(f"Blocked IP address: {ip}")
        except Exception as e:
            self.logger.error(f"Error blocking IP: {e}")

    def _increase_monitoring(self, ip: str) -> None:
        """Increase monitoring for an IP address."""
        try:
            self.redis.setex(
                f"increased_monitoring:{ip}", config.INCREASED_MONITORING_DURATION, "active"
            )
            self.logger.info(f"Increased monitoring for IP: {ip}")
        except Exception as e:
            self.logger.error(f"Error increasing monitoring: {e}")

    # Helper methods for feature extraction
    def _get_request_count(self, ip: str) -> int:
        """Get request count for IP in recent timeframe."""
        try:
            count = self.redis.get(f"request_count:{ip}")
            return int(count) if count else 0
        except Exception:
            return 0

    def _get_error_rate(self, ip: str) -> float:
        """Get error rate for IP in recent timeframe."""
        try:
            errors = self.redis.get(f"error_count:{ip}")
            requests = self.redis.get(f"request_count:{ip}")
            if errors and requests:
                return float(errors) / float(requests)
            return 0.0
        except Exception:
            return 0.0

    def _get_location_risk(self, ip: str) -> float:
        """Get risk score for IP's location."""
        try:
            risk = self.redis.get(f"location_risk:{ip}")
            return float(risk) if risk else 0.0
        except Exception:
            return 0.0

    def _get_session_duration(self, ip: str) -> float:
        """Get current session duration for IP."""
        try:
            start_time = self.redis.get(f"session_start:{ip}")
            if start_time:
                return time.time() - float(start_time)
            return 0.0
        except Exception:
            return 0.0

    def _get_action_frequency(self, ip: str) -> float:
        """Get action frequency for IP in recent timeframe."""
        try:
            actions = self.redis.get(f"action_count:{ip}")
            duration = self._get_session_duration(ip)
            if actions and duration > 0:
                return float(actions) / duration
            return 0.0
        except Exception:
            return 0.0


# Global threat detector instance
threat_detector = ThreatDetector()
