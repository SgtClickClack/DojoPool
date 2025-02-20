"""Tournament model module."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .game import Game
    from .tournament_match import TournamentMatch
    from .tournament_participant import TournamentParticipant
    from .tournament_round import TournamentRound
    from .user import User
    from .venue import Venue


class TournamentStatus(str, Enum):
    """Tournament status enum."""

    OPEN: str = "open"
    CLOSED = "closed"
    IN_PROGRESS = "in_progress"
    COMPLETED: str = "completed"
    CANCELLED: str = "cancelled"


class Tournament(BaseModel):
    """Tournament model."""

    __tablename__: str = "tournaments"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    venue_id: Mapped[int] = mapped_column(Integer, ForeignKey("venues.id"))
    organizer_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    start_date: Mapped[datetime] = mapped_column(DateTime)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    max_participants: Mapped[int] = mapped_column(Integer)
    entry_fee: Mapped[float] = mapped_column(Float, default=0.0)
    prize_pool: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default=TournamentStatus.OPEN.value)
    rules: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="tournaments")
    organizer: Mapped["User"] = relationship(
        "User", foreign_keys=[organizer_id], back_populates="organized_tournaments"
    )
    prizes: Mapped[List["TournamentPrize"]] = relationship(
        "TournamentPrize", back_populates="tournament"
    )
    participants: Mapped[List["TournamentParticipant"]] = relationship(
        "TournamentParticipant", back_populates="tournament"
    )
    games: Mapped[List["Game"]] = relationship("Game", back_populates="tournament")

    def __init__(
        self,
        name: str,
        venue_id: int,
        start_date: datetime,
        max_participants: int,
        description: Optional[str] = None,
        end_date: Optional[datetime] = None,
        entry_fee: float = 0.0,
        prize_pool: float = 0.0,
        status: str = "open",
        rules: Optional[Dict[str, Any]] = None,
        organizer_id: Optional[int] = None,
    ) -> None:
        """Initialize tournament."""
        super().__init__()
        self.name = name
        self.description = description
        self.venue_id = venue_id
        self.organizer_id = organizer_id
        self.start_date = start_date
        self.end_date = end_date
        self.max_participants = max_participants
        self.entry_fee = entry_fee
        self.prize_pool = prize_pool
        self.status = status
        self.rules = rules or {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation."""
        return f"<Tournament {self.name}>"

    def to_dict(self) -> dict:
        """Convert tournament to dictionary."""
        base_dict = super().to_dict()
        tournament_dict = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "venue_id": self.venue_id,
            "organizer_id": self.organizer_id,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "max_participants": self.max_participants,
            "entry_fee": self.entry_fee,
            "prize_pool": self.prize_pool,
            "status": self.status,
            "rules": self.rules,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **tournament_dict}


class TournamentPrize(BaseModel):
    """Tournament prize model."""

    __tablename__: str = "tournament_prizes"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tournament_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tournaments.id"), nullable=False
    )
    place: Mapped[int] = mapped_column(Integer, nullable=False)
    prize_amount: Mapped[float] = mapped_column(Float, nullable=False)
    prize_description: Mapped[str] = mapped_column(String(500))
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
        "Tournament", back_populates="prizes"
    )

    def __init__(
        self,
        tournament_id: int,
        place: int,
        prize_amount: float,
        prize_description: str,
    ):
        """Initialize tournament prize."""
        super().__init__()
        self.tournament_id = tournament_id
        self.place = place
        self.prize_amount = prize_amount
        self.prize_description = prize_description
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation."""
        return f"<TournamentPrize {self.tournament_id} - {self.place} place>"

    def to_dict(self) -> dict:
        """Convert prize to dictionary."""
        base_dict = super().to_dict()
        prize_dict = {
            "id": self.id,
            "tournament_id": self.tournament_id,
            "place": self.place,
            "prize_amount": self.prize_amount,
            "prize_description": self.prize_description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **prize_dict}
