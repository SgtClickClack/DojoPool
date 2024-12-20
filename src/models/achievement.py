from datetime import datetime
from enum import Enum
from src.core.database import db
from src.core.mixins import TimestampMixin

class AchievementType(str, Enum):
    """Types of achievements."""
    GAMES_PLAYED = 'games_played'
    GAMES_WON = 'games_won'
    TOURNAMENTS_PLAYED = 'tournaments_played'
    TOURNAMENTS_WON = 'tournaments_won'
    MATCHES_PLAYED = 'matches_played'
    MATCHES_WON = 'matches_won'
    HIGHEST_BREAK = 'highest_break'
    TOTAL_POINTS = 'total_points'
    PERFECT_GAME = 'perfect_game'
    STREAK = 'streak'
    SOCIAL = 'social'
    VENUE = 'venue'
    SPECIAL = 'special'

class Achievement(TimestampMixin, db.Model):
    """Model for achievements that users can earn."""
    
    __tablename__ = 'achievements'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum(AchievementType), nullable=False)
    points = db.Column(db.Integer, default=0)
    icon = db.Column(db.String(200))  # URL to achievement icon
    requirements = db.Column(db.JSON)  # JSON object with achievement requirements
    is_hidden = db.Column(db.Boolean, default=False)
    tier = db.Column(db.Integer, default=1)  # Achievement tier/level
    next_tier_id = db.Column(db.Integer, db.ForeignKey('achievements.id'))  # Next tier achievement
    
    # Relationships
    users = db.relationship('UserAchievement', back_populates='achievement')
    next_tier = db.relationship('Achievement', remote_side=[id])

class UserAchievement(TimestampMixin, db.Model):
    """Model for tracking which achievements users have earned."""
    
    __tablename__ = 'user_achievements'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress = db.Column(db.JSON)  # JSON object tracking progress towards achievement
    
    # Relationships
    user = db.relationship('User', back_populates='achievements')
    achievement = db.relationship('Achievement', back_populates='users')