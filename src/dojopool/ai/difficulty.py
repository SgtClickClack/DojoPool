"""Adaptive difficulty module for AI-based game difficulty adjustment."""

from typing import Any, Dict, List

from flask import current_app

from ..core.database import db
from ..models import Game, Tournament, User


class AdaptiveDifficulty:
    """Class for managing adaptive difficulty in games."""

    DIFFICULTY_LEVELS = {
        "beginner": {"min_score": 0, "max_score": 1000, "multiplier": 1.0},
        "intermediate": {"min_score": 1001, "max_score": 2000, "multiplier": 1.2},
        "advanced": {"min_score": 2001, "max_score": 3000, "multiplier": 1.5},
        "expert": {"min_score": 3001, "max_score": float("inf"), "multiplier": 2.0},
    }

    @staticmethod
    async def calculate_player_level(user_id: int) -> Dict[str, Any]:
        """Calculate a player's skill level based on various factors."""
        try:
            # Get user's game history
            games = (
                await db.session.query(Game)
                .filter((Game.player1_id == user_id) | (Game.player2_id == user_id))
                .all()
            )

            if not games:
                return {
                    "level": "beginner",
                    "score": 0,
                    "next_level": "intermediate",
                    "progress": 0,
                }

            # Calculate base score
            total_games = len(games)
            wins = sum(1 for game in games if game.winner_id == user_id)
            win_rate = wins / total_games if total_games > 0 else 0

            # Get tournament performance
            tournaments = (
                await db.session.query(Tournament)
                .join(Tournament.players)
                .filter(User.id == user_id)
                .all()
            )

            tournament_score = sum(
                t.prize_pool * 0.1 if t.winner_id == user_id else t.prize_pool * 0.01
                for t in tournaments
            )

            # Calculate skill score
            base_score = win_rate * 1000
            tournament_bonus = min(tournament_score, 1000)
            consistency_bonus = min(total_games * 10, 500)

            total_score = base_score + tournament_bonus + consistency_bonus

            # Determine level
            level = "beginner"
            for l, data in AdaptiveDifficulty.DIFFICULTY_LEVELS.items():
                if data["min_score"] <= total_score <= data["max_score"]:
                    level = l
                    break

            # Calculate progress to next level
            current_level_data = AdaptiveDifficulty.DIFFICULTY_LEVELS[level]
            next_level = None
            progress = 0

            for l, data in AdaptiveDifficulty.DIFFICULTY_LEVELS.items():
                if data["min_score"] > current_level_data["max_score"]:
                    next_level = l
                    range_size = data["min_score"] - current_level_data["min_score"]
                    progress = min(
                        100, ((total_score - current_level_data["min_score"]) / range_size) * 100
                    )
                    break

            return {
                "level": level,
                "score": total_score,
                "next_level": next_level,
                "progress": progress,
                "stats": {
                    "total_games": total_games,
                    "wins": wins,
                    "win_rate": win_rate,
                    "tournaments_played": len(tournaments),
                },
            }

        except Exception as e:
            current_app.logger.error(f"Error calculating player level: {str(e)}")
            return {
                "level": "beginner",
                "score": 0,
                "next_level": "intermediate",
                "progress": 0,
                "error": str(e),
            }

    @staticmethod
    async def get_opponent_suggestions(user_id: int, count: int = 5) -> List[Dict[str, Any]]:
        """Get suggested opponents based on skill level."""
        try:
            user_level = await AdaptiveDifficulty.calculate_player_level(user_id)

            # Find players with similar skill levels
            all_players = await db.session.query(User).filter(User.id != user_id).all()
            player_levels = []

            for player in all_players:
                level = await AdaptiveDifficulty.calculate_player_level(player.id)
                score_diff = abs(level["score"] - user_level["score"])
                player_levels.append(
                    {"user": player, "score_diff": score_diff, "level": level["level"]}
                )

            # Sort by score difference and return top matches
            player_levels.sort(key=lambda x: x["score_diff"])
            return player_levels[:count]

        except Exception as e:
            current_app.logger.error(f"Error getting opponent suggestions: {str(e)}")
            return []

    @staticmethod
    async def generate_training_plan(user_id: int) -> Dict[str, Any]:
        """Generate a personalized training plan based on player's level and performance."""
        try:
            level_data = await AdaptiveDifficulty.calculate_player_level(user_id)

            # Get recent games for analysis
            recent_games = (
                await db.session.query(Game)
                .filter((Game.player1_id == user_id) | (Game.player2_id == user_id))
                .order_by(Game.created_at.desc())
                .limit(10)
                .all()
            )

            # Analyze game patterns
            patterns = {"wins": [], "losses": [], "stats": {}}

            for game in recent_games:
                won = game.winner_id == user_id
                target = patterns["wins"] if won else patterns["losses"]
                target.append(game)

            # Generate recommendations
            recommendations = []

            # Basic recommendations based on level
            if level_data["level"] == "beginner":
                recommendations.extend(
                    [
                        "Focus on basic shot techniques",
                        "Practice position play fundamentals",
                        "Learn basic safety plays",
                    ]
                )
            elif level_data["level"] == "intermediate":
                recommendations.extend(
                    [
                        "Work on advanced position play",
                        "Develop break shot consistency",
                        "Practice common pattern plays",
                    ]
                )
            elif level_data["level"] == "advanced":
                recommendations.extend(
                    [
                        "Master complex safety plays",
                        "Improve spin control techniques",
                        "Study advanced pattern recognition",
                    ]
                )
            else:  # expert
                recommendations.extend(
                    [
                        "Focus on mental game improvement",
                        "Analyze and adapt to different playing styles",
                        "Perfect pressure situation handling",
                    ]
                )

            # Add specific recommendations based on recent performance
            if patterns["losses"]:
                loss_patterns = [
                    g.game_data.get("loss_reason") for g in patterns["losses"] if g.game_data
                ]
                if loss_patterns:
                    common_issues = max(set(loss_patterns), key=loss_patterns.count)
                    recommendations.append(f"Work on improving {common_issues}")

            return {
                "current_level": level_data["level"],
                "recommendations": recommendations,
                "practice_routine": {
                    "daily_goals": [
                        "Warm-up routine (30 minutes)",
                        "Shot practice (1 hour)",
                        "Game situations (1 hour)",
                        "Cool-down drills (30 minutes)",
                    ],
                    "focus_areas": recommendations[:3],
                    "suggested_drills": [
                        "Straight-in shots",
                        "Position play patterns",
                        "Safety play practice",
                        "Break shot consistency",
                    ],
                },
                "progress_tracking": {
                    "current_score": level_data["score"],
                    "progress_to_next": level_data["progress"],
                    "next_level": level_data["next_level"],
                },
            }

        except Exception as e:
            current_app.logger.error(f"Error generating training plan: {str(e)}")
            return {"error": "Failed to generate training plan", "message": str(e)}
