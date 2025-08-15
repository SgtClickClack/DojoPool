"""
Tournament Model Module

This module defines the Tournament model for managing competitions within DojoPool.
It includes full type annotations and docstrings for clarity and maintainability.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from dojopool.extensions import db  # type: ignore
from dojopool.models.user import User # Import User model
from dojopool.models.venue import Venue
from .game import Game
from .enums import TournamentStatus, TournamentFormat # Import enums


class Tournament(db.Model):
    """Model for managing tournaments."""

    __tablename__ = 'tournaments'
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    venue_id = db.Column(db.Integer, db.ForeignKey('venues.id'), nullable=False)
    organizer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    registration_deadline = db.Column(db.DateTime, nullable=False)
    max_participants = db.Column(db.Integer, nullable=False)
    entry_fee = db.Column(db.Float, nullable=False)
    prize_pool = db.Column(db.Float, nullable=False)
    status = db.Column(SQLEnum(TournamentStatus), default=TournamentStatus.PENDING, nullable=False)
    format = db.Column(SQLEnum(TournamentFormat), nullable=False)
    rules = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    venue = db.relationship("Venue", backref=db.backref("tournaments", lazy=True))
    organizer = db.relationship("dojopool.models.user.User", backref=db.backref("organized_tournaments", lazy=True))
    participants = db.relationship("TournamentParticipant", backref="tournament", lazy='dynamic', cascade="all, delete-orphan")
    tournament_games = db.relationship("TournamentGame", backref="tournament", cascade="all, delete-orphan")

    def __init__(self, name: str, description: Optional[str], start_date: datetime, end_date: datetime,
                 venue_id: int, organizer_id: int, registration_deadline: datetime, max_participants: int,
                 entry_fee: float, prize_pool: float, format: TournamentFormat, status: TournamentStatus = TournamentStatus.PENDING, 
                 rules: Optional[str] = None):
        self.name = name
        self.description = description
        self.start_date = start_date
        self.end_date = end_date
        self.venue_id = venue_id
        self.organizer_id = organizer_id
        self.registration_deadline = registration_deadline
        self.max_participants = max_participants
        self.entry_fee = entry_fee
        self.prize_pool = prize_pool
        self.status = status
        self.format = format
        self.rules = rules

    def __repr__(self):
        return f'<Tournament {self.name}>'

    def to_dict(self):
        """Convert tournament to dictionary."""
        participant_count = self.participants.count() if self.participants else 0

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'venue_id': self.venue_id,
            'organizer_id': self.organizer_id,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'registration_deadline': self.registration_deadline.isoformat(),
            'max_participants': self.max_participants,
            'entry_fee': self.entry_fee,
            'prize_pool': self.prize_pool,
            'status': self.status,
            'format': self.format,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'participant_count': participant_count,
            'venue': self.venue.to_dict() if self.venue else None,
            'organizer': self.organizer.to_dict() if self.organizer else None
        }

    @hybrid_property
    def is_active(self) -> bool:
        """
        Determines whether the tournament is currently active.

        Returns:
            bool: True if the tournament is active, False otherwise.
        """
        now = datetime.utcnow()
        if self.end_date is None:
            return now >= self.start_date
        return self.start_date <= now <= self.end_date

    @hybrid_property
    def is_completed(self) -> bool:
        """Check if tournament is completed."""
        return self.status == TournamentStatus.COMPLETED

    @hybrid_property
    def participant_count(self) -> int:
        """Get number of participants."""
        return self.participants.count() if self.participants else 0

    def get_player_placement(self, user_id: int) -> Optional[int]:
        """Get player's placement in tournament."""
        # Moved import here to break circular dependency
        from dojopool.services.tournament_placement_service import tournament_placement_service
        # The service method also checks for completion, but an early exit here is fine.
        if not self.is_completed:
            return None
        return tournament_placement_service.get_player_placement(self, user_id)


# --- Uncommented TournamentParticipant ---
class TournamentParticipant(db.Model):
    """Model for tournament participants."""

    __tablename__ = 'tournament_participants'
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    registration_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    status = db.Column(db.String(50), default='registered')  # registered, checked_in, eliminated
    seed = db.Column(db.Integer, nullable=True)
    payment_status = db.Column(db.String(50), default='pending')  # pending, paid, refunded
    received_bye_round = db.Column(db.Integer, nullable=True) # Round number player received a bye, null if none

    # Relationships
    user = db.relationship("dojopool.models.user.User", backref="tournament_participations")

    # Unique constraint to prevent double registration
    # Needs to be added to __table_args__ if not already there
    # __table_args__ = (db.UniqueConstraint('tournament_id', 'user_id', name='_tournament_user_uc'), {'extend_existing': True})

    def __repr__(self):
        return f'<TournamentParticipant {self.user_id} in Tournament {self.tournament_id}>'

    def to_dict(self):
        """Convert participant to dictionary."""
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'user_id': self.user_id,
            'registration_date': self.registration_date.isoformat(),
            'status': self.status,
            'seed': self.seed,
            'payment_status': self.payment_status,
            'received_bye_round': self.received_bye_round,
            'user': self.user.to_dict() if self.user else None
        }
# --- End Uncommented TournamentParticipant ---

# --- New TournamentGame Model ---
class TournamentGame(db.Model):
    """Model linking Tournaments to Games and associated Matches."""
    __tablename__ = 'tournament_games'
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    round_number = db.Column(db.Integer, nullable=True)
    match_number = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    game = db.relationship("Game", back_populates="tournament_games")
    matches = db.relationship("Match", back_populates="tournament_game", lazy='dynamic')

    def __repr__(self):
        return f'<TournamentGame {self.id} for Tournament {self.tournament_id}, Game {self.game_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'tournament_id': self.tournament_id,
            'game_id': self.game_id,
            'round_number': self.round_number,
            'match_number': self.match_number,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'game': self.game.to_dict() if self.game else None,
            'matches': [match.to_dict() for match in self.matches] if self.matches else []
        }
# --- End New TournamentGame Model ---

# --- Explicit imports to resolve SQLAlchemy mapping ---
from dojopool.models.match import Match # Import Match for relationship

# Attach participants relationship after TournamentParticipant is defined
Tournament.participants = db.relationship(
    "dojopool.models.tournament.TournamentParticipant", # Use fully qualified string
    backref="tournament",
    lazy='dynamic', # Changed lazy loading strategy
    cascade="all, delete-orphan", # Kept cascade
    foreign_keys="TournamentParticipant.tournament_id" # Specify foreign keys explicitly
)

# --- STUB: TournamentMatch ---
class TournamentMatch:
    """Stub for TournamentMatch. Replace with real implementation if needed."""
    pass
