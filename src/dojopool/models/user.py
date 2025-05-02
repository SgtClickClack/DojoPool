"""
User model for DojoPool

This module defines the user model with type annotations. It leverages Flask-Login for
session management and Flask-SQLAlchemy for database interactions. The module is enhanced
with detailed docstrings, secure password handling, and complete type safety.
"""

from datetime import datetime
from typing import Optional

from flask_login import UserMixin  # type: ignore
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey # Added Float, ForeignKey
from werkzeug.security import check_password_hash, generate_password_hash  # type: ignore

from dojopool.core.extensions import db  # type: ignore

from .user_roles import user_roles


class User(db.Model, UserMixin):
    """User model."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    # Using Mapped type hints for clearer column definitions
    id: Mapped[int] = mapped_column(db.Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(db.String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(db.String(120), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(db.String(128), nullable=False)
    google_id: Mapped[Optional[str]] = mapped_column(db.String(120), unique=True, nullable=True)
    profile_picture: Mapped[Optional[str]] = mapped_column(db.String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[Optional[datetime]] = mapped_column(db.DateTime, nullable=True)
    _is_active: Mapped[bool] = mapped_column("is_active", db.Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(db.Boolean, nullable=False, default=False)
    is_admin: Mapped[bool] = mapped_column(db.Boolean, default=False)

    # Wallet Balance
    balance: Mapped[float] = mapped_column(Float, default=0.0)

    # Global Ranking Fields
    global_rating = db.Column(db.Float, default=1000.0)
    global_rank = db.Column(db.Integer)
    rank_tier = db.Column(db.String)
    rank_updated_at = db.Column(db.DateTime)
    highest_rating = db.Column(db.Float)
    highest_rating_date = db.Column(db.DateTime)
    highest_rank = db.Column(db.Integer)
    highest_rank_date = db.Column(db.DateTime)
    rank_tier_color = db.Column(db.String)  # Store tier color for UI
    rank_movement = db.Column(db.Integer, default=0)  # Track rank changes
    rank_streak = db.Column(db.Integer, default=0)  # Track win/loss streaks
    rank_streak_type = db.Column(db.String)  # 'win' or 'loss'
    total_games = db.Column(db.Integer, default=0)
    tournament_wins = db.Column(db.Integer, default=0)
    tournament_placements = db.Column(db.JSON)  # Store tournament placement history
    ranking_history = db.Column(db.JSON)  # Store historical ranking data

    # Relationships
    roles = relationship(
        "dojopool.models.role.Role", secondary=user_roles, lazy="subquery", backref=db.backref("users", lazy=True)
    )
    wallet_transactions = relationship('WalletTransaction', back_populates='user', cascade='all, delete-orphan') # Added relationship

    # Define games_won relationship here
    games_won = relationship(
        "dojopool.models.game.Game",
        foreign_keys="dojopool.models.game.Game.winner_id", # Use string for foreign keys
        back_populates="winner"
    )

    def __repr__(self) -> str:
        """
        Returns the string representation of the User.

        Returns:
            str: A string that represents the user.
        """
        return f"<User {self.username}>"

    def set_password(self, password: str) -> None:
        """
        Sets the user's password by hashing the plain text password.

        Args:
            password (str): The plain text password to be hashed.
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """
        Checks if the provided password matches the stored password hash.

        Args:
            password (str): The plain text password to verify.

        Returns:
            bool: True if the password is correct, False otherwise.
        """
        return check_password_hash(self.password_hash, password)

    def get_id(self) -> str:
        """Return the user ID as a string."""
        return str(self.id)

    @property
    def is_active(self) -> bool:
        """Return True if the user is active."""
        active = getattr(self, "_is_active", True)
        return bool(active)

    @is_active.setter
    def is_active(self, value: bool) -> None:
        """Set the user's active status."""
        self._is_active = value

    def to_dict(self):
        """Convert user to dictionary."""
        created_at_str = (
            self.created_at.isoformat() if self.created_at else None
        )
        last_login_str = (
            self.last_login.isoformat() if self.last_login else None
        )

        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "profile_picture": self.profile_picture,
            "created_at": created_at_str,
            "last_login": last_login_str,
            "is_verified": self.is_verified,
            "roles": [role.name for role in self.roles],
        }

    def check_is_active(self) -> bool:
        # Dummy implementation.
        return True

# --- Explicit imports to resolve SQLAlchemy mapping ---
from dojopool.models.game import Game
from dojopool.models.role import Role

# Attach tournament_participations relationship after TournamentParticipant is defined
# from dojopool.models.tournament import TournamentParticipant
# User.tournament_participations = relationship(
#     "dojopool.models.tournament.TournamentParticipant",
#     back_populates="user",
#     foreign_keys=[TournamentParticipant.user_id]
# )

# Attach games_won relationship after Game is defined - MOVED INSIDE CLASS
# User.games_won = relationship(
#     "dojopool.models.game.Game",
#     foreign_keys=[Game.winner_id],
#     back_populates="winner"
# )

# Attach wallet_transactions relationship after WalletTransaction is defined
# This might need adjustment if WalletTransaction is in a different file
# User.wallet_transactions = relationship(
#     "dojopool.models.marketplace.WalletTransaction", # Assuming it's in marketplace.py
#     back_populates="user",
#     cascade="all, delete-orphan"
# )
