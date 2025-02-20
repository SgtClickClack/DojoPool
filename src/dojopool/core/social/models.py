from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import db


class Friendship(Base):
    __tablename__: str = "friendships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    friend_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        Enum("pending", "accepted", "blocked", name="friendship_status"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    user: relationship = relationship(
        "User", foreign_keys=[user_id], back_populates="friendships"
    )
    friend: relationship = relationship(
        "User", foreign_keys=[friend_id], back_populates="friend_of"
    )


class ChatMessage(Base):
    __tablename__: str = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sender_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    receiver_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sender: relationship = relationship(
        "User", foreign_keys=[sender_id], back_populates="sent_messages"
    )
    receiver: relationship = relationship(
        "User", foreign_keys=[receiver_id], back_populates="received_messages"
    )


class CommunityChallenge(Base):
    __tablename__: str = "community_challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    creator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    requirements: Mapped[str] = mapped_column(Text)
    reward_points: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    creator: Mapped[List[User]] = relationship(
        "User", back_populates="created_challenges"
    )
    participants: Mapped[List[ChallengeParticipant]] = relationship(
        "ChallengeParticipant", back_populates="challenge"
    )


class ChallengeParticipant(Base):
    __tablename__: str = "challenge_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    challenge_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("community_challenges.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(
        Enum("joined", "in_progress", "completed", "failed", name="challenge_status"),
        nullable=False,
    )
    progress_data: Mapped[str] = mapped_column(Text)

    challenge: Mapped[List[CommunityChallenge]] = relationship(
        "CommunityChallenge", back_populates="participants"
    )
    user: Mapped[List[User]] = relationship(
        "User", back_populates="challenge_participations"
    )


class SocialShare(Base):
    __tablename__: str = "social_shares"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    content_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # game, achievement, challenge, etc.
    content_id: Mapped[int] = mapped_column(Integer, nullable=False)
    platform: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # twitter, facebook, instagram, etc.
    share_text: Mapped[str] = mapped_column(Text)
    media_url: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped[List[User]] = relationship("User", back_populates="social_shares")
