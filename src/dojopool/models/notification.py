"""Notification models."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .user import User


class NotificationType(str, Enum):
    """Notification types."""

    GAME_INVITE: str = "game_invite"
    TOURNAMENT_INVITE = "tournament_invite"
    GAME_START = "game_start"
    GAME_END: str = "game_end"
    ACHIEVEMENT: str = "achievement"
    SYSTEM = "system"


class NotificationStatus(str, Enum):
    """Notification status enumeration."""

    UNREAD: str = "unread"
    READ = "read"
    ARCHIVED = "archived"


class Notification(BaseModel):
    """Notification model."""

    __tablename__: str = "notifications"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=NotificationStatus.UNREAD.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notifications")

    def __init__(
        self,
        user_id: int,
        type: str,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize notification."""
        super().__init__()
        self.user_id = user_id
        self.type = type
        self.title = title
        self.message = message
        self.data = data
        self.created_at = datetime.now(timezone.utc)

    @classmethod
    def create(
        cls,
        user_id: int,
        type: NotificationType,
        title: str,
        message: str,
        data: Optional[Dict[str, Any]] = None,
    ):
        """Create a new notification."""
        notification: cls = cls(
            user_id=user_id,
            type=type.value,
            title=title,
            message=message,
            data=data,
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    def mark_as_read(self):
        """Mark notification as read."""
        self.status = NotificationStatus.READ.value
        self.read_at = datetime.now(timezone.utc)
        db.session.commit()

    def archive(self):
        """Archive notification."""
        self.status = NotificationStatus.ARCHIVED.value
        db.session.commit()

    def to_dict(self) -> Dict[str, Any]:
        """Convert notification to dictionary."""
        base_dict = super().to_dict()
        notification_dict = {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "title": self.title,
            "message": self.message,
            "data": self.data,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }
        return {**base_dict, **notification_dict}
