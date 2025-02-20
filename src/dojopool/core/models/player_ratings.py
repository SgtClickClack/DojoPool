"""Model for tracking player ratings."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db
from .base import Base


class PlayerRating(Base):
    """Model for tracking player ratings."""

    __tablename__ = "player_ratings"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=1000.0)
    games_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    wins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    losses: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    streak: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_game: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    previous_rating: Mapped[Optional[float]] = mapped_column(Float)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="ratings")

    def __repr__(self) -> str:
        """String representation."""
        return f"<PlayerRating {self.user_id}: {self.rating}>"

    def update_rating(self, new_rating: float) -> None:
        """Update player rating.

        Args:
            new_rating: New rating value
        """
        self.previous_rating = self.rating
        self.rating = new_rating
        db.session.commit()

    def record_game(self, won: bool):
        """Record game result.

        Args:
            won: Whether the player won the game
        """
        self.games_played += 1
        if won:
            self.wins += 1
            self.streak = self.streak + 1 if self.streak >= 0 else 1
        else:
            self.losses += 1
            self.streak = self.streak - 1 if self.streak <= 0 else -1
        self.last_game = datetime.utcnow()
        db.session.commit()

    def get_win_rate(self) -> float:
        """Calculate win rate.

        Returns:
            Win rate as a percentage
        """
        if self.games_played == 0:
            return 0.0
        return (self.wins / self.games_played) * 100

    def get_rating_change(self):
        """Get rating change from previous rating.

        Returns:
            Rating change or None if no previous rating
        """
        if self.previous_rating is None:
            return None
        return self.rating - self.previous_rating
