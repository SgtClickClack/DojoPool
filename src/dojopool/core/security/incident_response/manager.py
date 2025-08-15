"""
Incident response manager implementation.
Manages security incidents and coordinates response actions.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any, Dict, List, Optional, Union, cast

import aiohttp
import aiosmtplib
from prometheus_client import Counter, Histogram

from dojopool.core.monitoring import MetricsSnapshot, MetricsCollector
from dojopool.core.security.threat_detection import ThreatFinding
from dojopool.core.security.vulnerability_scanner import VulnerabilityFinding, ScannerManager
from .incident import IncidentSeverity, IncidentStatus, IncidentType, SecurityIncident
from .playbooks import PlaybookManager
from dojopool.utils.notifications import NotificationManager

logger = logging.getLogger(__name__)

# Prometheus metrics
INCIDENTS_TOTAL = Counter(
    'incidents_total',
    'Total number of security incidents',
    ['type', 'severity']
)

INCIDENT_ERRORS = Counter(
    'incident_errors',
    'Total number of errors in incident handling',
    ['operation']
)

class IncidentManager:
    """Manager for security incidents."""

    def __init__(self, storage_path: Optional[Path] = None):
        """Initialize incident manager.

        Args:
            storage_path: Optional path for incident data storage
        """
        self.logger = logging.getLogger(__name__)
        self.storage_path = storage_path
        if storage_path:
            storage_path.mkdir(parents=True, exist_ok=True)

        self.notification_manager = NotificationManager()
        self._active_incidents: Dict[str, SecurityIncident] = {}
        self._monitoring_tasks: Dict[str, asyncio.Task] = {}

        # Track incident statistics
        self.stats = {
            "total_incidents": 0,
            "active_incidents": 0,
            "resolved_incidents": 0,
            "severity_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "type_counts": {},
        }

        # Initialize components
        self.metrics_collector = MetricsCollector()
        self.threat_detector = ThreatDetector()
        self.scanner_manager = ScannerManager()

        # Initialize playbook manager
        self.playbook_manager = PlaybookManager()

    async def start(self) -> None:
        """Start incident manager."""
        self.logger.info("Starting incident response manager")

        # Load existing incidents
        await self._load_incidents()

        # Start background tasks
        asyncio.create_task(self._monitor_incidents())
        asyncio.create_task(self._cleanup_old_incidents())

    async def create_incident(
        self,
        title: str,
        description: str,
        incident_type: Union[str, IncidentType],
        severity: Union[str, IncidentSeverity],
        metrics_snapshot: Optional[MetricsSnapshot] = None,
        **kwargs,
    ) -> SecurityIncident:
        """Create a new security incident.

        Args:
            title: Incident title
            description: Incident description
            incident_type: Type of incident
            severity: Incident severity
            metrics_snapshot: Optional system metrics snapshot
            **kwargs: Additional incident data

        Returns:
            SecurityIncident: Created incident
        """
        try:
            # Convert string enums if needed
            if isinstance(incident_type, str):
                incident_type = IncidentType(incident_type)
            if isinstance(severity, str):
                severity = IncidentSeverity(severity)

            # Create incident
            incident = SecurityIncident(
                title=title,
                description=description,
                incident_type=incident_type,
                severity=severity,
                **kwargs,
            )

            # Add metrics snapshot
            if metrics_snapshot:
                incident.add_metrics_snapshot(metrics_snapshot)

            # Save to storage
            if self.storage_path:
                await self._save_incident(incident)

            # Start monitoring if high severity
            if severity in [IncidentSeverity.CRITICAL, IncidentSeverity.HIGH]:
                await self.start_monitoring(incident.id)

            # Send notifications
            await self._notify_incident_created(incident)

            # Track metrics
            INCIDENTS_TOTAL.labels(type=incident_type.value, severity=severity.value).inc()

            return incident

        except Exception as e:
            logger.error(f"Failed to create incident: {str(e)}")
            INCIDENT_ERRORS.labels(operation="create").inc()
            raise

    async def update_incident(
        self,
        incident_id: str,
        status: Optional[IncidentStatus] = None,
        comment: Optional[str] = None,
    ) -> SecurityIncident:
        """Update incident status.

        Args:
            incident_id: ID of the incident
            status: New status
            comment: Optional status update notes

        Returns:
            SecurityIncident: Updated incident
        """
        try:
            incident = await self.get_incident(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            # Update status if provided
            if status is not None:
                incident.update_status(status, comment or "Status updated")
            
            # Save to storage
            if self.storage_path:
                await self._save_incident(incident)

            # Stop monitoring if resolved
            if status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                await self.stop_monitoring(incident_id)

            # Send notifications
            await self._notify_status_updated(incident)

            return incident

        except Exception as e:
            logger.error(f"Failed to update incident status: {str(e)}")
            INCIDENT_ERRORS.labels(operation="update_status").inc()
            raise

    async def get_incident(self, incident_id: str) -> Optional[SecurityIncident]:
        """Get incident by ID.

        Args:
            incident_id: ID of the incident

        Returns:
            Optional[SecurityIncident]: Incident if found
        """
        try:
            # Check active incidents first
            if incident_id in self._active_incidents:
                return self._active_incidents[incident_id]

            # Try to load from storage
            if self.storage_path:
                file_path = self.storage_path / f"incident_{incident_id}.json"
                if file_path.exists():
                    with open(file_path) as f:
                        data = json.load(f)
                        incident = SecurityIncident.from_dict(data)
                        self._active_incidents[incident_id] = incident
                        return incident

            return None

        except Exception as e:
            logger.error(f"Failed to get incident: {str(e)}")
            INCIDENT_ERRORS.labels(operation="get").inc()
            raise

    async def get_active_incidents(
        self,
        severity: Optional[IncidentSeverity] = None,
        incident_type: Optional[IncidentType] = None,
    ) -> List[SecurityIncident]:
        """Get active incidents with optional filtering."""
        incidents = list(self._active_incidents.values())

        if severity:
            incidents = [i for i in incidents if i.severity == severity]
        if incident_type:
            incidents = [i for i in incidents if i.incident_type == incident_type]

        return incidents

    async def get_statistics(self) -> Dict[str, Any]:
        """Get incident statistics."""
        return self.stats

    async def _load_incidents(self) -> None:
        """Load incidents from storage."""
        try:
            if not self.storage_path:
                return

            for file in self.storage_path.glob("*.json"):
                with open(file) as f:
                    data = json.load(f)
                    incident = SecurityIncident.from_dict(data)

                    if incident.status == IncidentStatus.RESOLVED:
                        self._active_incidents[incident.id] = incident
                    else:
                        self._active_incidents[incident.id] = incident

                    # Update statistics
                    self.stats["total_incidents"] += 1
                    if incident.status == IncidentStatus.RESOLVED:
                        self.stats["resolved_incidents"] += 1
                    else:
                        self.stats["active_incidents"] += 1
                    self.stats["severity_counts"][incident.severity.value] += 1
                    self.stats["type_counts"][incident.incident_type.value] = (
                        self.stats["type_counts"].get(incident.incident_type.value, 0) + 1
                    )

        except Exception as e:
            self.logger.error(f"Error loading incidents: {str(e)}")

    async def _save_incident(self, incident: SecurityIncident) -> None:
        """Save incident to storage."""
        try:
            if not self.storage_path:
                return

            file_path = self.storage_path / f"incident_{incident.id}.json"
            with open(file_path, "w") as f:
                json.dump(incident.to_dict(), f, indent=2)

        except Exception as e:
            self.logger.error(f"Error saving incident: {str(e)}")

    async def _monitor_incidents(self) -> None:
        """Monitor active incidents."""
        while True:
            try:
                for incident in list(self._active_incidents.values()):
                    # Get current metrics
                    metrics = await self.metrics_collector.get_metrics()
                    incident.add_metrics_snapshot(metrics)

                    # Check for related threats
                    threats = await self.threat_detector.detect_threats()
                    for threat in threats:
                        if self._is_threat_related(incident, threat):
                            incident.add_threat_finding(threat)

                    # Update incident file
                    await self._save_incident(incident)

                await asyncio.sleep(300)  # Check every 5 minutes

            except Exception as e:
                self.logger.error(f"Error monitoring incidents: {str(e)}")
                await asyncio.sleep(60)

    async def _cleanup_old_incidents(self) -> None:
        """Clean up old resolved incidents."""
        while True:
            try:
                cutoff = datetime.now() - timedelta(days=90)

                for incident_id, incident in list(self._active_incidents.items()):
                    if incident.resolved_at and incident.resolved_at < cutoff:
                        # Archive incident
                        await self._archive_incident(incident)
                        del self._active_incidents[incident_id]

                        # Update statistics
                        self.stats["resolved_incidents"] -= 1

                await asyncio.sleep(86400)  # Check daily

            except Exception as e:
                self.logger.error(f"Error cleaning up incidents: {str(e)}")
                await asyncio.sleep(3600)

    async def _archive_incident(self, incident: SecurityIncident) -> None:
        """Archive old incident."""
        try:
            archive_dir = self.storage_path / "archive"
            archive_dir.mkdir(exist_ok=True)

            # Move incident file to archive
            source = self.storage_path / f"incident_{incident.id}.json"
            target = archive_dir / f"incident_{incident.id}.json"
            source.rename(target)

        except Exception as e:
            self.logger.error(f"Error archiving incident {incident.id}: {str(e)}")

    def _is_threat_related(self, incident: SecurityIncident, threat: Any) -> bool:
        """Check if threat is related to incident."""
        # Check source IP
        if incident.source_ip and incident.source_ip == threat.source_ip:
            return True

        # Check affected systems
        if set(incident.affected_systems) & set(threat.affected_systems):
            return True

        # Check indicators
        if set(incident.indicators) & set(threat.indicators):
            return True

        return False

    async def _notify_incident_created(self, incident: SecurityIncident) -> None:
        """Send notification for incident creation.

        Args:
            incident: Created incident
        """
        self.notification_manager.emit_notification(
            user_id=incident.assigned_to or "all",
            notification_type="incident_created",
            data={
                "title": f"New Security Incident: {incident.title}",
                "message": f"Severity: {incident.severity.value}\nType: {incident.incident_type.value}",
                "incident": incident.to_dict(),
            },
        )

    async def _notify_status_updated(self, incident: SecurityIncident) -> None:
        """Send notification for status update.

        Args:
            incident: Updated incident
        """
        self.notification_manager.emit_notification(
            user_id=incident.assigned_to or "all",
            notification_type="incident_status_updated",
            data={
                "title": f"Incident Status Updated: {incident.title}",
                "message": f"New Status: {incident.status.value}",
                "incident": incident.to_dict(),
            },
        )

    async def start_monitoring(self, incident_id: str) -> None:
        """Start monitoring an incident.

        Args:
            incident_id: ID of the incident to monitor
        """
        if incident_id in self._monitoring_tasks:
            return

        task = asyncio.create_task(self._monitor_incident(incident_id))
        self._monitoring_tasks[incident_id] = task

    async def stop_monitoring(self, incident_id: str) -> None:
        """Stop monitoring an incident.

        Args:
            incident_id: ID of the incident to stop monitoring
        """
        task = self._monitoring_tasks.pop(incident_id, None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

    async def _monitor_incident(self, incident_id: str) -> None:
        """Monitor an incident for changes and updates.

        Args:
            incident_id: ID of the incident to monitor
        """
        try:
            incident = await self.get_incident(incident_id)
            if not incident:
                return

            while incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                # Collect metrics
                metrics_snapshot = self.metrics_collector.collect()
                incident.add_metrics_snapshot(metrics_snapshot)

                # Check for related threats
                threats = await self._check_related_threats(incident)
                for threat in threats:
                    incident.add_threat_finding(threat)

                # Check for vulnerabilities
                vulnerabilities = await self._check_vulnerabilities(incident)
                for vuln in vulnerabilities:
                    incident.add_vulnerability_finding(vuln)

                # Save updates
                await self._save_incident(incident)

                # Send notifications
                await self._notify_incident_updated(incident)

                await asyncio.sleep(60)  # Check every minute

        except Exception as e:
            logger.error(f"Error monitoring incident {incident_id}: {str(e)}")
            INCIDENT_ERRORS.labels(operation="monitor").inc()
        finally:
            if incident_id in self._monitoring_tasks:
                del self._monitoring_tasks[incident_id]

    async def _check_related_threats(self, incident: SecurityIncident) -> List[ThreatFinding]:
        """Check for threats related to an incident.

        Args:
            incident: Incident to check

        Returns:
            List[ThreatFinding]: List of related threats
        """
        # TODO: Implement threat correlation logic
        return []

    async def _check_vulnerabilities(self, incident: SecurityIncident) -> List[VulnerabilityFinding]:
        """Check for vulnerabilities related to an incident.

        Args:
            incident: Incident to check

        Returns:
            List[VulnerabilityFinding]: List of related vulnerabilities
        """
        # TODO: Implement vulnerability correlation logic
        return []

    async def _notify_incident_updated(self, incident: SecurityIncident) -> None:
        """Send notification for incident update.

        Args:
            incident: Updated incident
        """
        self.notification_manager.emit_notification(
            user_id=incident.assigned_to or "all",
            notification_type="incident_updated",
            data={
                "title": f"Incident Updated: {incident.title}",
                "message": f"Status: {incident.status.value}\nSeverity: {incident.severity.value}",
                "incident": incident.to_dict(),
            },
        )

    async def add_evidence(self, incident_id: str, evidence_data: Dict) -> SecurityIncident:
        """Add evidence to an incident.

        Args:
            incident_id: ID of the incident
            evidence_data: Evidence data to add

        Returns:
            SecurityIncident: Updated incident
        """
        try:
            incident = await self.get_incident(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            incident.add_evidence(evidence_data)
            db.session.commit()

            return incident

        except Exception as e:
            logger.error(f"Failed to add evidence: {str(e)}")
            INCIDENT_ERRORS.labels(operation="add_evidence").inc()
            raise

    async def add_finding(
        self, incident_id: str, finding: Union[ThreatFinding, VulnerabilityFinding]
    ) -> SecurityIncident:
        """Add a finding to an incident.

        Args:
            incident_id: ID of the incident
            finding: Finding to add

        Returns:
            SecurityIncident: Updated incident
        """
        try:
            incident = await self.get_incident(incident_id)
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            finding_data = {
                "type": "threat" if isinstance(finding, ThreatFinding) else "vulnerability",
                "description": finding.description,
                "severity": finding.severity,
                "data": finding.to_dict(),
            }
            incident.add_finding(finding_data)
            db.session.commit()

            return incident

        except Exception as e:
            logger.error(f"Failed to add finding: {str(e)}")
            INCIDENT_ERRORS.labels(operation="add_finding").inc()
            raise
