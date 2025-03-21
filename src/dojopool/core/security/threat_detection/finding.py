"""
Threat finding definitions for the security system.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class ThreatFinding:
    """Represents a detected threat finding."""

    timestamp: datetime
    severity: str
    title: str
    description: str
    threat_type: str
    source_ip: str
    affected_systems: List[str]
    indicators: List[str]
    confidence: float
    automated_response: Optional[str] = None
    details: Optional[Dict[str, Any]] = None 