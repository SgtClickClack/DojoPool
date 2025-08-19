from datetime import datetime

from sqlalchemy.ext.hybrid import hybrid_property

from dojopool.models.user import User
from src.core.database import db
from src.core.validation import AchievementValidator


# TODO: Remove duplicate Achievement model to resolve SQLAlchemy registry conflicts.
# class Achievement(db.Model):
#     ...


class UserAchievement(db.Model):
    """User achievement model."""

    __tablename__ = "user_achievements"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    achievement_id = db.Column(db.Integer, db.ForeignKey("achievements.id"), nullable=False)

    # Progress tracking
    progress = db.Column(db.Float, default=0.0)
    current_value = db.Column(db.Float, default=0.0)
    completed = db.Column(db.Boolean, default=False)
    completion_details = db.Column(db.JSON)  # Details about how it was earned

    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    earned_at = db.Column(db.DateTime)
    notified_at = db.Column(db.DateTime)  # When user was notified

    # Status
    is_hidden = db.Column(db.Boolean, default=False)  # Hidden from user's profile
    is_featured = db.Column(db.Boolean, default=False)  # Featured on user's profile
    notes = db.Column(db.Text)

    # Relationships
    user = db.relationship("User", backref=db.backref("achievements", lazy="dynamic"))
    achievement = db.relationship(
        "Achievement", backref=db.backref("user_achievements", lazy="dynamic")
    )

    # Validation
    validator_class = AchievementValidator

    def __repr__(self):
        return f"<UserAchievement {self.user_id}:{self.achievement_id}>"

    @hybrid_property
    def days_to_earn(self):
        """Get number of days taken to earn achievement."""
        if not self.earned_at:
            return None
        return (self.earned_at - self.started_at).days

    def update_progress(self, value, details=None):
        """Update achievement progress.

        Args:
            value: New value
            details: Progress details

        Returns:
            bool: True if achievement was completed
        """
        if self.completed:
            return False

        self.current_value = value
        self.progress = self.achievement.get_progress(value)

        if self.achievement.check_requirement(value, details):
            self.complete(details)
            return True

        db.session.commit()
        return False

    def complete(self, details=None):
        """Complete achievement.

        Args:
            details: Completion details
        """
        if self.completed:
            return

        self.completed = True
        self.progress = 100.0
        self.earned_at = datetime.utcnow()

        if details:
            self.completion_details = details

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

    def unhide(self):
        """Unhide achievement on user's profile."""
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
        """Convert the model instance to a dictionary.

        Returns:
            dict: Model data
        """
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
        }

    @classmethod
    def get_user_achievements(cls, user_id, category=None, completed=None, hidden=None):
        """Get achievements for user.

        Args:
            user_id: User ID
            category: Achievement category filter
            completed: Completion status filter
            hidden: Hidden status filter

        Returns:
            list: User achievements
        """
        query = cls.query.join(Achievement).filter(cls.user_id == user_id)

        if category:
            query = query.filter(Achievement.category == category)

        if completed is not None:
            query = query.filter(cls.completed == completed)

        if hidden is not None:
            query = query.filter(cls.is_hidden == hidden)

        return query.order_by(Achievement.priority.desc()).all()

    @classmethod
    def get_featured(cls, user_id, limit=5):
        """Get featured achievements for user.

        Args:
            user_id: User ID
            limit: Maximum number to return

        Returns:
            list: Featured achievements
        """
        return (
            cls.query.filter_by(user_id=user_id, is_featured=True, completed=True)
            .join(Achievement)
            .order_by(Achievement.priority.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_recent(cls, user_id, days=30, limit=10):
        """Get recently earned achievements.

        Args:
            user_id: User ID
            days: Number of days to look back
            limit: Maximum number to return

        Returns:
            list: Recent achievements
        """
        since = datetime.utcnow() - timedelta(days=days)
        return (
            cls.query.filter(cls.user_id == user_id, cls.completed is True, cls.earned_at >= since)
            .order_by(cls.earned_at.desc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_progress_summary(cls, user_id):
        """Get achievement progress summary.

        Args:
            user_id: User ID

        Returns:
            dict: Progress summary
        """
        total = Achievement.query.filter_by(is_active=True).count()
        earned = cls.query.filter_by(user_id=user_id, completed=True).count()

        return {
            "total": total,
            "earned": earned,
            "progress": (earned / total * 100) if total > 0 else 0,
        }
