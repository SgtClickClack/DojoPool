"""
Activity Model Module

This module defines the Activity model for tracking user activities and generating activity feeds.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from enum import Enum
from dojopool.extensions import db  # type: ignore


class ActivityType(str, Enum):
    """Activity type enumeration."""
    GAME_COMPLETED = "game_completed"
    TOURNAMENT_JOINED = "tournament_joined"
    TOURNAMENT_WON = "tournament_won"
    ACHIEVEMENT_EARNED = "achievement_earned"
    FRIEND_ADDED = "friend_added"
    PROFILE_UPDATED = "profile_updated"
    SHOT_ANALYZED = "shot_analyzed"
    VENUE_VISITED = "venue_visited"


# class Activity(db.Model):
#     """Model for user activities."""
#
#     __tablename__ = 'activities'
#
#     id = db.Column(db.Integer, primary_key=True)
#     user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
#     type = db.Column(db.String(50), nullable=False)
#     title = db.Column(db.String(255), nullable=False)
#     description = db.Column(db.Text, nullable=True)
#     activity_metadata = db.Column(db.JSON, nullable=True)
#     created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
#     is_public = db.Column(db.Boolean, default=True, nullable=False)
#
#     # Relationships
#     user = db.relationship('User', backref=db.backref('activities', lazy=True))
#
#     def __repr__(self):
#         return f'<Activity {self.type} by {self.user_id}>'
#
#     def to_dict(self) -> Dict[str, Any]:
#         """Convert activity to dictionary."""
#         return {
#             'id': self.id,
#             'user_id': self.user_id,
#             'type': self.type,
#             'title': self.title,
#             'description': self.description,
#             'activity_metadata': self.activity_metadata,
#             'created_at': self.created_at.isoformat(),
#             'is_public': self.is_public,
#             'user': self.user.to_dict() if self.user else None
#         }
#
#     @classmethod
#     def create_game_activity(cls, user_id: int, game_id: int, result: str) -> 'Activity':
#         """Create a game completion activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.GAME_COMPLETED,
#             title=f"Completed a game",
#             description=f"Finished a game with result: {result}",
#             activity_metadata={'game_id': game_id, 'result': result}
#         )
#
#     @classmethod
#     def create_tournament_activity(cls, user_id: int, tournament_id: int, action: str) -> 'Activity':
#         """Create a tournament-related activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.TOURNAMENT_JOINED if action == 'joined' else ActivityType.TOURNAMENT_WON,
#             title=f"{action.title()} a tournament",
#             description=f"{action.title()} tournament #{tournament_id}",
#             activity_metadata={'tournament_id': tournament_id, 'action': action}
#         )
#
#     @classmethod
#     def create_achievement_activity(cls, user_id: int, achievement_id: int, name: str) -> 'Activity':
#         """Create an achievement activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.ACHIEVEMENT_EARNED,
#             title=f"Earned achievement: {name}",
#             description=f"Unlocked new achievement: {name}",
#             activity_metadata={'achievement_id': achievement_id, 'name': name}
#         )
#
#     @classmethod
#     def create_friend_activity(cls, user_id: int, friend_id: int, action: str) -> 'Activity':
#         """Create a friend-related activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.FRIEND_ADDED,
#             title=f"{action.title()} a friend",
#             description=f"{action.title()} user #{friend_id} as a friend",
#             activity_metadata={'friend_id': friend_id, 'action': action}
#         )
#
#     @classmethod
#     def create_profile_activity(cls, user_id: int, field: str) -> 'Activity':
#         """Create a profile update activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.PROFILE_UPDATED,
#             title="Updated profile",
#             description=f"Updated {field} in profile",
#             activity_metadata={'field': field}
#         )
#
#     @classmethod
#     def create_shot_activity(cls, user_id: int, shot_id: int, analysis: Dict[str, Any]) -> 'Activity':
#         """Create a shot analysis activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.SHOT_ANALYZED,
#             title="Analyzed shot",
#             description=f"Received shot analysis with accuracy: {analysis.get('accuracy', 0)}%",
#             activity_metadata={'shot_id': shot_id, 'analysis': analysis}
#         )
#
#     @classmethod
#     def create_venue_activity(cls, user_id: int, venue_id: int, action: str) -> 'Activity':
#         """Create a venue-related activity."""
#         return cls(
#             user_id=user_id,
#             type=ActivityType.VENUE_VISITED,
#             title=f"{action.title()} a venue",
#             description=f"{action.title()} venue #{venue_id}",
#             activity_metadata={'venue_id': venue_id, 'action': action}
#         ) 