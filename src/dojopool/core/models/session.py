from flask_caching import Cache
from flask_caching import Cache
"""Session model module."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import BaseModel

if TYPE_CHECKING:
    from ..models.user import User


class Session(BaseModel):
    """Session model for tracking user sessions."""

    __tablename__: str = "sessions"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    device_info: Mapped[Dict[str, Any]] = mapped_column(
        JSON
    )  # Device and browser information
    ip_address: Mapped[str] = mapped_column(String(45))
    last_activity: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="sessions")

    def __repr__(self) -> str:
        return f"<Session {self.id} for User {self.user_id}>"

    def is_expired(self) -> bool:
        """Check if session is expired."""
        return datetime.utcnow() > self.expires_at

    def update_activity(self) -> None:
        """Update last activity timestamp."""
        self.last_activity = datetime.utcnow()
        db.session.commit()

    def invalidate(self) -> None:
        """Invalidate the session."""
        self.is_active = False
        db.session.commit()

    def update_device_info(self, device_info: Dict[str, Any]) -> None:
        """Update device information."""
        self.device_info = device_info
        db.session.commit()

    @classmethod
    def get_active_session(cls, token: str) -> Optional["Session"]:
        """Get active session by token."""
        return (
            cls.query.filter_by(token=token, is_active=True)
            .filter(cls.expires_at > datetime.utcnow())
            .first()
        )

    @classmethod
    def cleanup_expired(cls) -> None:
        """Clean up expired sessions."""
        cls.query.filter(cls.expires_at <= datetime.utcnow()).update(
            {"is_active": False}
        )
        db.session.commit()
