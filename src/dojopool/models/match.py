"""
Match Model Module

This module defines the Match model for tracking pool games between users.
Enhanced with type annotations and complete docstrings for improved clarity
and maintainability.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db


class Match(Base):
    """Match model for tournament matches."""

    __tablename__: str = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tournaments.id"), nullable=False
    )
    round: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Tournament round number
    match_number: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # Match number within round
    player1_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    player2_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    winner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    loser_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    score: Mapped[str] = mapped_column(String(20))  # e.g., "7-5"
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending, in_progress, completed
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tournament: relationship = relationship("Tournament", backref="matches")
    player1: relationship = relationship("User", foreign_keys=[player1_id])
    player2: relationship = relationship("User", foreign_keys=[player2_id])
    winner: relationship = relationship("User", foreign_keys=[winner_id])
    loser: relationship = relationship("User", foreign_keys=[loser_id])

    @hybrid_property
    def duration(self) -> Optional[float]:
        """Get match duration in seconds."""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    @hybrid_property
    def is_completed(self) -> bool:
        """Check if match is completed."""
        return self.status == "completed"

    def start(self):
        """Start the match."""
        if self.status == "pending":
            self.status: Column = "in_progress"
            self.start_time: Column = datetime.utcnow()

    def complete(self, winner_id: int, score: str):
        """Complete the match with results."""
        if self.status != "completed":
            self.winner_id = winner_id
            self.loser_id: Column = (
                self.player2_id if winner_id == self.player1_id else self.player1_id
            )
            self.score: Column = score
            self.status: Column = "completed"
            self.end_time: Column = datetime.utcnow()

    def to_dict(self):
        """Convert match to dictionary."""
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "round": self.round,
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
        """
        Returns a string representation of the Match.

        Returns:
            str: A string summarizing the match.
        """
        return f"<Match {self.id}: {self.player1.username} vs {self.player2.username}>"

    def get_score_difference(self) -> Optional[float]:
        """
        Calculate the score difference between the two players.

        Returns:
            Optional[float]: The score difference.
        """
        if not self.score:
            return None
        try:
            score_parts = self.score.split("-")
            player1_score: Column = float(score_parts[0])
            player2_score: Column = float(score_parts[1])
            return player1_score - player2_score
        except (ValueError, IndexError):
            return None
