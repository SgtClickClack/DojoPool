"""Model for tracking player ratings."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from dojopool.core.extensions import db


class PlayerRating(db.Model):
    """Model for tracking player ratings."""

    __tablename__ = "player_ratings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False, default=1000.0)
    games_played = Column(Integer, nullable=False, default=0)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    streak = Column(Integer, nullable=False, default=0)
    last_game = Column(DateTime, nullable=False, default=datetime.utcnow)
    previous_rating = Column(Float)

    # Relationships
    user = relationship("User", back_populates="user_player_ratings")

    def __repr__(self):
        """String representation."""
        return f"<PlayerRating {self.user_id}: {self.rating}>"
