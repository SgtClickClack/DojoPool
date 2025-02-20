"""
Game model for DojoPool

This module defines the game model for tracking pool matches between players.
It includes fields for game state, scores, and relationships to players and venues.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel
from ..core.database.database import db

if TYPE_CHECKING:
    from .table import Table
    from .tournament import Tournament
    from .user import User
    from .venue import Venue


class GameType(str, Enum):
    """Game type enumeration."""

    EIGHT_BALL: str = "8ball"
    NINE_BALL = "9ball"
    STRAIGHT = "straight"
    ONE_POCKET: str = "one_pocket"
    BANK_POOL: str = "bank_pool"
    SNOOKER = "snooker"
    ROTATION: str = "rotation"


class GameMode(str, Enum):
    """Game mode enumeration."""

    CASUAL: str = "casual"
    RANKED = "ranked"
    TOURNAMENT = "tournament"
    PRACTICE: str = "practice"
    CHALLENGE: str = "challenge"
    TRAINING = "training"


class GameStatus(str, Enum):
    """Game status enumeration."""

    PENDING: str = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED: str = "completed"
    CANCELLED: str = "cancelled"
    FORFEITED = "forfeited"
    DISPUTED: str = "disputed"


class Shot(BaseModel):
    """Shot model for tracking individual shots in a game."""

    __tablename__: str = "shots"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    shot_type: Mapped[str] = mapped_column(String(50))
    ball_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pocket: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    game: Mapped["Game"] = relationship("Game", back_populates="shots")
    player: Mapped["User"] = relationship("User", back_populates="shots", lazy="select")

    def __init__(
        self,
        game_id: int,
        player_id: int,
        shot_type: str,
        ball_number: Optional[int] = None,
        pocket: Optional[int] = None,
        success: bool = False,
        metrics: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize a new shot."""
        super().__init__()
        self.game_id = game_id
        self.player_id = player_id
        self.shot_type = shot_type
        self.ball_number = ball_number
        self.pocket = pocket
        self.success = success
        self.metrics = metrics or {}
        self.timestamp = datetime.now(timezone.utc)
        self.created_at = datetime.now(timezone.utc)

    def to_dict(self) -> Dict[str, Any]:
        """Convert shot to dictionary."""
        base_dict = super().to_dict()
        shot_dict = {
            "id": self.id,
            "game_id": self.game_id,
            "player_id": self.player_id,
            "shot_type": self.shot_type,
            "ball_number": self.ball_number,
            "pocket": self.pocket,
            "success": self.success,
            "metrics": self.metrics,
            "timestamp": self.timestamp.isoformat(),
            "created_at": self.created_at.isoformat(),
        }
        return {**base_dict, **shot_dict}


class Game(BaseModel):
    """Game model with complete type annotations."""

    __tablename__: str = "games"
    __table_args__ = {"extend_existing": True}

    # Primary fields
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    opponent_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    venue_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("venues.id"), nullable=True
    )
    table_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tables.id"), nullable=True
    )
    game_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=GameStatus.PENDING.value)
    winner_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    player_score: Mapped[int] = mapped_column(Integer, default=0)
    opponent_score: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    game_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    is_ranked: Mapped[bool] = mapped_column(Boolean, default=True)
    is_tournament_game: Mapped[bool] = mapped_column(Boolean, default=False)
    tournament_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tournaments.id"), nullable=True
    )
    session_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("game_sessions.id"), nullable=True
    )

    # Relationships
    player: Mapped["User"] = relationship(
        "User", foreign_keys=[player_id], back_populates="games"
    )
    opponent: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[opponent_id], backref="opponent_games"
    )
    winner: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[winner_id], backref="won_games"
    )
    venue: Mapped["Venue"] = relationship("Venue", back_populates="games")
    tournament: Mapped[Optional["Tournament"]] = relationship(
        "Tournament", back_populates="games"
    )
    session: Mapped["GameSession"] = relationship("GameSession", back_populates="games")
    table: Mapped[Optional["Table"]] = relationship("Table", back_populates="games")
    shots: Mapped[List["Shot"]] = relationship(
        "Shot", back_populates="game", lazy="select"
    )

    def __init__(
        self,
        player_id: int,
        game_type: str,
        opponent_id: Optional[int] = None,
        venue_id: Optional[int] = None,
        is_ranked: bool = True,
        is_tournament_game: bool = False,
        tournament_id: Optional[int] = None,
        session_id: Optional[int] = None,
    ):
        """Initialize game."""
        super().__init__()
        self.player_id = player_id
        self.opponent_id = opponent_id
        self.venue_id = venue_id
        self.game_type = game_type
        self.is_ranked = is_ranked
        self.is_tournament_game = is_tournament_game
        self.tournament_id = tournament_id
        self.session_id = session_id
        self.started_at = datetime.now(timezone.utc)

    def __repr__(self):
        """Return string representation of the game."""
        return f"<Game {self.id}: {self.game_type} - {self.status}>"

    def to_dict(self) -> Dict[str, Any]:
        """Convert game to dictionary."""
        base_dict = super().to_dict()
        game_dict = {
            "id": self.id,
            "player_id": self.player_id,
            "opponent_id": self.opponent_id,
            "venue_id": self.venue_id,
            "game_type": self.game_type,
            "status": self.status,
            "winner_id": self.winner_id,
            "player_score": self.player_score,
            "opponent_score": self.opponent_score,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "is_ranked": self.is_ranked,
            "is_tournament_game": self.is_tournament_game,
            "tournament_id": self.tournament_id,
            "session_id": self.session_id,
        }
        return {**base_dict, **game_dict}


class GameSession(BaseModel):
    """Game session model."""

    __tablename__: str = "game_sessions"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(50), default="active")
    settings: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="game_sessions")
    games: Mapped[List["Game"]] = relationship("Game", back_populates="session")

    def __init__(self, user_id: int, settings: Optional[Dict[str, Any]] = None):
        """Initialize game session."""
        super().__init__()
        self.user_id = user_id
        self.settings = settings or {}
        self.metrics = {}
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def end(self):
        """End game session."""
        self.status = "ended"
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()

    def cancel(self):
        """Cancel game session."""
        self.status = "cancelled"
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()

    def update_settings(self, settings: Dict[str, Any]) -> None:
        """Update session settings."""
        self.settings.update(settings)
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()

    def add_metric(self, key: str, value: float):
        """Add metric to session."""
        if key not in self.metrics:
            self.metrics[key] = []
        self.metrics[key].append(
            {"value": value, "timestamp": datetime.now(timezone.utc).isoformat()}
        )
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary."""
        base_dict = super().to_dict()
        session_dict = {
            "id": self.id,
            "user_id": self.user_id,
            "status": self.status,
            "settings": self.settings,
            "metrics": self.metrics,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        return {**base_dict, **session_dict}
