from datetime import datetime
from typing import Dict, TYPE_CHECKING, Optional

from sqlalchemy.sql.expression import desc

from dojopool.extensions import db
from dojopool.models.achievements import Achievement, UserAchievement
# Avoid circular import if Game is needed only for type hint
if TYPE_CHECKING:
    from dojopool.models.game import Game, GameStatus # GameStatus might be needed here too
    from dojopool.models.social import UserProfile # For type hinting

class AchievementService:
    """Service class for handling achievement logic."""

    def create_achievement(self, data: Dict) -> Dict:
        """Create a new achievement"""
        try:
            achievement = Achievement()
            achievement.name = data["name"]
            achievement.description = data.get("description")
            achievement.category_id = data.get("category_id")
            achievement.icon = data.get("icon")
            achievement.points = data.get("points", 0)
            achievement.has_progress = data.get("has_progress", False)
            achievement.target_value = data.get("target_value")
            achievement.progress_description = data.get("progress_description")
            achievement.is_secret = data.get("is_secret", False)
            achievement.conditions = data.get("conditions", {})

            db.session.add(achievement)
            db.session.commit()

            return {"message": "Achievement created successfully", "achievement_id": achievement.id}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def update_achievement(self, achievement_id: int, data: Dict) -> Dict:
        """Update achievement details"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {"error": "Achievement not found"}

            # Update fields
            for field in [
                "name",
                "description",
                "category_id",
                "icon",
                "points",
                "has_progress",
                "target_value",
                "progress_description",
                "is_secret",
                "conditions",
            ]:
                if field in data:
                    setattr(achievement, field, data[field])

            db.session.commit()

            return {"message": "Achievement updated successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def delete_achievement(self, achievement_id: int) -> Dict:
        """Delete an achievement"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {"error": "Achievement not found"}

            db.session.delete(achievement)
            db.session.commit()

            return {"message": "Achievement deleted successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def get_achievement_details(self, achievement_id: int) -> Dict:
        """Get achievement details"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {"error": "Achievement not found"}

            return {
                "id": achievement.id,
                "name": achievement.name,
                "description": achievement.description,
                "category_id": achievement.category_id,
                "icon": achievement.icon,
                "points": achievement.points,
                "has_progress": achievement.has_progress,
                "target_value": achievement.target_value,
                "progress_description": achievement.progress_description,
                "is_secret": achievement.is_secret,
                "rarity": achievement.rarity,
                "conditions": achievement.conditions,
            }
        except Exception as e:
            return {"error": str(e)}

    def get_user_achievements(self, user_id: int) -> Dict:
        """Get all achievements for a user"""
        try:
            user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
            return {"achievements": [
                {
                    "id": ua.id,
                    "achievement_id": ua.achievement_id,
                    "current_progress": ua.current_progress,
                    "is_unlocked": ua.is_unlocked,
                    "unlocked_at": ua.unlocked_at,
                    "shared_count": ua.shared_count,
                    "last_shared_at": ua.last_shared_at,
                }
                for ua in user_achievements
            ]}
        except Exception as e:
            return {"error": str(e)}

    def track_achievement_progress(self, user_id: int, achievement_id: int, progress_update: int) -> Dict:
        """Track progress for an achievement (integer progress only)"""
        try:
            user_achievement = UserAchievement.query.filter_by(
                user_id=user_id, achievement_id=achievement_id
            ).first()
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {"error": "Achievement not found"}

            # Create user achievement if it doesn't exist
            if not user_achievement:
                user_achievement = UserAchievement()
                user_achievement.user_id = user_id
                user_achievement.achievement_id = achievement_id
                db.session.add(user_achievement)
                db.session.commit()

            # Update progress
            new_progress = user_achievement.current_progress + progress_update
            unlocked = user_achievement.update_progress(new_progress)

            return {
                "message": "Progress updated successfully",
                "is_unlocked": user_achievement.is_unlocked,
                "current_progress": user_achievement.current_progress,
            }
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}

    def get_achievement_stats(self, user_id: int) -> Dict:
        """Get achievement statistics for a user"""
        try:
            total_achievements = Achievement.query.count()
            user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()

            unlocked = sum(1 for ua in user_achievements if ua.is_unlocked)
            total_points = sum(ua.achievement.points for ua in user_achievements if ua.is_unlocked)

            stats = {
                "total_achievements": total_achievements,
                "unlocked_achievements": unlocked,
                "completion_rate": (
                    (unlocked / total_achievements * 100) if total_achievements > 0 else 0
                ),
                "total_points": total_points,
            }

            return stats
        except Exception as e:
            return {"error": str(e)}

    def get_achievement_leaderboard(self, limit: int = 10) -> Dict:
        """Get achievement leaderboard"""
        try:
            leaderboard = (
                db.session.query(
                    UserAchievement.user_id,
                    db.func.count(UserAchievement.id).label("unlocked_achievements"),
                    db.func.sum(Achievement.points).label("total_points"),
                )
                .join(Achievement)
                .filter_by(is_unlocked=True)
                .group_by(UserAchievement.user_id)
                .order_by(desc(db.func.sum(Achievement.points)))
                .limit(limit)
                .all()
            )

            return {
                "leaderboard": [
                    {
                        "user_id": entry[0],
                        "unlocked_achievements": entry[1],
                        "total_points": entry[2] or 0,
                    }
                    for entry in leaderboard
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    def check_and_award_game_achievements(self, game: 'Game'):
        """Check and award all achievements related to a completed game."""
        if not game.winner or not game.player1 or not game.player2:
            # Cannot determine winner/loser or players are not set
            return

        winner_profile: Optional['UserProfile'] = db.session.query(UserProfile).filter_by(user_id=game.winner_id).first()
        
        loser_id = game.player2_id if game.winner_id == game.player1_id else game.player1_id
        loser_profile: Optional['UserProfile'] = db.session.query(UserProfile).filter_by(user_id=loser_id).first()

        if not winner_profile:
            # Winner profile not found, cannot award achievements
            # Consider logging this situation
            return

        self._check_win_streak(winner_profile, game)
        self._check_first_win(winner_profile)
        self._check_perfect_game(winner_profile, game, loser_profile)
        self._check_high_difficulty_win(winner_profile, game)

    def _check_win_streak(self, profile: 'UserProfile', current_game: 'Game'):
        """Check and award win streak achievements."""
        if not profile or not profile.user:
            return

        # Querying Game model directly, ensure it's imported or accessible
        from dojopool.models.game import Game, GameStatus # Full import for query

        recent_games = (
            db.session.query(Game)
            .filter(
                ((Game.player1_id == profile.user.id) | (Game.player2_id == profile.user.id)),
                Game.status == GameStatus.COMPLETED,
                Game.id != current_game.id, # Exclude current game from historical check
                Game.completed_at <= (current_game.completed_at or datetime.utcnow())
            )
            .order_by(desc(Game.completed_at))
            .limit(10)
            .all()
        )

        streak = 0
        # Current game is a win, so streak starts at least at 1
        if current_game.winner_id == profile.user_id:
             streak = 1

        for game_record in recent_games:
            if game_record.winner_id == profile.user.id:
                streak += 1
            else:
                # Streak broken by a loss or a game not involving the user as winner
                break
        
        # Award based on final streak count (including current game)
        if streak >= 10:
            self._award_achievement(profile, "win_streak_10")
        elif streak >= 5: # Use elif to award only the highest applicable streak achievement
            self._award_achievement(profile, "win_streak_5")
        elif streak >= 3:
            self._award_achievement(profile, "win_streak_3")

    def _check_first_win(self, profile: 'UserProfile'):
        """Award first win achievement."""
        if not profile:
             return
        # Assuming UserProfile.wins counts completed game wins
        if hasattr(profile, "wins") and profile.wins == 1: # After the current game's win is counted
            self._award_achievement(profile, "first_win")

    def _check_perfect_game(self, winner_profile: 'UserProfile', game: 'Game', loser_profile: Optional['UserProfile'] = None):
        """Check for a perfect game (opponent scored 0)."""
        if not winner_profile or not game.score:
            return
        
        try:
            p1_score_str, p2_score_str = game.score.split('-')
            p1_score = int(p1_score_str)
            p2_score = int(p2_score_str)

            if game.winner_id == game.player1_id and p2_score == 0:
                self._award_achievement(winner_profile, "perfect_game")
            elif game.winner_id == game.player2_id and p1_score == 0:
                self._award_achievement(winner_profile, "perfect_game")
        except ValueError: # Handles cases where score might not be in "X-Y" format
            # Consider logging this error
            pass

    def _check_high_difficulty_win(self, profile: 'UserProfile', game: 'Game'):
        """Check for winning a high-difficulty game."""
        if not profile:
            return
        # Assuming game might have a 'difficulty_rating' attribute directly or via a relation
        # This part is speculative based on original code, adjust if 'difficulty_rating' is stored elsewhere
        if hasattr(game, "difficulty_rating") and game.difficulty_rating >= 8:
            self._award_achievement(profile, "difficult_victory")

    def _award_achievement(self, profile: 'UserProfile', achievement_code: str):
        """Award an achievement to a player if not already unlocked."""
        if not profile or not profile.user:
            return
        try:
            achievement = db.session.query(Achievement).filter_by(code=achievement_code).first()
            if not achievement:
                # Log missing achievement code
                return

            user_achievement = (
                db.session.query(UserAchievement)
                .filter_by(user_id=profile.user_id, achievement_id=achievement.id)
                .first()
            )

            if not user_achievement:
                user_achievement = UserAchievement(user_id=profile.user_id, achievement_id=achievement.id)
                db.session.add(user_achievement)
                # Assuming UserAchievement has an unlock method or is unlocked upon creation if not present
                if hasattr(user_achievement, 'unlock') and callable(user_achievement.unlock):
                    user_achievement.unlock() # This might also handle commit
                else:
                    db.session.commit() # Commit if unlock doesn't
            elif hasattr(user_achievement, 'is_unlocked') and not user_achievement.is_unlocked:
                if hasattr(user_achievement, 'unlock') and callable(user_achievement.unlock):
                    user_achievement.unlock()
                else:
                    # Manually mark as unlocked if no method, though unlock method is preferred
                    db.session.commit()

        except Exception as e:
            db.session.rollback()
            # Log exception e

achievement_service = AchievementService() # Singleton instance
