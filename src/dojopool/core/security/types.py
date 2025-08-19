"""
Shared type definitions for security monitoring and threat detection.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional


class SecuritySeverity(Enum):
    """Security event severity levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


@dataclass
class SecurityEvent:
    """Base class for security-related events."""

    timestamp: datetime
    event_type: str
    severity: SecuritySeverity
    source_ip: str
    details: Dict[str, Any]
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    component: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


@dataclass
class ThreatEvent:
    """Represents a detected security threat."""

    # Base event fields
    timestamp: datetime
    event_type: str
    severity: SecuritySeverity
    source_ip: str
    details: Dict[str, Any]
    # Threat-specific fields
    threat_type: str
    anomaly_score: float
    confidence: float
    # Optional fields
    is_blocked: bool = False
    response_action: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    component: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None
