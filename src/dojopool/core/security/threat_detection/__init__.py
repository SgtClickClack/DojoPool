"""Threat detection module."""

from .finding import ThreatFinding
from .detector import ThreatDetector

# Create singleton instance
threat_detector = ThreatDetector()

__all__ = ['ThreatFinding', 'ThreatDetector', 'threat_detector'] 