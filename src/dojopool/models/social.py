"""
Social Module

This module defines the SocialProfile model for handling user social interactions, 
such as friend relationships, clans, and enemy systems. Full type annotations and comprehensive docstrings 
have been added to ensure clarity and maintainability.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from enum import Enum

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.extensions import db


# TODO: Remove duplicate User model to resolve SQLAlchemy registry conflicts.
# class User(db.Model):
#     """User model."""
# 
#     __tablename__ = "users"
#     __table_args__ = {"extend_existing": True}
# 
#     id = db.Column(db.Integer, primary_key=True)
#     username = db.Column(db.String(150), unique=True, nullable=False)
#     email = db.Column(db.String(254), unique=True, nullable=False)
#     password = db.Column(db.String(128), nullable=False)
#     is_active = db.Column(db.Boolean, default=True)
#     date_joined = db.Column(db.DateTime, default=func.now())
# 
#     # Relationships
#     profile = relationship("UserProfile", back_populates="user", uselist=False)
#     social_profile = relationship("SocialProfile", back_populates="user", uselist=False)
# 
#     def __str__(self):
#         """String representation."""
#         return self.username


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


class RelationshipStatus(str, Enum):
    """Relationship status enum."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"
    ENEMY = "enemy"


class ClanRole(str, Enum):
    """Clan role enum."""
    LEADER = "leader"
    OFFICER = "officer"
    MEMBER = "member"
    RECRUIT = "recruit"


class ClanRank(str, Enum):
    """Clan rank enum."""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"


class Friendship(db.Model):
    """Friendship model."""

    __tablename__ = "friendships"
    __table_args__ = (
        db.UniqueConstraint("sender_id", "receiver_id", name="uix_friendship"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default=RelationshipStatus.PENDING)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

    def __str__(self):
        """String representation."""
        return f"{self.sender.username} -> {self.receiver.username} ({self.status})"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "sender": {
                "id": self.sender.id,
                "username": self.sender.username,
                "avatar": self.sender.profile.avatar if self.sender.profile else None
            },
            "receiver": {
                "id": self.receiver.id,
                "username": self.receiver.username,
                "avatar": self.receiver.profile.avatar if self.receiver.profile else None
            }
        }


class EnemyRelationship(db.Model):
    """Enemy relationship model."""

    __tablename__ = "enemy_relationships"
    __table_args__ = (
        db.UniqueConstraint("user_id", "enemy_id", name="uix_enemy_relationship"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    enemy_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    enemy = relationship("User", foreign_keys=[enemy_id])

    def __str__(self):
        """String representation."""
        return f"{self.user.username} -> {self.enemy.username} (enemy)"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "enemy_id": self.enemy_id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar": self.user.profile.avatar if self.user.profile else None
            },
            "enemy": {
                "id": self.enemy.id,
                "username": self.enemy.username,
                "avatar": self.enemy.profile.avatar if self.enemy.profile else None
            }
        }


class Clan(db.Model):
    """Clan model."""

    __tablename__ = "clans"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    tag = db.Column(db.String(10), unique=True, nullable=False)
    description = db.Column(db.Text)
    logo_url = db.Column(db.String(255))
    banner_url = db.Column(db.String(255))
    rank = db.Column(db.String(20), default=ClanRank.BRONZE)
    home_venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"))
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    members = relationship("ClanMember", back_populates="clan")
    home_venue = relationship("Venue")

    def __str__(self):
        """String representation."""
        return f"Clan {self.name} ({self.tag})"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "tag": self.tag,
            "description": self.description,
            "logo_url": self.logo_url,
            "banner_url": self.banner_url,
            "rank": self.rank,
            "home_venue_id": self.home_venue_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "member_count": len(self.members),
            "home_venue": self.home_venue.to_dict() if self.home_venue else None
        }


