"""Room logger class for managing room-related logging."""

import json
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any, Dict, List, Optional

from .query_builder import LogQueryBuilder


class RoomLogger:
    """Room logger class."""

    def __init__(self, log_dir: str):
        """Initialize RoomLogger.

        Args:
            log_dir: Directory for log files
        """
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        # Set up log files
        self.events_log = self.log_dir / "room_events.log"
        self.access_log = self.log_dir / "room_access.log"
        self.error_log = self.log_dir / "room_errors.log"
        self.audit_log = self.log_dir / "room_audit.log"

        # Set up loggers
        formatter = logging.Formatter(
            '{"timestamp": "%(asctime)s", "level": "%(levelname)s", %(message)s}',
            datefmt="%Y-%m-%dT%H:%M:%S",
        )

        self.events_logger = self._setup_logger(
            "room_events", self.events_log, formatter
        )
        self.access_logger = self._setup_logger(
            "room_access", self.access_log, formatter
        )
        self.error_logger = self._setup_logger("room_errors", self.error_log, formatter)
        self.audit_logger = self._setup_logger("room_audit", self.audit_log, formatter)

    def _setup_logger(
        self, name: str, log_file: Path, formatter: logging.Formatter
    ) -> logging.Logger:
        """Set up logger instance.

        Args:
            name: Logger name
            log_file: Log file path
            formatter: Log formatter

        Returns:
            logging.Logger: Configured logger
        """
        logger = logging.getLogger(name)
        logger.setLevel(logging.INFO)

        # Add rotating file handler
        handler = RotatingFileHandler(
            log_file, maxBytes=10 * 1024 * 1024, backupCount=5
        )  # 10MB
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        return logger

    def log_room_event(
        self,
        event_type: str,
        room_id: str,
        user_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
    ):
        """Log room event.

        Args:
            event_type: Event type
            room_id: Room ID
            user_id: Optional user ID
            data: Optional event data
        """
        message = (
            f'"event_type": "{event_type}", '
            f'"room_id": "{room_id}", '
            f'"user_id": "{user_id or ""}", '
            f'"data": {json.dumps(data or {})}'
        )
        self.events_logger.info(message)

    def log_room_access(
        self,
        action: str,
        room_id: str,
        user_id: Optional[str] = None,
        success: bool = True,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Log room access attempt.

        Args:
            action: Access action
            room_id: Room ID
            user_id: Optional user ID
            success: Whether access was successful
            details: Optional access details
        """
        message = (
            f'"action": "{action}", '
            f'"room_id": "{room_id}", '
            f'"user_id": "{user_id or ""}", '
            f'"success": {str(success).lower()}, '
            f'"details": {json.dumps(details or {})}'
        )
        self.access_logger.info(message)

    def log_room_error(
        self,
        error_type: str,
        room_id: str,
        user_id: Optional[str] = None,
        error: Optional[Exception] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        """Log room error.

        Args:
            error_type: Error type
            room_id: Room ID
            user_id: Optional user ID
            error: Error exception
            details: Optional error details
        """
        message = (
            f'"error_type": "{error_type}", '
            f'"room_id": "{room_id}", '
            f'"user_id": "{user_id or ""}", '
            f'"error": "{str(error) if error else ""}", '
            f'"details": {json.dumps(details or {})}'
        )
        self.error_logger.error(message)

    def log_room_audit(
        self,
        action: str,
        room_id: str,
        user_id: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log room audit event.

        Args:
            action: Audit action
            room_id: Room ID
            user_id: User ID
            details: Optional audit details
        """
        message = (
            f'"action": "{action}", '
            f'"room_id": "{room_id}", '
            f'"user_id": "{user_id}", '
            f'"details": {json.dumps(details or {})}'
        )
        self.audit_logger.info(message)

    def get_room_events(
        self,
        room_id: str,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        """Get room events from log.

        Args:
            room_id: Room ID
            event_type: Optional event type filter
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[Dict[str, Any]]: List of room events
        """
        query = LogQueryBuilder(str(self.events_log)).filter_by_room(room_id)

        if event_type:
            query.filter_by_event_type(event_type)

        if start_time or end_time:
            query.time_range(start_time, end_time)

        return query.execute()

    def get_room_access_logs(
        self,
        room_id: str,
        user_id: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        """Get room access logs.

        Args:
            room_id: Room ID
            user_id: Optional user ID filter
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[Dict[str, Any]]: List of access logs
        """
        query = LogQueryBuilder(str(self.access_log)).filter_by_room(room_id)

        if user_id:
            query.filter_by_user(user_id)

        if start_time or end_time:
            query.time_range(start_time, end_time)

        return query.execute()

    def get_room_audit_logs(
        self,
        room_id: str,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ):
        """Get room audit logs.

        Args:
            room_id: Room ID
            user_id: Optional user ID filter
            action: Optional action filter
            start_time: Optional start time filter
            end_time: Optional end time filter

        Returns:
            List[Dict[str, Any]]: List of audit logs
        """
        query = LogQueryBuilder(str(self.audit_log)).filter_by_room(room_id)

        if user_id:
            query.filter_by_user(user_id)

        if action:
            query.filter_by_action(action)

        if start_time or end_time:
            query.time_range(start_time, end_time)

        return query.execute()


# Global room logger instance
room_logger = RoomLogger("logs/rooms")
