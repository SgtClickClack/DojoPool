"""Tournament round model module."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .tournament import Tournament
    from .tournament_match import TournamentMatch


class TournamentRound(BaseModel):
    """Tournament round model."""

    __tablename__ = "tournament_rounds"

    id: Mapped[int] = mapped_column(primary_key=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id"))
    round_number: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(
        String(100)
    )  # e.g., "Quarter Finals", "Semi Finals", etc.
    status: Mapped[str] = mapped_column(String(50), default="pending")
    start_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
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
        "Tournament", back_populates="rounds"
    )
    matches: Mapped[List["TournamentMatch"]] = relationship(
        "TournamentMatch", back_populates="round", lazy="select"
    )

    def __init__(
        self,
        tournament_id: int,
        round_number: int,
        name: str,
    ) -> None:
        """Initialize a new tournament round."""
        super().__init__()
        self.tournament_id = tournament_id
        self.round_number = round_number
        self.name = name
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation of the tournament round."""
        return f"<TournamentRound {self.id}: {self.name}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert tournament round to dictionary."""
        base_dict = super().to_dict()
        round_dict = {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "round_number": self.round_number,
            "name": self.name,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **round_dict}
