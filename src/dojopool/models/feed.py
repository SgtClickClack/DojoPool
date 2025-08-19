from datetime import datetime
from typing import Dict, Any
from dojopool.extensions import db
from dojopool.models.base import TimestampedModel

class FeedEntry(TimestampedModel):
    """Feed entry model for user activity feed."""
    
    __tablename__ = 'feed_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(64), nullable=False)
    content = db.Column(db.String(512), nullable=False)

    user = db.relationship('User', back_populates='feed_entries')

    def __init__(self, user_id: int, type: str, content: str):
        """Initialize a new feed entry.
        
        Args:
            user_id: The ID of the user creating the entry
            type: Type of feed entry (e.g. 'post', 'achievement', etc.)
            content: The content of the feed entry
        """
        self.user_id = user_id
        self.type = type
        self.content = content

    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        base_dict = super().to_dict()
        base_dict.update({
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'content': self.content,
        })
        return base_dict 