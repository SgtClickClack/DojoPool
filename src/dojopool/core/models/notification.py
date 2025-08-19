"""Notification models module.

This module provides notification-related models.
"""

from datetime import datetime
from enum import Enum

from sqlalchemy import Index

from ...core.database import db
from ...core.events import emit_event
from .base import BaseModel


class NotificationType(Enum):
    """Notification type enumeration."""

    GAME_INVITE = "game_invite"
    MATCH_START = "match_start"
    TOURNAMENT_UPDATE = "tournament_update"
    ACHIEVEMENT = "achievement"
    FRIEND_REQUEST = "friend_request"
    SYSTEM = "system"
    VENUE_UPDATE = "venue_update"
    EVENT_REMINDER = "event_reminder"
    PAYMENT = "payment"
    REWARD = "reward"


class Notification(BaseModel):
    """Notification model."""

    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notifications_user", "user_id"),
        Index("idx_notifications_read", "is_read"),
        Index("idx_notifications_type", "type"),
        Index("idx_notifications_created", "created_at"),
        {"extend_existing": True},
    )

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.Enum(NotificationType), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)

    # Additional data
    data = db.Column(db.JSON)  # Store any additional notification data
    action_url = db.Column(db.String(200))  # URL to redirect when clicked
    icon = db.Column(db.String(50))  # Icon identifier

    # Status
    is_read = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime)

    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship("User", backref=db.backref("core_user_notifications", lazy="dynamic"))

    def __repr__(self):
        return f"<Notification {self.id}:{self.type}>"

    def mark_as_read(self):
        """Mark notification as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
            db.session.commit()

    def mark_as_unread(self):
        """Mark notification as unread."""
        if self.is_read:
            self.is_read = False
            self.read_at = None
            db.session.commit()

    def archive(self):
        """Archive notification."""
        self.is_archived = True
        db.session.commit()

    def unarchive(self):
        """Unarchive notification."""
        self.is_archived = False
        db.session.commit()

    @classmethod
    def create(cls, user_id, type, title, message, data=None, action_url=None, icon=None):
        """Create a new notification.

        Args:
            user_id: User ID
            type: Notification type
            title: Notification title
            message: Notification message
            data: Optional additional data
            action_url: Optional action URL
            icon: Optional icon identifier

        Returns:
            Notification: Created notification
        """
        notification = cls(
            user_id=user_id,
            type=type,
            title=title,
            message=message,
            data=data,
            action_url=action_url,
            icon=icon,
        )
        db.session.add(notification)
        db.session.commit()

        # Emit real-time event
        emit_event("notification", {"user_id": user_id, "notification": notification.to_dict()})

        return notification

    @classmethod
    def get_unread_count(cls, user_id):
        """Get count of unread notifications.

        Args:
            user_id: User ID

        Returns:
            int: Number of unread notifications
        """
        return cls.query.filter_by(user_id=user_id, is_read=False, is_archived=False).count()

    @classmethod
    def get_recent(cls, user_id, limit=20):
        """Get recent notifications.

        Args:
            user_id: User ID
            limit: Maximum number of notifications

        Returns:
            list: Recent notifications
        """
        return (
            cls.query.filter_by(user_id=user_id, is_archived=False)
            .order_by(cls.created_at.desc())
            .limit(limit)
            .all()
        )

    def to_dict(self):
        """Convert notification to dictionary.

        Returns:
            dict: Notification data
        """
        return {
            "id": self.id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "action_url": self.action_url,
            "icon": self.icon,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }


class NotificationPreference(BaseModel):
    """Notification preference model."""

    __tablename__ = "notification_preferences"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    notification_type = db.Column(
        db.String(50), nullable=False
    )  # achievement, tournament, friend_request, etc.
    email_enabled = db.Column(db.Boolean, default=True)
    push_enabled = db.Column(db.Boolean, default=True)
    sms_enabled = db.Column(db.Boolean, default=False)
    quiet_hours_start = db.Column(db.Time)
    quiet_hours_end = db.Column(db.Time)

    # Relationships
    user = db.relationship("User", backref=db.backref("notification_preferences", lazy="dynamic"))

    def __repr__(self):
        return f"<NotificationPreference {self.user_id}:{self.notification_type}>"

    def enable_all(self):
        """Enable all notification channels."""
        self.email_enabled = True
        self.push_enabled = True
        self.sms_enabled = True
        db.session.commit()

    def disable_all(self):
        """Disable all notification channels."""
        self.email_enabled = False
        self.push_enabled = False
        self.sms_enabled = False
        db.session.commit()

    def is_quiet_hours(self, current_time=None):
        """Check if current time is within quiet hours.

        Args:
            current_time: Time to check (defaults to current time)

        Returns:
            bool: True if within quiet hours
        """
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False

        current_time = current_time or datetime.now().time()
        if self.quiet_hours_start <= self.quiet_hours_end:
            return self.quiet_hours_start <= current_time <= self.quiet_hours_end
        else:  # Handles case where quiet hours span midnight
            return current_time >= self.quiet_hours_start or current_time <= self.quiet_hours_end
