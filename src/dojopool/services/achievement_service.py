from datetime import datetime
from typing import Dict, List, Optional
from src.models.achievement import Achievement, UserAchievement
from src.core import db

class AchievementService:
    def create_achievement(self, data: Dict) -> Dict:
        """Create a new achievement"""
        try:
            achievement = Achievement(
                name=data['name'],
                description=data['description'],
                category=data['category'],
                requirements=data['requirements'],
                points=data.get('points', 0),
                icon_url=data.get('icon_url'),
                reward_type=data.get('reward_type'),
                reward_value=data.get('reward_value'),
                is_hidden=data.get('is_hidden', False),
                is_active=data.get('is_active', True)
            )
            
            db.session.add(achievement)
            db.session.commit()
            
            return {'message': 'Achievement created successfully', 'achievement_id': achievement.id}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def update_achievement(self, achievement_id: int, data: Dict) -> Dict:
        """Update achievement details"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {'error': 'Achievement not found'}
            
            # Update fields
            for field in ['name', 'description', 'category', 'points', 'icon_url', 
                         'requirements', 'reward_type', 'reward_value', 'is_hidden', 'is_active']:
                if field in data:
                    setattr(achievement, field, data[field])
            
            achievement.updated_at = datetime.utcnow()
            db.session.commit()
            
            return {'message': 'Achievement updated successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def delete_achievement(self, achievement_id: int) -> Dict:
        """Delete an achievement"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {'error': 'Achievement not found'}
            
            db.session.delete(achievement)
            db.session.commit()
            
            return {'message': 'Achievement deleted successfully'}
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def get_achievement_details(self, achievement_id: int) -> Dict:
        """Get achievement details"""
        try:
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {'error': 'Achievement not found'}
            
            return achievement.to_dict()
        except Exception as e:
            return {'error': str(e)}

    def get_user_achievements(self, user_id: int) -> Dict:
        """Get all achievements for a user"""
        try:
            user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
            return {'achievements': [ua.to_dict() for ua in user_achievements]}
        except Exception as e:
            return {'error': str(e)}

    def track_achievement_progress(self, user_id: int, achievement_id: int, progress_update: Dict) -> Dict:
        """Track progress for an achievement"""
        try:
            user_achievement = UserAchievement.query.filter_by(
                user_id=user_id,
                achievement_id=achievement_id
            ).first()
            
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {'error': 'Achievement not found'}
            
            # Create user achievement if it doesn't exist
            if not user_achievement:
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement_id
                )
                db.session.add(user_achievement)
            
            # Update progress
            current_progress = user_achievement.progress or {}
            for key, value in progress_update.items():
                if key in current_progress:
                    current_progress[key] += value
                else:
                    current_progress[key] = value
            
            user_achievement.progress = current_progress
            user_achievement.updated_at = datetime.utcnow()
            
            # Check if achievement is completed
            is_complete = self._check_achievement_completion(
                achievement.requirements,
                current_progress
            )
            
            if is_complete and not user_achievement.completed:
                user_achievement.completed = True
                user_achievement.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'message': 'Progress updated successfully',
                'is_complete': is_complete,
                'progress': current_progress
            }
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def claim_achievement_reward(self, user_id: int, achievement_id: int) -> Dict:
        """Claim reward for a completed achievement"""
        try:
            user_achievement = UserAchievement.query.filter_by(
                user_id=user_id,
                achievement_id=achievement_id
            ).first()
            
            if not user_achievement:
                return {'error': 'Achievement not found for user'}
            
            if not user_achievement.completed:
                return {'error': 'Achievement not completed'}
            
            if user_achievement.reward_claimed:
                return {'error': 'Reward already claimed'}
            
            achievement = Achievement.query.get(achievement_id)
            if not achievement:
                return {'error': 'Achievement not found'}
            
            # Process reward
            reward = {
                'type': achievement.reward_type,
                'value': achievement.reward_value
            }
            
            user_achievement.reward_claimed = True
            user_achievement.reward_claimed_at = datetime.utcnow()
            user_achievement.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            return {
                'message': 'Reward claimed successfully',
                'reward': reward
            }
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}

    def get_achievement_stats(self, user_id: int) -> Dict:
        """Get achievement statistics for a user"""
        try:
            total_achievements = Achievement.query.filter_by(is_active=True).count()
            user_achievements = UserAchievement.query.filter_by(user_id=user_id).all()
            
            completed = sum(1 for ua in user_achievements if ua.completed)
            total_points = sum(ua.achievement.points for ua in user_achievements if ua.completed)
            
            stats = {
                'total_achievements': total_achievements,
                'completed_achievements': completed,
                'completion_rate': (completed / total_achievements * 100) if total_achievements > 0 else 0,
                'total_points': total_points
            }
            
            return stats
        except Exception as e:
            return {'error': str(e)}

    def get_achievement_leaderboard(self, limit: int = 10) -> Dict:
        """Get achievement leaderboard"""
        try:
            # Get users with most completed achievements
            leaderboard = db.session.query(
                UserAchievement.user_id,
                db.func.count(UserAchievement.id).label('completed_achievements'),
                db.func.sum(Achievement.points).label('total_points')
            ).join(
                Achievement
            ).filter(
                UserAchievement.completed == True
            ).group_by(
                UserAchievement.user_id
            ).order_by(
                db.desc('total_points')
            ).limit(limit).all()
            
            return {
                'leaderboard': [
                    {
                        'user_id': entry[0],
                        'completed_achievements': entry[1],
                        'total_points': entry[2] or 0
                    }
                    for entry in leaderboard
                ]
            }
        except Exception as e:
            return {'error': str(e)}

    def _check_achievement_completion(self, requirements: Dict, progress: Dict) -> bool:
        """Check if achievement requirements are met"""
        try:
            for key, required_value in requirements.items():
                if key not in progress:
                    return False
                if progress[key] < required_value:
                    return False
            return True
        except Exception:
            return False 