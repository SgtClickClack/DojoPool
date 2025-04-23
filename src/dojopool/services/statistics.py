"""Statistics service for dashboard."""

from datetime import datetime, timedelta
from typing import Any, Dict

from dojopool.models.achievements import Achievement
from dojopool.models.game import Game
from dojopool.models.rating import Rating
from dojopool.models.tournament import Tournament


class StatisticsService:
    """Service for handling user statistics."""

    @staticmethod
    def get_user_statistics(user_id: int) -> Dict[str, Any]:
        """Get comprehensive statistics for a user.

        Args:
            user_id: The user's ID

        Returns:
            Dict[str, Any]: User statistics
        """
        return {
            "games": StatisticsService._get_game_stats(user_id),
            "achievements": StatisticsService._get_achievement_stats(user_id),
            "tournaments": StatisticsService._get_tournament_stats(user_id),
            "ratings": StatisticsService._get_rating_stats(user_id),
            "power_ups": StatisticsService._get_power_up_stats(user_id),
        }

    @staticmethod
    def _get_game_stats(user_id: int) -> Dict[str, Any]:
        """Get game-related statistics."""
        games = Game.query.filter_by(user_id=user_id).all()
        total_games = len(games)

        if not total_games:
            return {
                "total_games": 0,
                "win_rate": 0,
                "average_score": 0,
                "highest_score": 0,
                "recent_games": [],
            }

        wins = sum(1 for game in games if game.is_winner)
        total_score = sum(game.score for game in games)
        highest_score = max(game.score for game in games)

        recent_games = (
            Game.query.filter_by(user_id=user_id).order_by(Game.created_at.desc()).limit(5).all()
        )

        return {
            "total_games": total_games,
            "win_rate": (wins / total_games) * 100,
            "average_score": total_score / total_games,
            "highest_score": highest_score,
            "recent_games": [game.to_dict() for game in recent_games],
        }

    @staticmethod
    def _get_achievement_stats(user_id: int) -> Dict[str, Any]:
        """Get achievement-related statistics."""
        achievements = Achievement.query.filter_by(user_id=user_id).all()
        total_achievements = len(achievements)

        # Get achievement progress
        in_progress = Achievement.query.filter_by(user_id=user_id, completed=False).all()

        recent_achievements = (
            Achievement.query.filter_by(user_id=user_id, completed=True)
            .order_by(Achievement.completed_at.desc())
            .limit(5)
            .all()
        )

        return {
            "total_achievements": total_achievements,
            "completed": len([a for a in achievements if a.completed]),
            "in_progress": [a.to_dict() for a in in_progress],
            "recent_achievements": [a.to_dict() for a in recent_achievements],
        }

    @staticmethod
    def _get_tournament_stats(user_id: int) -> Dict[str, Any]:
        """Get tournament-related statistics."""
        tournaments = Tournament.query.filter_by(user_id=user_id).all()
        total_tournaments = len(tournaments)

        if not total_tournaments:
            return {
                "total_tournaments": 0,
                "wins": 0,
                "win_rate": 0,
                "upcoming_tournaments": [],
                "recent_results": [],
            }

        wins = sum(1 for t in tournaments if t.is_winner)

        upcoming = (
            Tournament.query.filter(
                Tournament.start_time > datetime.utcnow(), Tournament.user_id == user_id
            )
            .order_by(Tournament.start_time)
            .limit(3)
            .all()
        )

        recent_results = (
            Tournament.query.filter(
                Tournament.end_time < datetime.utcnow(), Tournament.user_id == user_id
            )
            .order_by(Tournament.end_time.desc())
            .limit(5)
            .all()
        )

        return {
            "total_tournaments": total_tournaments,
            "wins": wins,
            "win_rate": (wins / total_tournaments) * 100,
            "upcoming_tournaments": [t.to_dict() for t in upcoming],
            "recent_results": [t.to_dict() for t in recent_results],
        }

    @staticmethod
    def _get_rating_stats(user_id: int) -> Dict[str, Any]:
        """Get rating-related statistics."""
        current_rating = (
            Rating.query.filter_by(user_id=user_id).order_by(Rating.created_at.desc()).first()
        )

        # Get rating history for the past month
        month_ago = datetime.utcnow() - timedelta(days=30)
        rating_history = (
            Rating.query.filter(Rating.user_id == user_id, Rating.created_at >= month_ago)
            .order_by(Rating.created_at)
            .all()
        )

        return {
            "current_rating": current_rating.value if current_rating else 1200,
            "peak_rating": max(r.value for r in rating_history) if rating_history else 1200,
            "rating_history": [
                {"date": r.created_at.isoformat(), "rating": r.value} for r in rating_history
            ],
        }

    @staticmethod
    def _get_power_up_stats(user_id: int) -> Dict[str, Any]:
        """Get power-up related statistics."""
        # This would be implemented when power-ups are added
        return {"available_power_ups": [], "active_power_ups": [], "power_up_history": []}
