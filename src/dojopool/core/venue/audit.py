from multiprocessing import Pool
from multiprocessing import Pool
"""Audit logging system for QR code operations."""

import json
import logging
import os
import threading
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class AuditEventType(Enum):
    """Types of audit events."""

    QR_GENERATE = "qr_generate"
    QR_VERIFY = "qr_verify"
    QR_REFRESH = "qr_refresh"
    ALERT_CREATE = "alert_create"
    ALERT_ACKNOWLEDGE = "alert_acknowledge"
    STATS_EXPORT = "stats_export"
    RATE_LIMIT_EXCEED = "rate_limit_exceed"
    RATE_LIMIT_BLOCK = "rate_limit_block"
    CONFIG_CHANGE = "config_change"


@dataclass
class AuditEvent:
    """Audit event data."""

    event_type: AuditEventType
    timestamp: datetime
    user_id: Optional[str]
    ip_address: Optional[str]
    resource_id: Optional[str]
    action: str
    status: str
    details: Dict[str, Any]
    venue_id: Optional[str] = None
    table_id: Optional[str] = None


class AuditLogger:
    """Manager for audit logging."""

    def __init__(
        self,
        log_dir: str = "logs/audit",
        retention_days: int = 90,
        max_file_size_mb: int = 100,
    ):
        """Initialize audit logger.

        Args:
            log_dir: Directory for audit log files
            retention_days: Days to retain audit logs
            max_file_size_mb: Maximum size of log files in MB
        """
        self._lock = threading.Lock()
        self.log_dir = log_dir
        self.retention_days = retention_days
        self.max_file_size = max_file_size_mb * 1024 * 1024

        # Create log directory if needed
        os.makedirs(log_dir, exist_ok=True)

        # Configure logger
        self.logger = logging.getLogger("audit")
        self.logger.setLevel(logging.INFO)

        # Add file handler
        self._setup_file_handler()

        # Start cleanup thread
        self._stop_cleanup = False
        self._cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._cleanup_thread.start()

    def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str],
        ip_address: Optional[str],
        resource_id: Optional[str],
        action: str,
        status: str,
        details: Dict[str, Any],
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
    ) -> None:
        """Log an audit event.

        Args:
            event_type: Type of event
            user_id: ID of user performing action
            ip_address: IP address of request
            resource_id: ID of affected resource
            action: Description of action
            status: Outcome status
            details: Additional event details
            venue_id: Optional venue ID
            table_id: Optional table ID
        """
        event = AuditEvent(
            event_type=event_type,
            timestamp=datetime.utcnow(),
            user_id=user_id,
            ip_address=ip_address,
            resource_id=resource_id,
            action=action,
            status=status,
            details=details,
            venue_id=venue_id,
            table_id=table_id,
        )

        with self._lock:
            # Check if rotation needed
            self._check_rotation()

            # Log event
            self.logger.info(
                json.dumps(
                    {
                        "event_type": event.event_type.value,
                        "timestamp": event.timestamp.isoformat(),
                        "user_id": event.user_id,
                        "ip_address": event.ip_address,
                        "resource_id": event.resource_id,
                        "action": event.action,
                        "status": event.status,
                        "details": event.details,
                        "venue_id": event.venue_id,
                        "table_id": event.table_id,
                    }
                )
            )

    def get_events(
        self,
        event_type: Optional[AuditEventType] = None,
        user_id: Optional[str] = None,
        venue_id: Optional[str] = None,
        table_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        status: Optional[str] = None,
    ):
        """Get audit events matching criteria.

        Args:
            event_type: Optional event type to filter by
            user_id: Optional user ID to filter by
            venue_id: Optional venue ID to filter by
            table_id: Optional table ID to filter by
            start_time: Optional start time for range
            end_time: Optional end time for range
            status: Optional status to filter by

        Returns:
            List[Dict]: Matching audit events
        """
        events = []

        # Get list of log files to search
        log_files = sorted(
            [
                f
                for f in os.listdir(self.log_dir)
                if f.startswith("audit_") and f.endswith(".log")
            ]
        )

        for log_file in log_files:
            file_path = os.path.join(self.log_dir, log_file)
            try:
                with open(file_path, "r") as f:
                    for line in f:
                        try:
                            event = json.loads(line)

                            # Apply filters
                            if event_type and event["event_type"] != event_type.value:
                                continue

                            if user_id and event["user_id"] != user_id:
                                continue

                            if venue_id and event["venue_id"] != venue_id:
                                continue

                            if table_id and event["table_id"] != table_id:
                                continue

                            if status and event["status"] != status:
                                continue

                            event_time = datetime.fromisoformat(event["timestamp"])
                            if start_time and event_time < start_time:
                                continue

                            if end_time and event_time > end_time:
                                continue

                            events.append(event)

                        except json.JSONDecodeError:
                            continue

            except IOError:
                continue

        return events

    def export_events(self, format: str = "json", **filters) -> Optional[bytes]:
        """Export audit events.

        Args:
            format: Export format (json or csv)
            **filters: Filters to apply

        Returns:
            Optional[bytes]: Export data
        """
        events = self.get_events(**filters)

        if not events:
            return None

        if format == "json":
            return json.dumps(
                {"generated_at": datetime.utcnow().isoformat(), "events": events},
                indent=2,
            ).encode()

        elif format == "csv":
            import csv
            from io import StringIO

            output = StringIO()
            writer = csv.writer(output)

            # Write header
            writer.writerow(
                [
                    "Timestamp",
                    "Event Type",
                    "User ID",
                    "IP Address",
                    "Resource ID",
                    "Action",
                    "Status",
                    "Venue ID",
                    "Table ID",
                    "Details",
                ]
            )

            # Write events
            for event in events:
                writer.writerow(
                    [
                        event["timestamp"],
                        event["event_type"],
                        event["user_id"] or "",
                        event["ip_address"] or "",
                        event["resource_id"] or "",
                        event["action"],
                        event["status"],
                        event["venue_id"] or "",
                        event["table_id"] or "",
                        json.dumps(event["details"]),
                    ]
                )

            return output.getvalue().encode()

        return None

    def _setup_file_handler(self):
        """Set up logging file handler."""
        current_date = datetime.utcnow().date()
        log_file = os.path.join(self.log_dir, f"audit_{current_date.isoformat()}.log")

        handler = logging.FileHandler(log_file)
        handler.setLevel(logging.INFO)

        self.logger.addHandler(handler)
        self._current_handler = handler
        self._current_log_file = log_file

    def _check_rotation(self):
        """Check if log file rotation is needed."""
        # Check date rotation
        current_date = datetime.utcnow().date()
        log_date = datetime.strptime(
            os.path.basename(self._current_log_file)[6:16], "%Y-%m-%d"
        ).date()

        if current_date != log_date:
            self.logger.removeHandler(self._current_handler)
            self._setup_file_handler()
            return

        # Check size rotation
        if os.path.getsize(self._current_log_file) >= self.max_file_size:
            # Create new file with timestamp
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            new_file = os.path.join(
                self.log_dir, f"audit_{current_date.isoformat()}_{timestamp}.log"
            )

            self.logger.removeHandler(self._current_handler)
            self._current_handler.close()

            # Rename current file
            os.rename(self._current_log_file, new_file)

            # Set up new handler
            self._setup_file_handler()

    def _cleanup_loop(self) -> None:
        """Background thread for cleaning up old log files."""
        while not self._stop_cleanup:
            try:
                self._cleanup_old_logs()
            except Exception as e:
                print(f"Error in audit log cleanup: {str(e)}")

            # Run daily
            import time

            time.sleep(86400)

    def _cleanup_old_logs(self):
        """Clean up old log files."""
        if not self.retention_days:
            return

        cutoff = datetime.utcnow().date() - timedelta(days=self.retention_days)

        for filename in os.listdir(self.log_dir):
            if not filename.startswith("audit_") or not filename.endswith(".log"):
                continue

            try:
                # Get date from filename
                file_date = datetime.strptime(filename[6:16], "%Y-%m-%d").date()

                if file_date < cutoff:
                    os.remove(os.path.join(self.log_dir, filename))

            except ValueError:
                continue


# Global instance
audit_logger = AuditLogger()
