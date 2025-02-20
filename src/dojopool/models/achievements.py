"""Achievement models for DojoPool."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from .user import User


class AchievementCategory(Base):
    """Achievement category model."""

    __tablename__: str = "achievement_categories"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column()
    icon: Mapped[Optional[str]] = mapped_column()  # Font awesome icon name

    # Relationships
    achievements: Mapped[List["Achievement"]] = relationship(back_populates="category")

    def __str__(self) -> str:
        return self.name


class Achievement(Base):
    """Achievement model."""

    __tablename__: str = "achievements"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[Optional[str]] = mapped_column()
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("achievement_categories.id")
    )
    icon: Mapped[Optional[str]] = mapped_column()  # Path to icon image
    points: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Progress tracking
    has_progress: Mapped[bool] = mapped_column(default=False)
    target_value: Mapped[Optional[int]] = mapped_column()
    progress_description: Mapped[Optional[str]] = mapped_column()

    # Social features
    is_secret: Mapped[bool] = mapped_column(default=False)
    rarity: Mapped[float] = mapped_column(
        default=0
    )  # Percentage of users who have this

    # Unlock conditions as JSON
    conditions: Mapped[Dict] = mapped_column(JSON, default=dict)

    # Relationships
    category: Mapped[Optional["AchievementCategory"]] = relationship(
        back_populates="achievements"
    )
    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        back_populates="achievement"
    )

    def __str__(self):
        return self.name

    def update_rarity(self):
        """Update achievement rarity based on number of users who have unlocked it."""
        total_users = User.query.count()
        if total_users > 0:
            unlocked_count: Any = UserAchievement.query.filter_by(
                achievement_id=self.id, is_unlocked=True
            ).count()
            self.rarity = (unlocked_count / total_users) * 100


class UserAchievement(Base):
    """User achievement model."""

    __tablename__: str = "user_achievements"
    __table_args__: Any = (
        UniqueConstraint("user_id", "achievement_id", name="unique_user_achievement"),
        {"extend_existing": True},
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    achievement_id: Mapped[int] = mapped_column(
        ForeignKey("achievements.id"), nullable=False
    )
    current_progress: Mapped[int] = mapped_column(default=0)
    is_unlocked: Mapped[bool] = mapped_column(default=False)
    unlocked_at: Mapped[Optional[datetime]] = mapped_column()

    # Social sharing
    shared_count: Mapped[int] = mapped_column(default=0)
    last_shared_at: Mapped[Optional[datetime]] = mapped_column()

    # Relationships
    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(
        back_populates="user_achievements"
    )
    shares: Mapped[List["AchievementShare"]] = relationship(
        back_populates="user_achievement"
    )

    def update_progress(self, new_value: int) -> None:
        """Update achievement progress and check if unlocked."""
        self.current_progress = new_value

        if (
            self.achievement.has_progress
            and self.achievement.target_value
            and new_value >= self.achievement.target_value
            and not self.is_unlocked
        ):
            self.unlock()
        else:
            db.session.commit()

    def unlock(self) -> None:
        """Unlock the achievement."""
        if not self.is_unlocked:
            self.is_unlocked = True
            self.unlocked_at = datetime.utcnow()
            db.session.commit()

            # Update achievement rarity
            self.achievement.update_rarity()

            # Trigger notification (handled by event system)
            from ..core.events import achievement_unlocked

            achievement_unlocked.send(self)

    def share(self):
        """Share the achievement."""
        self.shared_count += 1
        self.last_shared_at = datetime.utcnow()
        db.session.commit()


class AchievementShare(Base):
    """Achievement share model."""

    __tablename__: str = "achievement_shares"
    __table_args__: Any = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_achievement_id: Mapped[int] = mapped_column(
        ForeignKey("user_achievements.id"), nullable=False
    )
    shared_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    likes: Mapped[int] = mapped_column(default=0)
    comments: Mapped[int] = mapped_column(default=0)

    # Relationships
    user_achievement: Mapped["UserAchievement"] = relationship(back_populates="shares")

    def __str__(self):
        return f"Share of {self.user_achievement.achievement.name} by {self.user_achievement.user.username}"


def get_achievement_text(achievement: Achievement):
    """Get the display text for an achievement."""
    return f"{achievement.name}: {achievement.description}"
