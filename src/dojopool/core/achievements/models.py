from datetime import datetime

from sqlalchemy.ext.hybrid import hybrid_property

from src.core.auth.models import User
from src.core.database import db
from src.core.validation import AchievementValidator


class Achievement(db.Model):
    """Achievement model."""

    __tablename__ = "achievements"
    __table_args__ = {"extend_existing": True}

    # Basic fields
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(255))  # URL or identifier for achievement icon

    # Requirements
    category = db.Column(db.String(50))  # e.g., tournament, game, social
    requirement_type = db.Column(db.String(50))  # e.g., win_count, score_threshold
    requirement_value = db.Column(db.Float)  # Value needed to earn achievement
    requirement_details = db.Column(db.JSON)  # Additional requirements

    # Rewards
    points = db.Column(db.Integer, default=0)  # Points awarded for earning
    reward_type = db.Column(db.String(50))  # e.g., badge, title, bonus
    reward_details = db.Column(db.JSON)  # Additional reward details

    # Status and metadata
    is_active = db.Column(db.Boolean, default=True)
    is_hidden = db.Column(db.Boolean, default=False)  # Hidden achievements
    is_rare = db.Column(db.Boolean, default=False)  # Rare/special achievements
    rarity = db.Column(db.Float)  # Percentage of users who have earned it
    priority = db.Column(db.Integer, default=0)  # Display priority
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Validation
    validator_class = AchievementValidator

    def __repr__(self):
        return f"<Achievement {self.name}>"

    @hybrid_property
    def total_earned(self):
        """Get total number of users who earned this achievement."""
        return self.user_achievements.filter_by(completed=True).count()

    def update_rarity(self):
        """Update achievement rarity based on total users."""
        total_users = User.query.count()
        if total_users > 0:
            self.rarity = (self.total_earned / total_users) * 100
            db.session.commit()

    def check_requirement(self, value, details=None):
        """Check if a value meets the achievement requirement.

        Args:
            value: Value to check
            details: Additional details to check

        Returns:
            bool: True if requirement is met
        """
        if not self.requirement_type or not self.requirement_value:
            return False

        if self.requirement_type == "threshold":
            return value >= self.requirement_value
        elif self.requirement_type == "exact":
            return value == self.requirement_value
        elif self.requirement_type == "count":
            return value >= self.requirement_value
        elif self.requirement_type == "custom":
            # Custom logic based on requirement_details
            return False

        return False

    def get_progress(self, value):
        """Calculate progress towards achievement.

        Args:
            value: Current value

        Returns:
            float: Progress percentage (0-100)
        """
        if not self.requirement_type or not self.requirement_value:
            return 0.0

        if self.requirement_type in ["threshold", "count"]:
            progress = (value / self.requirement_value) * 100
            return min(progress, 100.0)
        elif self.requirement_type == "exact":
            return 100.0 if value == self.requirement_value else 0.0

        return 0.0

    @classmethod
    def get_available(cls, category=None, hidden=False):
        """Get available achievements.

        Args:
            category: Category filter
            hidden: Include hidden achievements

        Returns:
            list: Available achievements
        """
        query = cls.query.filter_by(is_active=True)

        if not hidden:
            query = query.filter_by(is_hidden=False)

        if category:
            query = query.filter_by(category=category)

        return query.order_by(cls.priority.desc()).all()

    @classmethod
    def get_by_requirement(cls, requirement_type):
        """Get achievements by requirement type.

        Args:
            requirement_type: Type of requirement

        Returns:
            list: Matching achievements
        """
        return cls.query.filter_by(is_active=True, requirement_type=requirement_type).all()


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
