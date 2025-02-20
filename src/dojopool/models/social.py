"""
Social Module with complete type annotations.

This module defines the social models for handling user social interactions,
such as friend relationships, messages, and achievements.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union, cast
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import (
    Mapped,
    RelationshipProperty,
    backref,
    mapped_column,
    relationship,
)

from ..core.extensions import db
from .user import User


class UserProfile(Base):
    """User profile model with complete type annotations."""

    __tablename__: str = "user_profiles"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True
    )
    avatar: Mapped[Optional[str]] = mapped_column(String(255))  # Path to avatar image
    bio: Mapped[Optional[str]] = mapped_column(Text)
    skill_level: Mapped[int] = mapped_column(default=0)
    dojo_coins: Mapped[Decimal] = mapped_column(type_=Numeric(10, 2), default=0)
    total_matches: Mapped[int] = mapped_column(default=0)
    wins: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships with type annotations
    user: Mapped[User] = relationship("User", backref=backref("profile", uselist=False))

    @property
    def win_rate(self) -> float:
        """Calculate win rate percentage."""
        if self.total_matches == 0:
            return 0.0
        return (self.wins / self.total_matches) * 100

    def __str__(self) :
        return f"{self.user.username}'s Profile"


class Friendship(Base):
    """Friendship model with complete type annotations."""

    __tablename__: str = "friendships"
    __table_args__: Any = (
        UniqueConstraint("sender_id", "receiver_id", name="unique_friendship"),
        {"extend_existing": True},
    )

    STATUS_CHOICES: List[Any] = ["pending", "accepted", "rejected", "blocked"]

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships with type annotations
    sender: Mapped[User] = relationship(
        "User", foreign_keys=[sender_id], backref="friendships_sent"
    )
    receiver: Mapped[User] = relationship(
        "User", foreign_keys=[receiver_id], backref="friendships_received"
    )

    def __str__(self) :
        return f"{self.sender.username} :
    """Message model with complete type annotations."""

    __tablename__: str = "messages"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships with type annotations
    sender: Mapped[User] = relationship(
        "User", foreign_keys=[sender_id], backref="sent_messages"
    )
    receiver: Mapped[User] = relationship(
        "User", foreign_keys=[receiver_id], backref="received_messages"
    )

    def __str__(self) -> str:
        return f"Message from {self.sender.username} to {self.receiver.username}"


class Achievement(Base):
    """Achievement model with complete type annotations."""

    __tablename__: str = "achievements"
    __table_args__: Any = {"extend_existing": True}

    id: int = cast(int, Column(Integer, primary_key=True))
    name: str = cast(str, Column(String(100), nullable=False))
    description: str = cast(str, Column(Text, nullable=False))
    icon: Optional[str] = cast(
        Optional[str], Column(String(255))
    )  # Path to achievement icon
    points: int = cast(int, Column(Integer, default=0))
    created_at: datetime = cast(datetime, Column(DateTime, default=datetime.utcnow))
    updated_at: datetime = cast(
        datetime, Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    def __str__(self) :
        return self.name


class SocialProfile(Base):
    """Social profile model with complete type annotations."""

    __tablename__: str = "social_profiles"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, unique=True
    )
    bio: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        type_=DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships with type annotations
    user: Mapped[User] = relationship(
        "User", backref=backref("social_profile", uselist=False)
    )
    friends: Mapped[List[User]] = relationship(
        "User",
        secondary="friendships",
        primaryjoin="and_(SocialProfile.user_id==Friendship.sender_id, "
        "Friendship.status=='accepted')",
        secondaryjoin="Friendship.receiver_id==User.id",
        backref="friend_profiles",
    )

    def __str__(self) :
        return f"{self.user.username}'s Social Profile"

    def add_friend(self, friend: User) :
        """Add a friend to the user's friend list."""
        if friend.id != self.user_id and friend not in self.friends:
            friendship: Friendship = Friendship(
                sender_id=self.user_id, receiver_id=friend.id, status="accepted"
            )
            db.session.add(friendship)
            db.session.commit()

    def remove_friend(self, friend: User) -> None:
        """Remove a friend from the user's friend list."""
        if friend in self.friends:
            Friendship.query.filter(
                (
                    (Friendship.sender_id == self.user_id)
                    & (Friendship.receiver_id == friend.id)
                )
                | (
                    (Friendship.sender_id == friend.id)
                    & (Friendship.receiver_id == self.user_id)
                )
            ).delete()
            db.session.commit()


class UserFollower(Base):
    """Model for representing follower relationships between users."""

    __tablename__: str = "user_followers"

    id: Mapped[int] = mapped_column(primary_key=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    followee_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Define relationships to the User model to easily access follower and followee data.
    follower: relationship = relationship("User", foreign_keys=[follower_id])
    followee: relationship = relationship("User", foreign_keys=[followee_id])


class UserMessage(Base):
    """Model for user messages."""

    __tablename__: str = "user_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    content: Mapped[str] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships to the User model for sender and receiver.
    sender: relationship = relationship("User", foreign_keys=[sender_id])
    receiver: relationship = relationship("User", foreign_keys=[receiver_id])
