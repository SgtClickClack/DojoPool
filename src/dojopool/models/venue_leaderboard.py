"""
VenueLeaderboard Model Module

This module defines the VenueLeaderboard model for tracking player stats at specific venues.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from dojopool.extensions import db

class VenueLeaderboard(db.Model):
    """Model for venue-specific leaderboard entries."""
    __tablename__ = 'venue_leaderboards'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    venue_id = Column(Integer, ForeignKey('venues.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    points = Column(Float, default=0.0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    highest_streak = Column(Integer, default=0)
    last_played = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    venue = relationship('Venue', back_populates='leaderboard_entries')
    user = relationship('User', backref='venue_leaderboard_entries')

    def __repr__(self):
        return f'<VenueLeaderboard {self.user_id} at Venue {self.venue_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'venue_id': self.venue_id,
            'user_id': self.user_id,
            'points': self.points,
            'wins': self.wins,
            'losses': self.losses,
            'current_streak': self.current_streak,
            'highest_streak': self.highest_streak,
            'last_played': self.last_played.isoformat() if self.last_played else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
