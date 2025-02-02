"""
Match Model Module

This module defines the Match model for tracking pool games between users.
Enhanced with type annotations and complete docstrings for improved clarity
and maintainability.
"""

from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from ..core.extensions import db
from ..models.user import User


class Match(db.Model):
    """Match model for tournament matches."""

    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    tournament_id = Column(Integer, ForeignKey("tournament_games.id"), nullable=False)
    round = Column(Integer, nullable=False)  # Tournament round number
    match_number = Column(Integer, nullable=False)  # Match number within round
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
    tournament_game = relationship("TournamentGame", backref="matches")
    player1 = relationship("User", foreign_keys=[player1_id])
    player2 = relationship("User", foreign_keys=[player2_id])
    winner = relationship("User", foreign_keys=[winner_id])
    loser = relationship("User", foreign_keys=[loser_id])

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

    def start(self) -> None:
        """Start the match."""
        if self.status == "pending":
            self.status = "in_progress"
            self.start_time = datetime.utcnow()

    def complete(self, winner_id: int, score: str) -> None:
        """Complete the match with results."""
        if self.status != "completed":
            self.winner_id = winner_id
            self.loser_id = self.player2_id if winner_id == self.player1_id else self.player1_id
            self.score = score
            self.status = "completed"
            self.end_time = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
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
