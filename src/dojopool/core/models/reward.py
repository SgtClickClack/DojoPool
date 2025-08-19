"""Reward models module."""

from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..database import db
from .base import BaseModel


class RewardTier(BaseModel):
    """Reward tier model."""

    __tablename__ = "reward_tiers"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    points_required = db.Column(db.Integer, nullable=False)
    benefits = db.Column(db.JSON)  # List of tier benefits
    icon_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f"<RewardTier {self.name}>"

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

    __tablename__ = "rewards"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    reward_type = db.Column(db.String(50), nullable=False)  # achievement, challenge, referral, etc.
    points_value = db.Column(db.Integer, nullable=False)
    tier_id = db.Column(db.Integer, db.ForeignKey("reward_tiers.id"))
    requirements = db.Column(db.JSON)  # Requirements to earn reward
    icon_url = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    tier = db.relationship("RewardTier", backref=db.backref("rewards", lazy="dynamic"))

    def __repr__(self):
        return f"<Reward {self.name}>"

    def deactivate(self):
        """Deactivate reward."""
        self.is_active = False
        db.session.commit()

    def activate(self):
        """Activate reward."""
        self.is_active = True
        db.session.commit()


class Achievement(BaseModel):
    """Achievement model."""

    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    type = Column(String(50), nullable=False)  # skill, social, special, etc.
    tier = Column(String(20))  # bronze, silver, gold, etc.
    points = Column(Integer, default=0)
    icon = Column(String(100))
    requirements = Column(JSON)  # Criteria to earn achievement
    reward_type = Column(String(50))  # coins, items, etc.
    reward_value = Column(Float, default=0.0)
    is_hidden = Column(Boolean, default=False)
    is_special = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Achievement {self.name}>"

    def to_dict(self):
        """Convert achievement to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "tier": self.tier,
            "points": self.points,
            "icon": self.icon,
            "requirements": self.requirements,
            "reward_type": self.reward_type,
            "reward_value": self.reward_value,
            "is_hidden": self.is_hidden,
            "is_special": self.is_special,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class UserAchievement(BaseModel):
    """User Achievement model."""

    __tablename__ = "user_achievements"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    progress = Column(JSON)  # Track progress towards achievement
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime)
    reward_claimed = Column(Boolean, default=False)
    reward_claimed_at = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="achievements")
    achievement = relationship("Achievement", backref="user_achievements")

    def __repr__(self):
        return f"<UserAchievement {self.user_id}:{self.achievement_id}>"

    def to_dict(self):
        """Convert user achievement to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "progress": self.progress,
            "completed": self.completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "reward_claimed": self.reward_claimed,
            "reward_claimed_at": (
                self.reward_claimed_at.isoformat() if self.reward_claimed_at else None
            ),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class UserReward(BaseModel):
    """User reward model."""

    __tablename__ = "user_rewards"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    claimed_at = Column(DateTime)
    expires_at = Column(DateTime)
    status = Column(String(20), default="earned")  # earned, claimed, expired
    points_earned = Column(Integer, nullable=False)

    # Relationships
    user = relationship("User", backref=db.backref("rewards_earned", lazy="dynamic"))
    reward = relationship("Reward", backref=db.backref("user_rewards", lazy="dynamic"))

    def __repr__(self):
        return f"<UserReward {self.user_id}:{self.reward_id}>"

    def claim(self):
        """Claim the reward."""
        if self.status == "earned" and (not self.expires_at or self.expires_at > datetime.utcnow()):
            self.status = "claimed"
            self.claimed_at = datetime.utcnow()
            db.session.commit()
        else:
            raise ValueError("Reward cannot be claimed")

    def expire(self):
        """Mark reward as expired."""
        self.status = "expired"
        db.session.commit()
