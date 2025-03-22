"""
Achievement Service Module

This module provides services for managing achievements and user progress.
"""

from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from ..models import Achievement, UserAchievement, AchievementType
from ..extensions import db
from ..cache.decorators import cached, invalidate_cache, cached_many


class AchievementService:
    """Service for managing achievements and user progress."""

    @staticmethod
    @cached("achievements", expire=timedelta(hours=1))
    def get_achievements(
        achievement_type: Optional[AchievementType] = None,
        include_secret: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all achievements, optionally filtered by type.
        
        Args:
            achievement_type: Optional achievement type to filter by
            include_secret: Whether to include secret achievements
            
        Returns:
            List of achievements
        """
        query = Achievement.query

        if achievement_type:
            query = query.filter(Achievement.type == achievement_type)
        if not include_secret:
            query = query.filter(Achievement.is_secret == False)

        achievements = query.order_by(Achievement.points.desc()).all()
        return [achievement.to_dict() for achievement in achievements]

    @staticmethod
    @cached("user_achievements", expire=timedelta(minutes=5))
    def get_user_achievements(
        user_id: int,
        completed: Optional[bool] = None,
        achievement_type: Optional[AchievementType] = None
    ) -> List[Dict[str, Any]]:
        """Get achievements for a user.
        
        Args:
            user_id: ID of the user
            completed: Optional filter for completed/incomplete achievements
            achievement_type: Optional achievement type to filter by
            
        Returns:
            List of user achievements
        """
        query = UserAchievement.query.filter(UserAchievement.user_id == user_id)

        if completed is not None:
            query = query.filter(UserAchievement.completed == completed)
        if achievement_type:
            query = query.join(Achievement).filter(Achievement.type == achievement_type)

        user_achievements = query.order_by(UserAchievement.updated_at.desc()).all()
        return [ua.to_dict() for ua in user_achievements]

    @staticmethod
    @cached("user_achievement_stats", expire=timedelta(minutes=5))
    def get_user_achievement_stats(user_id: int) -> Dict[str, Any]:
        """Get achievement statistics for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dictionary containing achievement statistics
        """
        user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
        
        total_achievements = Achievement.query.count()
        completed_achievements = sum(1 for ua in user_achievements if ua.completed)
        total_points = sum(ua.achievement.points for ua in user_achievements if ua.completed)
        
        return {
            'total_achievements': total_achievements,
            'completed_achievements': completed_achievements,
            'completion_percentage': (completed_achievements / total_achievements * 100) if total_achievements > 0 else 0,
            'total_points': total_points
        }

    @staticmethod
    @invalidate_cache("user_achievements:*")
    @invalidate_cache("user_achievement_stats:*")
    def update_achievement_progress(
        user_id: int,
        achievement_id: int,
        progress: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """Update progress for a user's achievement.
        
        Args:
            user_id: ID of the user
            achievement_id: ID of the achievement
            progress: New progress value
            metadata: Optional metadata to store
            
        Returns:
            Tuple of (success, error_message, updated_achievement)
        """
        try:
            # Get or create user achievement
            user_achievement = UserAchievement.query.filter_by(
                user_id=user_id,
                achievement_id=achievement_id
            ).first()

            if not user_achievement:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement_id
                )
                db.session.add(user_achievement)

            # Update progress
            was_completed = user_achievement.completed
            is_completed = user_achievement.update_progress(progress, metadata)
            db.session.commit()

            return True, None, user_achievement.to_dict()
        except Exception as e:
            db.session.rollback()
            return False, str(e), None

    @staticmethod
    @cached("recent_achievements", expire=timedelta(minutes=5))
    def get_recent_achievements(
        user_id: int,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get recently completed achievements for a user.
        
        Args:
            user_id: ID of the user
            limit: Maximum number of achievements to return
            
        Returns:
            List of recently completed achievements
        """
        user_achievements = UserAchievement.query.filter_by(
            user_id=user_id,
            completed=True
        ).order_by(UserAchievement.completed_at.desc())\
            .limit(limit)\
            .all()

        return [ua.to_dict() for ua in user_achievements]

    @staticmethod
    @cached("achievement_leaderboard", expire=timedelta(minutes=5))
    def get_achievement_leaderboard(
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get global achievement leaderboard.
        
        Args:
            limit: Maximum number of users to return
            
        Returns:
            List of users sorted by achievement points
        """
        from sqlalchemy import func
        from ..models import User

        leaderboard = db.session.query(
            User.id,
            User.username,
            func.sum(Achievement.points).label('total_points'),
            func.count(UserAchievement.id).label('completed_achievements')
        ).join(UserAchievement)\
            .join(Achievement)\
            .filter(UserAchievement.completed == True)\
            .group_by(User.id, User.username)\
            .order_by(func.sum(Achievement.points).desc())\
            .limit(limit)\
            .all()

        return [
            {
                'user_id': row.id,
                'username': row.username,
                'total_points': row.total_points,
                'completed_achievements': row.completed_achievements
            }
            for row in leaderboard
        ] 