"""Reward models module."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database.database import db

if TYPE_CHECKING:
    from .user import User


class Achievement(db.Model):
    """Achievement model."""

    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    icon_url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

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
    users: Mapped[list["UserAchievement"]] = relationship(back_populates="achievement")

    def __repr__(self) -> str:
        """Return string representation of the achievement."""
        return f"<Achievement {self.name}>"


class UserAchievement(db.Model):
    """User achievement model."""

    __tablename__ = "user_achievements"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped[Achievement] = relationship(back_populates="users")

    def __repr__(self) -> str:
        """Return string representation of the user achievement."""
        return f"<UserAchievement user_id={self.user_id} achievement_id={self.achievement_id}>"
