"""Player model module.

This module contains the Player model for tracking player information.
"""

from sqlalchemy import JSON
from werkzeug.security import check_password_hash, generate_password_hash

from .base import TimestampedModel, db


class Player(TimestampedModel):
    """Player model for storing player data."""

    __tablename__ = "player"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)

    # Authentication fields
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    # Profile fields
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    avatar_url = db.Column(db.String(255))

    # Game-related fields
    skill_level = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    experience_points = db.Column(db.Integer, default=0)
    rank = db.Column(db.String(50), default="beginner")

    # JSON fields
    stats = db.Column(JSON, default={})
    preferences = db.Column(JSON, default={})
    achievements = db.Column(JSON, default=[])

    # Status fields
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)

    # Relationships
    current_status = db.relationship("PlayerStatus", uselist=False, back_populates="player")

    def __init__(self, **kwargs):
        """Initialize player with default values."""
        super(Player, self).__init__(**kwargs)
        self.stats = self.stats or {
            "games_played": 0,
            "games_won": 0,
            "total_shots": 0,
            "successful_shots": 0,
            "tournaments_played": 0,
            "tournaments_won": 0,
            "highest_break": 0,
            "average_shot_time": 0,
            "tournament_matches_played": 0,
            "tournament_matches_won": 0,
            "league_matches_played": 0,
            "league_matches_won": 0,
        }
        self.preferences = self.preferences or {
            "notifications": True,
            "privacy": "public",
            "theme": "light",
            "language": "en",
        }
        self.achievements = self.achievements or []

    @property
    def password(self):
        """Prevent password from being accessed."""
        raise AttributeError("password is not a readable attribute")

    @password.setter
    def password(self, password):
        """Set password."""
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        """Check if password matches."""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert player to dictionary."""
        base_dict = super().to_dict()
        player_dict = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "avatar_url": self.avatar_url,
            "skill_level": self.skill_level,
            "experience_points": self.experience_points,
            "rank": self.rank,
            "stats": self.stats,
            "preferences": self.preferences,
            "achievements": self.achievements,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }
        return {**base_dict, **player_dict}

    def __repr__(self):
        """String representation of player."""
        return f"<Player {self.username}>"


__all__ = ["Player"]
