"""
Venue and pool table models.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from ...core.extensions import db
from ...models.venue import Venue  # Import the main Venue model


class TableType(Enum):
    """Pool table type enumeration."""

    STANDARD = "standard"
    TOURNAMENT = "tournament"
    SNOOKER = "snooker"
    CAROM = "carom"


class TableStatus(Enum):
    """Pool table status enumeration."""

    AVAILABLE = "available"
    IN_USE = "in_use"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class PoolTable(db.Model):
    """Pool table model."""

    __tablename__ = "pool_tables"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    table_type = db.Column(db.Enum(TableType), nullable=False)
    status = db.Column(
        db.Enum(TableStatus), nullable=False, default=TableStatus.AVAILABLE
    )
    qr_code = db.Column(db.String(255))  # URL or path to QR code image
    last_qr_refresh = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    venue = db.relationship("Venue", back_populates="pool_tables")
    games = db.relationship("Game", back_populates="table")


# Remove duplicate Venue model definition
# All venue-related models are now in models/venue.py
