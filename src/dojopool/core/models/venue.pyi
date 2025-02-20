from datetime import date, datetime, time, timedelta
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import BaseModel

class VenueType(Enum):
    BAR = "bar"
    POOL_HALL = "pool_hall"
    CLUB = "club"
    ARCADE = "arcade"
    OTHER = "other"

class VenueStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"

class Venue(BaseModel):
    __tablename__: str = "venues"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[VenueType] = mapped_column(SQLEnum(VenueType), nullable=False)
    status: Mapped[VenueStatus] = mapped_column(
        SQLEnum(VenueStatus), default=VenueStatus.PENDING
    )
    address: Mapped[str] = mapped_column(String(200), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    country: Mapped[str] = mapped_column(String(50), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    website: Mapped[Optional[str]] = mapped_column(String(200))
    description: Mapped[Optional[str]] = mapped_column(Text)
    hours: Mapped[Dict[str, Any]] = mapped_column(JSON)
    features: Mapped[Dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    tables: Mapped[List["Table"]] = relationship("Table", back_populates="venue")
    events: Mapped[List["VenueEvent"]] = relationship(
        "VenueEvent", back_populates="venue"
    )

    def __repr__(self) -> str: ...
    def to_dict(self) -> Dict[str, Any]: ...
    def update_status(self, status: VenueStatus) -> None: ...
    def update_hours(self, hours: Dict[str, Any]) -> None: ...
    def update_features(self, features: Dict[str, Any]) -> None: ...
