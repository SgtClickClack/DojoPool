"""User model with complete type annotations."""

from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from flask_login import UserMixin
from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db


class User(db.Model, UserMixin):
    """User model with complete type annotations."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True, nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(unique=True, nullable=True)
    profile_picture: Mapped[Optional[str]] = mapped_column(nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    is_admin: Mapped[bool] = mapped_column(default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Global Ranking Fields
    global_rating: Mapped[float] = mapped_column(default=1000.0)
    global_rank: Mapped[Optional[int]] = mapped_column(nullable=True)
    rank_tier: Mapped[Optional[str]] = mapped_column(nullable=True)
    rank_updated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    highest_rating: Mapped[Optional[float]] = mapped_column(nullable=True)
    highest_rating_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    highest_rank: Mapped[Optional[int]] = mapped_column(nullable=True)
    highest_rank_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    rank_tier_color: Mapped[Optional[str]] = mapped_column(nullable=True)
    rank_movement: Mapped[int] = mapped_column(default=0)
    rank_streak: Mapped[int] = mapped_column(default=0)
    rank_streak_type: Mapped[Optional[str]] = mapped_column(nullable=True)

    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        secondary="user_roles", back_populates="users"
    )
    games_won: Mapped[List["Game"]] = relationship(
        back_populates="winner", foreign_keys="Game.winner_id"
    )
    games_lost: Mapped[List["Game"]] = relationship(
        back_populates="loser", foreign_keys="Game.loser_id"
    )
    tournaments: Mapped[List["Tournament"]] = relationship(
        secondary="tournament_participants", back_populates="participants"
    )

    def set_password(self, password: str) -> None:
        """Set user password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str):
        """Check if password is correct."""
        return check_password_hash(self.password_hash, password)

    def update_last_login(self):
        """Update user's last login time."""
        self.last_login = datetime.now(timezone.utc)

    def update_rank(self, new_rating: float):
        """Update user's ranking information."""
        self.global_rating = new_rating
        self.rank_updated_at = datetime.now(timezone.utc)

        if not self.highest_rating or new_rating > self.highest_rating:
            self.highest_rating = new_rating
            self.highest_rating_date = datetime.now(timezone.utc)

    @property
    def total_games(self) -> int:
        """Get total number of games played."""
        return len(self.games_won) + len(self.games_lost)

    @property
    def win_rate(self):
        """Calculate win rate."""
        total: Any = self.total_games
        return len(self.games_won) / total if total > 0 else 0.0

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<User {self.username}>"
