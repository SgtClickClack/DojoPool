"""
Tournament Model Module

This module defines the Tournament model for managing competitions within DojoPool.
It includes full type annotations and docstrings for clarity and maintainability.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from enum import Enum
from dojopool.core.extensions import db  # type: ignore
from dojopool.models.user import User # Import User model
from dojopool.models.venue import Venue
from .game import Game


class TournamentStatus(str, Enum):
    """Tournament status enumeration."""

    PENDING = "pending"
    REGISTRATION = "registration"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(str, Enum):
    """Tournament format enumeration."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"


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
    status = db.Column(db.String(50), default='draft')  # draft, open, closed, in_progress, completed
    format = db.Column(db.String(50), nullable=False)  # single_elimination, double_elimination, round_robin
    rules = db.Column(db.Text, nullable=True) # Added rules based on service usage
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    venue = db.relationship("Venue", backref=db.backref("tournaments", lazy=True))
    organizer = db.relationship("dojopool.models.user.User", backref=db.backref("organized_tournaments", lazy=True))
    participants = db.relationship("TournamentParticipant", backref="tournament", lazy='dynamic', cascade="all, delete-orphan")
    tournament_games = db.relationship("TournamentGame", backref="tournament", cascade="all, delete-orphan")

    # Add __init__ method
    def __init__(self, name: str, description: Optional[str], start_date: datetime, end_date: datetime,
                 venue_id: int, organizer_id: int, registration_deadline: datetime, max_participants: int,
                 entry_fee: float, prize_pool: float, format: str, status: str = 'draft', rules: Optional[str] = None):
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
        if not self.is_completed:
            return None

        # Get all matches associated with this tournament via TournamentGame
        # This might involve querying the database if relationships are lazy-loaded
        all_matches: List[Match] = []
        for tg in self.tournament_games:
            all_matches.extend(tg.matches)

        if not all_matches:
            return None

        wins = sum(1 for m in all_matches if m.winner_id == user_id)
        losses = sum(1 for m in all_matches if m.loser_id == user_id)

        if not wins and not losses:
            # Player didn't participate in any recorded matches
            return None

        # Calculate placement based on format
        if self.format == TournamentFormat.SINGLE_ELIMINATION.value:
            return self._calculate_single_elim_placement(user_id, all_matches)
        elif self.format == TournamentFormat.DOUBLE_ELIMINATION.value:
            return self._calculate_double_elim_placement(user_id, all_matches)
        elif self.format == TournamentFormat.ROUND_ROBIN.value:
            return self._calculate_round_robin_placement(user_id, all_matches)

        return None

    def _calculate_single_elim_placement(
        self, user_id: int, matches: List["Match"]
    ) -> int:
        """Calculate placement in single elimination tournament."""
        if not matches:
            return 0 # Or appropriate default/error

        # Find the round where player was eliminated
        elimination_round = 0
        for match in matches:
            # Ensure comparison is between actual IDs
            if match.loser_id is not None and match.loser_id == user_id:
                elimination_round = match.round # Get the actual round number
                break

        # Calculate placement based on elimination round
        # Ensure rounds are actual integers before calling max
        rounds = [m.round for m in matches if m.round is not None]
        if not rounds:
            return 1 # Handle case with no rounds (e.g., player won by default)
        total_rounds = max(rounds)

        if elimination_round == 0:  # Player was never eliminated (Won tournament)
            return 1
        elif elimination_round == total_rounds:  # Runner up
            return 2
        else:
            # Placement based on the round they were eliminated
            # Lower rounds mean higher placement numbers (3rd, 4th...)
            # This assumes rounds are numbered 1, 2, ... N
            # Calculate how many places eliminated before them
            placement_power = total_rounds - elimination_round
            return 2 ** (placement_power + 1) # Roughly places 3/4, 5-8 etc.

    def _calculate_double_elim_placement(
        self, user_id: int, matches: List["Match"]
    ) -> int:
        """Calculate placement in double elimination tournament."""
        if not matches:
            return 0

        # Track losses
        loss_count = sum(1 for m in matches if m.loser_id is not None and m.loser_id == user_id)

        if loss_count == 0:  # Won tournament
            return 1
        elif loss_count == 1:  # Lost once
            # Check if they lost in the grand final
            rounds = [m.round for m in matches if m.round is not None]
            if not rounds:
                 return 3 # Should not happen if matches exist
            max_round = max(rounds)
            final_match = next((m for m in matches if m.round == max_round), None)
            # If lost in final round -> 2nd place, otherwise 3rd (lost earlier in winners)
            return 2 if final_match and (final_match.loser_id is not None and final_match.loser_id == user_id) else 3
        else:  # Lost twice (eliminated from losers bracket)
            # Placement depends on which round they lost the second time
            # This calculation can be complex, returning a rough placement for now
            return loss_count + 2 # Rough estimate (4th, 5th, etc.)

    def _calculate_round_robin_placement(
        self, user_id: int, matches: List["Match"]
    ) -> int:
        """Calculate placement in round robin tournament."""
        if not matches:
            return 0

        # Calculate points for all players
        points = {}
        participants = set()
        for match in matches:
            if match.player1_id: participants.add(match.player1_id)
            if match.player2_id: participants.add(match.player2_id)

            # Initialize points if player not seen
            if match.winner_id not in points: points[match.winner_id] = 0
            if match.loser_id not in points: points[match.loser_id] = 0

            # Award points (can be adjusted based on rules, e.g., draws)
            if match.winner_id is not None:
                points[match.winner_id] += 2  # Win = 2 points (example)
            # Add points for loss or default points? Depends on rules.
            # Assuming 0 points for loss for simplicity here.

        # Handle participants who didn't play (or results weren't recorded)
        for p_id in participants:
            if p_id not in points: points[p_id] = 0

        # Sort players by points (descending)
        # Tie-breaking rules would be needed for a robust system
        sorted_players = sorted(points.items(), key=lambda item: item[1], reverse=True)

        # Find rank of the user_id
        rank = 0
        for i, (player_id, score) in enumerate(sorted_players):
            if i == 0 or score < sorted_players[i-1][1]: # New rank if score decreased
                rank = i + 1
            if player_id == user_id:
                return rank

        return len(participants) # Return last place if not found (shouldn't happen if in participants)


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
