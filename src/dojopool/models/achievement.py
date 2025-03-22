"""
Achievement Model Module

This module defines the Achievement model for managing user achievements.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON, Boolean
from sqlalchemy.orm import relationship
from enum import Enum
from dojopool.core.extensions import db  # type: ignore


class AchievementType(str, Enum):
    """Achievement type enumeration."""
    GAME = "game"
    TOURNAMENT = "tournament"
    SOCIAL = "social"
    SKILL = "skill"
    SPECIAL = "special"


class Achievement(db.Model):
    """Model for achievements."""

    __tablename__ = 'achievements'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(SQLEnum(AchievementType), nullable=False)
    icon_url = db.Column(db.String(255), nullable=True)
    points = db.Column(db.Integer, nullable=False, default=0)
    requirements = db.Column(db.JSON, nullable=True)
    is_secret = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user_achievements = db.relationship('UserAchievement', backref='achievement', lazy=True)

    def __repr__(self):
        return f'<Achievement {self.name}>'

    def to_dict(self) -> Dict[str, Any]:
        """Convert achievement to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'type': self.type.value,
            'icon_url': self.icon_url,
            'points': self.points,
            'requirements': self.requirements,
            'is_secret': self.is_secret,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class UserAchievement(db.Model):
    """Model for user achievements."""

    __tablename__ = 'user_achievements'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    progress = db.Column(db.Integer, nullable=False, default=0)
    completed = db.Column(db.Boolean, nullable=False, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    metadata = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = db.relationship('User', backref=db.backref('achievements', lazy=True))

    def __repr__(self):
        return f'<UserAchievement {self.user_id} - {self.achievement_id}>'

    def to_dict(self) -> Dict[str, Any]:
        """Convert user achievement to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'achievement_id': self.achievement_id,
            'progress': self.progress,
            'completed': self.completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'achievement': self.achievement.to_dict() if self.achievement else None
        }

    def update_progress(self, progress: int, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Update achievement progress.
        
        Args:
            progress: New progress value
            metadata: Optional metadata to store
            
        Returns:
            True if achievement was completed, False otherwise
        """
        self.progress = progress
        if metadata:
            self.metadata = metadata

        # Check if achievement is completed
        if not self.completed and self.achievement.requirements:
            required = self.achievement.requirements.get('value', 0)
            if progress >= required:
                self.completed = True
                self.completed_at = datetime.utcnow()
                return True

        return False
