"""
Real-time security monitoring module for DojoPool.
Provides security event tracking, threat detection, and alerting.
"""

import json
import logging
import re
import time
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from logging.handlers import RotatingFileHandler
from typing import Any, Dict, Optional

from flask import request
from prometheus_client import Counter, Histogram
from ...utils.monitoring import REGISTRY

from ..security.threat_detection import threat_detector
from ..security.types import SecurityEvent, SecuritySeverity, ThreatEvent
from . import security_config as config

# Security metrics
SECURITY_EVENT_COUNTER = Counter(
    "security_events_total",
    "Total security events detected",
    ["event_type", "severity"],
    registry=REGISTRY,
)

THREAT_RESPONSE_TIME = Histogram(
    "threat_response_seconds",
    "Time taken to respond to threats",
    ["threat_type", "severity"],
    registry=REGISTRY,
)


class SecurityEventType(Enum):
    SUSPICIOUS_REQUEST = "suspicious_request"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    AUTH_FAILURE = "auth_failure"
    INJECTION_ATTEMPT = "injection_attempt"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    ABNORMAL_BEHAVIOR = "abnormal_behavior"
    CONTENT_VIOLATION = "content_violation"
    IP_BLOCKED = "ip_blocked"


class SecuritySeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class SecurityEvent:
    """Represents a security event."""

    timestamp: datetime
    event_type: SecurityEventType
    severity: SecuritySeverity
    source_ip: str
    details: Dict[str, Any]


