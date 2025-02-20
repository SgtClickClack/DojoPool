from flask_caching import Cache
from flask_caching import Cache
"""
Venue Model Module

This module defines the Venue model representing pool venues. It includes full type annotations
and docstrings for better clarity and maintainability.
"""

from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database.database import db
from ..core.models.base import BaseModel
from ..validation import VenueValidator

if TYPE_CHECKING:
    from .game import Game
    from .table import Table
    from .tournament import Tournament
    from .venue_checkin import VenueCheckIn
    from .venue_leaderboard import VenueLeaderboard


class Venue(BaseModel):
    """Venue model."""

    __tablename__: str = "venues"
    __table_args__ = {"extend_existing": True}

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    contact_info: Mapped[Dict[str, Any]] = mapped_column(JSON)
    operating_hours: Mapped[Dict[str, Any]] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    total_tables: Mapped[int] = mapped_column(Integer, default=0)
    available_tables: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    tournaments: Mapped[List["Tournament"]] = relationship(
        "Tournament", back_populates="venue", lazy="dynamic"
    )
    games: Mapped[List["Game"]] = relationship(
        "Game", back_populates="venue", lazy="dynamic"
    )
    tables: Mapped[List["Table"]] = relationship(
        "Table", back_populates="venue", lazy="dynamic"
    )
    checkins: Mapped[List["VenueCheckIn"]] = relationship(
        "VenueCheckIn", back_populates="venue", lazy="dynamic"
    )
    leaderboards: Mapped[List["VenueLeaderboard"]] = relationship(
        "VenueLeaderboard", back_populates="venue", lazy="dynamic"
    )

    def __init__(
        self,
        name: str,
        location: str,
        description: Optional[str] = None,
        contact_info: Optional[Dict[str, Any]] = None,
        operating_hours: Optional[Dict[str, Any]] = None,
        total_tables: int = 0,
        available_tables: Optional[int] = None,
    ) -> None:
        """Initialize venue."""
        super().__init__()
        self.name = name
        self.location = location
        self.description = description
        self.contact_info = contact_info or {}
        self.operating_hours = operating_hours or {}
        self.total_tables = total_tables
        self.available_tables = available_tables or total_tables

    def __repr__(self):
        """Return string representation."""
        return f"<Venue {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        base_dict = super().to_dict()
        venue_dict = {
            "name": self.name,
            "location": self.location,
            "description": self.description,
            "contact_info": self.contact_info,
            "operating_hours": self.operating_hours,
            "is_active": self.is_active,
            "rating": self.rating,
            "total_tables": self.total_tables,
            "available_tables": self.available_tables,
        }
        return {**base_dict, **venue_dict}

    @hybrid_property
    def average_rating(self):
        """Get calculated average rating."""
        if not hasattr(self, "review_count") or not self.review_count:
            return None
        return round(self.rating, 1)

    @hybrid_property
    def is_open(self):
        """Check if venue is currently open."""
        current_time = datetime.now(timezone.utc)
        current_day = current_time.weekday()
        return True  # Simplified for now

    def get_available_tables(
        self, start_time: Optional[datetime] = None, duration: Optional[int] = None
    ) -> int:
        """Get number of available tables.

        Args:
            start_time: Start time to check (defaults to current time)
            duration: Duration in hours

        Returns:
            int: Number of available tables
        """
        start_time = start_time or datetime.now(timezone.utc)

        # Get active games during the period
        active_games = self.games.filter(
            db.or_(
                db.and_(Game.start_time <= start_time, Game.end_time >= start_time),
                (
                    db.and_(
                        Game.start_time >= start_time,
                        Game.start_time <= start_time + timedelta(hours=duration or 1),
                    )
                    if duration
                    else False
                ),
            )
        ).count()

        return self.total_tables - active_games

    def deactivate(self, reason: Optional[str] = None) -> None:
        """Deactivate venue.

        Args:
            reason: Deactivation reason
        """
        self.is_active = False
        if reason:
            self.description = reason
        db.session.commit()

    def activate(self) -> None:
        """Activate venue."""
        self.is_active = True
        db.session.commit()

    def update_rating(self, new_rating: float) -> None:
        """Update venue rating.

        Args:
            new_rating: New rating value
        """
        if not hasattr(self, "review_count") or self.rating is None:
            self.rating = new_rating
            setattr(self, "review_count", 1)
        else:
            total = self.rating * getattr(self, "review_count")
            setattr(self, "review_count", getattr(self, "review_count") + 1)
            self.rating = (total + new_rating) / getattr(self, "review_count")
        db.session.commit()

    def add_photo(self, photo_url: str, is_featured: bool = False) -> None:
        """Add photo to venue.

        Args:
            photo_url: URL of photo
            is_featured: Whether to set as featured image
        """
        if not hasattr(self, "photos"):
            self.photos = []
        self.photos.append(photo_url)
        if is_featured:
            self.featured_image = photo_url
        db.session.commit()

    def remove_photo(self, photo_url: str) -> None:
        """Remove photo from venue.

        Args:
            photo_url: URL of photo to remove
        """
        if hasattr(self, "photos") and photo_url in self.photos:
            self.photos.remove(photo_url)
            if hasattr(self, "featured_image") and self.featured_image == photo_url:
                self.featured_image = self.photos[0] if self.photos else None
            db.session.commit()

    def update_amenities_summary(self) -> None:
        """Update amenities summary."""
        self.amenities_summary = {}
        db.session.commit()

    def search(self, query: str) -> bool:
        """Performs a simple case-insensitive search on the venue name."""
        return query.lower() in self.name.lower()

    def get_status(self) -> bool:
        """Get current venue status."""
        now = datetime.now(timezone.utc)
        # Dummy logic: Replace with real operating-hour checks.
        return True

    def add_checkin(self, checkin: "VenueCheckIn") -> None:
        """Add a check-in to the venue."""
        self.checkins.append(checkin)
        db.session.commit()
