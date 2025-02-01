"""Adaptive difficulty module."""

from datetime import datetime, timedelta

from ..core.extensions import cache
from ..core.models.game import Game


class AdaptiveDifficulty:
    """Adaptive difficulty system for adjusting game parameters based on player performance."""

    def __init__(self):
        """Initialize adaptive difficulty system."""
        self.cache_timeout = 3600  # 1 hour

    def adjust_difficulty(self, player_id: int) -> dict:
        """
        Adjust game difficulty based on player's recent performance.

        Args:
            player_id: Player ID to adjust difficulty for

        Returns:
            dict: Adjusted game settings
        """
        # Try to get cached settings
        cache_key = f"difficulty:{player_id}"
        cached_settings = cache.get(cache_key)
        if cached_settings:
            return cached_settings

        # Calculate new settings based on recent games
        recent_games = self._get_recent_games(player_id)
        performance_metrics = self._calculate_performance_metrics(recent_games)

        settings = self._generate_settings(performance_metrics)

        # Cache the settings
        cache.set(cache_key, settings, timeout=self.cache_timeout)

        return settings

    def _get_recent_games(self, player_id: int, days: int = 7) -> list:
        """Get player's recent games."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        return Game.query.filter(
            ((Game.player1_id == player_id) | (Game.player2_id == player_id))
            & (Game.created_at >= cutoff_date)
        ).all()

    def _calculate_performance_metrics(self, games: list) -> dict:
        """Calculate performance metrics from recent games."""
        if not games:
            return {"win_rate": 0.5, "avg_score": 0, "streak": 0}  # Default to 50% win rate

        wins = 0
        total_score = 0
        current_streak = 0

        for game in games:
            if game.winner_id:
                if game.winner_id == game.player1_id:
                    player1_score = int(game.score.split("-")[0])
                    player2_score = int(game.score.split("-")[1])
                else:
                    player2_score = int(game.score.split("-")[0])
                    player1_score = int(game.score.split("-")[1])

                total_score += player1_score if game.player1_id else player2_score

                if game.winner_id == (game.player1_id if game.player1_id else game.player2_id):
                    wins += 1
                    current_streak += 1
                else:
                    current_streak = 0

        return {
            "win_rate": wins / len(games),
            "avg_score": total_score / len(games),
            "streak": current_streak,
        }

    def _generate_settings(self, metrics: dict) -> dict:
        """Generate game settings based on performance metrics."""
        base_difficulty = 1.0

        # Adjust difficulty based on win rate
        if metrics["win_rate"] > 0.7:
            base_difficulty *= 1.2
        elif metrics["win_rate"] < 0.3:
            base_difficulty *= 0.8

        # Adjust for streaks
        if metrics["streak"] > 3:
            base_difficulty *= 1.1

        # Generate specific game rules
        return {
            "game_rules": {
                "difficulty": base_difficulty,
                "time_limit": int(300 * (1 / base_difficulty)),  # Adjust time limit
                "points_multiplier": base_difficulty,
                "extra_challenges": metrics["win_rate"] > 0.6,
            },
            "challenges": self._generate_challenges(base_difficulty),
            "rewards": self._generate_rewards(base_difficulty),
        }

    def _generate_challenges(self, difficulty: float) -> list:
        """Generate appropriate challenges based on difficulty."""
        challenges = []

        if difficulty > 1.1:
            challenges.extend(
                [
                    {"type": "time", "target": 180},  # 3 minute limit
                    {"type": "accuracy", "target": 0.8},  # 80% accuracy required
                ]
            )
        elif difficulty > 0.9:
            challenges.extend(
                [
                    {"type": "time", "target": 240},  # 4 minute limit
                    {"type": "accuracy", "target": 0.7},  # 70% accuracy required
                ]
            )
        else:
            challenges.extend(
                [
                    {"type": "time", "target": 300},  # 5 minute limit
                    {"type": "accuracy", "target": 0.6},  # 60% accuracy required
                ]
            )

        return challenges

    def _generate_rewards(self, difficulty: float) -> dict:
        """Generate appropriate rewards based on difficulty."""
        return {
            "base_points": int(100 * difficulty),
            "time_bonus": int(50 * difficulty),
            "accuracy_bonus": int(50 * difficulty),
            "streak_bonus": int(25 * difficulty),
        }
