"""
Social Module

This module defines the SocialProfile model for handling user social interactions, 
such as friend relationships. Full type annotations and comprehensive docstrings 
have been added to ensure clarity and maintainability.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.extensions import db


class User(db.Model):
    """User model."""

    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(254), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    date_joined = db.Column(db.DateTime, default=func.now())

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    social_profile = relationship("SocialProfile", back_populates="user", uselist=False)

    def __str__(self):
        """String representation."""
        return self.username


class UserProfile(db.Model):
    """User profile model."""

    __tablename__ = "user_profiles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    avatar = db.Column(db.String(255))  # Path to avatar file
    bio = db.Column(db.Text)
    skill_level = db.Column(db.Integer, default=0)
    dojo_coins = db.Column(db.Numeric(10, 2), default=0)
    total_matches = db.Column(db.Integer, default=0)
    wins = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="profile")
    achievements = relationship("UserAchievement", back_populates="user")

    def win_rate(self) -> float:
        """Calculate win rate."""
        return (self.wins / self.total_matches * 100) if self.total_matches > 0 else 0

    def __str__(self):
        """String representation."""
        return f"{self.user.username}'s profile"


class Friendship(db.Model):
    """Friendship model."""

    __tablename__ = "friendships"
    __table_args__ = (
        db.UniqueConstraint("sender_id", "receiver_id", name="uix_friendship"),
        {"extend_existing": True},
    )

    STATUS_CHOICES = ["pending", "accepted", "rejected", "blocked"]

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def __str__(self):
        """String representation."""
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"


class Message(db.Model):
    """Message model."""

    __tablename__ = "messages"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def __str__(self):
        """String representation."""
        return f"Message from {self.sender.username} to {self.receiver.username}"


class Achievement(db.Model):
    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    icon = db.Column(db.String(255))  # Path to icon file
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=func.now())

    def __str__(self):
        return self.name


# Removed duplicate UserAchievement model to resolve table redefinition conflict
# class UserAchievement(db.Model):
#     __tablename__ = "user_achievements"
#     __table_args__ = {"extend_existing": True}
# 
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey("user_profiles.id"), nullable=False)
#     achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False)
#     earned_at = db.Column(db.DateTime, default=func.now())
# 
#     # Relationships
#     user = relationship("UserProfile", back_populates="achievements")
#     achievement = relationship("Achievement")
# 
#     def __str__(self):
#         return f"{self.user.user.username} - {self.achievement.name}"


class SocialProfile(db.Model):
    """Social profile model."""

    __tablename__ = "social_profiles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    bio = db.Column(db.Text)

    # Relationships
    user = relationship("User", back_populates="social_profile")
    friends = relationship(
        "SocialProfile",
        secondary="social_profile_friends",
        primaryjoin="SocialProfile.id == social_profile_friends.c.profile_id",
        secondaryjoin="SocialProfile.id == social_profile_friends.c.friend_id",
        backref="friend_of",
    )

    def __str__(self) -> str:
        """String representation."""
        return f"SocialProfile({self.user.username})"

    def add_friend(self, friend: "SocialProfile") -> None:
        """Add a friend to the social profile."""
        if friend not in self.friends:
            self.friends.append(friend)
            db.session.add(self)
            db.session.commit()

    def remove_friend(self, friend: "SocialProfile") -> None:
        """Remove a friend from the social profile."""
        if friend in self.friends:
            self.friends.remove(friend)
            db.session.add(self)
            db.session.commit()


# Association table for SocialProfile friends
social_profile_friends = db.Table(
    "social_profile_friends",
    db.Column("profile_id", db.Integer, db.ForeignKey("social_profiles.id"), primary_key=True),
    db.Column("friend_id", db.Integer, db.ForeignKey("social_profiles.id"), primary_key=True),
)
