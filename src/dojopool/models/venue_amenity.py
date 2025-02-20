"""
VenueAmenity Model Module

This module defines the VenueAmenity model for tracking venue amenities.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db

if TYPE_CHECKING:
    from .venue import Venue


class VenueAmenity(Base):
    """Represents an amenity available at a venue."""

    __tablename__ = "venue_amenities"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(nullable=True)  # Icon identifier or URL
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    venue: relationship = relationship(
        "Venue", back_populates="amenities", lazy="joined"
    )

    def __repr__(self) -> str:
        """Return string representation of the amenity."""
        return f"<VenueAmenity {self.venue_id} {self.name}>"
