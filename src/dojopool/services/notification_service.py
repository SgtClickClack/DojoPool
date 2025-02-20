"""Notification service."""

import json
import logging
import os
import smtplib
from dataclasses import dataclass
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from enum import Enum
from typing import Dict, List, Optional

from flask_socketio import emit

from ..core.extensions import db
from ..models.notification import Notification, NotificationType


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class AlertChannel(Enum):
    EMAIL = "email"
    IN_APP = "in_app"


@dataclass
class Alert:
    title: str
    message: str
    severity: AlertSeverity
    timestamp: datetime
    metric_name: str
    current_value: float
    threshold_value: float
    channel: List[AlertChannel]


class NotificationService:
    """Service for managing notifications."""

    def __init__(
        self, email_config: Optional[Dict] = None, log_file: str = "notifications.log"
    ):
        self.email_config = email_config or {}
        self._setup_logging(log_file)

    def _setup_logging(self, log_file: str):
        """Set up logging for the notification service."""
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
        )
        self.logger.addHandler(handler)

    @staticmethod
    def send_notification(
        user_id: int, type: str, title: str, message: str, data: Optional[Dict] = None
    ) -> None:
        """Send a notification to a user."""
        notification = Notification(
            user_id=user_id, type=type, title=title, message=message, data=data
        )
        db.session.add(notification)
        db.session.commit()

        # Emit socket event
        emit("notification", notification.to_dict(), room=str(user_id))

    @staticmethod
    def send_game_invite(from_user: int, to_user: int, game_id: int):
        """Send a game invite notification."""
        NotificationService.send_notification(
            to_user,
            NotificationType.GAME_INVITE,
            "Game Invite",
            f"You have been invited to a game",
            {"from_user": from_user, "game_id": game_id},
        )

    @staticmethod
    def send_tournament_invite(tournament_id: int, to_user: int):
        """Send a tournament invite notification."""
        NotificationService.send_notification(
            to_user,
            NotificationType.TOURNAMENT_INVITE,
            "Tournament Invite",
            f"You have been invited to a tournament",
            {"tournament_id": tournament_id},
        )

    @staticmethod
    def mark_all_as_read(user_id: int):
        """Mark all notifications as read for a user."""
        Notification.query.filter_by(user_id=user_id, read=False).update({"read": True})
        db.session.commit()

    def _format_alert_message(self, alert: Alert) -> str:
        """Format an alert message."""
        return f"""
        {alert.title}
        
        {alert.message}
        
        Metric: {alert.metric_name}
        Current Value: {alert.current_value}
        Threshold: {alert.threshold_value}
        Severity: {alert.severity.value}
        Time: {alert.timestamp.isoformat()}
        """
