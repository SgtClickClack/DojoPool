"""Ranking module."""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import func
from dojopool.models import db, User, Game, GameType
from dojopool.core.cache import cache_service


class RankingService:
    """Ranking service."""

    def __init__(self):
        """Initialize ranking service."""
        self.cache_timeout = 3600  # 1 hour

    def calculate_player_rating(self, user_id: int, game_type: GameType) -> float:
        """Calculate player rating for game type.

        Args:
            user_id: User ID
            game_type: Game type

        Returns:
            Player rating
        """
        # Get player's games
        games = Game.query.filter(
            (Game.winner_id == user_id) | (Game.loser_id == user_id),
            Game.type == game_type,
            Game.completed_at.isnot(None),
        ).all()

        if not games:
            return 1000.0  # Default rating

        # Calculate rating based on wins/losses and opponent ratings
        rating = 1000.0
        k_factor = 32.0  # Rating adjustment factor

        for game in games:
            if game.winner_id == user_id:
                opponent_id = game.loser_id
                won = True
            else:
                opponent_id = game.winner_id
                won = False

            opponent_rating = self.get_player_rating(opponent_id, game_type)
            expected_score = 1 / (1 + 10 ** ((opponent_rating - rating) / 400))
            actual_score = 1.0 if won else 0.0

            rating += k_factor * (actual_score - expected_score)

        return rating

    def get_player_rating(self, user_id: int, game_type: GameType) -> float:
        """Get player rating for game type.

        Args:
            user_id: User ID
            game_type: Game type

        Returns:
            Player rating
        """
        cache_key = f"player_rating:{user_id}:{game_type.value}"
        rating = cache_service.get(cache_key)

        if rating is None:
            rating = self.calculate_player_rating(user_id, game_type)
            cache_service.set(cache_key, rating, timeout=self.cache_timeout)

        return rating

    def get_player_rankings(
        self, game_type: GameType, limit: Optional[int] = None, min_games: int = 10
    ) -> List[Dict[str, Any]]:
        """Get player rankings for game type.

        Args:
            game_type: Game type
            limit: Maximum number of players to return
            min_games: Minimum number of games required

        Returns:
            List of player rankings
        """
        cache_key = f"player_rankings:{game_type.value}:{limit}:{min_games}"
        rankings = cache_service.get(cache_key)

        if rankings is None:
            # Get players with minimum number of games
            players = (
                db.session.query(User, func.count(Game.id).label("game_count"))
                .outerjoin(
                    Game, (Game.winner_id == User.id) | (Game.loser_id == User.id)
                )
                .filter(Game.type == game_type, Game.completed_at.isnot(None))
                .group_by(User.id)
                .having(func.count(Game.id) >= min_games)
                .all()
            )

            # Calculate rankings
            rankings = []
            for player, game_count in players:
                rating = self.get_player_rating(player.id, game_type)
                rankings.append(
                    {
                        "user_id": player.id,
                        "username": player.username,
                        "rating": rating,
                        "game_count": game_count,
                    }
                )

            # Sort by rating
            rankings.sort(key=lambda x: x["rating"], reverse=True)

            # Apply limit
            if limit:
                rankings = rankings[:limit]

            cache_service.set(cache_key, rankings, timeout=self.cache_timeout)

        return rankings

    def get_player_stats(self, user_id: int, game_type: GameType) -> Dict[str, Any]:
        """Get player stats for game type.

        Args:
            user_id: User ID
            game_type: Game type

        Returns:
            Player stats
        """
        cache_key = f"player_stats:{user_id}:{game_type.value}"
        stats = cache_service.get(cache_key)

        if stats is None:
            # Get player's games
            games = Game.query.filter(
                (Game.winner_id == user_id) | (Game.loser_id == user_id),
                Game.type == game_type,
                Game.completed_at.isnot(None),
            ).all()

            # Calculate stats
            total_games = len(games)
            wins = sum(1 for game in games if game.winner_id == user_id)
            losses = total_games - wins
            win_rate = (wins / total_games) if total_games > 0 else 0.0

            stats = {
                "total_games": total_games,
                "wins": wins,
                "losses": losses,
                "win_rate": win_rate,
                "rating": self.get_player_rating(user_id, game_type),
            }

            cache_service.set(cache_key, stats, timeout=self.cache_timeout)

        return stats

    def update_rankings(self, game_id: int) -> Tuple[float, float]:
        """Update rankings after game completion.

        Args:
            game_id: Game ID

        Returns:
            Tuple of (winner_rating_change, loser_rating_change)
        """
        game = Game.query.get(game_id)
        if not game or not game.completed_at:
            return 0.0, 0.0

        # Get current ratings
        winner_rating = self.get_player_rating(game.winner_id, game.type)
        loser_rating = self.get_player_rating(game.loser_id, game.type)

        # Calculate rating changes
        k_factor = 32.0
        expected_score = 1 / (1 + 10 ** ((loser_rating - winner_rating) / 400))
        rating_change = k_factor * (1 - expected_score)

        # Update cache
        cache_service.delete(f"player_rating:{game.winner_id}:{game.type.value}")
        cache_service.delete(f"player_rating:{game.loser_id}:{game.type.value}")
        cache_service.delete_many(
            [
                key
                for key in cache_service.get_many(
                    [
                        f"player_rankings:{game.type.value}:*",
                        f"player_stats:{game.winner_id}:{game.type.value}",
                        f"player_stats:{game.loser_id}:{game.type.value}",
                    ]
                )
            ]
        )

        return rating_change, -rating_change


ranking_service = RankingService()

__all__ = ["ranking_service", "RankingService"]
