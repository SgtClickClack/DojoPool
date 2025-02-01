"""AI recommendations service.

This module provides AI-powered recommendations for games and opponents.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

from src.core.database import cache
from src.core.models import Game, GameResult, GameType, User


class RecommendationEngine:
    """AI recommendation engine."""

    def __init__(self):
        """Initialize recommendation engine."""
        self.scaler = StandardScaler()

    def get_player_features(self, user_id):
        """Get player feature vector.

        Args:
            user_id: User ID

        Returns:
            np.array: Feature vector
        """
        # Get player statistics
        stats = GameResult.get_player_stats(user_id)
        if not stats:
            return None

        # Get recent games
        recent_games = Game.get_player_games(user_id, limit=20)

        # Calculate features
        features = {
            "win_rate": stats["win_rate"],
            "total_games": stats["total_games"],
            "avg_score": self._calculate_avg_score(recent_games, user_id),
            "preferred_game_types": self._get_preferred_game_types(recent_games),
            "activity_level": self._calculate_activity_level(recent_games),
            "skill_level": self._calculate_skill_level(stats, recent_games),
        }

        return np.array(list(features.values()))

    def get_opponent_recommendations(self, user_id, limit=5):
        """Get recommended opponents.

        Args:
            user_id: User ID
            limit: Maximum number of recommendations

        Returns:
            list: Recommended opponents
        """
        # Try to get from cache
        cache_key = f"opponent_recommendations:{user_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Get player features
        player_features = self.get_player_features(user_id)
        if player_features is None:
            return []

        # Get all active players
        active_players = User.query.filter(User.id != user_id, User.is_active is True).all()

        # Calculate similarity scores
        scores = []
        for player in active_players:
            features = self.get_player_features(player.id)
            if features is not None:
                similarity = cosine_similarity(
                    player_features.reshape(1, -1), features.reshape(1, -1)
                )[0][0]
                scores.append((player, similarity))

        # Sort by similarity and get top recommendations
        recommendations = sorted(scores, key=lambda x: x[1], reverse=True)[:limit]

        # Format results
        results = [
            {
                "user_id": player.id,
                "username": player.username,
                "similarity": similarity,
                "stats": GameResult.get_player_stats(player.id),
            }
            for player, similarity in recommendations
        ]

        # Cache results
        cache.set(cache_key, results, timeout=3600)  # 1 hour

        return results

    def get_game_type_recommendations(self, user_id, limit=3):
        """Get recommended game types.

        Args:
            user_id: User ID
            limit: Maximum number of recommendations

        Returns:
            list: Recommended game types
        """
        # Try to get from cache
        cache_key = f"game_type_recommendations:{user_id}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Get player's game history
        recent_games = Game.get_player_games(user_id, limit=50)
        if not recent_games:
            return []

        # Get all game types
        game_types = GameType.query.filter_by(is_active=True).all()

        # Calculate scores for each game type
        scores = []
        for game_type in game_types:
            # Get stats for this game type
            stats = GameResult.get_player_stats(user_id, game_type=game_type.name)
            if not stats:
                continue

            # Calculate score based on performance and frequency
            type_games = [g for g in recent_games if g.type_id == game_type.id]
            frequency = len(type_games) / len(recent_games)
            performance = stats["win_rate"]

            # Combine factors into final score
            score = (0.7 * performance) + (0.3 * frequency)
            scores.append((game_type, score))

        # Sort by score and get top recommendations
        recommendations = sorted(scores, key=lambda x: x[1], reverse=True)[:limit]

        # Format results
        results = [
            {
                "type_id": game_type.id,
                "name": game_type.name,
                "description": game_type.description,
                "score": score,
                "stats": GameResult.get_player_stats(user_id, game_type=game_type.name),
            }
            for game_type, score in recommendations
        ]

        # Cache results
        cache.set(cache_key, results, timeout=3600)  # 1 hour

        return results

    def _calculate_avg_score(self, games, user_id):
        """Calculate average score from recent games.

        Args:
            games: List of games
            user_id: User ID

        Returns:
            float: Average score
        """
        scores = []
        for game in games:
            result = next((r for r in game.results if r.player_id == user_id), None)
            if result and result.score:
                scores.append(result.score)
        return np.mean(scores) if scores else 0

    def _get_preferred_game_types(self, games):
        """Get preferred game types from recent games.

        Args:
            games: List of games

        Returns:
            float: Game type preference score
        """
        if not games:
            return 0

        # Count game type frequencies
        type_counts = {}
        for game in games:
            type_counts[game.type_id] = type_counts.get(game.type_id, 0) + 1

        # Calculate preference score
        max_count = max(type_counts.values())
        return max_count / len(games)

    def _calculate_activity_level(self, games):
        """Calculate player activity level.

        Args:
            games: List of games

        Returns:
            float: Activity level score
        """
        if not games:
            return 0

        # Calculate average days between games
        dates = sorted([game.start_time for game in games if game.start_time])
        if len(dates) < 2:
            return 0

        intervals = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        avg_interval = np.mean(intervals)

        # Convert to activity score (0-1)
        return 1 / (1 + avg_interval)

    def _calculate_skill_level(self, stats, games):
        """Calculate player skill level.

        Args:
            stats: Player statistics
            games: Recent games

        Returns:
            float: Skill level score
        """
        if not stats or not games:
            return 0

        # Combine multiple factors
        win_rate = stats["win_rate"] / 100
        consistency = self._calculate_consistency(games)
        opponent_strength = self._calculate_opponent_strength(games)

        # Weight factors
        return (0.5 * win_rate) + (0.3 * consistency) + (0.2 * opponent_strength)

    def _calculate_consistency(self, games):
        """Calculate player consistency.

        Args:
            games: List of games

        Returns:
            float: Consistency score
        """
        if not games:
            return 0

        # Calculate standard deviation of positions
        positions = [
            result.position for game in games for result in game.results if result.position
        ]

        if not positions:
            return 0

        std = np.std(positions)
        return 1 / (1 + std)  # Convert to 0-1 score

    def _calculate_opponent_strength(self, games):
        """Calculate average opponent strength.

        Args:
            games: List of games

        Returns:
            float: Opponent strength score
        """
        if not games:
            return 0

        # Get average opponent win rate
        opponent_rates = []
        for game in games:
            for result in game.results:
                opponent_stats = GameResult.get_player_stats(result.player_id)
                if opponent_stats:
                    opponent_rates.append(opponent_stats["win_rate"])

        return np.mean(opponent_rates) / 100 if opponent_rates else 0
