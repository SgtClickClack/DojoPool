from sqlalchemy.orm import joinedload
from sqlalchemy.orm import joinedload
"""Ranking service implementation."""

import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey, or_, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...extensions import cache_service as default_cache_service
from ...extensions import db
from ...extensions import db_service as default_db_service
from ...models.game import Game
from ...models.tournament import Tournament
from ...models.user import User
from .config import GLOBAL_RANKING_CONFIG

logger: Any = logging.getLogger(__name__)


@dataclass
class RankingEntry:
    """Represents a player's ranking entry."""

    user_id: int
    rating: float
    rank: int
    change_24h: float
    games_played: int
    wins: int
    losses: int
    streak: int
    last_game: datetime
    title: Optional[str]


class RankingService:
    """Service for managing player rankings."""

    def __init__(self, db_service=None, cache_service=None) -> None:
        """Initialize the ranking service with optional service overrides.

        Args:
            db_service: Optional database service override for testing
            cache_service: Optional cache service override for testing
        """
        self.db_service = db_service or default_db_service
        self.cache_service = cache_service or default_cache_service
        self.config = GLOBAL_RANKING_CONFIG
        self.last_update = datetime.now() - self.config["update_frequency"]
        self._rankings: Dict[int, RankingEntry] = {}
        self._rank_order: List[int] = []
        self._update_lock = asyncio.Lock()
        self._cache_lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Initialize the service and load cached data."""
        try:
            await self._load_cached_rankings()
        except Exception as e:
            logger.error(f"Failed to initialize ranking service: {e}")
            raise

    async def calculate_global_rating(self, user_id: int):
        """Calculate global rating for a user."""
        try:
            async with self._cache_lock:
                # Get base stats
                games_won: Any = await self._get_games_won(user_id)
                total_games: Any = await self._get_total_games(user_id)
                if total_games == 0:
                    return self.config["initial_rating"]

                # Calculate components
                win_rate: Any = await self._calculate_win_rate(user_id)
                tournament_perf: Any = await self._calculate_tournament_performance(
                    user_id
                )
                opponent_strength: Any = await self._calculate_opponent_strength(
                    user_id
                )
                activity_score: Any = await self._calculate_activity_score(user_id)

                # Weighted calculation
                rating: Any = (
                    win_rate * self.config["win_rate_weight"]
                    + tournament_perf * self.config["tournament_weight"]
                    + opponent_strength * self.config["opponent_weight"]
                    + activity_score * self.config["activity_weight"]
                )

                return max(rating, self.config["minimum_rating"])
        except Exception as e:
            logger.error(f"Error calculating global rating for user {user_id}: {e}")
            return self.config["initial_rating"]

    async def get_player_tier(self, rating: float):
        """Get player tier based on rating."""
        try:
            tiers: Any = self.config["tiers"]
            for tier in tiers:
                if rating >= tier["min_rating"]:
                    return {
                        "name": tier["name"],
                        "icon": tier["icon"],
                        "color": tier["color"],
                        "min_rating": tier["min_rating"],
                    }
            return tiers[-1]  # Return lowest tier if no match
        except Exception as e:
            logger.error(f"Error getting player tier for rating {rating}: {e}")
            return self.config["tiers"][-1]

    async def update_global_rankings(self) -> None:
        """Update global rankings for all players."""
        try:
            async with self._update_lock:
                if (datetime.now() - self.last_update) < self.config[
                    "update_frequency"
                ]:
                    return

                # Get all active players
                players: Any = await self.db_service.execute(
                    db.select(User).filter(User.is_active == True)
                )

                new_rankings: List[Any] = []
                for player in players.scalars():
                    try:
                        rating: Any = await self.calculate_global_rating(player.id)
                        new_rankings.append(
                            {
                                "user_id": player.id,
                                "rating": rating,
                                "last_updated": datetime.now(),
                            }
                        )
                    except Exception as e:
                        logger.error(
                            f"Error updating ranking for player {player.id}: {e}"
                        )
                        continue

                # Sort and assign ranks
                new_rankings.sort(key=lambda x: x["rating"], reverse=True)
                for rank, entry in enumerate(new_rankings, 1):
                    entry["rank"] = rank

                # Update database in transaction
                try:
                    await self._update_rankings_in_db(new_rankings)
                except SQLAlchemyError as e:
                    logger.error(f"Database error updating rankings: {e}")
                    raise

                self.last_update = datetime.now()
                await self._cache_rankings()
        except Exception as e:
            logger.error(f"Error in update_global_rankings: {e}")
            raise

    async def get_player_ranking(self, user_id: int) -> Optional[RankingEntry]:
        """Get a player's current ranking entry."""
        return self._rankings.get(user_id)

    async def get_rankings_in_range(self, start_rank: int, end_rank: int):
        """Get rankings for a specific range."""
        try:
            if start_rank < 1:
                start_rank = 1

            start_idx: Any = start_rank - 1
            end_idx: min = min(end_rank, len(self._rank_order))

            rankings: List[Dict[str, Any]] = []
            for idx in range(start_idx, end_idx):
                user_id: Any = self._rank_order[idx]
                entry: Any = self._rankings[user_id]
                rankings.append(
                    {
                        "user_id": entry.user_id,
                        "rating": entry.rating,
                        "rank": entry.rank,
                        "change_24h": entry.change_24h,
                        "games_played": entry.games_played,
                        "wins": entry.wins,
                        "losses": entry.losses,
                        "streak": entry.streak,
                        "last_game": entry.last_game.isoformat(),
                        "title": entry.title,
                    }
                )

            return rankings
        except Exception as e:
            logger.error(
                f"Error getting rankings in range {start_rank}-{end_rank}: {e}"
            )
            return []

    async def get_player_ranking_details(
        self, user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get detailed ranking information for a player."""
        try:
            entry: Any = await self.get_player_ranking(user_id)
            if not entry:
                return None

            # Get additional stats
            total_games: Any = await self._get_total_games(user_id)
            games_won: Any = await self._get_games_won(user_id)
            tournament_stats: Any = await self._get_tournament_stats(user_id)

            # Calculate performance metrics
            performance_metrics = await self._calculate_performance_metrics(user_id)

            return {
                "user_id": entry.user_id,
                "rating": entry.rating,
                "rank": entry.rank,
                "change_24h": entry.change_24h,
                "games_played": total_games,
                "games_won": games_won,
                "win_rate": games_won / total_games if total_games > 0 else 0,
                "tournament_wins": tournament_stats["wins"],
                "tournament_placements": tournament_stats["placements"],
                "performance_metrics": performance_metrics,
            }
        except Exception as e:
            logger.error(f"Error getting ranking details for user {user_id}: {e}")
            return None

    async def _calculate_win_rate(self, user_id: int) -> float:
        """Calculate player's win rate."""
        try:
            games: Any = await self.db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
            )
            games_list: list = list(games.scalars())
            if not games_list:
                return 0.0

            wins: sum = sum(1 for game in games_list if game.winner_id == user_id)
            return wins / len(games_list)
        except Exception as e:
            logger.error(f"Error calculating win rate for user {user_id}: {e}")
            return 0.0

    async def _calculate_tournament_performance(self, user_id: int):
        """Calculate tournament performance score."""
        try:
            tournaments: Any = await self.db_service.execute(
                db.select(Tournament).filter(
                    Tournament.participants.any(User.id == user_id),
                    Tournament.end_date < datetime.now(),
                )
            )
            tournament_list: list = list(tournaments.scalars())
            if not tournament_list:
                return 0.0

            total_score: float = 0.0
            for tournament in tournament_list:
                placement = tournament.get_player_placement(user_id)
                if placement:
                    # Score based on placement (1st = 1.0, 2nd = 0.8, 3rd = 0.6, etc.)
                    total_score += max(0.0, 1.0 - ((placement - 1) * 0.2))

            return total_score / len(tournament_list)
        except Exception as e:
            logger.error(
                f"Error calculating tournament performance for user {user_id}: {e}"
            )
            return 0.0

    async def _calculate_opponent_strength(self, user_id: int) -> float:
        """Calculate average opponent strength."""
        try:
            games: Any = await self.db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
            )
            games_list: list = list(games.scalars())
            if not games_list:
                return 0.0

            total_opponent_rating: float = 0.0
            for game in games_list:
                opponent_id: Any = (
                    game.loser_id if game.winner_id == user_id else game.winner_id
                )
                opponent: Any = await self.db_service.execute(
                    db.select(User).filter(User.id == opponent_id)
                )
                opponent_obj: Any = opponent.scalar_one_or_none()
                if opponent_obj:
                    total_opponent_rating += opponent_obj.global_rating or 1000.0

            return (
                total_opponent_rating / len(games_list)
            ) / 3000.0  # Normalize to 0-1
        except Exception as e:
            logger.error(f"Error calculating opponent strength for user {user_id}: {e}")
            return 0.0

    async def _calculate_activity_score(self, user_id: int) -> float:
        """Calculate activity score based on recent games."""
        try:
            recent_games: Any = await self.db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at > (datetime.now() - timedelta(days=30)),
                )
            )
            games_count: len = len(list(recent_games.scalars()))
            return min(1.0, games_count / 20.0)  # Max score at 20 games/month
        except Exception as e:
            logger.error(f"Error calculating activity score for user {user_id}: {e}")
            return 0.0

    async def _get_games_won(self, user_id: int) -> int:
        """Get total number of games won by user."""
        try:
            games: Any = await self.db_service.execute(
                db.select(Game).filter(
                    Game.winner_id == user_id, Game.completed_at.isnot(None)
                )
            )
            return len(list(games.scalars()))
        except Exception as e:
            logger.error(f"Error getting games won for user {user_id}: {e}")
            return 0

    async def _get_total_games(self, user_id: int):
        """Get total number of completed games."""
        try:
            games: Any = await self.db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
            )
            return len(list(games.scalars()))
        except Exception as e:
            logger.error(f"Error getting total games for user {user_id}: {e}")
            return 0

    async def _get_tournament_stats(self, user_id: int):
        """Get tournament statistics for user."""
        try:
            tournaments: Any = await self.db_service.execute(
                db.select(Tournament).filter(
                    Tournament.participants.any(User.id == user_id),
                    Tournament.end_date < datetime.now(),
                )
            )
            tournament_list: list = list(tournaments.scalars())

            wins: sum = 0
            placements: List[Any] = []

            for tournament in tournament_list:
                placement = tournament.get_player_placement(user_id)
                if placement:
                    placements.append(
                        {
                            "tournament_id": tournament.id,
                            "name": tournament.name,
                            "date": tournament.end_date.isoformat(),
                            "placement": placement,
                        }
                    )
                    if placement == 1:
                        wins += 1

            return {
                "wins": wins,
                "placements": sorted(placements, key=lambda x: x["date"], reverse=True)[
                    :10
                ],  # Keep last 10
            }
        except Exception as e:
            logger.error(f"Error getting tournament stats for user {user_id}: {e}")
            return {"wins": 0, "placements": []}

    async def _calculate_performance_metrics(self, user_id: int):
        """Calculate detailed performance metrics for a player."""
        try:
            # Get recent games
            games: Any = await self.db_service.execute(
                db.select(Game)
                .filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
                .order_by(Game.completed_at.desc())
            )
            games_list: list = list(games.scalars())

            if not games_list:
                return {
                    "accuracy": 0.0,
                    "consistency": 0.0,
                    "speed": 0.0,
                    "strategy": 0.0,
                }

            # Calculate accuracy (based on win rate)
            wins: sum = sum(1 for game in games_list if game.winner_id == user_id)
            accuracy: Any = wins / len(games_list)

            # Calculate consistency (based on recent games)
            recent_games: Any = [
                g
                for g in games_list
                if g.completed_at > (datetime.now() - timedelta(days=30))
            ]
            consistency: Any = (
                len(recent_games) / 20.0
            )  # 20 games per month is considered fully consistent
            consistency: Any = min(1.0, consistency)

            # Calculate speed (based on game duration)
            speed_games: Any = [g for g in games_list if hasattr(g, "duration")]
            if speed_games:
                avg_duration: Any = sum(g.duration for g in speed_games) / len(
                    speed_games
                )
                speed_score: Any = 1.0 - min(
                    1.0, avg_duration / 3600
                )  # Normalize to 1 hour
            else:
                speed_score: Any = 0.0

            # Calculate strategy (based on tournament performance)
            tournaments: Any = await self.db_service.execute(
                db.select(Tournament).filter(
                    Tournament.participants.any(User.id == user_id),
                    Tournament.end_date < datetime.now(),
                )
            )
            tournament_list: list = list(tournaments.scalars())

            if tournament_list:
                tournament_placements: List[Any] = [
                    t.get_player_placement(user_id) for t in tournament_list
                ]
                valid_placements: List[Any] = [
                    p for p in tournament_placements if p is not None
                ]
                if valid_placements:
                    avg_placement = sum(valid_placements) / len(valid_placements)
                    strategy_score: float = 1.0 - min(
                        1.0, (avg_placement - 1) / 10
                    )  # Normalize to top 10
                else:
                    strategy_score: float = 0.0
            else:
                strategy_score: float = 0.0

            return {
                "accuracy": accuracy,
                "consistency": consistency,
                "speed": speed_score,
                "strategy": strategy_score,
            }
        except Exception as e:
            logger.error(
                f"Error calculating performance metrics for user {user_id}: {e}"
            )
            return {"accuracy": 0.0, "consistency": 0.0, "speed": 0.0, "strategy": 0.0}

    async def _update_rankings_in_db(self, rankings: List[Dict]) -> None:
        """Update rankings in database using bulk operations."""
        try:
            async with self.db_service.begin() as session:
                for rank, player_data in enumerate(rankings, 1):
                    user_id: Any = player_data["user_id"]
                    user: Any = await session.execute(
                        db.select(User).filter(User.id == user_id)
                    )
                    user_obj = user.scalar_one_or_none()
                    if not user_obj:
                        continue

                    old_rank: Any = user_obj.global_rank or rank
                    old_rating: Any = user_obj.global_rating or 1000.0

                    # Update user data
                    user_obj.global_rating: Any = player_data["rating"]
                    user_obj.global_rank = rank
                    user_obj.rank_updated_at = datetime.now()
                    user_obj.rank_movement = old_rank - rank

                    # Update highest achievements
                    if (
                        not user_obj.highest_rating
                        or player_data["rating"] > user_obj.highest_rating
                    ):
                        user_obj.highest_rating: Any = player_data["rating"]
                        user_obj.highest_rating_date = datetime.now()

                    if not user_obj.highest_rank or rank < user_obj.highest_rank:
                        user_obj.highest_rank = rank
                        user_obj.highest_rank_date = datetime.now()

                    # Update streak
                    if player_data["rating"] > old_rating:
                        if user_obj.rank_streak_type == "win":
                            user_obj.rank_streak += 1
                        else:
                            user_obj.rank_streak = 1
                            user_obj.rank_streak_type = "win"
                    else:
                        if user_obj.rank_streak_type == "loss":
                            user_obj.rank_streak += 1
                        else:
                            user_obj.rank_streak = 1
                            user_obj.rank_streak_type = "loss"

                    session.add(user_obj)

        except Exception as e:
            logger.error(f"Error updating rankings in database: {e}")
            raise

    async def _cache_rankings(self) -> None:
        """Cache the current rankings."""
        cache_data: Dict[Any, Any] = {
            "rankings": {
                user_id: {
                    "user_id": entry.user_id,
                    "rating": entry.rating,
                    "rank": entry.rank,
                    "change_24h": entry.change_24h,
                    "games_played": entry.games_played,
                    "wins": entry.wins,
                    "losses": entry.losses,
                    "streak": entry.streak,
                    "last_game": entry.last_game.isoformat(),
                    "title": entry.title,
                }
                for user_id, entry in self._rankings.items()
            },
            "rank_order": self._rank_order,
            "last_update": self.last_update.isoformat() if self.last_update else None,
        }

        await self.cache_service.set(
            "global_rankings", cache_data, timeout=300
        )  # Cache for 5 minutes

    async def _load_cached_rankings(self):
        """Load rankings from cache."""
        try:
            cache_data: Dict[Any, Any] = await self.cache_service.get("global_rankings")
            if not cache_data:
                return False

            self._rankings = {
                int(user_id): RankingEntry(
                    user_id=data["user_id"],
                    rating=data["rating"],
                    rank=data["rank"],
                    change_24h=data["change_24h"],
                    games_played=data["games_played"],
                    wins=data["wins"],
                    losses=data["losses"],
                    streak=data["streak"],
                    last_game=datetime.fromisoformat(data["last_game"]),
                    title=data["title"],
                )
                for user_id, data in cache_data["rankings"].items()
            }

            self._rank_order = [int(user_id) for user_id in cache_data["rank_order"]]
            self.last_update = (
                datetime.fromisoformat(cache_data["last_update"])
                if cache_data["last_update"]
                else None
            )

            return True

        except Exception as e:
            logger.error(f"Error loading cached rankings: {e}")
            return False
