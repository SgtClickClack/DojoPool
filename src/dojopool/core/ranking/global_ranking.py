from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any, cast
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import asyncio
from dataclasses import dataclass

from sqlalchemy import or_, func, text
from .config import GLOBAL_RANKING_CONFIG
from ...models.user import User
from ...models.game import Game
from ...models.tournament import Tournament
from ...extensions import db, cache_service, db_service

logger = logging.getLogger(__name__)


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
        self.config = GLOBAL_RANKING_CONFIG
        self.last_update = datetime.now() - self.config["update_frequency"]
        self._game_cache = {}
        self._tournament_cache = {}
        self._opponent_cache = {}
        self._rankings: Dict[int, RankingEntry] = {}  # user_id -> RankingEntry
        self._rank_order: List[int] = []  # Ordered list of user_ids by rank
        self._update_lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Initialize the ranking service by loading cached data or updating rankings."""
        if not await self._load_cached_rankings():
            await self.update_global_rankings()

    def calculate_global_rating(self, user_id: int) -> float:
        """Calculate a player's global rating based on multiple factors."""
        weights = self.config["ranking_weights"]

        # Get base stats using cached data
        win_rate = self._calculate_win_rate(user_id)
        tournament_score = self._calculate_tournament_performance(user_id)
        opponent_strength = self._calculate_opponent_strength(user_id)
        activity_score = self._calculate_activity_score(user_id)

        # Calculate weighted score
        rating = (
            win_rate * weights["win_rate"]
            + tournament_score * weights["tournament_performance"]
            + opponent_strength * weights["opponent_strength"]
            + activity_score * weights["activity_level"]
        ) * 1000  # Scale to rating range

        return max(0, min(3000, rating))  # Clamp between 0-3000

    def get_player_tier(self, rating: float) -> Dict:
        """Get player's tier based on their rating."""
        for tier in self.config["tiers"]:
            if rating >= tier["min_rating"]:
                return tier
        return self.config["tiers"][-1]  # Return lowest tier if no match

    async def update_global_rankings(self) -> None:
        """Update global rankings based on recent games."""
        async with self._update_lock:
            try:
                # Get all player ratings from database
                query = text(
                    """
                    SELECT 
                        u.id,
                        pr.rating,
                        pr.games_played,
                        pr.wins,
                        pr.losses,
                        pr.streak,
                        pr.last_game,
                        pr.previous_rating,
                        t.title_name
                    FROM users u
                    JOIN player_ratings pr ON u.id = pr.user_id
                    LEFT JOIN player_titles t ON u.id = t.user_id
                    WHERE pr.last_game >= :cutoff_date
                    ORDER BY pr.rating DESC
                """
                )

                cutoff_date = datetime.now() - timedelta(days=30)  # Only active players
                results = await db_service.fetch_all(query, {"cutoff_date": cutoff_date})

                # Calculate 24h rating changes
                yesterday = datetime.now() - timedelta(days=1)
                history_query = text(
                    """
                    SELECT user_id, rating
                    FROM rating_history
                    WHERE timestamp >= :yesterday
                """
                )
                history = await db_service.fetch_all(history_query, {"yesterday": yesterday})
                old_ratings = {row["user_id"]: row["rating"] for row in history}

                # Update rankings
                new_rankings: Dict[int, RankingEntry] = {}
                for rank, row in enumerate(results, 1):
                    user_id = row["id"]
                    old_rating = old_ratings.get(user_id, row["previous_rating"])
                    change_24h = row["rating"] - old_rating

                    entry = RankingEntry(
                        user_id=user_id,
                        rating=row["rating"],
                        rank=rank,
                        change_24h=change_24h,
                        games_played=row["games_played"],
                        wins=row["wins"],
                        losses=row["losses"],
                        streak=row["streak"],
                        last_game=row["last_game"],
                        title=row["title_name"],
                    )
                    new_rankings[user_id] = entry

                # Update internal state
                self._rankings = new_rankings
                self._rank_order = [r["id"] for r in results]
                self._last_update = datetime.now()

                # Cache the results
                await self._cache_rankings()

            except Exception as e:
                print(f"Error updating global rankings: {e}")
                raise

    async def get_player_ranking(self, user_id: int) -> Optional[RankingEntry]:
        """Get a player's current ranking entry."""
        return self._rankings.get(user_id)

    async def get_rankings_in_range(self, start_rank: int, end_rank: int) -> List[Dict[str, Any]]:
        """Get rankings for a specific range."""
        if start_rank < 1:
            start_rank = 1

        start_idx = start_rank - 1
        end_idx = min(end_rank, len(self._rank_order))

        rankings: List[Dict[str, Any]] = []
        for idx in range(start_idx, end_idx):
            user_id = self._rank_order[idx]
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

    async def get_nearby_rankings(self, user_id: int, range_size: int = 5) -> List[Dict[str, Any]]:
        """Get rankings near a specific player."""
        entry = await self.get_player_ranking(user_id)
        if not entry:
            return []

        rank = entry.rank
        start_rank = max(1, rank - range_size)
        end_rank = rank + range_size

        return await self.get_rankings_in_range(start_rank, end_rank)

    async def get_top_rankings(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get top N rankings."""
        return await self.get_rankings_in_range(1, limit)

    async def _cache_rankings(self) -> None:
        """Cache the current rankings."""
        cache_data = {
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
            "last_update": self._last_update.isoformat() if self._last_update else None,
        }

        await cache_service.set("global_rankings", cache_data, timeout=300)  # Cache for 5 minutes

    async def _load_cached_rankings(self) -> bool:
        """Load rankings from cache."""
        try:
            cache_data = await cache_service.get("global_rankings")
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
            self._last_update = (
                datetime.fromisoformat(cache_data["last_update"])
                if cache_data["last_update"]
                else None
            )

            return True

        except Exception as e:
            print(f"Error loading cached rankings: {e}")
            return False

    def _preload_game_data(self, player_ids: List[int]) -> None:
        """Preload game data for multiple players."""
        # Get all relevant games in one query
        games = (
            Game.query.filter(
                or_(Game.winner_id.in_(player_ids), Game.loser_id.in_(player_ids)),
                Game.completed_at.isnot(None),
            )
            .order_by(Game.completed_at.desc())
            .all()
        )

        # Organize games by player
        for player_id in player_ids:
            player_games = [g for g in games if g.winner_id == player_id or g.loser_id == player_id]
            self._game_cache[player_id] = player_games

    def _preload_tournament_data(self, player_ids: List[int]) -> None:
        """Preload tournament data for multiple players."""
        # Get all relevant tournaments in one query
        tournaments = (
            Tournament.query.filter(
                Tournament.participants.any(User.id.in_(player_ids)),
                Tournament.end_date < datetime.now(),
            )
            .order_by(Tournament.end_date.desc())
            .all()
        )

        # Organize tournaments by player
        for player_id in player_ids:
            player_tournaments = [
                t for t in tournaments if any(p.id == player_id for p in t.participants)
            ]
            self._tournament_cache[player_id] = player_tournaments

    def _calculate_player_ranking(self, player: User) -> Optional[Dict]:
        """Calculate complete ranking data for a player."""
        try:
            rating = self.calculate_global_rating(player.id)
            tier = self.get_player_tier(rating)

            # Calculate additional stats using cached data
            games = self._game_cache.get(player.id, [])
            total_games = len(games)
            games_won = sum(1 for g in games if g.winner_id == player.id)

            # Get tournament stats using cached data
            tournaments = self._tournament_cache.get(player.id, [])
            tournament_stats = self._calculate_tournament_stats(player.id, tournaments)

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

    def _calculate_win_rate(self, user_id: int) -> float:
        """Calculate player's win rate using cached data."""
        games = self._game_cache.get(user_id, [])
        if not games:
            return 0.0

        wins = sum(1 for game in games if game.winner_id == user_id)
        return wins / len(games)

    def _calculate_tournament_performance(self, user_id: int) -> float:
        """Calculate tournament performance score using cached data."""
        tournaments = self._tournament_cache.get(user_id, [])
        if not tournaments:
            return 0.0

        total_score = 0.0
        for tournament in tournaments:
            placement = tournament.get_player_placement(user_id)
            if placement:
                # Score based on placement (1st = 1.0, 2nd = 0.8, 3rd = 0.6, etc.)
                total_score += max(0.0, 1.0 - ((placement - 1) * 0.2))

        return total_score / len(tournaments)

    def _calculate_opponent_strength(self, user_id: int) -> float:
        """Calculate average opponent strength using cached data."""
        games = self._game_cache.get(user_id, [])
        if not games:
            return 0.0

        if user_id not in self._opponent_cache:
            total_opponent_rating = 0.0
            for game in games:
                opponent_id = game.loser_id if game.winner_id == user_id else game.winner_id
                opponent_rating = self.get_cached_rating(opponent_id) or 1000.0
                total_opponent_rating += opponent_rating

            self._opponent_cache[user_id] = total_opponent_rating / len(games)

        return self._opponent_cache[user_id] / 3000.0  # Normalize to 0-1

    def _calculate_activity_score(self, user_id: int) -> float:
        """Calculate activity score based on recent games using cached data."""
        games = self._game_cache.get(user_id, [])
        if not games:
            return 0.0

        recent_games = sum(
            1 for game in games if game.completed_at > (datetime.now() - timedelta(days=30))
        )

        return min(1.0, recent_games / 20.0)  # Max score at 20 games/month

    def _calculate_tournament_stats(
        self, user_id: int, tournaments: List[Tournament]
    ) -> Dict[str, Any]:
        """Calculate tournament statistics using cached data."""
        wins = 0
        placements = []

        for tournament in tournaments:
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

    def _update_rankings_in_db(self, rankings: List[Dict]) -> None:
        """Update rankings in database using bulk operations."""
        # Prepare bulk update data
        user_updates = []
        history_updates = []
        current_time = datetime.now()

        for rank, player_data in enumerate(rankings, 1):
            user_id = player_data["user_id"]
            user = User.query.get(user_id)
            if not user:
                continue

            old_rank = user.global_rank or rank
            old_rating = user.global_rating or 1000.0

            # Prepare user update
            update_data = {
                "global_rating": player_data["rating"],
                "global_rank": rank,
                "rank_tier": player_data["tier"],
                "rank_tier_color": player_data["tier_color"],
                "rank_updated_at": current_time,
                "total_games": player_data["total_games"],
                "games_won": player_data["games_won"],
                "tournament_wins": player_data["tournament_wins"],
                "tournament_placements": player_data["tournament_placements"],
                "rank_movement": old_rank - rank,
            }

            # Update highest achievements
            if not user.highest_rating or player_data["rating"] > user.highest_rating:
                update_data["highest_rating"] = player_data["rating"]
                update_data["highest_rating_date"] = current_time

            if not user.highest_rank or rank < user.highest_rank:
                update_data["highest_rank"] = rank
                update_data["highest_rank_date"] = current_time

            # Update streak
            if player_data["rating"] > old_rating:
                if user.rank_streak_type == "win":
                    update_data["rank_streak"] = user.rank_streak + 1
                else:
                    update_data["rank_streak"] = 1
                    update_data["rank_streak_type"] = "win"
            else:
                if user.rank_streak_type == "loss":
                    update_data["rank_streak"] = user.rank_streak + 1
                else:
                    update_data["rank_streak"] = 1
                    update_data["rank_streak_type"] = "loss"

            user_updates.append(update_data)

            # Prepare history update
            history = user.ranking_history or []
            history.append(
                {
                    "date": current_time.isoformat(),
                    "rank": rank,
                    "rating": player_data["rating"],
                    "tier": player_data["tier"],
                }
            )
            history_updates.append(history[-100:])  # Keep last 100 entries

        # Perform bulk updates
        with db.session.begin_nested():
            for user_id, update_data in zip([r["user_id"] for r in rankings], user_updates):
                User.query.filter_by(id=user_id).update(update_data)

            for user_id, history in zip([r["user_id"] for r in rankings], history_updates):
                User.query.filter_by(id=user_id).update({"ranking_history": history})

        db.session.commit()

    def get_rankings_in_range(self, start_rank: int, end_rank: int) -> List[Dict]:
        """Get rankings for a specific range."""
        rankings = cache_service.get("global_rankings")
        if not rankings:
            self.update_global_rankings()
            rankings = cache_service.get("global_rankings")

        return rankings[start_rank - 1 : end_rank]

    def get_player_ranking_details(self, user_id: int) -> Optional[Dict]:
        """Get detailed ranking information for a player."""
        rankings = cache_service.get("global_rankings")
        if not rankings:
            self.update_global_rankings()
            rankings = cache_service.get("global_rankings")

        for rank, player in enumerate(rankings, 1):
            if player["user_id"] == user_id:
                # Get additional stats
                total_games = self._get_total_games(user_id)
                games_won = self._get_games_won(user_id)
                tournament_stats = self._get_tournament_stats(user_id)
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

    def _get_total_games(self, user_id: int) -> int:
        """Get total number of completed games."""
        return Game.query.filter(
            (Game.winner_id == user_id) | (Game.loser_id == user_id), Game.completed_at.isnot(None)
        ).count()

    def _get_recent_games(self, user_id: int) -> int:
        """Get number of games in the last 30 days."""
        return Game.query.filter(
            (Game.winner_id == user_id) | (Game.loser_id == user_id),
            Game.completed_at > (datetime.now() - timedelta(days=30)),
        ).count()

    def _get_games_won(self, user_id: int) -> int:
        """Get total number of games won by user."""
        return Game.query.filter(Game.winner_id == user_id, Game.completed_at.isnot(None)).count()

    def _get_tournament_stats(self, user_id: int) -> Dict[str, Any]:
        """Get tournament statistics for user."""
        tournaments = Tournament.query.filter(
            Tournament.participants.any(id=user_id), Tournament.end_date < datetime.now()
        ).all()

        wins = 0
        placements = []

        for tournament in tournaments:
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

    def get_cached_rating(self, user_id: int) -> Optional[float]:
        """Get player's cached rating."""
        cache_key = f"player_rating:{user_id}"
        return cache_service.get(cache_key)

    def _calculate_performance_metrics(self, user_id: int) -> Dict[str, float]:
        """Calculate detailed performance metrics for a player."""
        games = self._game_cache.get(user_id, [])
        tournaments = self._tournament_cache.get(user_id, [])

        # Calculate accuracy (based on win rate and game performance)
        total_games = len(games)
        if total_games == 0:
            return {"accuracy": 0.0, "consistency": 0.0, "speed": 0.0, "strategy": 0.0}

        wins = sum(1 for game in games if game.winner_id == user_id)
        accuracy = wins / total_games

        # Calculate consistency (based on performance variation)
        recent_games = [g for g in games if g.completed_at > (datetime.now() - timedelta(days=30))]
        consistency = len(recent_games) / 20.0  # 20 games per month is considered fully consistent
        consistency = min(1.0, consistency)

        # Calculate speed (based on game duration and response time)
        speed_score = 0.0
        speed_games = [g for g in games if hasattr(g, "duration")]
        if speed_games:
            avg_duration = sum(g.duration for g in speed_games) / len(speed_games)
            speed_score = 1.0 - min(1.0, avg_duration / 3600)  # Normalize to 1 hour

        # Calculate strategy (based on tournament performance and opponent strength)
        strategy_score = 0.0
        if tournaments:
            tournament_placements = [t.get_player_placement(user_id) for t in tournaments]
            avg_placement = sum(p for p in tournament_placements if p) / len(tournament_placements)
            strategy_score = 1.0 - min(1.0, (avg_placement - 1) / 10)  # Normalize to top 10

        return {
            "accuracy": accuracy,
            "consistency": consistency,
            "speed": speed_score,
            "strategy": strategy_score,
        }
