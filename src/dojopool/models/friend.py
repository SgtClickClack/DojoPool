"""
Friend System Model Module

This module defines the Friend model for managing user friendships and relationships.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from dojopool.core.extensions import db  # type: ignore


class FriendshipStatus(str, Enum):
    """Friendship status enumeration."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class Friend(db.Model):
    """Model for friend relationships."""

    __tablename__ = 'friends'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=FriendshipStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_interaction = db.Column(db.DateTime, nullable=True)

    # Relationships
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('friendships', lazy=True))
    friend = db.relationship('User', foreign_keys=[friend_id], backref=db.backref('friend_of', lazy=True))

    def __repr__(self):
        return f'<Friend {self.user_id} -> {self.friend_id} ({self.status})>'

    def to_dict(self) -> Dict[str, Any]:
        """Convert friend relationship to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'friend_id': self.friend_id,
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'last_interaction': self.last_interaction.isoformat() if self.last_interaction else None,
            'friend': self.friend.to_dict() if self.friend else None
        }

    def update_status(self, new_status: FriendshipStatus) -> None:
        """Update friendship status."""
        self.status = new_status
        self.updated_at = datetime.utcnow()

    def update_interaction(self) -> None:
        """Update last interaction timestamp."""
        self.last_interaction = datetime.utcnow()
        self.updated_at = datetime.utcnow() 