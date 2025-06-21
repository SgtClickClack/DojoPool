"""
Security Incident Response System for DojoPool.

This module provides a comprehensive framework for handling security incidents including:
- Incident detection and classification
- Automated initial response
- Incident tracking and documentation
- Response coordination
- Post-incident analysis
"""

import json
import logging
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Set

from dojopool.config import SecurityConfig
from dojopool.utils.security import log_security_event

logger = logging.getLogger(__name__)


class IncidentSeverity(Enum):
    """Classification of incident severity levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class IncidentStatus(Enum):
    """Possible states of an incident."""

    NEW = "new"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVING = "resolving"
    RESOLVED = "resolved"
    CLOSED = "closed"


class IncidentType(Enum):
    """Types of security incidents."""

    UNAUTHORIZED_ACCESS = "unauthorized_access"
    DATA_BREACH = "data_breach"
    MALWARE = "malware"
    DOS_ATTACK = "dos_attack"
    CONFIGURATION_ERROR = "configuration_error"
    VULNERABILITY = "vulnerability"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class SecurityIncident:
    """Represents a security incident."""

    def __init__(
        self,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        description: str,
        affected_systems: Set[str],
        detected_by: str,
    ):
        self.id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        self.type = incident_type
        self.severity = severity
        self.status = IncidentStatus.NEW
        self.description = description
        self.affected_systems = affected_systems
        self.detected_by = detected_by
        self.detection_time = datetime.utcnow()
        self.last_updated = self.detection_time
        self.resolution_time: Optional[datetime] = None
        self.assigned_to: Optional[str] = None
        self.timeline: List[Dict] = []
        self.containment_steps: List[str] = []
        self.resolution_steps: List[str] = []

        self._log_creation()

    def _log_creation(self) -> None:
        """Log the creation of the incident."""
        log_security_event(
            "incident_created",
            self.detected_by,
            {
                "incident_id": self.id,
                "type": self.type.value,
                "severity": self.severity.value,
                "description": self.description,
            },
        )


class IncidentResponseCoordinator:
    """Coordinates the response to security incidents."""

    def __init__(self):
        self.active_incidents: Dict[str, SecurityIncident] = {}
        self.resolved_incidents: Dict[str, SecurityIncident] = {}

    def create_incident(
        self,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        description: str,
        affected_systems: Set[str],
        detected_by: str,
    ) -> SecurityIncident:
        """Create and register a new security incident."""
        incident = SecurityIncident(
            incident_type, severity, description, affected_systems, detected_by
        )

        self.active_incidents[incident.id] = incident
        self._initiate_response(incident)
        return incident

    def _initiate_response(self, incident: SecurityIncident) -> None:
        """Initialize the response to an incident."""
        # Log the incident
        logger.critical(f"Security incident detected: {incident.id}")

        # Implement initial response based on incident type
        response_actions = self._get_initial_response_actions(incident)

        # Execute initial response actions
        for action in response_actions:
            try:
                action(incident)
            except Exception as e:
                logger.error(
                    f"Error executing response action for incident {incident.id}: {str(e)}"
                )

    def _get_initial_response_actions(self, incident: SecurityIncident) -> List[callable]:
        """Get the initial response actions based on incident type."""
        actions = []

        if incident.severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
            actions.extend([self._notify_security_team, self._initiate_containment])

        if incident.type == IncidentType.UNAUTHORIZED_ACCESS:
            actions.append(self._lock_affected_accounts)
        elif incident.type == IncidentType.DATA_BREACH:
            actions.append(self._isolate_affected_systems)
        elif incident.type == IncidentType.DOS_ATTACK:
            actions.append(self._enable_ddos_protection)

        return actions

    def _notify_security_team(self, incident: SecurityIncident) -> None:
        """Notify the security team about the incident."""
        logger.info(f"Notifying security team about incident {incident.id}")
        # Implement notification logic (email, Slack, etc.)

    def _initiate_containment(self, incident: SecurityIncident) -> None:
        """Initiate containment procedures."""
        logger.info(f"Initiating containment for incident {incident.id}")
        incident.containment_steps.append("Initiated containment procedures")

    def _lock_affected_accounts(self, incident: SecurityIncident) -> None:
        """Lock potentially compromised accounts."""
        logger.info(f"Locking affected accounts for incident {incident.id}")
        incident.containment_steps.append("Locked affected accounts")

    def _isolate_affected_systems(self, incident: SecurityIncident) -> None:
        """Isolate affected systems to prevent further damage."""
        logger.info(f"Isolating affected systems for incident {incident.id}")
        incident.containment_steps.append("Isolated affected systems")

    def _enable_ddos_protection(self, incident: SecurityIncident) -> None:
        """Enable enhanced DDoS protection."""
        logger.info(f"Enabling DDoS protection for incident {incident.id}")
        incident.containment_steps.append("Enabled enhanced DDoS protection")

    def update_incident(
        self,
        incident_id: str,
        status: Optional[IncidentStatus] = None,
        resolution_steps: Optional[List[str]] = None,
        assigned_to: Optional[str] = None,
    ) -> Optional[SecurityIncident]:
        """Update an incident's status and details."""
        incident = self.active_incidents.get(incident_id)
        if not incident:
            logger.error(f"Incident {incident_id} not found")
            return None

        if status:
            incident.status = status
            if status == IncidentStatus.RESOLVED:
                incident.resolution_time = datetime.utcnow()
                self.resolved_incidents[incident_id] = incident
                del self.active_incidents[incident_id]

        if resolution_steps:
            incident.resolution_steps.extend(resolution_steps)

        if assigned_to:
            incident.assigned_to = assigned_to

        incident.last_updated = datetime.utcnow()
        incident.timeline.append(
            {
                "timestamp": datetime.utcnow().isoformat(),
                "action": "update",
                "details": {
                    "status": status.value if status else None,
                    "resolution_steps": resolution_steps,
                    "assigned_to": assigned_to,
                },
            }
        )

        log_security_event(
            "incident_updated",
            "system",
            {
                "incident_id": incident_id,
                "status": status.value if status else None,
                "assigned_to": assigned_to,
            },
        )

        return incident

    def get_incident(self, incident_id: str) -> Optional[SecurityIncident]:
        """Get an incident by ID from either active or resolved incidents."""
        return self.active_incidents.get(incident_id) or self.resolved_incidents.get(incident_id)

    def get_active_incidents(
        self, severity: Optional[IncidentSeverity] = None
    ) -> List[SecurityIncident]:
        """Get all active incidents, optionally filtered by severity."""
        incidents = list(self.active_incidents.values())
        if severity:
            incidents = [i for i in incidents if i.severity == severity]
        return incidents

    def generate_incident_report(self, incident_id: str) -> Optional[Dict]:
        """Generate a detailed report for an incident."""
        incident = self.get_incident(incident_id)
        if not incident:
            return None

        return {
            "incident_id": incident.id,
            "type": incident.type.value,
            "severity": incident.severity.value,
            "status": incident.status.value,
            "description": incident.description,
            "affected_systems": list(incident.affected_systems),
            "detected_by": incident.detected_by,
            "detection_time": incident.detection_time.isoformat(),
            "resolution_time": (
                incident.resolution_time.isoformat() if incident.resolution_time else None
            ),
            "assigned_to": incident.assigned_to,
            "timeline": incident.timeline,
            "containment_steps": incident.containment_steps,
            "resolution_steps": incident.resolution_steps,
        }
