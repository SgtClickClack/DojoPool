"""Player status model module.

This module contains the PlayerStatus model for tracking player status in games and venues.
"""

from datetime import datetime
from typing import Any, Dict

from dojopool.core.database import reference_col
from dojopool.core.extensions import db

from .base import TimestampedModel


class PlayerStatus(TimestampedModel):
    """Player status model."""

    __tablename__ = "player_status"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    player_id = reference_col("player", nullable=False)
    game_id = reference_col("games", nullable=True)
    venue_id = reference_col("venues", nullable=True)
    status = db.Column(db.String(50), nullable=False, default="offline")
    last_active = db.Column(db.DateTime, default=datetime.utcnow)
    current_activity = db.Column(db.String(100))
    is_available = db.Column(db.Boolean, default=True)
    is_busy = db.Column(db.Boolean, default=False)
    is_away = db.Column(db.Boolean, default=False)
    custom_status = db.Column(db.String(200))

    # Relationships
    player = db.relationship("Player", backref="status_history")
    game = db.relationship("Game", backref="player_statuses")
    venue = db.relationship("Venue", backref="player_statuses")

    def __init__(self, **kwargs):
        """Initialize player status."""
        super(PlayerStatus, self).__init__(**kwargs)
        self.last_active = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert player status to dictionary."""
        return {
            "id": self.id,
            "player_id": self.player_id,
            "game_id": self.game_id,
            "venue_id": self.venue_id,
            "status": self.status,
            "last_active": self.last_active.isoformat() if self.last_active else None,
            "current_activity": self.current_activity,
            "is_available": self.is_available,
            "is_busy": self.is_busy,
            "is_away": self.is_away,
            "custom_status": self.custom_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def update_status(self, status: str, activity: str = None):
        """Update player status."""
        self.status = status
        self.last_active = datetime.utcnow()
        if activity:
            self.current_activity = activity
        db.session.commit()

    def set_availability(self, available: bool):
        """Set player availability."""
        self.is_available = available
        self.last_active = datetime.utcnow()
        db.session.commit()

    def set_busy(self, busy: bool):
        """Set player busy status."""
        self.is_busy = busy
        self.last_active = datetime.utcnow()
        db.session.commit()

    def set_away(self, away: bool) -> None:
        """Set player away status."""
        self.is_away = away
        self.last_active = datetime.utcnow()
        db.session.commit()

    def set_custom_status(self, status: str):
        """Set custom status message."""
        self.custom_status = status
        self.last_active = datetime.utcnow()
        db.session.commit()
