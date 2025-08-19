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
from dojopool.core.security.threat_detection import ThreatFinding, ThreatDetector
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
                if self.storage_path:
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

    async def _load_incidents(self) -> None:
        """Load existing incidents from storage."""
        try:
            if not self.storage_path:
                return

            for file_path in self.storage_path.glob("incident_*.json"):
                try:
                    with open(file_path) as f:
                        data = json.load(f)
                        incident = SecurityIncident.from_dict(data)
                        self._active_incidents[incident.id] = incident
                except Exception as e:
                    self.logger.error(f"Error loading incident from {file_path}: {str(e)}")

        except Exception as e:
            self.logger.error(f"Error loading incidents: {str(e)}")
            INCIDENT_ERRORS.labels(operation="load").inc()

    async def _save_incident(self, incident: SecurityIncident) -> None:
        """Save incident to storage.

        Args:
            incident: Incident to save
        """
        try:
            if not self.storage_path:
                return

            file_path = self.storage_path / f"incident_{incident.id}.json"
            with open(file_path, "w") as f:
                json.dump(incident.to_dict(), f, indent=2)

        except Exception as e:
            self.logger.error(f"Error saving incident: {str(e)}")
            INCIDENT_ERRORS.labels(operation="save").inc()
            raise

    async def _monitor_incidents(self) -> None:
        """Monitor active incidents."""
        while True:
            try:
                # Check each active incident
                for incident_id, incident in list(self._active_incidents.items()):
                    if incident.status not in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                        # Start monitoring if not already monitored
                        if incident_id not in self._monitoring_tasks:
                            self._monitoring_tasks[incident_id] = asyncio.create_task(
                                self._monitor_incident(incident_id)
                            )

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                self.logger.error(f"Error monitoring incidents: {str(e)}")
                await asyncio.sleep(60)  # Wait before retry

    async def _cleanup_old_incidents(self) -> None:
        """Clean up old resolved incidents."""
        while True:
            try:
                # Get current time
                now = datetime.now()

                # Check each active incident
                for incident_id, incident in list(self._active_incidents.items()):
                    if incident.status in [IncidentStatus.RESOLVED, IncidentStatus.CLOSED]:
                        # Remove if older than retention period
                        if now - incident.last_updated > timedelta(days=30):
                            del self._active_incidents[incident_id]

                await asyncio.sleep(3600)  # Check every hour

            except Exception as e:
                self.logger.error(f"Error cleaning up incidents: {str(e)}")
                await asyncio.sleep(3600)  # Wait before retry

    async def _check_related_threats(self, incident: SecurityIncident) -> List[ThreatFinding]:
        """Check for threats related to an incident.

        Args:
            incident: Incident to check

        Returns:
            List[ThreatFinding]: Related threats
        """
        try:
            # Get event from incident
            event = self._create_security_event(incident)

            # Detect threats
            threats = await self.threat_detector.detect_threats(event)
            if threats:
                return [threats]

            return []

        except Exception as e:
            self.logger.error(f"Error checking related threats: {str(e)}")
            return []

    async def _check_vulnerabilities(self, incident: SecurityIncident) -> List[VulnerabilityFinding]:
        """Check for vulnerabilities related to an incident.

        Args:
            incident: Incident to check

        Returns:
            List[VulnerabilityFinding]: Related vulnerabilities
        """
        try:
            # Get scan results
            scan_results = await self.scanner_manager.scan(incident.affected_systems)
            return scan_results

        except Exception as e:
            self.logger.error(f"Error checking vulnerabilities: {str(e)}")
            return []

    def _create_security_event(self, incident: SecurityIncident) -> Any:
        """Create security event from incident.

        Args:
            incident: Source incident

        Returns:
            SecurityEvent: Created event
        """
        # Convert incident to security event
        return {
            "timestamp": incident.created_at,
            "source_ip": incident.source_ip,
            "event_type": incident.incident_type.value,
            "severity": incident.severity.value,
            "details": incident.details,
        }

    async def start_monitoring(self, incident_id: str) -> None:
        """Start monitoring an incident.

        Args:
            incident_id: ID of the incident to monitor
        """
        try:
            if incident_id not in self._monitoring_tasks:
                self._monitoring_tasks[incident_id] = asyncio.create_task(
                    self._monitor_incident(incident_id)
                )
        except Exception as e:
            self.logger.error(f"Error starting monitoring: {str(e)}")
            INCIDENT_ERRORS.labels(operation="start_monitoring").inc()

    async def stop_monitoring(self, incident_id: str) -> None:
        """Stop monitoring an incident.

        Args:
            incident_id: ID of the incident to stop monitoring
        """
        try:
            if incident_id in self._monitoring_tasks:
                task = self._monitoring_tasks[incident_id]
                task.cancel()
                del self._monitoring_tasks[incident_id]
        except Exception as e:
            self.logger.error(f"Error stopping monitoring: {str(e)}")
            INCIDENT_ERRORS.labels(operation="stop_monitoring").inc() 