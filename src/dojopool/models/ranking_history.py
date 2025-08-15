"""Model for tracking player ranking history."""

from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from dojopool.extensions import db


class RankingHistory(db.Model):
    """Model for tracking player ranking history."""

    __tablename__ = "ranking_history"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    games_played = Column(Integer, nullable=False)
    wins = Column(Integer, nullable=False)
    losses = Column(Integer, nullable=False)
    streak = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="ranking_history")

    def to_dict(self):
        """Convert ranking history to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "rating": self.rating,
            "rank": self.rank,
            "games_played": self.games_played,
            "wins": self.wins,
            "losses": self.losses,
            "streak": self.streak,
            "timestamp": self.timestamp.isoformat(),
        }

    def __repr__(self):
        """String representation."""
        return f"<RankingHistory {self.user_id}: {self.rating} at {self.timestamp}>"
