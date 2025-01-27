"""Chat models for messaging between users."""

from datetime import datetime
from ..core.database import db
from ..core.mixins import TimestampMixin
from .venue import VenueCheckin


class ChatRoom(TimestampMixin, db.Model):
    """Model for chat rooms."""

    __tablename__ = "chat_rooms"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))  # Optional name for group chats
    type = db.Column(db.String(20), default="direct")  # direct, group, tournament, etc.
    status = db.Column(db.String(20), default="active")  # active, archived, deleted

    # Relationships
    participants = db.relationship("ChatParticipant", back_populates="room")
    messages = db.relationship("ChatMessage", back_populates="room")

    @staticmethod
    def can_users_interact(user1_id: int, user2_id: int) -> bool:
        """Check if two users can interact based on their dojo check-in status.

        Args:
            user1_id: First user's ID
            user2_id: Second user's ID

        Returns:
            bool: True if users can interact, False otherwise
        """
        # Get active check-ins for both users
        user1_checkin = VenueCheckin.query.filter_by(user_id=user1_id, checked_out_at=None).first()

        user2_checkin = VenueCheckin.query.filter_by(user_id=user2_id, checked_out_at=None).first()

        # Users can interact if they're checked into the same venue
        if user1_checkin and user2_checkin:
            return user1_checkin.venue_id == user2_checkin.venue_id

        return False


class ChatParticipant(TimestampMixin, db.Model):
    """Model for chat room participants."""

    __tablename__ = "chat_participants"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    role = db.Column(db.String(20), default="member")  # member, admin, moderator
    status = db.Column(db.String(20), default="active")  # active, muted, left
    last_read_at = db.Column(db.DateTime)

    # Relationships
    room = db.relationship("ChatRoom", back_populates="participants")
    user = db.relationship("User", back_populates="chat_rooms")


class ChatMessage(TimestampMixin, db.Model):
    """Model for chat messages."""

    __tablename__ = "chat_messages"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    message_type = db.Column(db.String(20), default="text")  # text, image, system
    status = db.Column(db.String(20), default="sent")  # sent, delivered, read, deleted
    delivered_at = db.Column(db.DateTime)
    read_at = db.Column(db.DateTime)

    # Relationships
    room = db.relationship("ChatRoom", back_populates="messages")
    sender = db.relationship("User", back_populates="sent_messages")
