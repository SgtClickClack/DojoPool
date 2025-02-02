"""
Tournament Model Module

This module defines the Tournament model for managing competitions within DojoPool.
It includes full type annotations and docstrings for clarity and maintainability.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Float, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from enum import Enum
from dojopool.core.extensions import db  # type: ignore

# Association table for tournament participants
tournament_participants = Table(
    "tournament_participants",
    db.Model.metadata,
    Column("tournament_id", Integer, ForeignKey("tournaments.id"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)


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
    """Tournament model."""

    __tablename__ = "tournaments"

    id = db.Column(db.Integer, primary_key=True)  # type: int
    name = db.Column(db.String(100), nullable=False)  # type: str
    description = db.Column(db.Text, nullable=True)  # type: Optional[str]
    start_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # type: datetime
    end_date = db.Column(db.DateTime, nullable=True)  # type: Optional[datetime]
    registration_deadline = db.Column(db.DateTime)
    max_participants = db.Column(db.Integer, default=32)
    entry_fee = db.Column(db.Float, default=0.0)
    prize_pool = db.Column(db.Float, default=0.0)
    status = db.Column(db.Enum(TournamentStatus), nullable=False, default=TournamentStatus.PENDING)
    format = db.Column(db.Enum(TournamentFormat), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"))
    organizer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Relationships
    venue = relationship("Venue", backref="tournaments")
    organizer = relationship("User", backref="organized_tournaments", foreign_keys=[organizer_id])
    participants = relationship("User", secondary="tournament_participants", backref="tournaments")
    matches = relationship("TournamentGame", backref="tournament", lazy="dynamic")

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
        return len(self.participants)

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
        self, user_id: int, matches: List["TournamentGame"]
    ) -> int:
        """Calculate placement in single elimination tournament."""
        if not matches:
            return 0

        # Find the round where player was eliminated
        elimination_round = 0
        for match in matches:
            if match.loser_id == user_id:
                elimination_round = match.round_number
                break

        # Calculate placement based on elimination round
        total_rounds = max(m.round_number for m in matches)
        if elimination_round == 0:  # Won tournament
            return 1
        elif elimination_round == total_rounds:  # Runner up
            return 2
        else:
            # Earlier rounds have lower placements
            return 2 ** (total_rounds - elimination_round + 1)

    def _calculate_double_elim_placement(
        self, user_id: int, matches: List["TournamentGame"]
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
                (m for m in matches if m.round_number == max(m.round_number for m in matches)), None
            )
            return 2 if final_match and final_match.loser_id == user_id else 3
        else:  # Lost in losers bracket
            return loss_count + 1

    def _calculate_round_robin_placement(
        self, user_id: int, matches: List["TournamentGame"]
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

    def to_dict(self) -> Dict[str, Any]:
        """Convert tournament to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "max_participants": self.max_participants,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "status": self.status,
            "format": self.format,
            "participant_count": self.participant_count,
            "is_active": self.is_active,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        """
        Returns a string representation of the Tournament.

        Returns:
            str: A summary representation of the tournament.
        """
        return f"<Tournament {self.name}>"


class TournamentGame(db.Model):
    """Model for games played within tournaments."""

    __tablename__ = "tournament_games"

    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=False)
    round_number = Column(Integer, nullable=False)
    match_number = Column(Integer, nullable=False)
    player1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    player2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    winner_id = Column(Integer, ForeignKey("users.id"))
    loser_id = Column(Integer, ForeignKey("users.id"))
    score = Column(String(20))  # e.g., "7-5"
    status = Column(String(20), default="pending")  # pending, in_progress, completed
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tournament = relationship("Tournament", back_populates="matches")
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])
    loser = relationship("User", foreign_keys=[loser_id])

    @hybrid_property
    def duration(self) -> Optional[float]:
        """Get game duration in seconds."""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    @hybrid_property
    def is_completed(self) -> bool:
        """Check if game is completed."""
        return self.status == "completed"

    def start(self) -> None:
        """Start the game."""
        if self.status == "pending":
            self.status = "in_progress"
            self.start_time = datetime.utcnow()

    def complete(self, winner_id: int, score: str) -> None:
        """Complete the game with results."""
        if self.status != "completed":
            self.winner_id = winner_id
            self.loser_id = self.player2_id if winner_id == self.player1_id else self.player1_id
            self.score = score
            self.status = "completed"
            self.end_time = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert game to dictionary."""
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "round_number": self.round_number,
            "match_number": self.match_number,
            "player1_id": self.player1_id,
            "player2_id": self.player2_id,
            "winner_id": self.winner_id,
            "loser_id": self.loser_id,
            "score": self.score,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration": self.duration,
            "is_completed": self.is_completed,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __repr__(self) -> str:
        """String representation."""
        return f"<TournamentGame {self.id}: {self.player1_id} vs {self.player2_id}>"
