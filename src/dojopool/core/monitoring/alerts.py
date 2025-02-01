"""Alert system for monitoring performance and security issues."""

import logging
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
registry = CollectorRegistry()

ALERT_COUNTER = Counter(
    "alerts_total", "Total number of alerts triggered", ["type", "severity"], registry=registry
)

ALERT_LATENCY = Histogram(
    "alert_notification_latency_seconds",
    "Time taken to send alert notifications",
    registry=registry,
)


class AlertSeverity:
    """Alert severity levels."""

    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AlertType:
    """Alert types."""

    PERFORMANCE = "performance"
    SECURITY = "security"
    ERROR = "error"
    RESOURCE = "resource"


class Alert:
    """Alert class for storing alert information."""

    def __init__(
        self,
        title: str,
        message: str,
        severity: str,
        alert_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        self.title = title
        self.message = message
        self.severity = severity
        self.type = alert_type
        self.metadata = metadata or {}
        self.timestamp = datetime.now()
        self.resolved = False
        self.resolved_at: Optional[datetime] = None
        self.notification_sent = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        return {
            "title": self.title,
            "message": self.message,
            "severity": self.severity,
            "type": self.type,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat(),
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
        }


class AlertManager:
    """Alert manager for handling alerts and notifications."""

    def __init__(self):
        self.alerts: List[Alert] = []
        self.handlers: Dict[str, List[Callable]] = {
            AlertSeverity.CRITICAL: [],
            AlertSeverity.HIGH: [],
            AlertSeverity.MEDIUM: [],
            AlertSeverity.LOW: [],
        }

        # Load configuration
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load alert configuration."""
        config_path = os.path.join(os.path.dirname(__file__), "alert_config.json")

        try:
            with open(config_path, "r") as f:
                return json.load(f)
        except FileNotFoundError:
            # Return default configuration
            return {
                "thresholds": {
                    "api_response_time": 100,  # ms
                    "page_load_time": 3000,  # ms
                    "error_rate": 1,  # percent
                    "memory_usage": 80,  # percent
                    "cpu_usage": 70,  # percent
                },
                "notification": {
                    "email": {
                        "enabled": False,
                        "smtp_host": "smtp.gmail.com",
                        "smtp_port": 587,
                        "username": "",
                        "password": "",
                        "recipients": [],
                    },
                    "slack": {"enabled": False, "webhook_url": ""},
                },
            }

    def add_handler(self, severity: str, handler: Callable) -> None:
        """Add alert handler for severity level."""
        if severity in self.handlers:
            self.handlers[severity].append(handler)

    def trigger_alert(
        self,
        title: str,
        message: str,
        severity: str,
        alert_type: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        """Trigger a new alert."""
        alert = Alert(title, message, severity, alert_type, metadata)
        self.alerts.append(alert)

        # Update Prometheus metrics
        ALERT_COUNTER.labels(type=alert_type, severity=severity).inc()

        # Handle alert based on severity
        self._handle_alert(alert)

        return alert

    def _handle_alert(self, alert: Alert) -> None:
        """Handle alert based on severity."""
        handlers = self.handlers.get(alert.severity, [])

        for handler in handlers:
            try:
                with ALERT_LATENCY.time():
                    handler(alert)
            except Exception as e:
                logger.error(f"Error in alert handler: {str(e)}")

    def resolve_alert(self, alert: Alert) -> None:
        """Mark alert as resolved."""
        alert.resolved = True
        alert.resolved_at = datetime.now()

    def get_active_alerts(
        self, severity: Optional[str] = None, alert_type: Optional[str] = None
    ) -> List[Alert]:
        """Get list of active alerts."""
        alerts = [a for a in self.alerts if not a.resolved]

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        if alert_type:
            alerts = [a for a in alerts if a.type == alert_type]

        return alerts

    def send_email_notification(self, alert: Alert) -> None:
        """Send email notification for alert."""
        if not self.config["notification"]["email"]["enabled"]:
            return

        try:
            msg = MIMEMultipart()
            msg["Subject"] = f"[{alert.severity.upper()}] {alert.title}"
            msg["From"] = self.config["notification"]["email"]["username"]
            msg["To"] = ", ".join(self.config["notification"]["email"]["recipients"])

            body = f"""
            Alert Details:
            -------------
            Type: {alert.type}
            Severity: {alert.severity}
            Time: {alert.timestamp}
            
            {alert.message}
            
            Additional Information:
            {json.dumps(alert.metadata, indent=2)}
            """

            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP(
                self.config["notification"]["email"]["smtp_host"],
                self.config["notification"]["email"]["smtp_port"],
            ) as server:
                server.starttls()
                server.login(
                    self.config["notification"]["email"]["username"],
                    self.config["notification"]["email"]["password"],
                )
                server.send_message(msg)

            alert.notification_sent = True

        except Exception as e:
            logger.error(f"Failed to send email notification: {str(e)}")

    def send_slack_notification(self, alert: Alert) -> None:
        """Send Slack notification for alert."""
        if not self.config["notification"]["slack"]["enabled"]:
            return

        try:
            import requests

            color = {
                AlertSeverity.CRITICAL: "#FF0000",
                AlertSeverity.HIGH: "#FFA500",
                AlertSeverity.MEDIUM: "#FFFF00",
                AlertSeverity.LOW: "#00FF00",
            }.get(alert.severity, "#808080")

            payload = {
                "attachments": [
                    {
                        "color": color,
                        "title": alert.title,
                        "text": alert.message,
                        "fields": [
                            {"title": "Type", "value": alert.type, "short": True},
                            {"title": "Severity", "value": alert.severity, "short": True},
                        ],
                        "footer": f"Alert triggered at {alert.timestamp}",
                    }
                ]
            }

            requests.post(self.config["notification"]["slack"]["webhook_url"], json=payload)

            alert.notification_sent = True

        except Exception as e:
            logger.error(f"Failed to send Slack notification: {str(e)}")


# Create global instance
alert_manager = AlertManager()

# Add default handlers
alert_manager.add_handler(AlertSeverity.CRITICAL, alert_manager.send_email_notification)
alert_manager.add_handler(AlertSeverity.CRITICAL, alert_manager.send_slack_notification)
alert_manager.add_handler(AlertSeverity.HIGH, alert_manager.send_slack_notification)
