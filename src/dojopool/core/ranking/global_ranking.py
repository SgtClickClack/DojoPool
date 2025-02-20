from flask_caching import Cache
import gc
from sqlalchemy.orm import joinedload
from flask_caching import Cache
import gc
from sqlalchemy.orm import joinedload
import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Callable, Dict, List, Optional, Set, Union
from uuid import UUID

from sqlalchemy import ForeignKey, or_, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...extensions import cache_service, db, db_service
from ...models.game import Game
from ...models.tournament import Tournament
from ...models.user import User
from .config import GLOBAL_RANKING_CONFIG

logger: Any = logging.getLogger(__name__)

# Global caches for ranking data.
_game_cache: Dict[str, Dict[str, Any]] = {}
_tournament_cache: Dict[str, Dict[str, Any]] = {}
_opponent_cache: Dict[str, Dict[str, Any]] = {}


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


class GlobalRankingService:
    """Service for managing global player rankings."""

    def __init__(self) -> None:
        """Initialize the ranking service."""
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
                players: Any = await db_service.execute(
                    db.select(User).filter(User.is_active == True)
                )

                new_rankings: Any = []
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
        if start_rank < 1:
            start_rank: Any = 1

        start_idx: Any = start_rank - 1
        end_idx: min = min(end_rank, len(self._rank_order))

        rankings: List[Dict[str, Any]] = []
        for idx in range(start_idx, end_idx):
            user_id: Any = self._rank_order[idx]
            entry = self._rankings[user_id]
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

    async def get_nearby_rankings(
        self, user_id: int, range_size: int = 5
    ) -> List[Dict[str, Any]]:
        """Get rankings near a specific player."""
        entry = await self.get_player_ranking(user_id)
        if not entry:
            return []

        rank: Any = entry.rank
        start_rank: Any = max(1, rank - range_size)
        end_rank: Any = rank + range_size

        return await self.get_rankings_in_range(start_rank, end_rank)

    async def get_top_rankings(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get top N rankings."""
        return await self.get_rankings_in_range(1, limit)

    async def _cache_rankings(self):
        """Cache the current rankings."""
        cache_data: Any = {
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

        await cache_service.set(
            "global_rankings", cache_data, timeout=300
        )  # Cache for 5 minutes

    async def _load_cached_rankings(self):
        """Load rankings from cache."""
        try:
            cache_data: Any = await cache_service.get("global_rankings")
            if not cache_data:
                return False

            self._rankings: Any = {
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
            print(f"Error loading cached rankings: {e}")
            return False

    def _preload_game_data(self, player_ids: List[int]):
        """Preload game data for multiple players."""
        # Get all relevant games in one query
        games: Any = (
            Game.query.filter(
                or_(Game.winner_id.in_(player_ids), Game.loser_id.in_(player_ids)),
                Game.completed_at.isnot(None),
            )
            .order_by(Game.completed_at.desc())
            .all()
        )

        # Organize games by player
        for player_id in player_ids:
            player_games: Any = [
                g for g in games if g.winner_id == player_id or g.loser_id == player_id
            ]
            self._game_cache[player_id] = player_games

    def _preload_tournament_data(self, player_ids: List[int]) -> None:
        """Preload tournament data for multiple players."""
        # Get all relevant tournaments in one query
        tournaments: Any = (
            Tournament.query.filter(
                Tournament.participants.any(User.id.in_(player_ids)),
                Tournament.end_date < datetime.now(),
            )
            .order_by(Tournament.end_date.desc())
            .all()
        )

        # Organize tournaments by player
        for player_id in player_ids:
            player_tournaments: Any = [
                t for t in tournaments if any(p.id == player_id for p in t.participants)
            ]
            self._tournament_cache[player_id] = player_tournaments

    async def _calculate_player_ranking(self, player: User):
        """Calculate complete ranking data for a player."""
        try:
            rating: Any = await self.calculate_global_rating(player.id)
            tier: Any = await self.get_player_tier(rating)

            # Calculate additional stats
            total_games: Any = await self._get_total_games(player.id)
            games_won: Any = await self._get_games_won(player.id)

            # Get tournament stats
            tournament_stats: Any = await self._get_tournament_stats(player.id)

            return {
                "user_id": player.id,
                "rating": rating,
                "tier": tier["name"],
                "tier_color": tier["color"],
                "total_games": total_games,
                "games_won": games_won,
                "win_rate": games_won / total_games if total_games > 0 else 0,
                "tournament_wins": tournament_stats["wins"],
                "tournament_placements": tournament_stats["placements"],
            }
        except Exception as e:
            logger.error(f"Error calculating ranking for player {player.id}: {str(e)}")
            return None

    async def _get_tournament_stats(self, user_id: int) -> Dict[str, Any]:
        """Get tournament statistics for user."""
        try:
            tournaments: Any = await db_service.execute(
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

    def calculate_global_rating_sync(self, user_id: int):
        """Synchronous version of calculate_global_rating."""
        try:
            # Get base stats
            games_won: Any = self._get_games_won(user_id)
            total_games: Any = self._get_total_games(user_id)
            if total_games == 0:
                return self.config["initial_rating"]

            # Calculate components
            win_rate: Any = self._calculate_win_rate(user_id)
            tournament_perf: Any = self._calculate_tournament_performance(user_id)
            opponent_strength: Any = self._calculate_opponent_strength(user_id)
            activity_score: Any = self._calculate_activity_score(user_id)

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

    def get_player_tier_sync(self, rating: float):
        """Synchronous version of get_player_tier."""
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

    async def _calculate_win_rate(self, user_id: int) -> float:
        """Calculate player's win rate using cached data."""
        try:
            games: Any = await db_service.execute(
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
            tournaments: Any = await db_service.execute(
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
            games: Any = await db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
            )
            games_list: list = list(games.scalars())
            if not games_list:
                return 0.0

            total_opponent_rating: Any = 0.0
            for game in games_list:
                opponent_id: Any = (
                    game.loser_id if game.winner_id == user_id else game.winner_id
                )
                opponent: Any = await db_service.execute(
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
            recent_games: Any = await db_service.execute(
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
            games: Any = await db_service.execute(
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
            games: Any = await db_service.execute(
                db.select(Game).filter(
                    (Game.winner_id == user_id) | (Game.loser_id == user_id),
                    Game.completed_at.isnot(None),
                )
            )
            return len(list(games.scalars()))
        except Exception as e:
            logger.error(f"Error getting total games for user {user_id}: {e}")
            return 0

    async def _update_rankings_in_db(self, rankings: List[Dict]):
        """Update rankings in database using bulk operations."""
        try:
            async with db_service.begin() as session:
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
                    user_obj.global_rank: Any = rank
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
                        user_obj.highest_rank: Any = rank
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

    def get_rankings_in_range(self, start_rank: int, end_rank: int) -> List[Dict]:
        """Get rankings for a specific range."""
        rankings: Any = cache_service.get("global_rankings")
        if not rankings:
            self.update_global_rankings()
            rankings: Any = cache_service.get("global_rankings")

        return rankings[start_rank - 1 : end_rank]

    def get_player_ranking_details(self, user_id: int) -> Optional[Dict]:
        """Get detailed ranking information for a player."""
        rankings: Any = cache_service.get("global_rankings")
        if not rankings:
            self.update_global_rankings()
            rankings: Any = cache_service.get("global_rankings")

        for rank, player in enumerate(rankings, 1):
            if player["user_id"] == user_id:
                # Get additional stats
                total_games: Any = self._get_total_games(user_id)
                games_won: Any = self._get_games_won(user_id)
                tournament_stats: Any = self._get_tournament_stats(user_id)
                performance_metrics = self._calculate_performance_metrics(user_id)

                return {
                    **player,
                    "rank": rank,
                    "total_games": total_games,
                    "games_won": games_won,
                    "win_rate": games_won / total_games if total_games > 0 else 0,
                    "tournament_wins": tournament_stats["wins"],
                    "tournament_placements": tournament_stats["placements"],
                    "performance_metrics": performance_metrics,
                }

        return None

    def get_cached_rating(self, user_id: int) -> Optional[float]:
        """Get player's cached rating."""
        cache_key: Any = f"player_rating:{user_id}"
        return cache_service.get(cache_key)

    def _calculate_performance_metrics(self, user_id: int):
        """Calculate detailed performance metrics for a player."""
        games: Any = self._game_cache.get(user_id, [])
        tournaments: Any = self._tournament_cache.get(user_id, [])

        # Calculate accuracy (based on win rate and game performance)
        total_games: Any = len(games)
        if total_games == 0:
            return {"accuracy": 0.0, "consistency": 0.0, "speed": 0.0, "strategy": 0.0}

        wins: sum = sum(1 for game in games if game.winner_id == user_id)
        accuracy = wins / total_games

        # Calculate consistency (based on performance variation)
        recent_games: Any = [
            g for g in games if g.completed_at > (datetime.now() - timedelta(days=30))
        ]
        consistency: Any = (
            len(recent_games) / 20.0
        )  # 20 games per month is considered fully consistent
        consistency: Any = min(1.0, consistency)

        # Calculate speed (based on game duration and response time)
        speed_score: float = 0.0
        speed_games: Any = [g for g in games if hasattr(g, "duration")]
        if speed_games:
            avg_duration: Any = sum(g.duration for g in speed_games) / len(speed_games)
            speed_score: float = 1.0 - min(
                1.0, avg_duration / 3600
            )  # Normalize to 1 hour

        # Calculate strategy (based on tournament performance and opponent strength)
        strategy_score: float = 0.0
        if tournaments:
            tournament_placements: List[Any] = [
                t.get_player_placement(user_id) for t in tournaments
            ]
            avg_placement: Any = sum(p for p in tournament_placements if p) / len(
                tournament_placements
            )
            strategy_score: float = 1.0 - min(
                1.0, (avg_placement - 1) / 10
            )  # Normalize to top 10

        return {
            "accuracy": accuracy,
            "consistency": consistency,
            "speed": speed_score,
            "strategy": strategy_score,
        }


def calculate_ranking(game_data: Dict[str, Any]) -> float:
    """
    Calculate ranking from game data.
    """
    return float(game_data.get("score", 0))


def get_rankings_in_range(start: int, end: int):
    """
    Retrieves a slice of rankings from the global cache.
    """
    rankings: List[Dict[str, Any]] = list(_game_cache.values())
    return rankings[start:end]


async def refresh_global_rankings():
    """
    Simulate a refresh of the global rankings.
    """
    await asyncio.sleep(0.1)
    _game_cache.clear()
    _tournament_cache.clear()
    # Populate with dummy data.
    _game_cache["player1"] = {
        "player_id": "player1",
        "score": 95,
        "last_update": datetime.utcnow(),
    }
    _game_cache["player2"] = {"player_id": "player2", "score": 85, "last_update": None}
    _tournament_cache["tournament1"] = {"ranking": 1, "last_update": datetime.utcnow()}


def get_global_ranking(player_id: str):
    """
    Get the global ranking for a specific player.
    """
    data: Any = _game_cache.get(player_id)
    if data is None:
        return None
    return calculate_ranking(data)


def sorted_rankings(key: Callable[[Dict[str, Any]], float]) -> List[Dict[str, Any]]:
    """
    Sorts the global rankings using a key function that returns a float.
    """
    rankings: List[Dict[str, Any]] = list(_game_cache.values())
    return sorted(rankings, key=key)


async def async_get_leading_player():
    """
    Asynchronously determines the leading player based on the score.
    """
    await refresh_global_rankings()
    sorted_rks = sorted_rankings(lambda data: float(data.get("score", 0)))
    if sorted_rks:
        return sorted_rks[-1].get("player_id")
    return None


async def get_recent_tournament_update_iso() -> Optional[str]:
    """
    Asynchronously retrieves the most recent tournament update as an ISO string.
    """
    await refresh_global_rankings()
    for tour in _tournament_cache.values():
        last_update = tour.get("last_update")
        if last_update is not None:
            return last_update.isoformat()
    return None


def get_some_integer():
    """
    Dummy example function returning an integer.

    Returns:
        int: Example integer.
    """
    return 42
