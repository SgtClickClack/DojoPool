"""Achievement service.

This module provides achievement tracking and milestone management.
"""

from datetime import datetime
from src.core.database import db, cache
from src.core.models import User, Game, GameResult
from src.core.events import emit_event
from src.core.config.achievements import (
    ACHIEVEMENT_CONFIG,
    ACHIEVEMENT_SETTINGS,
    ACHIEVEMENT_LEVELS,
    ACHIEVEMENT_REWARDS,
    ACHIEVEMENT_NOTIFICATIONS
)

class AchievementManager:
    """Achievement manager for tracking and awarding achievements."""
    
    def __init__(self):
        """Initialize achievement manager."""
        self.achievements = ACHIEVEMENT_CONFIG
        self.settings = ACHIEVEMENT_SETTINGS
        self.levels = ACHIEVEMENT_LEVELS
        self.rewards = ACHIEVEMENT_REWARDS
        self.notifications = ACHIEVEMENT_NOTIFICATIONS
    
    def check_achievements(self, user_id):
        """Check and award achievements for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            list: New achievements earned
        """
        # Try to get from cache
        cache_key = f'achievements_check:{user_id}'
        cached = cache.get(cache_key)
        if cached:
            return cached
            
        user = User.query.get(user_id)
        if not user:
            return []
            
        # Get user statistics
        stats = GameResult.get_player_stats(user_id)
        if not stats:
            return []
            
        new_achievements = []
        
        # Check game milestones
        games_played = stats['total_games']
        for tier, data in self.achievements['GAMES_PLAYED'].items():
            if games_played >= data['count']:
                achievement = self._award_achievement(
                    user,
                    'GAMES_PLAYED',
                    tier,
                    data['points'],
                    data['icon']
                )
                if achievement:
                    new_achievements.append(achievement)
        
        # Check win milestones
        games_won = stats['total_wins']
        for tier, data in self.achievements['GAMES_WON'].items():
            if games_won >= data['count']:
                achievement = self._award_achievement(
                    user,
                    'GAMES_WON',
                    tier,
                    data['points'],
                    data['icon']
                )
                if achievement:
                    new_achievements.append(achievement)
        
        # Check win streak
        current_streak = self._get_current_streak(user_id)
        for tier, data in self.achievements['WIN_STREAK'].items():
            if current_streak >= data['count']:
                achievement = self._award_achievement(
                    user,
                    'WIN_STREAK',
                    tier,
                    data['points'],
                    data['icon']
                )
                if achievement:
                    new_achievements.append(achievement)
        
        # Check venue achievements
        venues_visited = self._count_unique_venues(user_id)
        for tier, data in self.achievements['VENUES_VISITED'].items():
            if venues_visited >= data['count']:
                achievement = self._award_achievement(
                    user,
                    'VENUES_VISITED',
                    tier,
                    data['points'],
                    data['icon']
                )
                if achievement:
                    new_achievements.append(achievement)
        
        # Check level progression
        self._check_level_progression(user)
        
        # Check point milestones
        self._check_point_milestones(user)
        
        # Cache results
        cache.set(cache_key, new_achievements, timeout=self.settings['CACHE_TIMEOUT'])
        
        return new_achievements
    
    def check_game_achievements(self, game_id):
        """Check for achievements after a game.
        
        Args:
            game_id: Game ID
            
        Returns:
            dict: Achievements earned by players
        """
        game = Game.query.get(game_id)
        if not game:
            return {}
            
        # Skip if game duration is too short
        if game.duration < self.settings['MIN_GAME_DURATION']:
            return {}
            
        achievements = {}
        
        for player in game.players:
            player_achievements = []
            
            # Check for perfect game
            if self._is_perfect_game(game, player.user_id):
                achievement = self._award_achievement(
                    player.user,
                    'PERFECT_GAME',
                    None,
                    self.achievements['PERFECT_GAME']['points'],
                    self.achievements['PERFECT_GAME']['icon']
                )
                if achievement:
                    player_achievements.append(achievement)
                    self._award_special_reward(player.user, 'PERFECT_GAME')
            
            # Check for comeback win
            if self._is_comeback_win(game, player.user_id):
                achievement = self._award_achievement(
                    player.user,
                    'COMEBACK_WIN',
                    None,
                    self.achievements['COMEBACK_WIN']['points'],
                    self.achievements['COMEBACK_WIN']['icon']
                )
                if achievement:
                    player_achievements.append(achievement)
            
            # Check for quick victory
            if self._is_quick_victory(game, player.user_id):
                achievement = self._award_achievement(
                    player.user,
                    'QUICK_VICTORY',
                    None,
                    self.achievements['QUICK_VICTORY']['points'],
                    self.achievements['QUICK_VICTORY']['icon']
                )
                if achievement:
                    player_achievements.append(achievement)
            
            if player_achievements:
                achievements[player.user_id] = player_achievements
        
        return achievements
    
    def _award_achievement(self, user, achievement_type, tier, points, icon):
        """Award an achievement to a user.
        
        Args:
            user: User instance
            achievement_type: Type of achievement
            tier: Achievement tier (bronze, silver, gold)
            points: Points to award
            icon: Achievement icon
            
        Returns:
            dict: Achievement data if newly awarded, None if already earned
        """
        # Check if already earned
        existing = db.session.query(Achievement).filter_by(
            user_id=user.id,
            type=achievement_type,
            tier=tier
        ).first()
        
        if existing:
            return None
            
        # Apply points multiplier
        points = int(points * self.settings['POINTS_MULTIPLIER'])
        
        # Create achievement
        achievement = Achievement(
            user_id=user.id,
            type=achievement_type,
            tier=tier,
            points=points,
            icon=icon,
            earned_at=datetime.utcnow()
        )
        
        # Add to database
        db.session.add(achievement)
        db.session.commit()
        
        # Update user points
        user.achievement_points += points
        db.session.commit()
        
        # Send notification
        if self.notifications['ENABLED']:
            self._send_achievement_notification(user, achievement)
        
        # Emit achievement event
        emit_event('achievement_earned', {
            'user_id': user.id,
            'achievement': achievement.to_dict()
        })
        
        return achievement.to_dict()
    
    def _check_level_progression(self, user):
        """Check and update user's achievement level.
        
        Args:
            user: User instance
        """
        current_points = user.achievement_points
        
        for level, data in self.levels.items():
            if data['min_points'] <= current_points <= data['max_points']:
                if user.achievement_level != level:
                    user.achievement_level = level
                    db.session.commit()
                    
                    # Send level up notification
                    if self.notifications['ENABLED']:
                        self._send_level_notification(user, level, data)
                    
                    # Check for master level achievement
                    if level == 'MASTER':
                        self._award_special_reward(user, 'MASTER_LEVEL')
                break
    
    def _check_point_milestones(self, user):
        """Check and award point milestone rewards.
        
        Args:
            user: User instance
        """
        current_points = user.achievement_points
        
        for points, reward in self.rewards['POINT_MILESTONES'].items():
            if current_points >= points:
                # Check if milestone already awarded
                existing = db.session.query(Achievement).filter_by(
                    user_id=user.id,
                    type='POINT_MILESTONE',
                    points=points
                ).first()
                
                if not existing:
                    self._award_achievement(
                        user,
                        'POINT_MILESTONE',
                        None,
                        points // 10,  # Bonus points for milestone
                        reward['icon']
                    )
    
    def _award_special_reward(self, user, reward_type):
        """Award special reward to user.
        
        Args:
            user: User instance
            reward_type: Type of special reward
        """
        reward = self.rewards['SPECIAL_REWARDS'].get(reward_type)
        if not reward:
            return
            
        # Check if already awarded
        existing = db.session.query(Achievement).filter_by(
            user_id=user.id,
            type=f'SPECIAL_{reward_type}'
        ).first()
        
        if not existing:
            self._award_achievement(
                user,
                f'SPECIAL_{reward_type}',
                None,
                1000,  # Bonus points for special reward
                reward['icon']
            )
    
    def _send_achievement_notification(self, user, achievement):
        """Send achievement notification.
        
        Args:
            user: User instance
            achievement: Achievement instance
        """
        from src.core.models import Notification
        
        # Create notification
        Notification.create(
            user_id=user.id,
            type='achievement',
            title='Achievement Unlocked!',
            message=f'You earned the {achievement.type} achievement!',
            data={
                'achievement': achievement.to_dict(),
                'animation': self.notifications['ANIMATION_DURATION'],
                'sound': self.notifications['SOUND_ENABLED'],
                'vibration': self.notifications['VIBRATION_ENABLED']
            },
            icon=achievement.icon
        )
    
    def _send_level_notification(self, user, level, level_data):
        """Send level up notification.
        
        Args:
            user: User instance
            level: New level
            level_data: Level configuration data
        """
        from src.core.models import Notification
        
        # Create notification
        Notification.create(
            user_id=user.id,
            type='level_up',
            title='Level Up!',
            message=f'You reached {level_data["title"]} level!',
            data={
                'level': level,
                'title': level_data['title'],
                'color': level_data['color'],
                'animation': self.notifications['ANIMATION_DURATION'],
                'sound': self.notifications['SOUND_ENABLED'],
                'vibration': self.notifications['VIBRATION_ENABLED']
            },
            icon='level_up'
        )
    
    def _get_current_streak(self, user_id):
        """Get current win streak.
        
        Args:
            user_id: User ID
            
        Returns:
            int: Current streak
        """
        recent_games = Game.get_player_games(user_id, limit=20)
        streak = 0
        last_game_time = None
        
        for game in recent_games:
            if game.winner_id == user_id:
                if last_game_time and (game.end_time - last_game_time).total_seconds() > self.settings['STREAK_TIMEOUT']:
                    break
                streak += 1
                last_game_time = game.end_time
            else:
                break
                
        return streak
    
    def _count_unique_venues(self, user_id):
        """Count unique venues visited.
        
        Args:
            user_id: User ID
            
        Returns:
            int: Number of unique venues
        """
        return db.session.query(Game.venue_id).distinct().filter(
            Game.players.any(user_id=user_id)
        ).count()
    
    def _is_perfect_game(self, game, user_id):
        """Check if game was perfect.
        
        Args:
            game: Game instance
            user_id: User ID
            
        Returns:
            bool: True if perfect game
        """
        if game.winner_id != user_id:
            return False
            
        # Check if opponent scored any points
        for result in game.results:
            if result.player_id != user_id and result.score > 0:
                return False
                
        return True
    
    def _is_comeback_win(self, game, user_id):
        """Check if game was a comeback win.
        
        Args:
            game: Game instance
            user_id: User ID
            
        Returns:
            bool: True if comeback win
        """
        if game.winner_id != user_id:
            return False
            
        # Check if player was behind by significant margin
        player_result = next(r for r in game.results if r.player_id == user_id)
        opponent_result = next(r for r in game.results if r.player_id != user_id)
        
        # Consider it a comeback if player was behind by 50% of winning score
        comeback_threshold = game.winning_score * 0.5
        return opponent_result.max_score >= player_result.score + comeback_threshold
    
    def _is_quick_victory(self, game, user_id):
        """Check if game was a quick victory.
        
        Args:
            game: Game instance
            user_id: User ID
            
        Returns:
            bool: True if quick victory
        """
        if game.winner_id != user_id:
            return False
            
        # Consider it quick if game duration is less than average
        return game.duration < game.type.average_duration * 0.6  # 40% faster than average

class Achievement(db.Model):
    """Achievement model."""
    
    __tablename__ = 'achievements'
    __table_args__ = (
        db.Index('idx_achievements_user', 'user_id'),
        db.Index('idx_achievements_type', 'type'),
        {'extend_existing': True}
    )
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    tier = db.Column(db.String(20))  # bronze, silver, gold
    points = db.Column(db.Integer, nullable=False)
    icon = db.Column(db.String(50))
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('achievements', lazy='dynamic'))
    
    def to_dict(self):
        """Convert achievement to dictionary.
        
        Returns:
            dict: Achievement data
        """
        return {
            'id': self.id,
            'type': self.type,
            'tier': self.tier,
            'points': self.points,
            'icon': self.icon,
            'earned_at': self.earned_at.isoformat()
        }
