"""Notification preferences model module."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship

from ..core.database.database import db

Base = declarative_base()

if TYPE_CHECKING:
    from .user import User


class NotificationPreference(Base):
    """User notification preferences."""

    __tablename__: str = "notification_preferences"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    # Email notification preferences
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    email_digest: Mapped[bool] = mapped_column(Boolean, default=False)

    # Push notification preferences
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    # Quiet hours
    quiet_hours_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    quiet_hours_start: Mapped[Optional[datetime]] = mapped_column(Time, nullable=True)
    quiet_hours_end: Mapped[Optional[datetime]] = mapped_column(Time, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="notification_preferences")

    def __init__(
        self,
        user_id: int,
        email_enabled: bool = True,
        email_digest: bool = False,
        push_enabled: bool = True,
        quiet_hours_enabled: bool = False,
        quiet_hours_start: Optional[datetime] = None,
        quiet_hours_end: Optional[datetime] = None,
    ) -> None:
        """Initialize notification preferences."""
        super().__init__()
        self.user_id = user_id
        self.email_enabled = email_enabled
        self.email_digest = email_digest
        self.push_enabled = push_enabled
        self.quiet_hours_enabled = quiet_hours_enabled
        self.quiet_hours_start = quiet_hours_start
        self.quiet_hours_end = quiet_hours_end
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation of the notification preference."""
        return f"<NotificationPreference {self.id}>"

    def enable_all(self) -> None:
        """Enable all notification channels."""
        self.email_enabled = True
        self.push_enabled = True
        self.quiet_hours_enabled = True
        db.session.commit()

    def disable_all(self):
        """Disable all notification channels."""
        self.email_enabled = False
        self.push_enabled = False
        self.quiet_hours_enabled = False
        db.session.commit()

    def is_quiet_hours(self, current_time: Optional[datetime] = None):
        """Check if current time is within quiet hours.

        Args:
            current_time: Time to check (defaults to current time)

        Returns:
            bool: True if within quiet hours
        """
        if not self.quiet_hours_start or not self.quiet_hours_end:
            return False

        current_time: Any = current_time or datetime.now(timezone.utc)
        if self.quiet_hours_start <= self.quiet_hours_end:
            return self.quiet_hours_start <= current_time <= self.quiet_hours_end
        else:  # Handles case where quiet hours span midnight
            return (
                current_time >= self.quiet_hours_start
                or current_time <= self.quiet_hours_end
            )

    def is_enabled(self) -> bool:
        """Check if email notifications are enabled."""
        return bool(self.email_enabled)

    def is_enabled_channels(self):
        """Check if push notifications are enabled."""
        return bool(self.push_enabled)
