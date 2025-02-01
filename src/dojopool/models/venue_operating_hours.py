"""Venue operating hours model module."""

from datetime import datetime, time, timedelta
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Time
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from ..extensions import db
from ..validation import VenueValidator


class VenueOperatingHours(db.Model):
    """Venue operating hours model."""

    __tablename__ = "venue_operating_hours"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday, 6=Sunday
    open_time = Column(Time, nullable=False)
    close_time = Column(Time, nullable=False)
    is_closed = Column(Boolean, default=False)
    special_hours = Column(Boolean, default=False)  # For holidays, events, etc.
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", back_populates="operating_hours")

    # Validation
    validator_class = VenueValidator

    def __repr__(self):
        return f"<VenueOperatingHours {self.venue_id}:{self.day_of_week}>"

    @hybrid_property
    def is_24h(self):
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

    def is_open(self, current_time=None):
        """Check if venue is open at given time.

        Args:
            current_time: Time to check (defaults to current time)

        Returns:
            bool: True if venue is open
        """
        if self.is_closed:
            return False

        current_time = current_time or datetime.now().time()

        if self.is_24h:
            return True

        if self.open_time <= self.close_time:
            return self.open_time <= current_time <= self.close_time
        else:  # Handles case where venue is open past midnight
            return current_time >= self.open_time or current_time <= self.close_time

    def set_hours(self, open_time, close_time, notes=None):
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

    def close(self, reason=None):
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

    def set_special_hours(self, is_special=True, notes=None):
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
    def get_current_status(cls, venue_id):
        """Get current operating status for venue.

        Args:
            venue_id: Venue ID

        Returns:
            dict: Operating status
        """
        current_time = datetime.now()
        hours = cls.query.filter_by(venue_id=venue_id, day_of_week=current_time.weekday()).first()

        if not hours:
            return {"status": "unknown"}

        is_open = hours.is_open(current_time.time())
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
