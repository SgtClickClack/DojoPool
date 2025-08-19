"""Achievement models for DojoPool."""

from datetime import datetime
from typing import Dict, Optional

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..core.extensions import db


class AchievementCategory(db.Model):
    """Achievement category model."""

    __tablename__ = "achievement_categories"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  # Font awesome icon name

    # Relationships
    achievements = relationship("Achievement", back_populates="category")

    def __str__(self):
        """String representation."""
        return self.name


class Achievement(db.Model):
    """Achievement model."""

    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey("achievement_categories.id"))
    icon = db.Column(db.String(255))  # Path to icon file
    points = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=func.now())

    # Progress tracking
    has_progress = db.Column(db.Boolean, default=False)
    target_value = db.Column(db.Integer)
    progress_description = db.Column(db.String(200))

    # Social features
    is_secret = db.Column(db.Boolean, default=False)
    rarity = db.Column(db.Float, default=0)  # Percentage of users who have this

    # Unlock conditions as JSON
    conditions = db.Column(db.JSON, default=dict)

    # Relationships
    category = relationship("AchievementCategory", back_populates="achievements")
    user_achievements = relationship("UserAchievement", back_populates="achievement")

    def __str__(self):
        """String representation."""
        return self.name

    def update_rarity(self):
        """Update achievement rarity."""
        total_users = db.session.query(func.count("*")).select_from("users").scalar()
        if total_users > 0:
            unlocked_count = (
                db.session.query(func.count("*"))
                .select_from(UserAchievement)
                .filter(
                    UserAchievement.achievement_id == self.id,
                    UserAchievement.is_unlocked == True,
                )
                .scalar()
            )
            self.rarity = (unlocked_count / total_users) * 100
            db.session.add(self)
            db.session.commit()


class UserAchievement(db.Model):
    """User achievement model."""

    __tablename__ = "user_achievements"
    __table_args__ = (
        db.UniqueConstraint("user_id", "achievement_id", name="uix_user_achievement"),
        {"extend_existing": True},
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user_profiles.id"), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False)
    current_progress = db.Column(db.Integer, default=0)
    is_unlocked = db.Column(db.Boolean, default=False)
    unlocked_at = db.Column(db.DateTime)

    # Social sharing
    shared_count = db.Column(db.Integer, default=0)
    last_shared_at = db.Column(db.DateTime)

    # Relationships
    user = relationship("UserProfile", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")
    shares = relationship("AchievementShare", back_populates="user_achievement")

    def __str__(self):
        """String representation."""
        return f"{self.user.username} - {self.achievement.name}"

    def update_progress(self, new_value: int) -> bool:
        """Update progress and check if achievement should be unlocked."""
        if self.is_unlocked:
            return False

        self.current_progress = new_value
        should_unlock = False

        if self.achievement.has_progress:
            if self.current_progress >= self.achievement.target_value:
                should_unlock = True
        else:
            should_unlock = True

        if should_unlock:
            self.unlock()
            return True

        db.session.add(self)
        db.session.commit()
        return False

    def unlock(self):
        """Unlock the achievement and trigger notifications."""
        self.is_unlocked = True
        self.unlocked_at = datetime.utcnow()
        db.session.add(self)
        db.session.commit()

        # Update achievement rarity
        self.achievement.update_rarity()

        # Add points to user's profile
        self.user.skill_level += self.achievement.points
        db.session.add(self.user)
        db.session.commit()

        # Send notification
        self._send_unlock_notification()

    def share(self):
        """Share achievement to social feed."""
        self.shared_count += 1
        self.last_shared_at = datetime.utcnow()
        db.session.add(self)
        db.session.commit()

    def _send_unlock_notification(self):
        """Send notification when achievement is unlocked."""
        from ..core.utils.notifications import send_notification

        send_notification(
            "achievement_unlocked",
            {
                "title": "Achievement Unlocked!",
                "message": f"You've unlocked {self.achievement.name}",
                "achievement": {
                    "name": self.achievement.name,
                    "description": self.achievement.description,
                    "points": self.achievement.points,
                    "icon": self.achievement.icon,
                    "rarity": self.achievement.rarity,
                },
            },
            self.user.id,
        )


class AchievementShare(db.Model):
    """Achievement share model."""

    __tablename__ = "achievement_shares"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    user_achievement_id = db.Column(
        db.Integer, db.ForeignKey("user_achievements.id"), nullable=False
    )
    shared_at = db.Column(db.DateTime, default=func.now())
    likes = db.Column(db.Integer, default=0)
    comments = db.Column(db.Integer, default=0)

    # Relationships
    user_achievement = relationship("UserAchievement", back_populates="shares")

    def __str__(self):
        """String representation."""
        return f"{self.user_achievement} - Shared at {self.shared_at}"


def get_achievement_text(achievement: Achievement) -> str:
    """
    Returns a descriptive text for a given achievement.

    Args:
        achievement (Achievement): The achievement instance.

    Returns:
        str: A formatted achievement description.
    """
    return f"Achievement: {achievement.name} - {achievement.description}"
