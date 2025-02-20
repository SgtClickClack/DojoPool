"""
VenueLeaderboard Model Module

This module defines the VenueLeaderboard model for tracking venue-specific leaderboards.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.models.base import BaseModel

if TYPE_CHECKING:
    from .user import User
    from .venue import Venue


class VenueLeaderboard(BaseModel):
    """Venue leaderboard model."""

    __tablename__: str = "venue_leaderboards"
    __table_args__ = {"extend_existing": True}

    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    last_updated: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    highest_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    venue: Mapped["Venue"] = relationship("Venue", back_populates="leaderboards")
    user: Mapped["User"] = relationship("User", back_populates="venue_rankings")

    def __repr__(self) -> str:
        """Return string representation of the leaderboard entry."""
        return f"<VenueLeaderboard {self.venue_id}:{self.user_id}>"

    @property
    def win_rate(self) -> float:
        """Calculate win rate."""
        if self.games_played == 0:
            return 0.0
        return (self.wins / self.games_played) * 100

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        base_dict = super().to_dict()
        leaderboard_dict = {
            "venue_id": self.venue_id,
            "user_id": self.user_id,
            "score": self.score,
            "rank": self.rank,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "rating": self.rating,
            "games_played": self.games_played,
            "wins": self.wins,
            "losses": self.losses,
            "streak": self.streak,
            "highest_rating": self.highest_rating,
            "win_rate": self.win_rate,
        }
        return {**base_dict, **leaderboard_dict}
