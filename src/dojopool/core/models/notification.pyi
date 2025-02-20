from datetime import date, datetime, time, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...core.database import db
from ...core.events import emit_event
from .base import Base
from .notification_preference import NotificationPreference

class NotificationType(Enum):
    MATCH_FOUND = "match_found"
    MATCH_STARTED = "match_started"
    MATCH_COMPLETED = "match_completed"
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    RANK_CHANGED = "rank_changed"
    SYSTEM = "system"

class Notification(Base):
    __tablename__: str = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    data: Mapped[Dict[str, Any]] = mapped_column(JSON)
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column()

    user: Mapped["User"] = relationship("User", back_populates="notifications")

    def __repr__(self) -> str: ...
    def to_dict(self) -> Dict[str, Any]: ...
    def mark_as_read(self) -> None: ...
    def mark_as_unread(self) -> None: ...
