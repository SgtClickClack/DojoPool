from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import db
from .base import BaseModel

class Event(BaseModel):
    __tablename__: str = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    event_data: Mapped[Dict[str, Any]] = mapped_column(JSON)
    timestamp: Mapped[datetime] = mapped_column(nullable=False)
    description: Mapped[str] = mapped_column(Text)
    metadata: Mapped[Dict[str, Any]] = mapped_column(JSON)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="events")

    def __repr__(self) -> str: ...
    def to_dict(self) -> Dict[str, Any]: ...
