"""
User model for DojoPool

This module defines the user model with type annotations. It leverages Flask-Login for
session management and Flask-SQLAlchemy for database interactions. The module is enhanced
with detailed docstrings, secure password handling, and complete type safety.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING, List

from flask_login import UserMixin  # type: ignore
from sqlalchemy.orm import relationship, Mapped, mapped_column  # type: ignore
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey, JSON  # type: ignore
from werkzeug.security import check_password_hash, generate_password_hash  # type: ignore
from sqlalchemy.ext.hybrid import hybrid_property  # type: ignore

from dojopool.core.extensions import db  # type: ignore

from .user_roles import user_roles
# from .friendship import Friendship # COMMENT OUT or REMOVE direct import here

if TYPE_CHECKING:
    from .social import SocialProfile # Corrected import path
    from .friendship import Friendship # MOVED here for type hinting
    # from .achievement import UserAchievement # For type hinting - COMMENTED OUT
    from .game import Game # For type hinting
    # from .player import PlayerStats # GUESS: Corrected import path for PlayerStats - COMMENTED OUT
    from .notification import Notification # For type hinting
    from .inventory import Inventory # For type hinting


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

    # Relationships
    roles = relationship(
        "dojopool.models.role.Role", secondary=user_roles, lazy="subquery", backref=db.backref("users", lazy=True)
    )
    wallet_transactions = relationship('WalletTransaction', back_populates='user', cascade='all, delete-orphan') # Added relationship

    # One-to-one relationship to UserProfile
    profile = db.relationship("UserProfile", uselist=False, back_populates="user")
    social_profile = db.relationship("SocialProfile", uselist=False, back_populates="user")

    # Friendships
    friendships_as_user1 = relationship(
        "dojopool.models.friendship.Friendship", # Use fully qualified string
        foreign_keys="dojopool.models.friendship.Friendship.user1_id",
        back_populates="user1"
    )
    friendships_as_user2 = relationship(
        "dojopool.models.friendship.Friendship", # Use fully qualified string
        foreign_keys="dojopool.models.friendship.Friendship.user2_id",
        back_populates="user2"
    )
    friendship_actions = relationship(
        "dojopool.models.friendship.Friendship", # Use fully qualified string
        foreign_keys="dojopool.models.friendship.Friendship.action_user_id",
        back_populates="action_user"
    )

    # Inventory relationship - ADDED
    inventory = relationship("dojopool.models.inventory.Inventory", back_populates="user", cascade="all, delete-orphan")

    # Rewards relationship for UserReward
    rewards = relationship('UserReward', back_populates='user', cascade='all, delete-orphan')

    # Reviews relationship for Review
    reviews = relationship('Review', back_populates='user', cascade='all, delete-orphan')

    # Review responses relationship for ReviewResponse
    review_responses = relationship('ReviewResponse', back_populates='user', cascade='all, delete-orphan')

    # Review reports relationship for ReviewReport
    review_reports = relationship('ReviewReport', back_populates='user', cascade='all, delete-orphan')

    # Review votes relationship for ReviewVote
    review_votes = relationship('ReviewVote', back_populates='user', cascade='all, delete-orphan')

    # Commenting out achievements relationship as UserAchievement model is commented out
    # achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")

    # Relationships with Game model
    # games_as_player1 = relationship(
    #     Game,
    #     foreign_keys="dojopool.models.game.Game.player1_id",
    #     back_populates="player1"
    # )
    # games_as_player2 = relationship(
    #     Game,
    #     foreign_keys="dojopool.models.game.Game.player2_id",
    #     back_populates="player2"
    # )

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

# TODO: The games_won relationship causes a NoForeignKeysError due to SQLAlchemy model loading order or circular import issues.
# It is not critical for wallet or user flows. Uncomment and debug this relationship if/when needed for game analytics.
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
