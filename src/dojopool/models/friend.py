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


# Canonical Friend model is defined elsewhere (core or social). This definition is commented out to prevent duplicate table errors, following the established modular model pattern.
# class Friend(db.Model):
#     """Model for friend relationships."""
#     __tablename__ = 'friends'
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
#     friend_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
#     status = db.Column(db.String(20), nullable=False, default=FriendshipStatus.PENDING)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
#     updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
#     last_interaction = db.Column(db.DateTime, nullable=True)
#     def to_dict(self) -> Dict[str, Any]:
#         return {
#             'id': self.id,
#             'user_id': self.user_id,
#             'friend_id': self.friend_id,
#             'status': self.status,
#             'created_at': self.created_at.isoformat(),
#             'updated_at': self.updated_at.isoformat(),
#             'last_interaction': self.last_interaction.isoformat() if self.last_interaction else None,
#         }