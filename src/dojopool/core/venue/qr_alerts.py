"""Automated alert system for QR code monitoring."""

import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Callable, Dict, List, Optional, Set

from .qr_stats import qr_stats


class AlertSeverity(Enum):
    """Alert severity levels."""

    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class AlertType(Enum):
    """Types of QR code alerts."""

    HIGH_ERROR_RATE = "high_error_rate"
    SLOW_SCAN_TIME = "slow_scan_time"
    EXPIRED_CODES = "expired_codes"
    REPEATED_ERRORS = "repeated_errors"
    LOW_SUCCESS_RATE = "low_success_rate"
    UNUSUAL_ACTIVITY = "unusual_activity"


@dataclass
class AlertConfig:
    """Configuration for an alert type."""

    enabled: bool = True
    severity: AlertSeverity = AlertSeverity.WARNING
    threshold: float = 0.0
    cooldown: int = 300  # seconds
    notify_channels: List[str] = field(default_factory=lambda: ["email"])


@dataclass
class Alert:
    """Alert instance."""

    type: AlertType
    severity: AlertSeverity
    message: str
    venue_id: Optional[str]
    table_id: Optional[str]
    timestamp: datetime
    details: Dict
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None


class QRAlertManager:
    """Manager for QR code alerts."""

    def __init__(self):
        """Initialize alert manager."""
        self._lock = threading.Lock()
        self.alerts: List[Alert] = []
        self.active_alerts: Set[str] = set()
        self.alert_configs: Dict[AlertType, AlertConfig] = {
            AlertType.HIGH_ERROR_RATE: AlertConfig(
                threshold=0.2, severity=AlertSeverity.ERROR  # 20% error rate
            ),
            AlertType.SLOW_SCAN_TIME: AlertConfig(
                threshold=5.0, severity=AlertSeverity.WARNING  # 5 seconds
            ),
            AlertType.EXPIRED_CODES: AlertConfig(
                threshold=0.1, severity=AlertSeverity.WARNING  # 10% expired codes
            ),
            AlertType.REPEATED_ERRORS: AlertConfig(
                threshold=3, severity=AlertSeverity.ERROR  # 3 same errors in 5 minutes
            ),
            AlertType.LOW_SUCCESS_RATE: AlertConfig(
                threshold=0.8, severity=AlertSeverity.WARNING  # 80% success rate
            ),
            AlertType.UNUSUAL_ACTIVITY: AlertConfig(
                threshold=2.0, severity=AlertSeverity.INFO  # 2x standard deviation
            ),
        }
        self.alert_handlers: Dict[str, Callable] = {}

        # Start monitoring thread
        self._stop_monitoring = False
        self._monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self._monitor_thread.start()

    def register_handler(self, channel: str, handler: Callable) -> None:
        """Register alert handler for a notification channel.

        Args:
            channel: Notification channel (e.g., 'email', 'slack')
            handler: Handler function for the channel
        """
        with self._lock:
            self.alert_handlers[channel] = handler

    def configure_alert(self, alert_type: AlertType, config: AlertConfig) -> None:
        """Configure an alert type.

        Args:
            alert_type: Type of alert to configure
            config: Alert configuration
        """
        with self._lock:
            self.alert_configs[alert_type] = config

    def get_alerts(
        self,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        severity: Optional[AlertSeverity] = None,
        include_acknowledged: bool = False,
        days: Optional[int] = None,
    ) -> List[Alert]:
        """Get alerts matching criteria.

        Args:
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            severity: Optional severity level to filter by
            include_acknowledged: Whether to include acknowledged alerts
            days: Optional number of days to limit to

        Returns:
            List[Alert]: Matching alerts
        """
        with self._lock:
            cutoff = None
            if days:
                cutoff = datetime.utcnow() - timedelta(days=days)

            return [
                alert
                for alert in self.alerts
                if (not venue_id or alert.venue_id == venue_id)
                and (not table_id or alert.table_id == table_id)
                and (not severity or alert.severity == severity)
                and (include_acknowledged or not alert.acknowledged)
                and (not cutoff or alert.timestamp >= cutoff)
            ]

    def acknowledge_alert(self, alert_id: int, user_id: str) -> bool:
        """Acknowledge an alert.

        Args:
            alert_id: Index of alert to acknowledge
            user_id: ID of user acknowledging the alert

        Returns:
            bool: True if alert was acknowledged
        """
        with self._lock:
            if alert_id < 0 or alert_id >= len(self.alerts):
                return False

            alert = self.alerts[alert_id]
            if alert.acknowledged:
                return False

            alert.acknowledged = True
            alert.acknowledged_by = user_id
            alert.acknowledged_at = datetime.utcnow()

            # Remove from active alerts
            alert_key = self._get_alert_key(alert)
            self.active_alerts.discard(alert_key)

            return True

    def _monitor_loop(self) -> None:
        """Main monitoring loop."""
        while not self._stop_monitoring:
            try:
                self._check_alerts()
            except Exception as e:
                print(f"Error in alert monitoring: {str(e)}")

            time.sleep(60)  # Check every minute

    def _check_alerts(self) -> None:
        """Check for alert conditions."""
        with self._lock:
            # Check each venue
            for venue_id in qr_stats.venue_stats.keys():
                stats = qr_stats.get_venue_stats(venue_id, days=1)
                if not stats:
                    continue

                # Check error rate
                if stats["total_scans"] > 0:
                    error_rate = stats["failed_scans"] / stats["total_scans"]
                    if error_rate >= self.alert_configs[AlertType.HIGH_ERROR_RATE].threshold:
                        self._create_alert(
                            AlertType.HIGH_ERROR_RATE,
                            f"High error rate ({error_rate*100:.1f}%) detected",
                            venue_id=venue_id,
                            details={"error_rate": error_rate},
                        )

                # Check success rate
                if stats["total_scans"] > 0:
                    success_rate = stats["successful_scans"] / stats["total_scans"]
                    if success_rate <= self.alert_configs[AlertType.LOW_SUCCESS_RATE].threshold:
                        self._create_alert(
                            AlertType.LOW_SUCCESS_RATE,
                            f"Low success rate ({success_rate*100:.1f}%)",
                            venue_id=venue_id,
                            details={"success_rate": success_rate},
                        )

                # Check scan time
                if (
                    stats["avg_scan_duration"]
                    >= self.alert_configs[AlertType.SLOW_SCAN_TIME].threshold
                ):
                    self._create_alert(
                        AlertType.SLOW_SCAN_TIME,
                        f"Slow average scan time ({stats['avg_scan_duration']:.2f}s)",
                        venue_id=venue_id,
                        details={"scan_duration": stats["avg_scan_duration"]},
                    )

                # Check for repeated errors
                error_report = qr_stats.get_error_report(venue_id=venue_id, days=1)
                if error_report["total_errors"] > 0:
                    error_counts = {}
                    recent_cutoff = datetime.utcnow() - timedelta(minutes=5)

                    for error in error_report["errors"]:
                        if datetime.fromisoformat(error["timestamp"]) >= recent_cutoff:
                            error_type = error["error_type"]
                            error_counts[error_type] = error_counts.get(error_type, 0) + 1

                    for error_type, count in error_counts.items():
                        if count >= self.alert_configs[AlertType.REPEATED_ERRORS].threshold:
                            self._create_alert(
                                AlertType.REPEATED_ERRORS,
                                f"Repeated errors of type '{error_type}'",
                                venue_id=venue_id,
                                details={"error_type": error_type, "count": count},
                            )

    def _create_alert(
        self,
        alert_type: AlertType,
        message: str,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        details: Optional[Dict] = None,
    ) -> None:
        """Create and process a new alert.

        Args:
            alert_type: Type of alert
            message: Alert message
            venue_id: Optional venue ID
            table_id: Optional table ID
            details: Optional alert details
        """
        config = self.alert_configs[alert_type]
        if not config.enabled:
            return

        # Check if similar alert is active
        alert_key = f"{alert_type}:{venue_id}:{table_id}"
        if alert_key in self.active_alerts:
            return

        # Create alert
        alert = Alert(
            type=alert_type,
            severity=config.severity,
            message=message,
            venue_id=venue_id,
            table_id=table_id,
            timestamp=datetime.utcnow(),
            details=details or {},
        )

        # Add to alerts list
        self.alerts.append(alert)
        self.active_alerts.add(alert_key)

        # Notify handlers
        for channel in config.notify_channels:
            handler = self.alert_handlers.get(channel)
            if handler:
                try:
                    handler(alert)
                except Exception as e:
                    print(f"Error in alert handler for {channel}: {str(e)}")

    def _get_alert_key(self, alert: Alert) -> str:
        """Get unique key for an alert.

        Args:
            alert: Alert instance

        Returns:
            str: Alert key
        """
        return f"{alert.type}:{alert.venue_id}:{alert.table_id}"


# Global instance
qr_alerts = QRAlertManager()
