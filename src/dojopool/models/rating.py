"""Rating model module."""

from sqlalchemy import JSON, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from ..core.mixins import TimestampMixin


class Rating(TimestampMixin, db.Model):
    """Model for user skill ratings."""

    __tablename__ = "ratings"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # elo, glicko, trueskill, etc.
    value: Mapped[float] = mapped_column(Float, nullable=False)
    uncertainty: Mapped[float] = mapped_column(
        Float
    )  # For rating systems with uncertainty (e.g., Glicko-2)
    volatility: Mapped[float] = mapped_column(
        Float
    )  # For rating systems with volatility
    games_played: Mapped[int] = mapped_column(Integer, default=0)
    last_game_id: Mapped[int] = mapped_column(ForeignKey("games.id"))

    # Additional rating data stored as JSON
    data: Mapped[dict] = mapped_column(JSON)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="ratings")
    last_game: Mapped["Game"] = relationship("Game", back_populates="ratings")
