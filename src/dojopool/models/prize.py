"""Prize model module."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db


class Prize(Base):
    """Prize model."""

    __tablename__ = "prizes"

    id: Mapped[int] = mapped_column(primary_key=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey("tournaments.id"))
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    value: Mapped[float] = mapped_column(Float)
    rank: Mapped[int] = mapped_column(Integer)  # 1 for first place, 2 for second, etc.
    winner_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(50), default="unclaimed")
    prize_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tournament: Mapped[List[Tournament]] = relationship(
        "Tournament", back_populates="prizes"
    )
    winner: Mapped[List[User]] = relationship("User", back_populates="prizes_won")

    def __init__(
        self,
        tournament_id: int,
        name: str,
        value: float,
        rank: int,
        description: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> None:
        """Initialize a new prize.

        Args:
            tournament_id: Tournament ID
            name: Prize name
            value: Prize value
            rank: Prize rank (1 for first place, etc.)
            description: Optional prize description
            metadata: Optional prize metadata
        """
        self.tournament_id = tournament_id
        self.name = name
        self.description = description
        self.value = value
        self.rank = rank
        self.status = "unclaimed"
        self.prize_metadata = metadata or {}
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def award(self, winner_id: int):
        """Award the prize to a winner.

        Args:
            winner_id: Winner user ID
        """
        self.winner_id = winner_id
        self.status = "awarded"
        self.updated_at = datetime.utcnow()

    def claim(self):
        """Mark the prize as claimed."""
        if self.status == "awarded":
            self.status = "claimed"
            self.updated_at = datetime.utcnow()

    def update_value(self, value: float):
        """Update prize value.

        Args:
            value: New prize value
        """
        self.value = value
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> dict:
        """Convert prize to dictionary.

        Returns:
            Dictionary representation of the prize
        """
        return {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "name": self.name,
            "description": self.description,
            "value": self.value,
            "rank": self.rank,
            "winner_id": self.winner_id,
            "status": self.status,
            "metadata": self.prize_metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
