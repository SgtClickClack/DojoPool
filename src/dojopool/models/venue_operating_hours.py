"""
VenueOperatingHours Model Module

This module defines the VenueOperatingHours model for tracking venue operating hours.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from ..validation import VenueValidator

if TYPE_CHECKING:
    from .venue import Venue


class VenueOperatingHours(Base):
    """Represents operating hours for a venue."""

    __tablename__: str = "venue_operating_hours"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String(15), nullable=False)
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_closed: Mapped[bool] = mapped_column(default=False)
    special_hours: Mapped[bool] = mapped_column(
        default=False
    )  # For holidays, events, etc.
    notes: Mapped[Optional[str]] = mapped_column(nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    venue: Mapped["Venue"] = relationship(
        "Venue", back_populates="operating_hours", lazy="joined"
    )

    # Validation
    validator_class: Any = VenueValidator

    def __repr__(self) -> str:
        """Return string representation of the operating hours."""
        return f"<VenueOperatingHours {self.venue_id} {self.day_of_week}>"

    @hybrid_property
    def is_24h(self) -> bool:
        """Check if venue is open 24 hours."""
        return self.open_time == time(0, 0) and self.close_time == time(23, 59)

    @hybrid_property
    def duration(self):
        """Get operating duration in hours."""
        if self.is_closed:
            return 0

        open_dt = datetime.combine(datetime.today(), self.open_time)
        close_dt = datetime.combine(datetime.today(), self.close_time)

        if close_dt < open_dt:  # Handles case where venue is open past midnight
            close_dt += timedelta(days=1)

        return (close_dt - open_dt).total_seconds() / 3600

    @property
    def is_open(self) -> bool:
        """Check if venue is open at current time."""
        if self.is_closed:
            return False

        now = datetime.now().time()
        if self.open_time <= self.close_time:
            return self.open_time <= now <= self.close_time
        else:  # Handles cases where venue closes after midnight
            return now >= self.open_time or now <= self.close_time

    def set_hours(
        self, open_time: time, close_time: time, notes: Optional[str] = None
    ) -> None:
        """Set operating hours.

        Args:
            open_time: Opening time
            close_time: Closing time
            notes: Optional notes
        """
        self.open_time = open_time
        self.close_time = close_time
        if notes:
            self.notes = notes
        db.session.commit()

    def close(self, reason: Optional[str] = None):
        """Mark venue as closed for the day.

        Args:
            reason: Closure reason
        """
        self.is_closed = True
        if reason:
            self.notes = reason
        db.session.commit()

    def open(self):
        """Mark venue as open for the day."""
        self.is_closed = False
        db.session.commit()

    def set_special_hours(self, is_special: bool = True, notes: Optional[str] = None):
        """Set special hours status.

        Args:
            is_special: Special hours status
            notes: Optional notes
        """
        self.special_hours = is_special
        if notes:
            self.notes = notes
        db.session.commit()

    @classmethod
    def get_current_status(cls, venue_id: int) -> Dict[str, Any]:
        """Get current operating status for venue.

        Args:
            venue_id: Venue ID

        Returns:
            dict: Operating status
        """
        current_time = datetime.now()
        hours = cls.query.filter_by(
            venue_id=venue_id, day_of_week=current_time.weekday()
        ).first()

        if not hours:
            return {"status": "unknown"}

        is_open = hours.is_open
        next_change = None

        if is_open:
            next_change = datetime.combine(current_time.date(), hours.close_time)
            if next_change < current_time:
                next_change += timedelta(days=1)
        else:
            next_change = datetime.combine(current_time.date(), hours.open_time)
            if next_change < current_time:
                next_change += timedelta(days=1)

        return {
            "status": "open" if is_open else "closed",
            "next_change": next_change,
            "special_hours": hours.special_hours,
            "notes": hours.notes,
        }

    def is_open_at(self, check_time: time):
        return self.open_time <= check_time <= self.close_time

    def update_hours(self, new_open: time, new_close: time):
        self.open_time = new_open
        self.close_time = new_close
