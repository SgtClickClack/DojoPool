from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import db


class RewardTier(Base):
    __tablename__: str = "reward_tiers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    points_required: Mapped[int] = mapped_column(Integer, nullable=False)
    benefits: Mapped[Dict[str, Any]] = mapped_column(
        JSON
    )  # JSON field for storing tier benefits
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    rewards: Mapped[List[Reward]] = relationship("Reward", back_populates="tier")


class Reward(Base):
    __tablename__: str = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tier_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("reward_tiers.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    points_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_available: Mapped[int] = mapped_column(Integer)  # null means unlimited
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expiry_date: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tier: Mapped[List[RewardTier]] = relationship(
        "RewardTier", back_populates="rewards"
    )
    user_rewards: Mapped[List[UserReward]] = relationship(
        "UserReward", back_populates="reward"
    )


class UserReward(Base):
    __tablename__: str = "user_rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    reward_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("rewards.id"), nullable=False
    )
    claimed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    used_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # claimed, used, expired
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped[List[User]] = relationship("User", back_populates="rewards")
    reward: Mapped[List[Reward]] = relationship("Reward", back_populates="user_rewards")
