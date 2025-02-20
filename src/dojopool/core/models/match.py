"""Match model for tournament matches."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union, cast
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db


class Match(Base):
    """Match model for tournament matches."""

    __tablename__ = "matches"
    __table_args__ = {"extend_existing": True}

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
    winner_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    loser_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending, in_progress, completed
    start_time: Mapped[datetime] = mapped_column(DateTime)
    end_time: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    valid: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_played: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    tournament: Mapped[List[Tournament]] = relationship(
        "Tournament", back_populates="matches"
    )
    player1: relationship = relationship(
        "User", foreign_keys=[player1_id], back_populates="matches_as_player1"
    )
    player2: relationship = relationship(
        "User", foreign_keys=[player2_id], back_populates="matches_as_player2"
    )
    winner: relationship = relationship(
        "User", foreign_keys=[winner_id], back_populates="matches_won"
    )
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
            self.status = "in_progress"
            self.start_time = datetime.utcnow()

    def complete(self, winner_id: int, score: str):
        """Complete the match with results."""
        if self.status != "completed":
            self.winner_id = winner_id
            self.loser_id = (
                self.player2_id if winner_id == self.player1_id else self.player1_id
            )
            self.score = score
            self.status = "completed"
            self.end_time = datetime.utcnow()

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
            "valid": self.valid,
            "description": self.description,
            "date_played": self.date_played.isoformat(),
        }

    def __repr__(self) -> str:
        """String representation."""
        return f"<Match {self.id}: {self.player1_id} vs {self.player2_id}>"

    def calculate_result(self) -> Optional[float]:
        return self.score

    def is_valid(self):
        return bool(self.valid)
