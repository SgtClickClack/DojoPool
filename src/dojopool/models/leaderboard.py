"""
Leaderboard Model Module

This module defines the Leaderboard model for tracking player rankings and statistics.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from dojopool.core.extensions import db  # type: ignore


class LeaderboardType(str, Enum):
    """Leaderboard type enumeration."""
    GLOBAL = "global"
    REGIONAL = "regional"
    VENUE = "venue"
    TOURNAMENT = "tournament"


class LeaderboardPeriod(str, Enum):
    """Leaderboard period enumeration."""
    ALL_TIME = "all_time"
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    DAILY = "daily"


# Canonical LeaderboardEntry model is defined elsewhere (core or ranking). This definition is commented out to prevent duplicate table errors.
# class LeaderboardEntry(db.Model):
#     """Model for leaderboard entries."""
#
#     __tablename__ = 'leaderboard_entries'
#
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
#     leaderboard_type = db.Column(db.String(50), nullable=False)  # global, regional, venue, tournament
#     period = db.Column(db.String(50), nullable=False)  # all_time, monthly, weekly, daily
#     # region_id = db.Column(db.Integer, db.ForeignKey('regions.id'), nullable=True)
#     venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=True)
#     tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=True)
#     rank = db.Column(db.Integer, nullable=False)
#     points = db.Column(db.Float, nullable=False, default=0.0)
#     wins = db.Column(db.Integer, nullable=False, default=0)
#     losses = db.Column(db.Integer, nullable=False, default=0)
#     games_played = db.Column(db.Integer, nullable=False, default=0)
#     win_rate = db.Column(db.Float, nullable=False, default=0.0)
#     last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
#
#     # Relationships
#     user = db.relationship('User', backref=db.backref('leaderboard_entries', lazy=True))
#     # region = db.relationship('Region', backref=db.backref('leaderboard_entries', lazy=True))
#     venue = db.relationship('Venue', backref=db.backref('leaderboard_entries', lazy=True))
#     tournament = db.relationship('Tournament', backref=db.backref('leaderboard_entries', lazy=True))
#
#     def __repr__(self):
#         return f'<LeaderboardEntry {self.user_id} Rank {self.rank}>'
#
#     def to_dict(self) -> Dict[str, Any]:
#         """Convert entry to dictionary."""
#         return {
#             'id': self.id,
#             'user_id': self.user_id,
#             'leaderboard_type': self.leaderboard_type,
#             'period': self.period,
#             'region_id': self.region_id,
#             'venue_id': self.venue_id,
#             'tournament_id': self.tournament_id,
#             'rank': self.rank,
#             'points': self.points,
#             'wins': self.wins,
#             'losses': self.losses,
#             'games_played': self.games_played,
#             'win_rate': self.win_rate,
#             'last_updated': self.last_updated.isoformat(),
#             'user': self.user.to_dict() if self.user else None,
#             'region': self.region.to_dict() if self.region else None,
#             'venue': self.venue.to_dict() if self.venue else None,
#             'tournament': self.tournament.to_dict() if self.tournament else None
#         }
#
#     @property
#     def win_rate(self) -> float:
#         """Calculate win rate."""
#         if self.games_played == 0:
#             return 0.0
#         return self.wins / self.games_played
#
#     def update_stats(self, won: bool) -> None:
#         """Update entry statistics after a game."""
#         self.games_played += 1
#         if won:
#             self.wins += 1
#             self.points += 1.0
#         else:
#             self.losses += 1
#             self.points += 0.5
#         self.last_updated = datetime.utcnow()
