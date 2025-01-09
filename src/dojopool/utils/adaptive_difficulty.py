from typing import Dict, List, Optional
import numpy as np
from src.extensions import cache
from datetime import datetime, timedelta

class AdaptiveDifficulty:
    """Manage adaptive difficulty for games"""
    
    def __init__(self):
        self.difficulty_levels = {
            'beginner': 1,
            'intermediate': 2,
            'advanced': 3,
            'expert': 4,
            'master': 5
        }
        
        self.performance_weights = {
            'win_rate': 0.4,
            'shot_accuracy': 0.3,
            'game_duration': 0.15,
            'opponent_skill': 0.15
        }
        
        self.skill_thresholds = {
            'beginner': 0.2,
            'intermediate': 0.4,
            'advanced': 0.6,
            'expert': 0.8,
            'master': 0.95
        }
    
    def calculate_player_skill(self, player_id: int, recent_games: List[Dict]) -> float:
        """
        Calculate player's skill level based on recent game performance
        :param player_id: Player ID
        :param recent_games: List of recent game data
        :return: Skill score between 0 and 1
        """
        if not recent_games:
            return 0.0
        
        # Calculate performance metrics
        win_rate = self._calculate_win_rate(player_id, recent_games)
        shot_accuracy = self._calculate_shot_accuracy(player_id, recent_games)
        game_duration = self._calculate_game_duration_score(recent_games)
        opponent_skill = self._calculate_opponent_skill(player_id, recent_games)
        
        # Weighted sum of performance metrics
        skill_score = (
            win_rate * self.performance_weights['win_rate'] +
            shot_accuracy * self.performance_weights['shot_accuracy'] +
            game_duration * self.performance_weights['game_duration'] +
            opponent_skill * self.performance_weights['opponent_skill']
        )
        
        return min(max(skill_score, 0.0), 1.0)
    
    def get_difficulty_level(self, skill_score: float) -> str:
        """
        Get difficulty level based on skill score
        :param skill_score: Player's skill score
        :return: Difficulty level string
        """
        for level, threshold in sorted(self.skill_thresholds.items(), key=lambda x: x[1]):
            if skill_score <= threshold:
                return level
        return 'master'
    
    def adjust_difficulty(self, player_id: int) -> Dict:
        """
        Adjust game difficulty based on player's performance
        :param player_id: Player ID
        :return: Dictionary with difficulty settings
        """
        # Get cached skill level
        cached_skill = self._get_cached_skill(player_id)
        if cached_skill is not None:
            return self._get_difficulty_settings(cached_skill)
        
        # Calculate new skill level
        recent_games = self._get_recent_games(player_id)
        skill_score = self.calculate_player_skill(player_id, recent_games)
        
        # Cache skill level
        self._cache_skill(player_id, skill_score)
        
        return self._get_difficulty_settings(skill_score)
    
    def _calculate_win_rate(self, player_id: int, games: List[Dict]) -> float:
        """Calculate player's win rate"""
        if not games:
            return 0.0
        wins = sum(1 for game in games if game['winner_id'] == player_id)
        return wins / len(games)
    
    def _calculate_shot_accuracy(self, player_id: int, games: List[Dict]) -> float:
        """Calculate player's shot accuracy"""
        total_shots = 0
        successful_shots = 0
        
        for game in games:
            shots = game['shots'].get(str(player_id), {})
            total_shots += shots.get('total', 0)
            successful_shots += shots.get('successful', 0)
        
        return successful_shots / total_shots if total_shots > 0 else 0.0
    
    def _calculate_game_duration_score(self, games: List[Dict]) -> float:
        """Calculate score based on game duration efficiency"""
        if not games:
            return 0.0
        
        durations = []
        for game in games:
            start_time = datetime.fromisoformat(game['start_time'])
            end_time = datetime.fromisoformat(game['end_time'])
            duration = (end_time - start_time).total_seconds() / 60  # in minutes
            durations.append(duration)
        
        # Calculate score based on duration consistency and efficiency
        mean_duration = np.mean(durations)
        std_duration = np.std(durations)
        
        # Penalize high variance and extremely short/long games
        duration_score = 1.0 - (std_duration / mean_duration) * 0.5
        duration_score *= np.exp(-abs(mean_duration - 30) / 30)  # Optimal duration ~30 mins
        
        return max(min(duration_score, 1.0), 0.0)
    
    def _calculate_opponent_skill(self, player_id: int, games: List[Dict]) -> float:
        """Calculate score based on opponent skill levels"""
        if not games:
            return 0.0
        
        opponent_skills = []
        for game in games:
            opponent_id = game['player1_id'] if game['player2_id'] == player_id else game['player2_id']
            opponent_skill = self._get_cached_skill(opponent_id) or 0.5  # Default to medium skill
            opponent_skills.append(opponent_skill)
        
        return np.mean(opponent_skills)
    
    def _get_cached_skill(self, player_id: int) -> Optional[float]:
        """Get cached skill level for player"""
        cache_key = f'player_skill:{player_id}'
        return cache.get(cache_key)
    
    def _cache_skill(self, player_id: int, skill_score: float):
        """Cache player's skill level"""
        cache_key = f'player_skill:{player_id}'
        cache.set(cache_key, skill_score, timeout=3600)  # Cache for 1 hour
    
    def _get_recent_games(self, player_id: int, days: int = 30) -> List[Dict]:
        """Get player's recent games"""
        from src.models.game import Game
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_games = Game.query.filter(
            ((Game.player1_id == player_id) | (Game.player2_id == player_id)) &
            (Game.end_time >= cutoff_date)
        ).order_by(Game.end_time.desc()).limit(50).all()
        
        return [game.to_dict() for game in recent_games]
    
    def _get_difficulty_settings(self, skill_score: float) -> Dict:
        """
        Get difficulty settings based on skill score
        :param skill_score: Player's skill score
        :return: Dictionary with difficulty settings
        """
        difficulty_level = self.get_difficulty_level(skill_score)
        
        # Base settings
        settings = {
            'level': difficulty_level,
            'skill_score': skill_score,
            'opponent_skill_range': self._get_skill_range(skill_score),
            'game_rules': self._get_game_rules(difficulty_level),
            'challenges': self._get_challenges(difficulty_level),
            'rewards': self._get_rewards(difficulty_level)
        }
        
        return settings
    
    def _get_skill_range(self, skill_score: float, range_size: float = 0.2) -> Dict[str, float]:
        """Calculate acceptable skill range for matchmaking"""
        min_skill = max(0.0, skill_score - range_size)
        max_skill = min(1.0, skill_score + range_size)
        return {'min': min_skill, 'max': max_skill}
    
    def _get_game_rules(self, difficulty_level: str) -> Dict:
        """Get game rules for difficulty level"""
        rules = {
            'beginner': {
                'fouls_allowed': 3,
                'shot_timer': 60,
                'hints_enabled': True,
                'practice_mode': True
            },
            'intermediate': {
                'fouls_allowed': 2,
                'shot_timer': 45,
                'hints_enabled': True,
                'practice_mode': False
            },
            'advanced': {
                'fouls_allowed': 2,
                'shot_timer': 30,
                'hints_enabled': False,
                'practice_mode': False
            },
            'expert': {
                'fouls_allowed': 1,
                'shot_timer': 30,
                'hints_enabled': False,
                'practice_mode': False
            },
            'master': {
                'fouls_allowed': 1,
                'shot_timer': 25,
                'hints_enabled': False,
                'practice_mode': False
            }
        }
        return rules[difficulty_level]
    
    def _get_challenges(self, difficulty_level: str) -> List[Dict]:
        """Get challenges for difficulty level"""
        challenges = {
            'beginner': [
                {'type': 'win_games', 'target': 3, 'reward': 100},
                {'type': 'shot_accuracy', 'target': 0.4, 'reward': 50}
            ],
            'intermediate': [
                {'type': 'win_streak', 'target': 3, 'reward': 200},
                {'type': 'shot_accuracy', 'target': 0.6, 'reward': 100}
            ],
            'advanced': [
                {'type': 'win_streak', 'target': 5, 'reward': 300},
                {'type': 'shot_accuracy', 'target': 0.7, 'reward': 150}
            ],
            'expert': [
                {'type': 'win_tournament', 'target': 1, 'reward': 500},
                {'type': 'shot_accuracy', 'target': 0.8, 'reward': 250}
            ],
            'master': [
                {'type': 'win_tournament', 'target': 3, 'reward': 1000},
                {'type': 'shot_accuracy', 'target': 0.9, 'reward': 500}
            ]
        }
        return challenges[difficulty_level]
    
    def _get_rewards(self, difficulty_level: str) -> Dict:
        """Get rewards for difficulty level"""
        multipliers = {
            'beginner': 1.0,
            'intermediate': 1.5,
            'advanced': 2.0,
            'expert': 3.0,
            'master': 5.0
        }
        
        base_rewards = {
            'win': 100,
            'shot_accuracy': 50,
            'quick_game': 25,
            'challenge_complete': 200
        }
        
        multiplier = multipliers[difficulty_level]
        return {k: int(v * multiplier) for k, v in base_rewards.items()}
