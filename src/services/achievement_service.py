from datetime import datetime
from typing import List, Optional
from sqlalchemy import and_
from ..models.achievement import Achievement, UserAchievement, AchievementType
from ..models import db
from ..services.notification_service import NotificationService

class AchievementService:
    def __init__(self):
        self.notification_service = NotificationService()

    def track_progress(self, user_id: int, achievement_type: AchievementType, increment: int = 1) -> List[Achievement]:
        """
        Track progress for achievements of a specific type and return any newly completed achievements.
        """
        # Find all active achievements of the given type
        achievements = Achievement.query.filter(
            and_(
                Achievement.type == achievement_type,
                Achievement.is_active == True
            )
        ).all()
        
        completed_achievements = []
        
        for achievement in achievements:
            user_achievement = UserAchievement.query.filter(
                and_(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement.id
                )
            ).first()
            
            if not user_achievement:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id
                )
                db.session.add(user_achievement)
            
            if not user_achievement.completed:
                user_achievement.progress += increment
                
                if user_achievement.progress >= achievement.target_value:
                    self._complete_achievement(user_achievement)
                    completed_achievements.append(achievement)
                    
                    # Check for next tier if available
                    if achievement.next_tier_id:
                        self._start_next_tier(user_id, achievement.next_tier_id)
        
        db.session.commit()
        return completed_achievements

    def _complete_achievement(self, user_achievement: UserAchievement):
        """Mark an achievement as completed and send notification."""
        user_achievement.completed = True
        user_achievement.completed_at = datetime.utcnow()
        
        # Send notification
        self.notification_service.send_achievement_notification(
            user_id=user_achievement.user_id,
            achievement=user_achievement.achievement
        )

    def _start_next_tier(self, user_id: int, next_tier_id: int):
        """Start tracking the next tier of an achievement."""
        next_tier = UserAchievement(
            user_id=user_id,
            achievement_id=next_tier_id
        )
        db.session.add(next_tier)

    def get_user_achievements(self, user_id: int) -> List[dict]:
        """Get all achievements and their progress for a user."""
        user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
        
        achievements_data = []
        for ua in user_achievements:
            achievement = ua.achievement
            achievements_data.append({
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'type': achievement.type.value,
                'icon_url': achievement.icon_url,
                'points': achievement.points,
                'progress': ua.progress,
                'target_value': achievement.target_value,
                'completed': ua.completed,
                'completed_at': ua.completed_at,
                'tier': achievement.tier
            })
        
        return achievements_data

    def get_leaderboard(self, limit: int = 10) -> List[dict]:
        """Get achievement points leaderboard."""
        leaderboard = db.session.query(
            UserAchievement.user_id,
            db.func.sum(Achievement.points).label('total_points')
        ).join(
            Achievement,
            UserAchievement.achievement_id == Achievement.id
        ).filter(
            UserAchievement.completed == True
        ).group_by(
            UserAchievement.user_id
        ).order_by(
            db.desc('total_points')
        ).limit(limit).all()
        
        return [
            {
                'user_id': entry[0],
                'points': entry[1]
            }
            for entry in leaderboard
        ]

    def create_achievement(self, name: str, description: str, type: AchievementType,
                         target_value: int, points: int, icon_url: Optional[str] = None,
                         is_hidden: bool = False, tier: int = 1,
                         next_tier_id: Optional[int] = None) -> Achievement:
        """Create a new achievement."""
        achievement = Achievement(
            name=name,
            description=description,
            type=type,
            target_value=target_value,
            points=points,
            icon_url=icon_url,
            is_hidden=is_hidden,
            tier=tier,
            next_tier_id=next_tier_id
        )
        
        db.session.add(achievement)
        db.session.commit()
        return achievement 