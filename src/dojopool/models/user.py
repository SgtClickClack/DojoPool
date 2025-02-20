"""
User model for DojoPool

This module defines the user model with type annotations. It leverages Flask-Login for
session management and Flask-SQLAlchemy for database interactions. The module is enhanced
with detailed docstrings, secure password handling, and complete type safety.
"""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Set, Union
from uuid import UUID

from flask_login import UserMixin
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from ..core.models.base import BaseModel
from ..core.database.database import db
from .associations import user_roles

if TYPE_CHECKING:
    from ..core.models.notification_preference import NotificationPreference
    from .game import Game, GameSession, Shot
    from .notification import Notification
    from .role import Role
    from .tournament import Tournament, TournamentMatch
    from .tournament_participant import TournamentParticipant
    from .venue_checkin import VenueCheckIn
    from .venue_leaderboard import VenueLeaderboard


class User(BaseModel, UserMixin):
    """User model with complete type annotations."""

    __tablename__: str = "users"
    __table_args__ = {"extend_existing": True}

    # Primary fields
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    _password: Mapped[str] = mapped_column("password", String(255), nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True
    )
    profile_picture: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    _is_active: Mapped[bool] = mapped_column("is_active", Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Global Ranking Fields
    global_rating: Mapped[float] = mapped_column(Float, default=1000.0)
    global_rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    rank_tier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rank_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    highest_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    highest_rating_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    highest_rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    highest_rank_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True
    )
    rank_tier_color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rank_movement: Mapped[int] = mapped_column(Integer, default=0)
    rank_streak: Mapped[int] = mapped_column(Integer, default=0)
    rank_streak_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    total_games: Mapped[int] = mapped_column(Integer, default=0)
    games_won: Mapped[int] = mapped_column(Integer, default=0)
    tournament_wins: Mapped[int] = mapped_column(Integer, default=0)
    tournament_placements: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    ranking_history: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary=user_roles,
        back_populates="users",
        lazy="select",
    )
    games: Mapped[List["Game"]] = relationship(
        "Game", foreign_keys="[Game.player_id]", back_populates="player"
    )
    tournament_participations: Mapped[List["TournamentParticipant"]] = relationship(
        "TournamentParticipant", back_populates="player"
    )
    organized_tournaments: Mapped[List["Tournament"]] = relationship(
        "Tournament",
        back_populates="organizer",
        foreign_keys="[Tournament.organizer_id]",
    )
    venue_checkins: Mapped[List["VenueCheckIn"]] = relationship(
        "VenueCheckIn", back_populates="user", lazy="select"
    )
    leaderboard_entries: Mapped[List["VenueLeaderboard"]] = relationship(
        "VenueLeaderboard", back_populates="user", lazy="select"
    )
    shots: Mapped[List["Shot"]] = relationship(
        "Shot", back_populates="player", lazy="select"
    )
    game_sessions: Mapped[List["GameSession"]] = relationship(
        "GameSession", back_populates="user", lazy="select"
    )
    tournament_matches_as_player1: Mapped[List["TournamentMatch"]] = relationship(
        "TournamentMatch",
        foreign_keys="[TournamentMatch.player1_id]",
        back_populates="player1",
        lazy="select",
    )
    tournament_matches_as_player2: Mapped[List["TournamentMatch"]] = relationship(
        "TournamentMatch",
        foreign_keys="[TournamentMatch.player2_id]",
        back_populates="player2",
        lazy="select",
    )
    tournament_matches_won: Mapped[List["TournamentMatch"]] = relationship(
        "TournamentMatch",
        foreign_keys="[TournamentMatch.winner_id]",
        back_populates="winner",
        lazy="select",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="user"
    )
    notification_preferences: Mapped[List["NotificationPreference"]] = relationship(
        "NotificationPreference", back_populates="user"
    )

    @property
    def password(self) -> str:
        """Get password."""
        return self._password

    @password.setter
    def password(self, value: str):
        """Set password with hashing."""
        self._password = generate_password_hash(value)

    def check_password(self, password: str):
        """Check if password is correct."""
        return check_password_hash(self._password, password)

    def __init__(self, username: str, email: str, password: str):
        """Initialize user."""
        super().__init__()
        self.username = username
        self.email = email
        self.password = password  # This will use the password.setter to hash
        self.created_at = datetime.now(timezone.utc)
        self.updated_at = datetime.now(timezone.utc)

    def __repr__(self) -> str:
        """Return string representation of the user."""
        return f"<User {self.username}>"

    def get_id(self) -> str:
        """Return user ID as string."""
        return str(self.id)

    @property
    def is_active(self):
        """Return True if the user is active."""
        return bool(self._is_active)

    @is_active.setter
    def is_active(self, value: bool):
        """Set the user's active status."""
        self._is_active = value

    def has_role(self, role_name: str):
        """Check if user has a specific role."""
        return any(role.name == role_name for role in self.roles)

    def has_permission(self, permission: str) -> bool:
        """Check if user has a specific permission through any of their roles."""
        return any(permission in (role.permissions or []) for role in self.roles)

    def to_dict(self) -> Dict[str, Any]:
        """Convert user to dictionary."""
        base_dict = super().to_dict()
        user_dict = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "profile_picture": self.profile_picture,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "is_verified": self.is_verified,
            "roles": [role.name for role in self.roles],
            "global_rating": self.global_rating,
            "total_games": self.total_games,
            "games_won": self.games_won,
            "tournament_wins": self.tournament_wins,
        }
        return {**base_dict, **user_dict}
