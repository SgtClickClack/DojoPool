from flask_caching import Cache
from flask_caching import Cache
"""Achievement models module."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import mapped_column
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.sql import func

from ...core.extensions import db
from ...core.models.base import Base
from ...core.validation.validators import AchievementValidator
from ...models.user import User


class Achievement(Base):
    """Achievement model."""

    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(db.String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(db.Text)
    icon: Mapped[Optional[str]] = mapped_column(
        db.String(255)
    )  # URL or identifier for achievement icon

    # Requirements
    category: Mapped[Optional[str]] = mapped_column(
        db.String(50)
    )  # e.g., tournament, game, social
    requirement_type: Mapped[Optional[str]] = mapped_column(
        db.String(50)
    )  # e.g., win_count, score_threshold
    requirement_value: Mapped[Optional[float]] = mapped_column(
        db.Float
    )  # Value needed to earn achievement
    requirement_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        db.JSON
    )  # Additional requirements

    # Rewards
    points: Mapped[int] = mapped_column(
        db.Integer, default=0
    )  # Points awarded for earning
    reward_type: Mapped[Optional[str]] = mapped_column(
        db.String(50)
    )  # e.g., badge, title, bonus
    reward_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        db.JSON
    )  # Additional reward details

    # Status and metadata
    is_active: Mapped[bool] = mapped_column(db.Boolean, default=True)
    is_hidden: Mapped[bool] = mapped_column(
        db.Boolean, default=False
    )  # Hidden achievements
    is_rare: Mapped[bool] = mapped_column(
        db.Boolean, default=False
    )  # Rare/special achievements
    rarity: Mapped[Optional[float]] = mapped_column(
        db.Float
    )  # Percentage of users who have earned it
    priority: Mapped[int] = mapped_column(db.Integer, default=0)  # Display priority
    created_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Validation
    validator_class = AchievementValidator

    def __repr__(self) -> str:
        """Get string representation."""
        return f"<Achievement {self.name}>"

    @hybrid_property
    def total_earned(self) -> int:
        """Get total number of users who earned this achievement."""
        return self.user_achievements.filter_by(completed=True).count()

    def update_rarity(self):
        """Update achievement rarity based on total users."""
        total_users = User.query.count()
        if total_users > 0:
            self.rarity = (self.total_earned / total_users) * 100
            db.session.commit()

    def check_requirement(
        self, value: Union[int, float], details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Check if the requirement is met."""
        if self.requirement_type == "exact":
            return value == self.requirement_value
        elif self.requirement_type == "count":
            return value >= self.requirement_value
        elif self.requirement_type == "custom":
            # Custom logic based on requirement_details
            return False
        return False

    def get_progress(self, value: Union[int, float]) -> float:
        """Calculate progress towards achievement.

        Args:
            value: Current value to check progress against

        Returns:
            float: Progress percentage (0.0 to 1.0)
        """
        if not self.requirement_type or not self.requirement_value:
            return 0.0

        if self.requirement_type == "threshold":
            return min(1.0, value / self.requirement_value)
        elif self.requirement_type == "exact":
            return 1.0 if value == self.requirement_value else 0.0
        elif self.requirement_type == "count":
            return min(1.0, value / self.requirement_value)
        elif self.requirement_type == "custom":
            # Custom progress calculation
            return 0.0

        return 0.0

    @classmethod
    def get_available(cls, category: Optional[str] = None, hidden: bool = False):
        """Get available achievements.

        Args:
            category: Optional category to filter by
            hidden: Whether to include hidden achievements

        Returns:
            List of achievements
        """
        query = cls.query.filter_by(is_active=True)

        if category:
            query = query.filter_by(category=category)

        if not hidden:
            query = query.filter_by(is_hidden=False)

        return query.order_by(cls.priority.desc()).all()

    @classmethod
    def get_by_requirement(cls, requirement_type: str):
        """Get achievements by requirement type.

        Args:
            requirement_type: Type of requirement to filter by

        Returns:
            List of achievements
        """
        return cls.query.filter_by(
            requirement_type=requirement_type, is_active=True
        ).all()


