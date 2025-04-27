"""Models for player story state and story events."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from .base import BaseModel

class PlayerStoryState(BaseModel):
    __tablename__ = "player_story_states"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    chapter = Column(String(100))
    quest = Column(String(200))
    flags = Column(JSON, default={})  # Arbitrary key-value flags for choices, relationships, etc.
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", backref="story_state")

    def __repr__(self):
        return f"<PlayerStoryState user={self.user_id} chapter={self.chapter}>"

class StoryEvent(BaseModel):
    __tablename__ = "story_events"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String(100))
    data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", backref="story_events")

    def __repr__(self):
        return f"<StoryEvent user={self.user_id} type={self.event_type}>"
