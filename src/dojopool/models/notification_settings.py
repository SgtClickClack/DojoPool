"""Notification settings model module.

This module contains the NotificationSettings model for managing user notification preferences.
"""

from typing import Any, Dict

from dojopool.core.database.db_utils import reference_col
from dojopool.extensions import db

from .base import TimestampedModel


class NotificationSettings(TimestampedModel):
    """Notification settings model."""

    __tablename__ = "notification_settings"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = reference_col("users", nullable=False)
    email_enabled = db.Column(db.Boolean, default=True)
    push_enabled = db.Column(db.Boolean, default=True)
    sms_enabled = db.Column(db.Boolean, default=False)
    game_notifications = db.Column(db.Boolean, default=True)
    tournament_notifications = db.Column(db.Boolean, default=True)
    friend_notifications = db.Column(db.Boolean, default=True)
    system_notifications = db.Column(db.Boolean, default=True)
    marketing_notifications = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.Time)
    quiet_hours_end = db.Column(db.Time)
    timezone = db.Column(db.String(50))

    # Relationships
    user = db.relationship("User", backref=db.backref("notification_settings", uselist=False))

    def __init__(self, **kwargs):
        """Initialize notification settings."""
        super(NotificationSettings, self).__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        """Convert notification settings to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email_enabled": self.email_enabled,
            "push_enabled": self.push_enabled,
            "sms_enabled": self.sms_enabled,
            "game_notifications": self.game_notifications,
            "tournament_notifications": self.tournament_notifications,
            "friend_notifications": self.friend_notifications,
            "system_notifications": self.system_notifications,
            "marketing_notifications": self.marketing_notifications,
            "quiet_hours_start": (
                self.quiet_hours_start.strftime("%H:%M") if self.quiet_hours_start else None
            ),
            "quiet_hours_end": (
                self.quiet_hours_end.strftime("%H:%M") if self.quiet_hours_end else None
            ),
            "timezone": self.timezone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
