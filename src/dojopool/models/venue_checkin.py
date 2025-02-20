"""
VenueCheckIn Model Module

This module defines the VenueCheckIn model for tracking user check-ins at venues.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .user import User
    from .venue import Venue


class VenueCheckIn(BaseModel):
    """Represents a user check-in at a venue."""

    __tablename__: str = "venue_checkins"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    venue_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("venues.id"), nullable=False
    )
    check_in_time: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    check_out_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    table_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    game_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # e.g., "8-ball", "9-ball", etc.
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship(
        "User", back_populates="venue_checkins", lazy="joined"
    )
    venue: Mapped["Venue"] = relationship(
        "Venue", back_populates="checkins", lazy="joined"
    )

    def __init__(
        self,
        user_id: int,
        venue_id: int,
        table_number: Optional[int] = None,
        game_type: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> None:
        """Initialize venue check-in."""
        super().__init__()
        self.user_id = user_id
        self.venue_id = venue_id
        self.table_number = table_number
        self.game_type = game_type
        self.notes = notes
        self.check_in_time = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        """Return string representation of the check-in."""
        return f"<VenueCheckIn {self.user_id} @ {self.venue_id}>"

    @property
    def duration(self) -> Optional[int]:
        """Calculate duration of stay in minutes."""
        if not self.check_out_time:
            return None
        delta = self.check_out_time - self.check_in_time
        return int(delta.total_seconds() / 60)

    def check_out(self) -> None:
        """Record check-out time."""
        self.check_out_time = datetime.now(timezone.utc)
        db.session.commit()
