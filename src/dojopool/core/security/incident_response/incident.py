"""
Incident response system implementation.
Handles security incidents, their lifecycle, and response actions.
"""

import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from dojopool.core.monitoring import MetricsSnapshot
from ..threat_detection import ThreatFinding
from ..vulnerability_scanner.base import VulnerabilityFinding
from dojopool.core.extensions import db


class IncidentType(str, Enum):
    """Types of security incidents."""

    INTRUSION = "intrusion"
    MALWARE = "malware"
    DOS = "dos"
    DATA_BREACH = "data_breach"
    ACCESS_VIOLATION = "access_violation"
    POLICY_VIOLATION = "policy_violation"
    SYSTEM_COMPROMISE = "system_compromise"
    NETWORK_ATTACK = "network_attack"
    SOCIAL_ENGINEERING = "social_engineering"
    PHYSICAL_SECURITY = "physical_security"


class IncidentSeverity(str, Enum):
    """Severity levels for incidents."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class IncidentStatus(str, Enum):
    """Status of an incident."""

    NEW = "new"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    MITIGATED = "mitigated"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class SecurityIncident:
    """Represents a security incident."""

    def __init__(
        self,
        title: str,
        description: str,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        source_ip: Optional[str] = None,
        affected_systems: Optional[List[str]] = None,
        indicators: Optional[List[str]] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Initialize security incident."""
        self.id = str(uuid.uuid4())
        self.title = title
        self.description = description
        self.incident_type = incident_type
        self.severity = severity
        self.status = IncidentStatus.NEW
        self.source_ip = source_ip
        self.affected_systems = affected_systems or []
        self.indicators = indicators or []
        self.details = details or {}

        # Timestamps
        self.created_at = datetime.now()
        self.updated_at = self.created_at
        self.resolved_at = None

        # Response tracking
        self.assigned_to = None
        self.actions_taken: List[Dict[str, Any]] = []
        self.evidence: List[Dict[str, Any]] = []
        self.related_incidents: List[str] = []

        # Metrics
        self.metrics_snapshots: List[MetricsSnapshot] = []

        # Findings
        self.threat_findings: List[ThreatFinding] = []
        self.vulnerability_findings: List[VulnerabilityFinding] = []

        # Setup logging
        self.logger = logging.getLogger(__name__)

    def update_status(self, new_status: IncidentStatus, comment: str) -> None:
        """Update incident status with comment."""
        self.status = new_status
        self.updated_at = datetime.now()

        if new_status == IncidentStatus.RESOLVED:
            self.resolved_at = datetime.now()

        self.add_action(
            action_type="status_update",
            description=f"Status updated to {new_status.value}",
            details={"comment": comment},
        )

    def add_action(self, action_type: str, description: str, details: Dict[str, Any]) -> None:
        """Add response action to incident."""
        action = {
            "timestamp": datetime.now(),
            "type": action_type,
            "description": description,
            "details": details,
        }
        self.actions_taken.append(action)
        self.updated_at = datetime.now()

    def add_evidence(self, evidence_type: str, content: Any, metadata: Dict[str, Any]) -> None:
        """Add evidence to incident."""
        evidence = {
            "timestamp": datetime.now(),
            "type": evidence_type,
            "content": content,
            "metadata": metadata,
        }
        self.evidence.append(evidence)
        self.updated_at = datetime.now()

    def add_metrics_snapshot(self, snapshot: MetricsSnapshot) -> None:
        """Add system metrics snapshot."""
        self.metrics_snapshots.append(snapshot)

    def add_threat_finding(self, finding: ThreatFinding) -> None:
        """Add related threat finding."""
        self.threat_findings.append(finding)
        self.updated_at = datetime.now()

    def add_vulnerability_finding(self, finding: VulnerabilityFinding) -> None:
        """Add related vulnerability finding."""
        self.vulnerability_findings.append(finding)
        self.updated_at = datetime.now()

    def link_incident(self, incident_id: str) -> None:
        """Link related incident."""
        if incident_id not in self.related_incidents:
            self.related_incidents.append(incident_id)
            self.updated_at = datetime.now()

    def assign_to(self, user_id: str) -> None:
        """Assign incident to user."""
        self.assigned_to = user_id
        self.updated_at = datetime.now()

        self.add_action(
            action_type="assignment",
            description=f"Incident assigned to user {user_id}",
            details={"user_id": user_id},
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert incident to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "type": self.incident_type.value,
            "severity": self.severity.value,
            "status": self.status.value,
            "source_ip": self.source_ip,
            "affected_systems": self.affected_systems,
            "indicators": self.indicators,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "assigned_to": self.assigned_to,
            "actions_taken": self.actions_taken,
            "evidence": self.evidence,
            "related_incidents": self.related_incidents,
            "metrics_snapshots": [snapshot.to_dict() for snapshot in self.metrics_snapshots],
            "threat_findings": [{
                "timestamp": finding.timestamp.isoformat(),
                "threat_type": finding.threat_type,
                "severity": finding.severity,
                "source_ip": finding.source_ip,
                "details": finding.details,
                "anomaly_score": finding.anomaly_score,
                "confidence": finding.confidence,
                "automated_response": finding.automated_response
            } for finding in self.threat_findings],
            "vulnerability_findings": [{
                "timestamp": finding.timestamp.isoformat(),
                "severity": finding.severity,
                "title": finding.title,
                "description": finding.description,
                "vulnerability_type": finding.vulnerability_type,
                "affected_component": finding.affected_component,
                "evidence": finding.evidence,
                "remediation": finding.remediation,
                "cwe_id": finding.cwe_id,
                "cvss_score": finding.cvss_score,
                "references": finding.references,
                "tags": finding.tags,
                "metadata": finding.metadata
            } for finding in self.vulnerability_findings],
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SecurityIncident":
        """Create incident from dictionary."""
        incident = cls(
            title=data["title"],
            description=data["description"],
            incident_type=IncidentType(data["type"]),
            severity=IncidentSeverity(data["severity"]),
            source_ip=data.get("source_ip"),
            affected_systems=data.get("affected_systems", []),
            indicators=data.get("indicators", []),
            details=data.get("details", {}),
        )

        # Restore fields
        incident.id = data["id"]
        incident.status = IncidentStatus(data["status"])
        incident.created_at = datetime.fromisoformat(data["created_at"])
        incident.updated_at = datetime.fromisoformat(data["updated_at"])
        if data["resolved_at"]:
            incident.resolved_at = datetime.fromisoformat(data["resolved_at"])
        incident.assigned_to = data["assigned_to"]
        incident.actions_taken = data["actions_taken"]
        incident.evidence = data["evidence"]
        incident.related_incidents = data["related_incidents"]

        # Restore findings
        for finding_data in data["threat_findings"]:
            finding = ThreatFinding(
                timestamp=datetime.fromisoformat(finding_data["timestamp"]),
                title=finding_data.get("title", ""),
                description=finding_data.get("description", ""),
                threat_type=finding_data["threat_type"],
                source_ip=finding_data["source_ip"],
                affected_systems=finding_data.get("affected_systems", []),
                indicators=finding_data.get("indicators", []),
                confidence=finding_data["confidence"],
                automated_response=finding_data.get("automated_response"),
                details=finding_data.get("details", {})
            )
            incident.threat_findings.append(finding)

        for finding_data in data["vulnerability_findings"]:
            finding = VulnerabilityFinding(
                timestamp=datetime.fromisoformat(finding_data["timestamp"]),
                severity=finding_data["severity"],
                title=finding_data["title"],
                description=finding_data["description"],
                vulnerability_type=finding_data["vulnerability_type"],
                affected_component=finding_data["affected_component"],
                evidence=finding_data["evidence"],
                remediation=finding_data["remediation"],
                cwe_id=finding_data.get("cwe_id"),
                cvss_score=finding_data.get("cvss_score"),
                references=finding_data.get("references"),
                tags=finding_data.get("tags"),
                metadata=finding_data.get("metadata")
            )
            incident.vulnerability_findings.append(finding)

        return incident


class Incident(db.Model):
    """Security incident model."""

    __tablename__ = "incidents"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    incident_type = db.Column(db.Enum(IncidentType), nullable=False)
    severity = db.Column(db.Enum(IncidentSeverity), nullable=False)
    status = db.Column(db.Enum(IncidentStatus), nullable=False, default=IncidentStatus.NEW)
    source_ip = db.Column(db.String(45))  # IPv6 compatible
    affected_systems = db.Column(db.JSON)  # List of affected systems
    indicators = db.Column(db.JSON)  # List of indicators
    evidence = db.Column(db.JSON)  # Evidence data
    metrics_snapshot = db.Column(db.JSON)  # System metrics at time of incident
    assigned_to = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    resolved_at = db.Column(db.DateTime)
    resolution_notes = db.Column(db.Text)

    # Relationships
    assignee = db.relationship("User", backref="assigned_incidents")
    findings = db.relationship("Finding", back_populates="incident")

    def __init__(
        self,
        title: str,
        description: str,
        incident_type: IncidentType,
        severity: IncidentSeverity,
        source_ip: Optional[str] = None,
        affected_systems: Optional[List[str]] = None,
        indicators: Optional[List[str]] = None,
    ):
        """Initialize incident.

        Args:
            title: Incident title
            description: Incident description
            incident_type: Type of incident
            severity: Incident severity
            source_ip: Source IP address
            affected_systems: List of affected systems
            indicators: List of indicators
        """
        self.title = title
        self.description = description
        self.incident_type = incident_type
        self.severity = severity
        self.source_ip = source_ip
        self.affected_systems = affected_systems or []
        self.indicators = indicators or []
        self.evidence = []

    def add_evidence(self, evidence_data: Dict) -> None:
        """Add evidence to incident.

        Args:
            evidence_data: Evidence data to add
        """
        if not self.evidence:
            self.evidence = []

        self.evidence.append({"timestamp": datetime.utcnow().isoformat(), "data": evidence_data})
        self.updated_at = datetime.utcnow()

    def update_status(self, status: IncidentStatus, notes: Optional[str] = None) -> None:
        """Update incident status.

        Args:
            status: New status
            notes: Optional status update notes
        """
        self.status = status
        if notes:
            if not hasattr(self, "status_history"):
                self.status_history = []
            self.status_history.append(
                {"timestamp": datetime.utcnow().isoformat(), "status": status.value, "notes": notes}
            )

        if status == IncidentStatus.RESOLVED:
            self.resolved_at = datetime.utcnow()
            self.resolution_notes = notes

        self.updated_at = datetime.utcnow()

    def add_finding(self, finding_data: Dict) -> None:
        """Add finding to incident.

        Args:
            finding_data: Finding data to add
        """
        finding = Finding(
            incident_id=self.id,
            finding_type=finding_data["type"],
            description=finding_data["description"],
            severity=finding_data.get("severity", IncidentSeverity.MEDIUM),
            data=finding_data.get("data", {}),
        )
        self.findings.append(finding)
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict:
        """Convert incident to dictionary.

        Returns:
            Dict: Incident data
        """
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "incident_type": self.incident_type.value,
            "severity": self.severity.value,
            "status": self.status.value,
            "source_ip": self.source_ip,
            "affected_systems": self.affected_systems,
            "indicators": self.indicators,
            "evidence": self.evidence,
            "metrics_snapshot": self.metrics_snapshot,
            "assigned_to": self.assigned_to,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolution_notes": self.resolution_notes,
        }


class Finding(db.Model):
    """Security finding model."""

    __tablename__ = "findings"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    incident_id = db.Column(db.Integer, db.ForeignKey("incidents.id"), nullable=False)
    finding_type = db.Column(db.String(50), nullable=False)  # 'threat' or 'vulnerability'
    description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.Enum(IncidentSeverity), nullable=False)
    data = db.Column(db.JSON)  # Additional finding data
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    incident = db.relationship("Incident", back_populates="findings")
