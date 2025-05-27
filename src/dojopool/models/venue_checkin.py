"""Venue check-in model module."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from dojopool.core.extensions import db


class VenueCheckIn(db.Model):
    """Venue check-in model."""

    __tablename__ = "venue_checkins"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    checked_out_at = Column(DateTime)
    table_number = Column(Integer)
    game_type = Column(String(50))  # e.g., "8-ball", "9-ball", etc.

    # Relationships
    venue = relationship("dojopool.models.venue.Venue", back_populates="checkins", foreign_keys=[venue_id])
    user = relationship("dojopool.models.user.User", backref="venue_checkins", foreign_keys=[user_id])

    def __repr__(self):
        return f"<VenueCheckIn {self.user_id} at {self.venue_id}>"

    @property
    def duration(self):
        """Calculate duration of stay in minutes."""
        if not self.checked_out_at:
            return None
        delta = self.checked_out_at - self.checked_in_at
        return int(delta.total_seconds() / 60)

# --- Explicit imports to resolve SQLAlchemy mapping ---
# (No explicit imports needed for Venue or User as these are defined in separate files and are not needed for mapping here)