class UserAchievement(Base):
    """User achievement model."""

    __tablename__ = "user_achievements"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(db.ForeignKey("users.id"), nullable=False)
    achievement_id: Mapped[int] = mapped_column(
        db.ForeignKey("achievements.id"), nullable=False
    )

    # Progress tracking
    progress: Mapped[float] = mapped_column(db.Float, default=0.0)
    current_value: Mapped[float] = mapped_column(db.Float, default=0.0)
    completed: Mapped[bool] = mapped_column(db.Boolean, default=False)
    completion_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        db.JSON
    )  # Details about how it was earned

    # Timestamps
    started_at: Mapped[datetime] = mapped_column(db.DateTime, default=datetime.utcnow)
    earned_at: Mapped[Optional[datetime]] = mapped_column(db.DateTime)
    notified_at: Mapped[Optional[datetime]] = mapped_column(
        db.DateTime
    )  # When user was notified

    # Status
    is_hidden: Mapped[bool] = mapped_column(
        db.Boolean, default=False
    )  # Hidden from user's profile
    is_featured: Mapped[bool] = mapped_column(
        db.Boolean, default=False
    )  # Featured on user's profile
    notes: Mapped[Optional[str]] = mapped_column(db.Text)

    # Relationships
    user: Mapped["User"] = relationship(
        "User", backref=db.backref("achievements", lazy="dynamic")
    )
    achievement: Mapped["Achievement"] = relationship(
        "Achievement", backref=db.backref("user_achievements", lazy="dynamic")
    )

    # Validation
    validator_class = AchievementValidator

    def __repr__(self):
        """Get string representation."""
        return f"<UserAchievement {self.user_id}:{self.achievement_id}>"

    @hybrid_property
    def days_to_earn(self) -> Optional[int]:
        """Get number of days taken to earn achievement."""
        if not self.earned_at:
            return None
        return (self.earned_at - self.started_at).days

    def update_progress(
        self, value: Union[int, float], details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Update achievement progress."""
        if self.completed:
            return

        self.current_value = value
        self.progress = self.achievement.get_progress(value)

        if self.achievement.check_requirement(value, details):
            self.complete(details)

    def complete(self, details: Optional[Dict[str, Any]] = None):
        """Complete achievement."""
        if self.completed:
            return

        self.completed = True
        self.earned_at = datetime.utcnow()
        self.progress = 1.0
        self.completion_details = details or {}

        # Update achievement rarity
        self.achievement.update_rarity()

        db.session.commit()

    def notify(self):
        """Mark achievement as notified."""
        self.notified_at = datetime.utcnow()
        db.session.commit()

    def hide(self):
        """Hide achievement from user's profile."""
        self.is_hidden = True
        db.session.commit()

    def unhide(self) -> None:
        """Unhide achievement from user's profile."""
        self.is_hidden = False
        db.session.commit()

    def feature(self):
        """Feature achievement on user's profile."""
        self.is_featured = True
        db.session.commit()

    def unfeature(self):
        """Unfeature achievement from user's profile."""
        self.is_featured = False
        db.session.commit()

    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "achievement": {
                "name": self.achievement.name,
                "description": self.achievement.description,
                "icon": self.achievement.icon,
                "points": self.achievement.points,
                "is_rare": self.achievement.is_rare,
                "rarity": self.achievement.rarity,
            },
            "progress": self.progress,
            "current_value": self.current_value,
            "completed": self.completed,
            "completion_details": self.completion_details,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
            "days_to_earn": self.days_to_earn,
            "is_hidden": self.is_hidden,
            "is_featured": self.is_featured,
            "notes": self.notes,
        }

    @classmethod
    def get_user_achievements(
        cls,
        user_id: int,
        category: Optional[str] = None,
        completed: Optional[bool] = None,
        hidden: Optional[bool] = None,
    ) -> List["UserAchievement"]:
        """Get user's achievements.

        Args:
            user_id: ID of the user
            category: Optional category to filter by
            completed: Optional completion status to filter by
            hidden: Optional hidden status to filter by

        Returns:
            List of user achievements
        """
        query = cls.query.filter_by(user_id=user_id)

        if category:
            query = query.join(Achievement).filter(Achievement.category == category)

        if completed is not None:
            query = query.filter_by(completed=completed)

        if hidden is not None:
            query = query.filter_by(is_hidden=hidden)

        return query.all()

    @classmethod
    def get_featured(cls, user_id: int, limit: int = 5):
        """Get user's featured achievements."""
        return (
            cls.query.filter_by(user_id=user_id, is_featured=True)
            .order_by(cls.earned_at.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_recent(cls, user_id: int, days: int = 30, limit: int = 10):
        """Get user's recent achievements."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        return (
            cls.query.filter_by(user_id=user_id, completed=True)
            .filter(cls.earned_at >= cutoff)
            .order_by(cls.earned_at.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_progress_summary(cls, user_id: int) -> Dict[str, Any]:
        """Get user's achievement progress summary."""
        total = Achievement.query.filter_by(is_active=True).count()
        earned = cls.query.filter_by(user_id=user_id, completed=True).count()

        return {
            "total": total,
            "earned": earned,
            "percent": (earned / total * 100) if total > 0 else 0,
            "points": db.session.query(func.sum(Achievement.points))
            .join(cls)
            .filter(cls.user_id == user_id, cls.completed == True)  # noqa
            .scalar()
            or 0,
        }
