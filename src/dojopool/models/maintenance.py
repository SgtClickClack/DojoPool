"""Maintenance model module.

This module defines the Maintenance model for tracking maintenance events for pool tables at venues.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from ..extensions import db

class Maintenance(db.Model):
    """Represents a maintenance event for a pool table at a venue."""

    __tablename__ = "maintenance"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey("venues.id"), nullable=False)
    table_id = Column(Integer, ForeignKey("pool_tables.id"), nullable=True)
    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    reason = Column(String(100), nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, in_progress, completed, cancelled
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship("Venue", backref="maintenance_events")
    # Optionally relate to PoolTable if model exists
    # table = relationship("PoolTable", backref="maintenance_events")

    def __repr__(self):
        return f"<Maintenance {self.id} for Venue {self.venue_id} Table {self.table_id}>" 