class SecurityMonitor:
    """Manages security monitoring and threat detection."""

    def __init__(self):
        """Initialize security monitor."""
        self.logger = logging.getLogger("security_monitor")
        self.suspicious_patterns = config.SUSPICIOUS_PATTERNS
        self.rate_limits = {}
        self.ip_blocks = {}
        self.setup_logging()

    def setup_logging(self):
        """Configure security event logging."""
        log_file = config.LOGGING_CONFIG["log_file"]
        max_bytes = config.LOGGING_CONFIG["max_file_size_mb"] * 1024 * 1024
        backup_count = config.LOGGING_CONFIG["backup_count"]

        handler = RotatingFileHandler(log_file, maxBytes=max_bytes, backupCount=backup_count)

        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(config.LOGGING_CONFIG["log_level"])

    def monitor_request(self, request) -> Optional[SecurityEvent]:
        """Monitor incoming request for security threats."""
        start_time = time.time()

        # Get request details
        source_ip = request.remote_addr
        path = request.path
        method = request.method
        dict(request.headers)
        dict(request.args)

        event = None

        try:
            # Check IP blacklist
            if self._is_ip_blocked(source_ip):
                event = self._create_event(
                    SecurityEventType.IP_BLOCKED,
                    SecuritySeverity.HIGH,
                    source_ip,
                    {"path": path, "method": method},
                )
                return event

            # Check rate limits based on path type
            rate_limit_key = (
                "api"
                if path.startswith("/api")
                else ("auth" if path.startswith("/auth") else "default")
            )
            if self._check_rate_limit(source_ip, rate_limit_key):
                event = self._create_event(
                    SecurityEventType.RATE_LIMIT_EXCEEDED,
                    SecuritySeverity.MEDIUM,
                    source_ip,
                    {"path": path, "method": method, "rate_limit_type": rate_limit_key},
                )

            # Check for suspicious patterns
            if payload := self._check_suspicious_patterns(request):
                event = self._create_event(
                    SecurityEventType.INJECTION_ATTEMPT, SecuritySeverity.HIGH, source_ip, payload
                )

            # Check for unauthorized access to protected paths
            if self._check_unauthorized_access(request):
                event = self._create_event(
                    SecurityEventType.UNAUTHORIZED_ACCESS,
                    SecuritySeverity.HIGH,
                    source_ip,
                    {"path": path, "method": method},
                )

            # Check content security if applicable
            if event := self._check_content_security(request):
                return event

            # Create security event if any checks failed
            if event:
                # Record response time
                THREAT_RESPONSE_TIME.labels(
                    threat_type=event.event_type.value, severity=event.severity.value
                ).observe(time.time() - start_time)

                # Log the security event
                self._log_event(event)

                # Run threat detection
                if threat := self._detect_threats(event):
                    # Add threat information to request context
                    request.threat_event = threat

            return event

        except Exception as e:
            self.logger.error(f"Error in security monitoring: {str(e)}")
            return None

    def _detect_threats(self, event: SecurityEvent) -> Optional[ThreatEvent]:
        """Run threat detection on security event."""
        try:
            return threat_detector.detect_threats(event)
        except Exception as e:
            self.logger.error(f"Error in threat detection: {e}")
            return None

    def _create_event(
        self,
        event_type: SecurityEventType,
        severity: SecuritySeverity,
        source_ip: str,
        details: Dict[str, Any],
    ) -> SecurityEvent:
        """Create a security event."""
        event = SecurityEvent(
            timestamp=datetime.now(),
            event_type=event_type,
            severity=severity,
            source_ip=source_ip,
            details=details,
        )

        # Update metrics
        SECURITY_EVENT_COUNTER.labels(event_type=event_type.value, severity=severity.value).inc()

        return event

    def _log_event(self, event: SecurityEvent) -> None:
        """Log security event."""
        self.logger.warning(
            f"Security event detected - "
            f"Type: {event.event_type.value}, "
            f"Severity: {event.severity.value}, "
            f"Source IP: {event.source_ip}, "
            f"Details: {json.dumps(event.details)}"
        )

    def _is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked."""
        if ip in config.IP_SECURITY["whitelist"]:
            return False

        if ip in config.IP_SECURITY["blacklist"]:
            return True

        current_time = time.time()
        if ip in self.ip_blocks:
            block_time = self.ip_blocks[ip]
            if current_time - block_time < config.IP_SECURITY["block_duration_minutes"] * 60:
                return True
            else:
                del self.ip_blocks[ip]

        return False

    def _check_rate_limit(self, ip: str, limit_type: str) -> bool:
        """Check if request exceeds rate limit."""
        current_time = time.time()
        rate_limit = config.RATE_LIMITS.get(limit_type, config.RATE_LIMITS["default"])

        if ip not in self.rate_limits:
            self.rate_limits[ip] = {"count": 0, "window_start": current_time}

        window_start = self.rate_limits[ip]["window_start"]
        if current_time - window_start > 60:  # 1 minute window
            self.rate_limits[ip] = {"count": 1, "window_start": current_time}
            return False

        self.rate_limits[ip]["count"] += 1
        return self.rate_limits[ip]["count"] > rate_limit["requests_per_minute"]

    def _check_suspicious_patterns(self, request) -> Optional[Dict]:
        """Check request for suspicious patterns."""
        patterns = self.suspicious_patterns
        payload = {}

        # Check URL parameters
        for _key, value in request.args.items():
            for pattern in patterns:
                if re.search(pattern, str(value), re.IGNORECASE):
                    payload["type"] = "url_parameter"
                    payload["pattern"] = pattern
                    payload["value"] = value
                    return payload

        # Check POST data
        if request.is_json:
            json_data = request.get_json()
            if isinstance(json_data, dict):
                for _key, value in json_data.items():
                    for pattern in patterns:
                        if re.search(pattern, str(value), re.IGNORECASE):
                            payload["type"] = "json_data"
                            payload["pattern"] = pattern
                            payload["value"] = value
                            return payload

        return None

    def _check_unauthorized_access(self, request) -> bool:
        """Check for unauthorized access attempts."""
        protected_paths = config.PROTECTED_PATHS
        return any(re.match(pattern, request.path) for pattern in protected_paths)

    def _check_content_security(self, request) -> Optional[SecurityEvent]:
        """Check content security policies."""
        if request.method in ["POST", "PUT"] and request.files:
            for file in request.files.values():
                # Check file size
                if (
                    file.content_length
                    > config.CONTENT_SECURITY["max_upload_size_mb"] * 1024 * 1024
                ):
                    return self._create_event(
                        SecurityEventType.CONTENT_VIOLATION,
                        SecuritySeverity.MEDIUM,
                        request.remote_addr,
                        {
                            "violation": "file_size_exceeded",
                            "file_name": file.filename,
                            "content_length": file.content_length,
                        },
                    )

                # Check file type
                if file.content_type not in config.CONTENT_SECURITY["allowed_file_types"]:
                    return self._create_event(
                        SecurityEventType.CONTENT_VIOLATION,
                        SecuritySeverity.MEDIUM,
                        request.remote_addr,
                        {
                            "violation": "invalid_file_type",
                            "file_name": file.filename,
                            "content_type": file.content_type,
                        },
                    )

        return None


# Global security monitor instance
security_monitor = SecurityMonitor()


def init_security_monitoring(app):
    """Initialize security monitoring for the Flask application."""

    @app.before_request
    def monitor_request():
        if event := security_monitor.monitor_request(request):
            # Add security event to request context
            request.security_event = event
