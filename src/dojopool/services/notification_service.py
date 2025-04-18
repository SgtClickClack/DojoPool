"""Notification service."""

from flask_socketio import emit
import os
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests

from dojopool.models.notification import Notification, NotificationType
from dojopool.core.extensions import db
from dojopool.models.user import User


class AlertSeverity(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

class AlertChannel(Enum):
    EMAIL = "email"
    SLACK = "slack"
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
        self,
        email_config: Optional[Dict] = None,
        slack_config: Optional[Dict] = None,
        log_file: str = "notifications.log"
    ):
        self.email_config = email_config or {}
        self.slack_config = slack_config or {}
        self._setup_logging(log_file)

    def _setup_logging(self, log_file: str):
        """Set up logging for notifications"""
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        handler = logging.FileHandler(log_file)
        handler.setFormatter(
            logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        )
        self.logger.addHandler(handler)

    @staticmethod
    def send_notification(user_id, type, title, message, data=None):
        """Send a notification to a user."""
        # Create notification in database
        notification = Notification.create(
            user_id=user_id, type=type, title=title, message=message, data=data
        )

        # Emit real-time notification
        emit("new_notification", notification.to_dict(), room=f"user_{user_id}")

        return notification

    @staticmethod
    def send_game_invite(from_user, to_user, game_id):
        """Send a game invitation notification."""
        return NotificationService.send_notification(
            user_id=to_user.id,
            type=NotificationType.GAME_INVITE,
            title=f"Game Invitation from {from_user.username}",
            message=f"{from_user.username} has invited you to a game!",
            data={"game_id": game_id, "from_user_id": from_user.id},
        )

    @staticmethod
    def send_tournament_invite(tournament, to_user):
        """Send a tournament invitation notification."""
        return NotificationService.send_notification(
            user_id=to_user.id,
            type=NotificationType.TOURNAMENT_INVITE,
            title=f"Tournament Invitation: {tournament.name}",
            message=f"You have been invited to join the tournament: {tournament.name}",
            data={"tournament_id": tournament.id},
        )

    @staticmethod
    def send_game_start(game, user_id):
        """Send a game start notification."""
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.GAME_START,
            title="Game Starting",
            message="Your game is about to begin!",
            data={"game_id": game.id},
        )

    @staticmethod
    def send_game_end(game, user_id, is_winner):
        """Send a game end notification."""
        message = (
            "Congratulations! You won the game!"
            if is_winner
            else "Game Over. Better luck next time!"
        )
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.GAME_END,
            title="Game Ended",
            message=message,
            data={"game_id": game.id, "is_winner": is_winner},
        )

    @staticmethod
    def send_achievement_notification(user_id, achievement):
        """Send an achievement notification."""
        return NotificationService.send_notification(
            user_id=user_id,
            type=NotificationType.ACHIEVEMENT,
            title="Achievement Unlocked!",
            message=f"Congratulations! You earned the achievement: {achievement.name}",
            data={"achievement_id": achievement.id},
        )

    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user."""
        notifications = Notification.query.filter_by(user_id=user_id, status="unread").all()

        for notification in notifications:
            notification.mark_as_read()

        db.session.commit()

    async def send_alert(self, alert: Alert):
        """Send an alert through specified channels"""
        self.logger.info(f"Sending alert: {alert.title} ({alert.severity.value})")

        for channel in alert.channel:
            try:
                if channel == AlertChannel.EMAIL:
                    await self._send_email_alert(alert)
                elif channel == AlertChannel.SLACK:
                    await self._send_slack_alert(alert)
                elif channel == AlertChannel.IN_APP:
                    await self._send_in_app_alert(alert)
            except Exception as e:
                self.logger.error(f"Failed to send alert via {channel.value}: {str(e)}")

    async def _send_email_alert(self, alert: Alert):
        """Send alert via email"""
        if not self.email_config:
            self.logger.warning("Email configuration not provided")
            return

        msg = MIMEMultipart()
        msg['From'] = self.email_config.get('from_email')
        msg['To'] = self.email_config.get('to_email')
        msg['Subject'] = f"DojoPool Performance Alert: {alert.title}"

        body = self._format_alert_message(alert)
        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP(
            self.email_config.get('smtp_host', 'smtp.gmail.com'),
            self.email_config.get('smtp_port', 587)
        ) as server:
            server.starttls()
            server.login(
                self.email_config.get('username'),
                self.email_config.get('password')
            )
            server.send_message(msg)

        self.logger.info(f"Email alert sent: {alert.title}")

    async def _send_slack_alert(self, alert: Alert):
        """Send alert via Slack webhook"""
        if not self.slack_config or 'webhook_url' not in self.slack_config:
            self.logger.warning("Slack webhook URL not provided")
            return

        color_map = {
            AlertSeverity.INFO: "#36a64f",
            AlertSeverity.WARNING: "#ffa500",
            AlertSeverity.CRITICAL: "#ff0000"
        }

        payload = {
            "attachments": [{
                "color": color_map[alert.severity],
                "title": alert.title,
                "text": alert.message,
                "fields": [
                    {
                        "title": "Metric",
                        "value": alert.metric_name,
                        "short": True
                    },
                    {
                        "title": "Current Value",
                        "value": str(alert.current_value),
                        "short": True
                    },
                    {
                        "title": "Threshold",
                        "value": str(alert.threshold_value),
                        "short": True
                    },
                    {
                        "title": "Severity",
                        "value": alert.severity.value.upper(),
                        "short": True
                    }
                ],
                "footer": f"DojoPool Performance Monitor • {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
            }]
        }

        response = requests.post(
            self.slack_config['webhook_url'],
            json=payload
        )
        response.raise_for_status()
        self.logger.info(f"Slack alert sent: {alert.title}")

    async def _send_in_app_alert(self, alert: Alert):
        """Store alert for in-app notification"""
        alert_data = {
            "id": str(hash(f"{alert.timestamp}{alert.title}")),
            "title": alert.title,
            "message": alert.message,
            "severity": alert.severity.value,
            "timestamp": alert.timestamp.isoformat(),
            "metric_name": alert.metric_name,
            "current_value": alert.current_value,
            "threshold_value": alert.threshold_value,
            "read": False
        }

        # Store in a file for now (in a real app, this would go to a database)
        alerts_file = "in_app_alerts.json"
        try:
            if os.path.exists(alerts_file):
                with open(alerts_file, 'r') as f:
                    alerts = json.load(f)
            else:
                alerts = []

            alerts.append(alert_data)
            
            # Keep only last 100 alerts
            alerts = alerts[-100:]

            with open(alerts_file, 'w') as f:
                json.dump(alerts, f, indent=2)

            self.logger.info(f"In-app alert stored: {alert.title}")
        except Exception as e:
            self.logger.error(f"Failed to store in-app alert: {str(e)}")

    def _format_alert_message(self, alert: Alert) -> str:
        """Format alert message in HTML"""
        color_map = {
            AlertSeverity.INFO: "#36a64f",
            AlertSeverity.WARNING: "#ffa500",
            AlertSeverity.CRITICAL: "#ff0000"
        }

        return f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: {color_map[alert.severity]};">{alert.title}</h2>
                    <p style="font-size: 16px;">{alert.message}</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                        <p><strong>Metric:</strong> {alert.metric_name}</p>
                        <p><strong>Current Value:</strong> {alert.current_value}</p>
                        <p><strong>Threshold:</strong> {alert.threshold_value}</p>
                        <p><strong>Severity:</strong> {alert.severity.value.upper()}</p>
                        <p><strong>Time:</strong> {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
                    </div>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated alert from the DojoPool Performance Monitor.
                    </p>
                </div>
            </body>
        </html>
        """
