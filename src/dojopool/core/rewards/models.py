from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..models import db


class RewardTier(db.Model):
    __tablename__ = "reward_tiers"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    points_required = Column(Integer, nullable=False)
    benefits = Column(JSON)  # JSON field for storing tier benefits
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    rewards = relationship("Reward", back_populates="tier")


class Reward(db.Model):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True)
    tier_id = Column(Integer, ForeignKey("reward_tiers.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    points_cost = Column(Integer, nullable=False)
    quantity_available = Column(Integer)  # null means unlimited
    is_active = Column(Boolean, default=True)
    expiry_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    tier = relationship("RewardTier", back_populates="rewards")
    user_rewards = relationship("UserReward", back_populates="reward")


class UserReward(db.Model):
    __tablename__ = "user_rewards"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("rewards.id"), nullable=False)
    claimed_at = Column(DateTime, default=datetime.utcnow)
    used_at = Column(DateTime)
    status = Column(String(50), nullable=False)  # claimed, used, expired
    points_spent = Column(Integer, nullable=False)

    user = relationship("User", back_populates="rewards")
    reward = relationship("Reward", back_populates="user_rewards")
