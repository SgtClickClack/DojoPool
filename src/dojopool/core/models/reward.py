"""Reward models module."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import db
from .base import BaseModel

class RewardTier(BaseModel):
    """Reward tier model."""
    
    __tablename__ = 'reward_tiers'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    points_required = db.Column(db.Integer, nullable=False)
    benefits = db.Column(db.JSON)  # List of tier benefits
    icon_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<RewardTier {self.name}>'
    
    def deactivate(self):
        """Deactivate reward tier."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate reward tier."""
        self.is_active = True
        db.session.commit()

class Reward(BaseModel):
    """Reward model."""
    
    __tablename__ = 'rewards'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    reward_type = db.Column(db.String(50), nullable=False)  # achievement, challenge, referral, etc.
    points_value = db.Column(db.Integer, nullable=False)
    tier_id = db.Column(db.Integer, db.ForeignKey('reward_tiers.id'))
    requirements = db.Column(db.JSON)  # Requirements to earn reward
    icon_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    tier = db.relationship('RewardTier', backref=db.backref('rewards', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Reward {self.name}>'
    
    def deactivate(self):
        """Deactivate reward."""
        self.is_active = False
        db.session.commit()
    
    def activate(self):
        """Activate reward."""
        self.is_active = True
        db.session.commit()

class UserReward(BaseModel):
    """User reward model."""
    
    __tablename__ = 'user_rewards'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reward_id = db.Column(db.Integer, db.ForeignKey('rewards.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    claimed_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='earned')  # earned, claimed, expired
    points_earned = db.Column(db.Integer, nullable=False)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('rewards_earned', lazy='dynamic'))
    reward = db.relationship('Reward', backref=db.backref('user_rewards', lazy='dynamic'))
    
    def __repr__(self):
        return f'<UserReward {self.user_id}:{self.reward_id}>'
    
    def claim(self):
        """Claim the reward."""
        if self.status == 'earned' and (not self.expires_at or self.expires_at > datetime.utcnow()):
            self.status = 'claimed'
            self.claimed_at = datetime.utcnow()
            db.session.commit()
        else:
            raise ValueError("Reward cannot be claimed")
    
    def expire(self):
        """Mark reward as expired."""
        self.status = 'expired'
        db.session.commit()