class ClanMember(db.Model):
    """Clan member model."""

    __tablename__ = "clan_members"
    __table_args__ = (
        db.UniqueConstraint("clan_id", "user_id", name="uix_clan_member"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    clan_id = db.Column(db.Integer, db.ForeignKey("clans.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), default=ClanRole.MEMBER)
    contribution_points = db.Column(db.Integer, default=0)
    joined_at = db.Column(db.DateTime, default=func.now())
    last_active = db.Column(db.DateTime, default=func.now())

    # Relationships
    clan = relationship("Clan", back_populates="members")
    user = relationship("User")

    def __str__(self):
        """String representation."""
        return f"{self.user.username} in {self.clan.name} ({self.role})"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "clan_id": self.clan_id,
            "user_id": self.user_id,
            "role": self.role,
            "contribution_points": self.contribution_points,
            "joined_at": self.joined_at.isoformat(),
            "last_active": self.last_active.isoformat(),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar": self.user.profile.avatar if self.user.profile else None
            }
        }


class ClanStats(db.Model):
    """Clan statistics model."""

    __tablename__ = "clan_stats"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    clan_id = db.Column(db.Integer, db.ForeignKey("clans.id"), nullable=False)
    total_matches = db.Column(db.Integer, default=0)
    matches_won = db.Column(db.Integer, default=0)
    tournaments_won = db.Column(db.Integer, default=0)
    total_contribution = db.Column(db.Integer, default=0)
    weekly_points = db.Column(db.Integer, default=0)
    monthly_points = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    clan = relationship("Clan")

    def __str__(self):
        """String representation."""
        return f"Stats for {self.clan.name}"

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "clan_id": self.clan_id,
            "total_matches": self.total_matches,
            "matches_won": self.matches_won,
            "tournaments_won": self.tournaments_won,
            "total_contribution": self.total_contribution,
            "weekly_points": self.weekly_points,
            "monthly_points": self.monthly_points,
            "win_rate": (self.matches_won / self.total_matches * 100) if self.total_matches > 0 else 0,
            "updated_at": self.updated_at.isoformat()
        }


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

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "receiver_id": self.receiver_id,
            "content": self.content,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "sender": {
                "id": self.sender.id,
                "username": self.sender.username,
                "avatar": self.sender.profile.avatar if self.sender.profile else None
            },
            "receiver": {
                "id": self.receiver.id,
                "username": self.receiver.username,
                "avatar": self.receiver.profile.avatar if self.receiver.profile else None
            }
        }


class SocialProfile(db.Model):
    """Social profile model."""

    __tablename__ = "social_profiles"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    bio = db.Column(db.Text)
    social_status = db.Column(db.String(50), default="online")  # online, offline, away, busy
    last_seen = db.Column(db.DateTime, default=func.now())

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

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bio": self.bio,
            "social_status": self.social_status,
            "last_seen": self.last_seen.isoformat(),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar": self.user.profile.avatar if self.user.profile else None
            }
        }

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


class ShareType(str, Enum):
    """Share type enum."""
    VIDEO_HIGHLIGHT = "video_highlight"
    ACHIEVEMENT = "achievement"
    TOURNAMENT = "tournament"
    GAME = "game"
    OTHER = "other"


class Share(db.Model):
    """Share model for social sharing."""
    __tablename__ = "shares"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content_type = db.Column(db.String(50), nullable=False)
    content_id = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    share_metadata = db.Column(db.JSON)
    created_at = db.Column(db.DateTime, default=func.now())

    user = relationship("User", backref="shares")

    def __str__(self):
        """String representation."""
        return f"Share by {self.user.username}: {self.title}"

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "content_type": self.content_type,
            "content_id": self.content_id,
            "title": self.title,
            "description": self.description,
            "share_metadata": self.share_metadata,
            "created_at": self.created_at.isoformat(),
            "user": {
                "id": self.user.id,
                "username": self.user.username,
                "avatar": self.user.profile.avatar if self.user.profile else None
            }
        }
