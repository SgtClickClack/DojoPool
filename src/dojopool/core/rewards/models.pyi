from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..models import db
from .base import Base

class RewardTier(Base):
    __tablename__: str = "reward_tiers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    points_required: Mapped[int] = mapped_column(nullable=False)
    rewards: Mapped[Dict[str, Any]] = mapped_column(JSON)
    active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    def __repr__(self) -> str: ...
    def to_dict(self) -> Dict[str, Any]: ...

class UserReward(Base):
    __tablename__: str = "user_rewards"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    tier_id: Mapped[int] = mapped_column(ForeignKey("reward_tiers.id"), nullable=False)
    points: Mapped[int] = mapped_column(default=0)
    claimed: Mapped[bool] = mapped_column(default=False)
    claimed_at: Mapped[Optional[datetime]] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="rewards")
    tier: Mapped[RewardTier] = relationship("RewardTier")

    def __repr__(self) -> str: ...
    def to_dict(self) -> Dict[str, Any]: ...
    def claim(self) -> None: ...
    def add_points(self, points: int) -> None: ...
    def remove_points(self, points: int) -> None: ...
