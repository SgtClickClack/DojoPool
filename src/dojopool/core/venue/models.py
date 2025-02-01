"""
Venue and pool table models.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from ...core.extensions import db


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
    status = db.Column(db.Enum(TableStatus), nullable=False, default=TableStatus.AVAILABLE)
    qr_code = db.Column(db.String(255))  # URL or path to QR code image
    last_qr_refresh = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    venue = db.relationship("Venue", back_populates="tables")
    games = db.relationship("Game", back_populates="table")


class Venue(db.Model):
    """Venue model."""

    __tablename__ = "venues"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    website = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tables = db.relationship("PoolTable", back_populates="venue")
    staff = db.relationship("User", secondary="venue_staff")


class VenueStaff(db.Model):
    """Association table for Venue-User (staff) relationship."""

    __tablename__ = "venue_staff"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # e.g., "manager", "staff"
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Unique constraint to prevent duplicate venue-staff assignments
    __table_args__ = (db.UniqueConstraint("venue_id", "user_id", name="unique_venue_staff"),)
