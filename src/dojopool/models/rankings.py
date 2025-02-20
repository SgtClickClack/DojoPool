from flask_caching import Cache
from flask_caching import Cache
"""Rankings models for DojoPool."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from .user import User


class PlayerRank(Base):
    """Player ranking model."""

    __tablename__: str = "player_ranks"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    rating: Mapped[int] = mapped_column(default=1000)
    rank_tier: Mapped[str] = mapped_column(String(50))  # Bronze, Silver, Gold, etc.
    tier_progress: Mapped[int] = mapped_column(default=0)  # 0-100
    peak_rating: Mapped[int] = mapped_column(default=1000)
    games_played: Mapped[int] = mapped_column(default=0)
    win_streak: Mapped[int] = mapped_column(default=0)
    best_win_streak: Mapped[int] = mapped_column(default=0)
    season_wins: Mapped[int] = mapped_column(default=0)
    season_losses: Mapped[int] = mapped_column(default=0)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: relationship = relationship(User, back_populates="rank", lazy="select")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"{self.user.username}'s Rank"

    def update_rating(self, new_rating: int):
        """Update player's rating and related stats."""
        self.rating = new_rating
        if new_rating > self.peak_rating:
            self.peak_rating = new_rating
        self._update_tier()
        db.session.commit()

    def _update_tier(self) -> None:
        """Update player's tier based on rating."""
        if self.rating < 1100:
            self.rank_tier = "Bronze"
            self.tier_progress = (self.rating - 1000) // 2
        elif self.rating < 1300:
            self.rank_tier = "Silver"
            self.tier_progress = (self.rating - 1100) // 4
        elif self.rating < 1600:
            self.rank_tier = "Gold"
            self.tier_progress = (self.rating - 1300) // 6
        elif self.rating < 2000:
            self.rank_tier = "Platinum"
            self.tier_progress = (self.rating - 1600) // 8
        else:
            self.rank_tier = "Diamond"
            self.tier_progress = min(100, (self.rating - 2000) // 10)


class SeasonStats(Base):
    """Season statistics model."""

    __tablename__: str = "season_stats"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    season: Mapped[int] = mapped_column()
    games_played: Mapped[int] = mapped_column(default=0)
    wins: Mapped[int] = mapped_column(default=0)
    losses: Mapped[int] = mapped_column(default=0)
    peak_rating: Mapped[int] = mapped_column()
    final_rating: Mapped[int] = mapped_column()
    best_win_streak: Mapped[int] = mapped_column(default=0)
    achievements_earned: Mapped[int] = mapped_column(default=0)
    tournament_wins: Mapped[int] = mapped_column(default=0)
    perfect_games: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    user: relationship = relationship(
        User, back_populates="season_stats", lazy="select"
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"{self.user.username}'s Season {self.season} Stats"

    def calculate_win_rate(self):
        """Calculate win rate percentage."""
        if self.games_played == 0:
            return 0.0
        return (self.wins / self.games_played) * 100


class LeaderboardSnapshot(Base):
    """Leaderboard snapshot model."""

    __tablename__: str = "leaderboard_snapshots"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    season: Mapped[int] = mapped_column()
    snapshot_type: Mapped[str] = mapped_column(String(50))  # daily, weekly, season_end
    data: Mapped[Dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    def __repr__(self):
        """Return string representation."""
        return f"{self.snapshot_type} Leaderboard - Season {self.season}"

    @classmethod
    def create_snapshot(cls, season: int, snapshot_type: str) -> "LeaderboardSnapshot":
        """Create a new leaderboard snapshot."""
        top_players: Any = (
            PlayerRank.query.order_by(PlayerRank.rating.desc()).limit(100).all()
        )

        data: Dict[Any, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "rankings": [
                {
                    "username": rank.user.username,
                    "rating": rank.rating,
                    "tier": rank.rank_tier,
                    "games_played": rank.games_played,
                    "win_streak": rank.win_streak,
                }
                for rank in top_players
            ],
        }

        snapshot: cls = cls(season=season, snapshot_type=snapshot_type, data=data)
        db.session.add(snapshot)
        db.session.commit()
        return snapshot


class PlayerAnalytics(Base):
    """Player analytics model."""

    __tablename__: str = "player_analytics"
    __table_args__ = {"extend_existing": True}

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    avg_shot_accuracy: Mapped[float] = mapped_column(default=0.0)
    avg_position_play: Mapped[float] = mapped_column(default=0.0)
    avg_shot_difficulty: Mapped[float] = mapped_column(default=0.0)
    favorite_game_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    peak_performance_time: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    common_opponents: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    performance_history: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON, default=list
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: relationship = relationship(User, back_populates="analytics", lazy="select")

    def __repr__(self):
        """Return string representation."""
        return f"{self.user.username}'s Analytics"

    def update_stats(self, game_stats: Dict[str, Any]):
        """Update player's analytics with new game data."""
        # Update rolling averages
        games_played: Any = self.user.rank.games_played
        weight: Any = 1 / (games_played + 1)

        self.avg_shot_accuracy = (
            self.avg_shot_accuracy * (1 - weight) + game_stats["accuracy"] * weight
        )

        self.avg_position_play = (
            self.avg_position_play * (1 - weight) + game_stats["position_play"] * weight
        )

        self.avg_shot_difficulty = (
            self.avg_shot_difficulty * (1 - weight)
            + game_stats["shot_difficulty"] * weight
        )

        # Update performance history
        self.performance_history.append(
            {"timestamp": datetime.utcnow().isoformat(), "stats": game_stats}
        )

        # Keep only last 100 games in history
        if len(self.performance_history) > 100:
            self.performance_history = self.performance_history[-100:]

        db.session.commit()

    def get_performance_trends(self) -> Dict[str, Any]:
        """Calculate performance trends over time."""
        if not self.performance_history:
            return {}

        recent_games = self.performance_history[-10:]
        older_games: Any = self.performance_history[-20:-10]

        if not older_games:
            return {}

        recent_avg: Dict[Any, Any] = {
            "accuracy": sum(g["stats"]["accuracy"] for g in recent_games)
            / len(recent_games),
            "position_play": sum(g["stats"]["position_play"] for g in recent_games)
            / len(recent_games),
            "shot_difficulty": sum(g["stats"]["shot_difficulty"] for g in recent_games)
            / len(recent_games),
        }

        older_avg: Dict[Any, Any] = {
            "accuracy": sum(g["stats"]["accuracy"] for g in older_games)
            / len(older_games),
            "position_play": sum(g["stats"]["position_play"] for g in older_games)
            / len(older_games),
            "shot_difficulty": sum(g["stats"]["shot_difficulty"] for g in older_games)
            / len(older_games),
        }

        return {
            "accuracy_trend": recent_avg["accuracy"] - older_avg["accuracy"],
            "position_trend": recent_avg["position_play"] - older_avg["position_play"],
            "difficulty_trend": recent_avg["shot_difficulty"]
            - older_avg["shot_difficulty"],
        }
