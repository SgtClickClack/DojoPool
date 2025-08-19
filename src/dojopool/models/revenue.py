"""Revenue model module.

This module defines the Revenue model for tracking revenue events for venues.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..extensions import db

class Revenue(db.Model):
    """Represents a revenue event for a venue."""

    __tablename__ = "revenue"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    date = Column(Date, nullable=False, default=datetime.utcnow)
    amount = Column(Float, nullable=False)
    source = Column(String(50), nullable=False)  # e.g., table_rental, food, drink, merchandise
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", backref="revenue_events")

    def __repr__(self):
        return f"<Revenue {self.id} for Venue {self.venue_id} on {self.date}: {self.amount}>" 