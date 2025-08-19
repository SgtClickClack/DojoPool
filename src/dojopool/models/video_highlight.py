"""Video highlight models module."""

from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from ..core.database import db
from .base import BaseModel


class HighlightStatus(Enum):
    """Video highlight status enumeration."""

    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class VideoHighlight(BaseModel):
    """Video highlight model."""

    __tablename__ = "video_highlights"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    tournament_id = Column(Integer, ForeignKey("tournaments.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default=HighlightStatus.PENDING.value, nullable=False)
    video_url = Column(String(255), nullable=True) # URL to the generated video
    thumbnail_url = Column(String(255), nullable=True)
    duration = Column(Integer, nullable=True) # Duration in seconds
    highlight_metadata = Column(JSON, nullable=True) # Additional highlight-specific data (e.g., key moments)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    game = relationship("Game", backref="highlights")
    tournament = relationship("Tournament", backref="highlights")
    user = relationship("User", backref="video_highlights")

    def __repr__(self):
        return f"<VideoHighlight {self.id} for Game {self.game_id}>"

    def update_status(self, status: HighlightStatus, video_url: str = None, thumbnail_url: str = None, duration: int = None, highlight_metadata: dict = None):
        """Update highlight status and details."""
        self.status = status.value
        if video_url is not None: self.video_url = video_url
        if thumbnail_url is not None: self.thumbnail_url = thumbnail_url
        if duration is not None: self.duration = duration
        if highlight_metadata is not None: self.highlight_metadata = highlight_metadata
        self.updated_at = datetime.utcnow()
        db.session.commit() 