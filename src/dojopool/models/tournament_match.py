"""Tournament match model."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .tournament import Tournament
    from .user import User


class TournamentMatch(BaseModel):
    """Tournament match model."""

    __tablename__ = "tournament_matches"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(
        ForeignKey("tournaments.id"), nullable=False
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    match_number: Mapped[int] = mapped_column(Integer, nullable=False)
    player1_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    player2_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    winner_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="pending")
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_bye: Mapped[bool] = mapped_column(Boolean, default=False)
    match_metadata: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
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
        "Tournament", back_populates="matches"
    )
    player1: Mapped["User"] = relationship("User", foreign_keys=[player1_id])
    player2: Mapped[Optional["User"]] = relationship("User", foreign_keys=[player2_id])
    winner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[winner_id])

    def __init__(
        self,
        tournament_id: int,
        round_number: int,
        match_number: int,
        player1_id: int,
        player2_id: Optional[int] = None,
    ) -> None:
        """Initialize a new tournament match."""
        super().__init__()
        self.tournament_id = tournament_id
        self.round_number = round_number
        self.match_number = match_number
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.status = "pending"
        self.is_bye = player2_id is None
        self.match_metadata = {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation of the match."""
        return f"<TournamentMatch {self.id}: Round {self.round_number} Match {self.match_number}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert match to dictionary."""
        base_dict = super().to_dict()
        match_dict = {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "round_number": self.round_number,
            "match_number": self.match_number,
            "player1_id": self.player1_id,
            "player2_id": self.player2_id,
            "winner_id": self.winner_id,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "is_bye": self.is_bye,
            "match_metadata": self.match_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **match_dict}
