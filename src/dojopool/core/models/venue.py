"""Venue models module."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models.base import BaseModel
from ..database.database import db


class VenueEventType(str, Enum):
    """Venue event type enumeration."""

    TOURNAMENT: str = "tournament"
    LEAGUE = "league"
    SOCIAL = "social"
    TRAINING = "training"
    SPECIAL: str = "special"


class VenueEventStatus(str, Enum):
    """Venue event status enumeration."""

    UPCOMING: str = "upcoming"
    ONGOING: str = "ongoing"
    COMPLETED = "completed"
    CANCELLED: str = "cancelled"


class Venue(BaseModel):
    """Venue model."""

    __tablename__: str = "venues"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    contact_info: Mapped[Dict[str, Any]] = mapped_column(JSON)
    operating_hours: Mapped[Dict[str, Any]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_tables: Mapped[int] = mapped_column(Integer, default=0)
    available_tables: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    events: Mapped[List["VenueEvent"]] = relationship(
        "VenueEvent", back_populates="venue"
    )
    leaderboards: Mapped[List["VenueLeaderboard"]] = relationship(
        "VenueLeaderboard", back_populates="venue"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Venue {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        base_dict = super().to_dict()
        venue_dict = {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "description": self.description,
            "contact_info": self.contact_info,
            "operating_hours": self.operating_hours,
            "is_active": self.is_active,
            "rating": self.rating,
            "total_tables": self.total_tables,
            "available_tables": self.available_tables,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **venue_dict}


class VenueEvent(BaseModel):
    """Venue event model."""

    __tablename__: str = "venue_events"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venues.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    event_type: Mapped[VenueEventType] = mapped_column(SQLEnum(VenueEventType), nullable=False)
    status: Mapped[VenueEventStatus] = mapped_column(
        SQLEnum(VenueEventStatus), default=VenueEventStatus.UPCOMING
    )
    start_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    registration_deadline: Mapped[datetime] = mapped_column(DateTime)
    max_participants: Mapped[int] = mapped_column(Integer)
    entry_fee: Mapped[float] = mapped_column(Float)
    prize_pool: Mapped[float] = mapped_column(Float)
    rules: Mapped[str] = mapped_column(Text)
    details: Mapped[Dict[str, Any]] = mapped_column(JSON)

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
    venue: Mapped["Venue"] = relationship("Venue", back_populates="events")
    participants: Mapped[List["VenueEventParticipant"]] = relationship(
        "VenueEventParticipant", back_populates="event"
    )

    def __repr__(self):
        """Return string representation."""
        return f"<VenueEvent {self.name} at {self.venue_id}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        base_dict = super().to_dict()
        event_dict = {
            "id": self.id,
            "venue_id": self.venue_id,
            "name": self.name,
            "description": self.description,
            "event_type": self.event_type.value,
            "status": self.status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "registration_deadline": self.registration_deadline.isoformat() if self.registration_deadline else None,
            "max_participants": self.max_participants,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "rules": self.rules,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **event_dict}


class VenueEventParticipant(BaseModel):
    """Venue event participant model."""

    __tablename__: str = "venue_event_participants"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venue_events.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(String(20), default="registered")
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    checked_out_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    placement: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    event: Mapped["VenueEvent"] = relationship(
        "VenueEvent", back_populates="participants"
    )
    user: Mapped["User"] = relationship("User", backref="event_participations")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<VenueEventParticipant {self.user_id} in {self.event_id}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        base_dict = super().to_dict()
        participant_dict = {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "status": self.status,
            "checked_in_at": (
                self.checked_in_at.isoformat() if self.checked_in_at else None
            ),
            "checked_out_at": (
                self.checked_out_at.isoformat() if self.checked_out_at else None
            ),
            "placement": self.placement,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **participant_dict}

    def check_in(self):
        """Check in participant."""
        self.checked_in_at = datetime.now(timezone.utc)
        self.status = "checked_in"
        db.session.commit()

    def check_out(self):
        """Check out participant."""
        self.checked_out_at = datetime.now(timezone.utc)
        self.status = "checked_out"
        db.session.commit()

    def cancel(self):
        """Cancel participation."""
        self.status = "cancelled"
        db.session.commit()

    def is_registration_open(self) -> bool:
        """Check if registration is open."""
        if not self.event.registration_deadline:
            return True
        return datetime.now(timezone.utc) <= self.event.registration_deadline

    def is_full(self) -> bool:
        """Check if event is full."""
        if not self.event.max_participants:
            return False
        return len(self.event.participants) >= self.event.max_participants

    def update_status(self, new_status: str) -> None:
        """Update participant status."""
        self.status = new_status
        db.session.commit()

    def duration(self) -> Optional[timedelta]:
        """Calculate participation duration."""
        if not self.checked_in_at or not self.checked_out_at:
            return None
        return self.checked_out_at - self.checked_in_at
