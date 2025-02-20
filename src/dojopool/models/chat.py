"""Chat models for messaging between users."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class ChatRoom(BaseModel):
    """Chat room model."""

    __tablename__: str = "chat_rooms"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="room"
    )
    participants: Mapped[List["ChatParticipant"]] = relationship(
        "ChatParticipant", back_populates="room"
    )

    def __repr__(self) -> str:
        return f"<ChatRoom {self.name}>"


class ChatMessage(BaseModel):
    """Chat message model."""

    __tablename__: str = "chat_messages"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_rooms.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")
    user: Mapped["User"] = relationship("User", backref="chat_messages")

    def __repr__(self) -> str:
        return f"<ChatMessage {self.id} in Room {self.room_id}>"


class ChatParticipant(BaseModel):
    """Chat participant model."""

    __tablename__: str = "chat_participants"
    __table_args__: Dict[Any, Any] = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    room_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("chat_rooms.id"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_read_at: Mapped[datetime] = mapped_column(DateTime)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="participants")
    user: Mapped["User"] = relationship("User", backref="chat_participations")

    def __repr__(self) -> str:
        return f"<ChatParticipant {self.user_id} in Room {self.room_id}>"
