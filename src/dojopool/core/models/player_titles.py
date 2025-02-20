"""Model for player titles."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import Base


class PlayerTitle(Base):
    """Model for player titles."""

    __tablename__ = "player_titles"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="titles")

    def __repr__(self) -> str:
        """String representation."""
        return f"<PlayerTitle {self.title} for user {self.user_id}>"

    def deactivate(self) -> None:
        """Deactivate the title."""
        self.is_active = False
        db.session.commit()

    def activate(self):
        """Activate the title."""
        self.is_active = True
        db.session.commit()

    def extend_expiry(self, days: int):
        """Extend title expiry.

        Args:
            days: Number of days to extend by
        """
        if self.expires_at:
            self.expires_at = self.expires_at + timedelta(days=days)
        else:
            self.expires_at = datetime.utcnow() + timedelta(days=days)
        db.session.commit()

    def is_expired(self):
        """Check if title is expired.

        Returns:
            Whether the title is expired
        """
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
