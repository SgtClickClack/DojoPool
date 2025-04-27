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
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    venue = db.relationship("dojopool.models.venue.Venue", backref=db.backref("tournaments", lazy=True))
    organizer = db.relationship("dojopool.models.user.User", backref=db.backref("organized_tournaments", lazy=True))
    matches = db.relationship("dojopool.models.tournament.TournamentMatch", backref="tournament", lazy=True)
    participants = db.relationship("TournamentParticipant", backref="tournament", lazy='dynamic', cascade="all, delete-orphan")

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

        # Get all matches to calculate placements
        matches = self.matches.all()
        wins = sum(1 for m in matches if m.winner_id == user_id)
        losses = sum(1 for m in matches if m.loser_id == user_id)

        if not wins and not losses:
            return None

        # Calculate placement based on format
        if self.format == TournamentFormat.SINGLE_ELIMINATION:
            return self._calculate_single_elim_placement(user_id, matches)
        elif self.format == TournamentFormat.DOUBLE_ELIMINATION:
            return self._calculate_double_elim_placement(user_id, matches)
        elif self.format == TournamentFormat.ROUND_ROBIN:
            return self._calculate_round_robin_placement(user_id, matches)

        return None

    def _calculate_single_elim_placement(
        self, user_id: int, matches: List["TournamentMatch"]
    ) -> int:
        """Calculate placement in single elimination tournament."""
        if not matches:
            return 0

        # Find the round where player was eliminated
        elimination_round = 0
        for match in matches:
            if match.loser_id == user_id:
                elimination_round = match.round
                break

        # Calculate placement based on elimination round
        total_rounds = max(m.round for m in matches)
        if elimination_round == 0:  # Won tournament
            return 1
        elif elimination_round == total_rounds:  # Runner up
            return 2
        else:
            # Earlier rounds have lower placements
            return 2 ** (total_rounds - elimination_round + 1)

    def _calculate_double_elim_placement(
        self, user_id: int, matches: List["TournamentMatch"]
    ) -> int:
        """Calculate placement in double elimination tournament."""
        if not matches:
            return 0

        # Track losses
        loss_count = sum(1 for m in matches if m.loser_id == user_id)
        if loss_count == 0:  # Won tournament
            return 1
        elif loss_count == 1:  # Lost in winners bracket
            final_match = next(
                (m for m in matches if m.round == max(m.round for m in matches)), None
            )
            return 2 if final_match and final_match.loser_id == user_id else 3
        else:  # Lost in losers bracket
            return loss_count + 1

    def _calculate_round_robin_placement(
        self, user_id: int, matches: List["TournamentMatch"]
    ) -> int:
        """Calculate placement in round robin tournament."""
        if not matches:
            return 0

        # Calculate points for all players
        points = {}
        for match in matches:
            if match.winner_id not in points:
                points[match.winner_id] = 0
            if match.loser_id not in points:
                points[match.loser_id] = 0

            points[match.winner_id] += 2  # Win = 2 points
            points[match.loser_id] += 1  # Loss = 1 point

        # Sort players by points
        sorted_players = sorted(points.items(), key=lambda x: x[1], reverse=True)
        for i, (player_id, _) in enumerate(sorted_players, 1):
            if player_id == user_id:
                return i

        return len(sorted_players)


# class TournamentParticipant(db.Model):
#     """Model for tournament participants."""
#
#     __tablename__ = 'tournament_participants'
#     __table_args__ = {"extend_existing": True}
#
#     id = db.Column(db.Integer, primary_key=True)
#     tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
#     registration_date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
#     status = db.Column(db.String(50), default='registered')  # registered, checked_in, eliminated
#     seed = db.Column(db.Integer, nullable=True)
#     payment_status = db.Column(db.String(50), default='pending')  # pending, paid, refunded
#     received_bye_round = db.Column(db.Integer, nullable=True) # Round number player received a bye, null if none
#
#     # Relationships
#     user = db.relationship("User", back_populates="tournament_participations")
#
#     # Unique constraint to prevent double registration
#     __table_args__ = (db.UniqueConstraint('tournament_id', 'user_id', name='_tournament_user_uc'),)
#
#     def __repr__(self):
#         return f'<TournamentParticipant {self.user_id} in Tournament {self.tournament_id}>'
#
#     def to_dict(self):
#         """Convert participant to dictionary."""
#         return {
#             'id': self.id,
#             'tournament_id': self.tournament_id,
#             'user_id': self.user_id,
#             'registration_date': self.registration_date.isoformat(),
#             'status': self.status,
#             'seed': self.seed,
#             'payment_status': self.payment_status,
#             'received_bye_round': self.received_bye_round,
#             'user': self.user.to_dict() if self.user else None
#         }


# class TournamentMatch(db.Model):
#     """Model for tournament matches."""
#
#     __tablename__ = 'tournament_matches'
#
#     id = db.Column(db.Integer, primary_key=True)
#     tournament_id = db.Column(db.Integer, db.ForeignKey('tournaments.id'), nullable=False)
#     round = db.Column(db.Integer, nullable=False)
#     match_number = db.Column(db.Integer, nullable=False)
#     bracket_type = db.Column(db.String(20), nullable=True)
#     player1_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
#     player2_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
#     winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
#     status = db.Column(db.String(50), default='scheduled')  # scheduled, in_progress, completed
#     start_time = db.Column(db.DateTime, nullable=True)
#     end_time = db.Column(db.DateTime, nullable=True)
#     score = db.Column(db.String(50), nullable=True)  # Format: "7-5, 6-4"
#     table_number = db.Column(db.Integer, nullable=True)
#
#     # Relationships
#     player1 = db.relationship(
#         "dojopool.models.user.User",
#         foreign_keys=[player1_id],
#         backref=db.backref("matches_as_player1", lazy=True)
#     )
#     player2 = db.relationship(
#         "dojopool.models.user.User",
#         foreign_keys=[player2_id],
#         backref=db.backref("matches_as_player2", lazy=True)
#     )
#     winner = db.relationship(
#         "dojopool.models.user.User",
#         foreign_keys=[winner_id],
#         backref=db.backref("matches_won", lazy=True)
#     )
#
#     def __repr__(self):
#         return f'<TournamentMatch {self.match_number} in Round {self.round}>'
#
#     def to_dict(self):
#         """Convert match to dictionary."""
#         return {
#             'id': self.id,
#             'tournament_id': self.tournament_id,
#             'round': self.round,
#             'match_number': self.match_number,
#             'bracket_type': self.bracket_type,
#             'player1_id': self.player1_id,
#             'player2_id': self.player2_id,
#             'winner_id': self.winner_id,
#             'status': self.status,
#             'start_time': self.start_time.isoformat() if self.start_time else None,
#             'end_time': self.end_time.isoformat() if self.end_time else None,
#             'score': self.score,
#             'table_number': self.table_number,
#             'player1': self.player1.to_dict() if self.player1 else None,
#             'player2': self.player2.to_dict() if self.player2 else None,
#             'winner': self.winner.to_dict() if self.winner else None
#         }

# --- Explicit imports to resolve SQLAlchemy mapping ---
from dojopool.models.venue import Venue
# from dojopool.models.tournament import TournamentParticipant

# Attach participants relationship after TournamentParticipant is defined
Tournament.participants = db.relationship(
    "dojopool.models.tournament.TournamentParticipant",
    backref="tournament",
    lazy=True,
    foreign_keys=["TournamentParticipant.tournament_id"]
)
