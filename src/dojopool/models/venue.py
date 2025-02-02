"""
Venue Model Module

This module defines the Venue model representing pool venues. It includes full type annotations
and docstrings for better clarity and maintainability.
"""

from datetime import datetime, time, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple

from sqlalchemy import (
    JSON,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

from ..extensions import db
from ..validation import VenueValidator


class Venue(db.Model):
    """Represents a pool venue in the system."""

    __tablename__ = "venues"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id = Column(Integer, primary_key=True)  # type: int
    name = Column(String(100), unique=True, nullable=False)  # type: str
    description = Column(Text)
    address = Column(String(255), nullable=False)  # type: str
    city = Column(String(100), nullable=False)  # type: str
    state = Column(String(50), nullable=False)
    country = Column(String(50), nullable=False)
    postal_code = Column(String(20), nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    website = Column(String(255))

    # Capacity and equipment
    capacity = Column(Integer)  # Total venue capacity
    tables = Column(Integer)  # Number of pool tables
    table_rate = Column(Float)  # Hourly rate per table

    # Status and ratings
    rating = Column(Float)  # Average rating
    review_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    status = Column(String(20), default="active")  # active, maintenance, closed

    # Location
    latitude = Column(Float)
    longitude = Column(Float)

    # Media and links
    photos = Column(JSON)  # List of photo URLs
    social_links = Column(JSON)  # Social media links
    featured_image = Column(String(255))  # Main venue image
    virtual_tour = Column(String(255))  # Virtual tour URL

    # Additional info
    hours_data = Column(JSON)  # Operating hours data
    amenities_summary = Column(JSON)  # Quick access to available amenities
    rules = Column(Text)  # Venue rules and policies
    notes = Column(Text)  # Internal notes

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)  # type: datetime
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    checkins = relationship("VenueCheckIn", back_populates="venue")
    operating_hours = relationship("VenueOperatingHours", back_populates="venue")
    amenities = relationship("VenueAmenity", back_populates="venue")
    leaderboard_entries = relationship("VenueLeaderboard", back_populates="venue")

    # Validation
    validator_class = VenueValidator

    def __init__(
        self,
        name: str,
        address: str,
        city: str,
        state: str,
        country: str,
        postal_code: str,
        tables: int,
        latitude: float = None,
        longitude: float = None,
        contact_email: str = None,
        contact_phone: str = None,
        status: str = "active",
    ):
        """Initialize venue."""
        self.name = name
        self.address = address
        self.city = city
        self.state = state
        self.country = country
        self.postal_code = postal_code
        self.tables = tables
        self.latitude = latitude
        self.longitude = longitude
        self.email = contact_email
        self.phone = contact_phone
        self.status = status
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def __repr__(self) -> str:
        """
        Returns the string representation of the Venue.

        Returns:
            str: A summary representation of the venue.
        """
        return f"<Venue {self.name}>"

    @hybrid_property
    def average_rating(self):
        """Get calculated average rating."""
        if not self.review_count:
            return None
        return round(self.rating, 1)

    @hybrid_property
    def is_open(self):
        """Check if venue is currently open."""
        current_time = datetime.now()
        current_day = current_time.weekday()
        hours = self.operating_hours.filter_by(day_of_week=current_day).first()
        return hours and hours.is_open(current_time.time())

    def get_available_tables(self, start_time=None, duration=None):
        """Get number of available tables.

        Args:
            start_time: Start time to check (defaults to current time)
            duration: Duration in hours

        Returns:
            int: Number of available tables
        """
        start_time = start_time or datetime.now()

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

        return self.tables - active_games

    def deactivate(self, reason=None):
        """Deactivate venue.

        Args:
            reason: Deactivation reason
        """
        self.is_active = False
        self.status = "closed"
        if reason:
            self.notes = reason
        db.session.commit()

    def activate(self):
        """Activate venue."""
        self.is_active = True
        self.status = "active"
        db.session.commit()

    def update_rating(self, new_rating):
        """Update venue rating.

        Args:
            new_rating: New rating value
        """
        if self.rating is None:
            self.rating = new_rating
            self.review_count = 1
        else:
            total = self.rating * self.review_count
            self.review_count += 1
            self.rating = (total + new_rating) / self.review_count
        db.session.commit()

    def add_photo(self, photo_url, is_featured=False):
        """Add photo to venue.

        Args:
            photo_url: URL of photo
            is_featured: Whether to set as featured image
        """
        if not self.photos:
            self.photos = []
        self.photos.append(photo_url)
        if is_featured:
            self.featured_image = photo_url
        db.session.commit()

    def remove_photo(self, photo_url):
        """Remove photo from venue.

        Args:
            photo_url: URL of photo to remove
        """
        if self.photos and photo_url in self.photos:
            self.photos.remove(photo_url)
            if self.featured_image == photo_url:
                self.featured_image = self.photos[0] if self.photos else None
            db.session.commit()

    def update_amenities_summary(self):
        """Update amenities summary."""
        self.amenities_summary = {amenity.name: amenity.is_available for amenity in self.amenities}
        db.session.commit()

    @classmethod
    def search(cls, query=None, city=None, state=None, is_active=True):
        """Search venues.

        Args:
            query: Search query
            city: City filter
            state: State filter
            is_active: Active status filter

        Returns:
            list: Matching venues
        """
        filters = [cls.is_active == is_active] if is_active is not None else []

        if query:
            filters.append(
                db.or_(cls.name.ilike(f"%{query}%"), cls.description.ilike(f"%{query}%"))
            )

        if city:
            filters.append(cls.city.ilike(f"%{city}%"))

        if state:
            filters.append(cls.state.ilike(f"%{state}%"))

        return cls.query.filter(*filters).all()
