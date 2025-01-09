"""Achievement model module.

This module contains the Achievement model for tracking user achievements.
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy import JSON
from .base import BaseModel, db

class Achievement(BaseModel):
    """Achievement model."""
    __tablename__ = 'achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    points = db.Column(db.Integer, default=0)
    icon_url = db.Column(db.String(200))
    requirements = db.Column(JSON)
    rewards = db.Column(JSON)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, **kwargs):
        """Initialize achievement."""
        super(Achievement, self).__init__(**kwargs)
        self.requirements = self.requirements or {}
        self.rewards = self.rewards or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert achievement to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'points': self.points,
            'icon_url': self.icon_url,
            'requirements': self.requirements,
            'rewards': self.rewards,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    @classmethod
    def get_active_achievements(cls) -> List['Achievement']:
        """Get all active achievements."""
        return cls.query.filter_by(is_active=True).order_by(cls.points.desc()).all()
    
    @classmethod
    def get_by_category(
        cls,
        category: str,
        active_only: bool = True
    ) -> List['Achievement']:
        """Get achievements by category."""
        query = cls.query.filter_by(category=category)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        return query.order_by(cls.points.desc()).all()
    
    @classmethod
    def create_achievement(
        cls,
        name: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        points: int = 0,
        icon_url: Optional[str] = None,
        requirements: Optional[Dict[str, Any]] = None,
        rewards: Optional[Dict[str, Any]] = None
    ) -> 'Achievement':
        """Create a new achievement."""
        achievement = cls(
            name=name,
            description=description,
            category=category,
            points=points,
            icon_url=icon_url,
            requirements=requirements or {},
            rewards=rewards or {}
        )
        db.session.add(achievement)
        db.session.commit()
        return achievement
    
    def update_requirements(self, requirements: Dict[str, Any]) -> None:
        """Update achievement requirements."""
        self.requirements = requirements
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_rewards(self, rewards: Dict[str, Any]) -> None:
        """Update achievement rewards."""
        self.rewards = rewards
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def activate(self) -> None:
        """Activate the achievement."""
        self.is_active = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def deactivate(self) -> None:
        """Deactivate the achievement."""
        self.is_active = False
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    @classmethod
    def search_achievements(
        cls,
        query: str,
        category: Optional[str] = None,
        active_only: bool = True
    ) -> List['Achievement']:
        """Search achievements by name."""
        search = f"%{query}%"
        db_query = cls.query.filter(cls.name.ilike(search))
        
        if category:
            db_query = db_query.filter_by(category=category)
        if active_only:
            db_query = db_query.filter_by(is_active=True)
        
        return db_query.order_by(cls.points.desc()).all()

class UserAchievement(BaseModel):
    """User Achievement model."""
    __tablename__ = 'user_achievements'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey('achievements.id'), nullable=False)
    progress = db.Column(JSON)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime)
    reward_claimed = db.Column(db.Boolean, default=False)
    reward_claimed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='achievements')
    achievement = db.relationship('Achievement', backref='user_achievements')
    
    def __init__(self, **kwargs):
        """Initialize user achievement."""
        super(UserAchievement, self).__init__(**kwargs)
        self.progress = self.progress or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert user achievement to dictionary."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'achievement_id': self.achievement_id,
            'progress': self.progress,
            'completed': self.completed,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'reward_claimed': self.reward_claimed,
            'reward_claimed_at': self.reward_claimed_at.isoformat() if self.reward_claimed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'achievement': self.achievement.to_dict()
        }
    
    @classmethod
    def get_user_achievements(
        cls,
        user_id: int,
        completed: Optional[bool] = None
    ) -> List['UserAchievement']:
        """Get achievements for a user."""
        query = cls.query.filter_by(user_id=user_id)
        
        if completed is not None:
            query = query.filter_by(completed=completed)
        
        return query.order_by(cls.updated_at.desc()).all()
    
    @classmethod
    def get_achievement_users(
        cls,
        achievement_id: int,
        completed: Optional[bool] = None
    ) -> List['UserAchievement']:
        """Get users who have an achievement."""
        query = cls.query.filter_by(achievement_id=achievement_id)
        
        if completed is not None:
            query = query.filter_by(completed=completed)
        
        return query.order_by(cls.updated_at.desc()).all()
    
    @classmethod
    def create_user_achievement(
        cls,
        user_id: int,
        achievement_id: int,
        progress: Optional[Dict[str, Any]] = None
    ) -> 'UserAchievement':
        """Create a new user achievement."""
        user_achievement = cls(
            user_id=user_id,
            achievement_id=achievement_id,
            progress=progress or {}
        )
        db.session.add(user_achievement)
        db.session.commit()
        return user_achievement
    
    def update_progress(self, progress: Dict[str, Any]) -> None:
        """Update achievement progress."""
        self.progress.update(progress)
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def complete(self) -> None:
        """Complete the achievement."""
        self.completed = True
        self.completed_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def reset(self) -> None:
        """Reset achievement progress."""
        self.progress = {}
        self.completed = False
        self.completed_at = None
        self.updated_at = datetime.utcnow()
        db.session.commit()