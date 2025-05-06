from datetime import datetime
from typing import Dict

from dojopool.core.extensions import db
from dojopool.models.achievements import Achievement, UserAchievement


class AchievementService:
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
                .order_by(db.desc("total_points"))
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
