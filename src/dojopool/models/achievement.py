from flask_caching import Cache
from flask_caching import Cache
"""Achievement model module.

This module contains the Achievement model for tracking user achievements.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel, db


class Achievement(BaseModel):
    """Achievement model."""

    __tablename__: str = "achievements"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    name: Any = db.Column(db.String(100), unique=True, nullable=False)
    description: Any = db.Column(db.Text)
    category = db.Column(db.String(50))
    points: Any = db.Column(db.Integer, default=0)
    icon_url: Any = db.Column(db.String(200))
    requirements = db.Column(JSON)
    rewards: Any = db.Column(JSON)
    is_active: Any = db.Column(db.Boolean, default=True)
    created_at: Any = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at: Any = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __init__(self, **kwargs):
        """Initialize achievement."""
        super(Achievement, self).__init__(**kwargs)
        self.requirements = self.requirements or {}
        self.rewards: Any = self.rewards or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert achievement to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "points": self.points,
            "icon_url": self.icon_url,
            "requirements": self.requirements,
            "rewards": self.rewards,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    @classmethod
    def get_active_achievements(cls):
        """Get all active achievements."""
        return cls.query.filter_by(is_active=True).order_by(cls.points.desc()).all()

    @classmethod
    def get_by_category(cls, category: str, active_only: bool = True):
        """Get achievements by category."""
        query: Any = cls.query.filter_by(category=category)

        if active_only:
            query: Any = query.filter_by(is_active=True)

        return query.order_by(cls.points.desc()).all()

    @classmethod
    def create_achievement(
        cls,
        name: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        points: int = 0,
        icon_url: Optional[str] = None,
        requirements: Optional[Dict[str, Any]] = None,
        rewards: Optional[Dict[str, Any]] = None,
    ):
        """Create a new achievement."""
        achievement: cls = cls(
            name=name,
            description=description,
            category=category,
            points=points,
            icon_url=icon_url,
            requirements=requirements or {},
            rewards=rewards or {},
        )
        db.session.add(achievement)
        db.session.commit()
        return achievement

    def update_requirements(self, requirements: Dict[str, Any]) -> None:
        """Update achievement requirements."""
        self.requirements = requirements
        self.updated_at: Any = datetime.utcnow()
        db.session.commit()

    def update_rewards(self, rewards: Dict[str, Any]):
        """Update achievement rewards."""
        self.rewards: Any = rewards
        self.updated_at: Any = datetime.utcnow()
        db.session.commit()

    def activate(self):
        """Activate the achievement."""
        self.is_active: Any = True
        self.updated_at: Any = datetime.utcnow()
        db.session.commit()

    def deactivate(self):
        """Deactivate the achievement."""
        self.is_active: Any = False
        self.updated_at: Any = datetime.utcnow()
        db.session.commit()

    @classmethod
    def search_achievements(
        cls, query: str, category: Optional[str] = None, active_only: bool = True
    ) -> List["Achievement"]:
        """Search achievements by name."""
        search: Any = f"%{query}%"
        db_query: Any = cls.query.filter(cls.name.ilike(search))

        if category:
            db_query: Any = db_query.filter_by(category=category)
        if active_only:
            db_query: Any = db_query.filter_by(is_active=True)

        return db_query.order_by(cls.points.desc()).all()
