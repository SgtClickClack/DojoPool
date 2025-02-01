"""Chat models for messaging between users."""

from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import BaseModel


class ChatRoom(BaseModel):
    """Chat room model."""

    __tablename__ = "chat_rooms"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    description = Column(Text)
    is_private = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    messages = relationship("ChatMessage", back_populates="room")
    participants = relationship("ChatParticipant", back_populates="room")

    def __repr__(self):
        return f"<ChatRoom {self.name}>"


class ChatMessage(BaseModel):
    """Chat message model."""

    __tablename__ = "chat_messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    room = relationship("ChatRoom", back_populates="messages")
    user = relationship("User", backref="chat_messages")

    def __repr__(self):
        return f"<ChatMessage {self.id} in Room {self.room_id}>"


class ChatParticipant(BaseModel):
    """Chat participant model."""

    __tablename__ = "chat_participants"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime)
    is_admin = Column(Boolean, default=False)

    # Relationships
    room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User", backref="chat_participations")

    def __repr__(self):
        return f"<ChatParticipant {self.user_id} in Room {self.room_id}>"
