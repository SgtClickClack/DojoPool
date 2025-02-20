"""Model for tracking player ranking history."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db


class RankingHistory(Base):
    """Model for tracking player ranking history."""

    __tablename__: str = "ranking_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    rating: Mapped[float] = mapped_column(Float, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    games_played: Mapped[int] = mapped_column(Integer, nullable=False)
    wins: Mapped[int] = mapped_column(Integer, nullable=False)
    losses: Mapped[int] = mapped_column(Integer, nullable=False)
    streak: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    # Relationships
    user: relationship = relationship("User", backref="ranking_history")

    def to_dict(self) -> Dict[str, Any]:
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
