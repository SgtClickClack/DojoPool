"""Notification model module.

This module contains the Notification model for tracking user notifications.
"""

from datetime import datetime
from enum import Enum

from dojopool.extensions import db


class NotificationType(str, Enum):
    """Notification type enumeration."""

    GAME_INVITE = "game_invite"
    TOURNAMENT_INVITE = "tournament_invite"
    GAME_START = "game_start"
    GAME_END = "game_end"
    ACHIEVEMENT = "achievement"
    SYSTEM = "system"


class NotificationStatus(str, Enum):
    """Notification status enumeration."""

    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


class Notification(db.Model):
    """Notification model."""

    __tablename__ = "notifications"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    data = db.Column(db.JSON)
    status = db.Column(db.String(20), default=NotificationStatus.UNREAD)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)

    # Relationships
    user = db.relationship("User", backref=db.backref("user_notifications", lazy="dynamic"))

    def __repr__(self):
        """String representation."""
        return f"<Notification {self.id} - {self.type} - {self.status}>"

    def mark_as_read(self):
        """Mark notification as read."""
        self.status = NotificationStatus.READ
        self.read_at = datetime.utcnow()
        db.session.commit()

    def archive(self):
        """Archive notification."""
        self.status = NotificationStatus.ARCHIVED
        db.session.commit()

    @classmethod
    def create(cls, user_id, type, title, message, data=None):
        """Create a new notification."""
        notification = cls(user_id=user_id, type=type, title=title, message=message, data=data)
        db.session.add(notification)
        db.session.commit()
        return notification
