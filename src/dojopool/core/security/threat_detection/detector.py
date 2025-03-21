"""
Real-time threat detection system for DojoPool.
Implements ML-based anomaly detection and automated response mechanisms.
"""

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import joblib
import numpy as np
import redis
from prometheus_client import Counter, Gauge, Histogram
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from dojopool.core.utils.notifications import send_notification
from dojopool.core.utils.monitoring import REGISTRY
from .. import security_config as config
from ..types import SecurityEvent, SecuritySeverity, ThreatEvent

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
                "anomaly_score": anomaly_score,
                "pattern_match": pattern_match,
            },
            anomaly_score=anomaly_score,
            confidence=self._calculate_confidence(anomaly_score, pattern_match),
        )

    def _determine_severity(self, anomaly_score: float, pattern_match: Optional[Dict]) -> str:
        """Determine threat severity based on anomaly score and pattern match."""
        if pattern_match and pattern_match.get("confidence", 0) > 0.9:
            return SecuritySeverity.CRITICAL.value

        if anomaly_score > 0.9:
            return SecuritySeverity.CRITICAL.value
        elif anomaly_score > 0.7:
            return SecuritySeverity.HIGH.value
        elif anomaly_score > 0.5:
            return SecuritySeverity.MEDIUM.value
        else:
            return SecuritySeverity.LOW.value

    def _determine_threat_type(self, event: SecurityEvent, pattern_match: Optional[Dict] = None) -> str:
        """Determine threat type based on event and pattern match."""
        if pattern_match:
            return pattern_match["pattern_name"]

        # Default threat types based on event characteristics
        if "injection" in str(event.details).lower():
            return "injection_attempt"
        elif "bruteforce" in str(event.details).lower():
            return "bruteforce_attempt"
        elif "dos" in str(event.details).lower():
            return "dos_attempt"
        else:
            return "suspicious_activity"

    def _calculate_confidence(self, anomaly_score: float, pattern_match: Optional[Dict]) -> float:
        """Calculate confidence score for threat detection."""
        if pattern_match:
            pattern_confidence = pattern_match.get("confidence", 0)
            return max(pattern_confidence, anomaly_score)
        return anomaly_score

    def _handle_threat(self, threat: ThreatEvent) -> None:
        """Handle detected threat."""
        try:
            # Log threat
            self.logger.warning(
                f"Threat detected - Type: {threat.threat_type}, "
                f"Severity: {threat.severity}, "
                f"Source IP: {threat.source_ip}, "
                f"Confidence: {threat.confidence:.2f}"
            )

            # Send notification
            send_notification(
                "security_alert",
                {
                    "title": f"Security Threat Detected: {threat.threat_type}",
                    "message": (
                        f"Severity: {threat.severity}\n"
                        f"Source IP: {threat.source_ip}\n"
                        f"Confidence: {threat.confidence:.2f}"
                    ),
                    "threat": threat.__dict__,
                },
            )

            # Store threat event
            self._store_threat_event(threat)

        except Exception as e:
            self.logger.error(f"Error handling threat: {e}")

    def _store_threat_event(self, threat: ThreatEvent) -> None:
        """Store threat event in Redis."""
        try:
            key = f"threat:{threat.timestamp.isoformat()}"
            self.redis.setex(key, config.THREAT_EVENT_TTL, json.dumps(threat.__dict__))
        except Exception as e:
            self.logger.error(f"Error storing threat event: {e}")

    def _get_request_count(self, ip: str) -> int:
        """Get recent request count for IP."""
        try:
            key = f"requests:{ip}"
            return int(self.redis.get(key) or 0)
        except Exception:
            return 0

    def _get_error_rate(self, ip: str) -> float:
        """Get error rate for IP."""
        try:
            key = f"errors:{ip}"
            return float(self.redis.get(key) or 0)
        except Exception:
            return 0

    def _get_location_risk(self, ip: str) -> float:
        """Get risk score for IP location."""
        try:
            key = f"location_risk:{ip}"
            return float(self.redis.get(key) or 0)
        except Exception:
            return 0

    def _get_session_duration(self, ip: str) -> float:
        """Get session duration for IP."""
        try:
            key = f"session:{ip}"
            return float(self.redis.get(key) or 0)
        except Exception:
            return 0

    def _get_action_frequency(self, ip: str) -> float:
        """Get action frequency for IP."""
        try:
            key = f"actions:{ip}"
            return float(self.redis.get(key) or 0)
        except Exception:
            return 0 