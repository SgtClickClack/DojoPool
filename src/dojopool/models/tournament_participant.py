"""
Tournament Participant model for DojoPool

This module defines the tournament participant model for tracking players in tournaments.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .tournament import Tournament
    from .user import User


class TournamentParticipant(BaseModel):
    """Tournament participant model with complete type annotations."""

    __tablename__: str = "tournament_participants"
    __table_args__ = {"extend_existing": True}

    # Primary fields
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tournaments.id"), nullable=False
    )
    player_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="registered"
    )  # registered, active, eliminated, completed
    seed: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    final_rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    points_earned: Mapped[float] = mapped_column(Float, default=0.0)
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    matches_won: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    registration_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    tournament: Mapped["Tournament"] = relationship(
        "Tournament", back_populates="participants", lazy="select"
    )
    player: Mapped["User"] = relationship(
        "User", back_populates="tournament_participations", lazy="select"
    )

    def __init__(
        self,
        tournament_id: int,
        player_id: int,
        seed: Optional[int] = None,
        registration_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize tournament participant."""
        super().__init__()
        self.tournament_id = tournament_id
        self.player_id = player_id
        self.seed = seed
        self.registration_data = registration_data or {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation of the tournament participant."""
        return f"<TournamentParticipant {self.id}: Tournament {self.tournament_id} - Player {self.player_id}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert tournament participant to dictionary."""
        base_dict = super().to_dict()
        participant_dict = {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "player_id": self.player_id,
            "status": self.status,
            "seed": self.seed,
            "final_rank": self.final_rank,
            "points_earned": self.points_earned,
            "matches_played": self.matches_played,
            "matches_won": self.matches_won,
            "is_active": self.is_active,
            "registration_data": self.registration_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **participant_dict}
