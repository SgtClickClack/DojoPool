"""
User model for DojoPool

This module defines the user model with type annotations. It leverages Flask-Login for
session management and Flask-SQLAlchemy for database interactions. The module is enhanced
with detailed docstrings, secure password handling, and complete type safety.
"""

from typing import Any
from datetime import datetime
from flask_login import UserMixin  # type: ignore
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash  # type: ignore
from dojopool.core.extensions import db  # type: ignore

from .user_roles import user_roles


class User(db.Model, UserMixin):
    """User model."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True, index=True)  # type: int
    username = db.Column(db.String(80), unique=True, index=True)  # type: str
    email = db.Column(db.String(120), unique=True, index=True)  # type: str
    password_hash = db.Column(db.String(128), nullable=False)  # type: str
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    profile_picture = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # type: datetime
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    _is_active = db.Column("is_active", db.Boolean, nullable=False, default=True)
    is_verified = db.Column(db.Boolean, nullable=False, default=False)
    is_admin = db.Column(db.Boolean, default=False)

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
    games_won = db.Column(db.Integer, default=0)
    tournament_wins = db.Column(db.Integer, default=0)
    tournament_placements = db.Column(db.JSON)  # Store tournament placement history
    ranking_history = db.Column(db.JSON)  # Store historical ranking data

    # Relationships
    games_won = relationship("Game", foreign_keys="Game.winner_id", back_populates="winner")
    games_lost = relationship("Game", foreign_keys="Game.loser_id", back_populates="loser")
    tournament_participations = relationship("TournamentParticipant", back_populates="player")
    roles = relationship(
        "Role", secondary=user_roles, lazy="subquery", backref=db.backref("users", lazy=True)
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
            self.created_at.isoformat() if hasattr(self.created_at, "isoformat") else None
        )
        last_login_str = (
            self.last_login.isoformat() if hasattr(self.last_login, "isoformat") else None
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
