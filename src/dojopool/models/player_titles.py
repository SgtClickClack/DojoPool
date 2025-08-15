"""Model for tracking player titles."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..extensions import db


class PlayerTitle(db.Model):
    """Model for tracking player titles."""

    __tablename__ = "player_titles"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title_name = Column(String(100), nullable=False)
    awarded_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="titles")

    def __repr__(self):
        """String representation."""
        return f"<PlayerTitle {self.user_id}: {self.title_name}>"
