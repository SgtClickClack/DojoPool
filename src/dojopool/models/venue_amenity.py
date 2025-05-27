"""
VenueAmenity Model Module

This module defines the VenueAmenity model for venue amenities.
"""

from sqlalchemy import Column, Integer, String, ForeignKey  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore
from dojopool.core.extensions import db

class VenueAmenity(db.Model):
    __tablename__ = 'venue_amenities'
    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=False)
    amenity = Column(String(128), nullable=False)

    venue = relationship('Venue', back_populates='amenities')
