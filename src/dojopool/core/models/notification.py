from flask_caching import Cache
from flask_caching import Cache
"""Notification models module.

This module provides notification-related models.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import BaseModel

# Re-export the models
__all__ = ["Notification", "NotificationType"]

# Move NotificationPreference to a new file to avoid circular dependencies
from .notification_preference import NotificationPreference


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
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType), nullable=False
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Additional data
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON
    )  # Store any additional notification data
    action_url: Mapped[Optional[str]] = mapped_column(
        String(200)
    )  # URL to redirect when clicked
    icon: Mapped[Optional[str]] = mapped_column(String(50))  # Icon identifier

    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification {self.id} for user {self.user_id}>"

    def mark_as_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.utcnow()
        db.session.commit()

    def mark_as_unread(self):
        """Mark notification as unread."""
        self.is_read = False
        self.read_at = None
        db.session.commit()

    def archive(self):
        """Archive the notification."""
        self.is_archived = True
        db.session.commit()

    def unarchive(self):
        """Unarchive the notification."""
        self.is_archived = False
        db.session.commit()

    @classmethod
    def create(
        cls,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        action_url: Optional[str] = None,
        icon: Optional[str] = None,
    ) -> "Notification":
        """Create a new notification.

        Args:
            user_id: ID of the user to notify
            type: Type of notification
            title: Notification title
            message: Notification message
            data: Optional additional data
            action_url: Optional URL to redirect when clicked
            icon: Optional icon identifier

        Returns:
            Created notification instance
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

        return notification

    @classmethod
    def get_unread_count(cls, user_id: int):
        """Get count of unread notifications.

        Args:
            user_id: User ID

        Returns:
            Number of unread notifications
        """
        return cls.query.filter_by(user_id=user_id, is_read=False).count()

    @classmethod
    def get_recent(cls, user_id: int, limit: int = 20):
        """Get recent notifications for a user.

        Args:
            user_id: User ID
            limit: Maximum number of notifications to return

        Returns:
            List of recent notifications
        """
        return (
            cls.query.filter_by(user_id=user_id)
            .order_by(cls.created_at.desc())
            .limit(limit)
            .all()
        )

    def to_dict(self):
        """Convert notification to dictionary.

        Returns:
            Dictionary representation of notification
        """
        return {
            "id": self.id,
            "type": self.type.value,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "action_url": self.action_url,
            "icon": self.icon,
            "is_read": self.is_read,
            "is_archived": self.is_archived,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
