from typing import List, Dict, Optional
import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow.keras.models import load_model
import joblib
import cv2
from ..vision.ball_tracker import BallTracker
from ..models import db, User, Game

class AIService:
    def __init__(self):
        self.ball_tracker = BallTracker()
        # Models would be loaded from saved files in production
        self.shot_analyzer = None
        self.player_recommender = None
        self.performance_predictor = None
        
    def analyze_shot(self, frame_sequence: List[np.ndarray]) -> Dict:
        """Analyze a shot sequence to provide insights."""
        ball_positions = []
        for frame in frame_sequence:
            position = self.ball_tracker.detect_ball(frame)
            if position:
                ball_positions.append(position)
        
        if len(ball_positions) < 2:
            return {
                'success': False,
                'error': 'Insufficient ball tracking data'
            }
        
        # Calculate shot metrics
        velocity = self._calculate_velocity(ball_positions)
        spin = self._estimate_spin(ball_positions)
        accuracy = self._calculate_accuracy(ball_positions)
        
        return {
            'success': True,
            'metrics': {
                'velocity': velocity,
                'spin': spin,
                'accuracy': accuracy
            },
            'recommendations': self._generate_shot_recommendations(velocity, spin, accuracy)
        }
    
    def recommend_players(self, user_id: int, skill_level: str) -> List[Dict]:
        """Recommend players for practice or matches."""
        user = User.query.get(user_id)
        if not user:
            return []
        
        # Get user's recent games and performance metrics
        recent_games = Game.query.filter(
            (Game.player1_id == user_id) | (Game.player2_id == user_id)
        ).order_by(Game.end_time.desc()).limit(10).all()
        
        # Calculate user's playing style and preferences
        play_style = self._analyze_play_style(recent_games, user_id)
        
        # Find compatible players
        compatible_players = User.query.filter(
            User.id != user_id,
            User.skill_level == skill_level
        ).all()
        
        recommendations = []
        for player in compatible_players:
            compatibility_score = self._calculate_compatibility(
                play_style,
                self._analyze_play_style(recent_games, player.id)
            )
            
            if compatibility_score >= 0.7:  # 70% compatibility threshold
                recommendations.append({
                    'player_id': player.id,
                    'username': player.username,
                    'compatibility_score': compatibility_score,
                    'reasons': self._get_compatibility_reasons(compatibility_score)
                })
        
        return sorted(recommendations, key=lambda x: x['compatibility_score'], reverse=True)
    
    def predict_performance(self, user_id: int) -> Dict:
        """Predict player's performance trends and potential."""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}
        
        # Gather historical performance data
        games = Game.query.filter(
            (Game.player1_id == user_id) | (Game.player2_id == user_id)
        ).order_by(Game.end_time).all()
        
        if not games:
            return {'error': 'Insufficient game data'}
        
        # Extract performance metrics
        metrics = self._extract_performance_metrics(games, user_id)
        
        # Generate predictions
        predictions = {
            'skill_trend': self._predict_skill_trend(metrics),
            'potential_peak': self._estimate_potential_peak(metrics),
            'areas_for_improvement': self._identify_improvement_areas(metrics)
        }
        
        return predictions
    
    def _calculate_velocity(self, positions: List[tuple]) -> float:
        """Calculate ball velocity from position sequence."""
        velocities = []
        for i in range(1, len(positions)):
            dx = positions[i][0] - positions[i-1][0]
            dy = positions[i][1] - positions[i-1][1]
            dt = 1/30  # Assuming 30 fps
            velocity = np.sqrt(dx*dx + dy*dy) / dt
            velocities.append(velocity)
        return np.mean(velocities)
    
    def _estimate_spin(self, positions: List[tuple]) -> float:
        """Estimate ball spin from trajectory."""
        # Simplified spin estimation based on trajectory curvature
        if len(positions) < 3:
            return 0.0
            
        curvature = 0
        for i in range(1, len(positions)-1):
            x1, y1 = positions[i-1]
            x2, y2 = positions[i]
            x3, y3 = positions[i+1]
            
            # Calculate curvature using three consecutive points
            a = np.sqrt((x2-x1)**2 + (y2-y1)**2)
            b = np.sqrt((x3-x2)**2 + (y3-y2)**2)
            c = np.sqrt((x3-x1)**2 + (y3-y1)**2)
            
            if a*b*c == 0:
                continue
                
            curvature += 4 * np.abs(
                (x2-x1)*(y3-y1) - (y2-y1)*(x3-x1)
            ) / (a*b*c)
            
        return curvature / (len(positions)-2) if len(positions) > 2 else 0
    
    def _calculate_accuracy(self, positions: List[tuple]) -> float:
        """Calculate shot accuracy based on final position."""
        if not positions:
            return 0.0
            
        # Assuming target pocket position is known
        target_position = (0, 0)  # Replace with actual pocket position
        final_position = positions[-1]
        
        distance_to_target = np.sqrt(
            (final_position[0] - target_position[0])**2 +
            (final_position[1] - target_position[1])**2
        )
        
        # Convert distance to accuracy score (0-1)
        max_distance = 100  # Maximum possible distance
        accuracy = 1 - min(distance_to_target / max_distance, 1)
        return accuracy
    
    def _generate_shot_recommendations(self, velocity: float, spin: float, accuracy: float) -> List[str]:
        """Generate recommendations based on shot metrics."""
        recommendations = []
        
        if velocity < 50:  # Threshold values would be calibrated
            recommendations.append("Consider increasing shot power for better control")
        elif velocity > 150:
            recommendations.append("Try reducing power to improve accuracy")
            
        if spin > 0.5:
            recommendations.append("High spin detected - focus on follow-through")
        
        if accuracy < 0.7:
            recommendations.append("Work on shot alignment and cue positioning")
            
        return recommendations
    
    def _analyze_play_style(self, games: List[Game], user_id: int) -> Dict:
        """Analyze player's style from game history."""
        style_metrics = {
            'aggression': 0,
            'consistency': 0,
            'shot_selection': 0,
            'defensive_play': 0
        }
        
        if not games:
            return style_metrics
            
        for game in games:
            # Calculate style metrics based on game data
            # This would use actual game statistics in production
            style_metrics['aggression'] += np.random.random()
            style_metrics['consistency'] += np.random.random()
            style_metrics['shot_selection'] += np.random.random()
            style_metrics['defensive_play'] += np.random.random()
            
        # Normalize metrics
        for key in style_metrics:
            style_metrics[key] /= len(games)
            
        return style_metrics
    
    def _calculate_compatibility(self, style1: Dict, style2: Dict) -> float:
        """Calculate compatibility score between two play styles."""
        if not style1 or not style2:
            return 0.0
            
        # Calculate Euclidean distance between style metrics
        distance = np.sqrt(sum(
            (style1[key] - style2[key])**2
            for key in style1
        ))
        
        # Convert distance to similarity score (0-1)
        max_distance = np.sqrt(len(style1))  # Maximum possible distance
        similarity = 1 - (distance / max_distance)
        return similarity
    
    def _get_compatibility_reasons(self, score: float) -> List[str]:
        """Generate reasons for compatibility score."""
        reasons = []
        
        if score >= 0.9:
            reasons.append("Extremely well-matched playing styles")
        elif score >= 0.8:
            reasons.append("Complementary skill sets")
        elif score >= 0.7:
            reasons.append("Good potential for competitive matches")
            
        return reasons
    
    def _extract_performance_metrics(self, games: List[Game], user_id: int) -> Dict:
        """Extract performance metrics from game history."""
        metrics = {
            'win_rate': [],
            'average_score': [],
            'shot_accuracy': [],
            'game_duration': []
        }
        
        for game in games:
            is_player1 = game.player1_id == user_id
            won = (is_player1 and game.winner_id == user_id) or \
                  (not is_player1 and game.winner_id == user_id)
                  
            metrics['win_rate'].append(1 if won else 0)
            metrics['average_score'].append(
                game.player1_score if is_player1 else game.player2_score
            )
            # Other metrics would be calculated from actual game data
            
        return metrics
    
    def _predict_skill_trend(self, metrics: Dict) -> Dict:
        """Predict skill development trend."""
        if not metrics['win_rate']:
            return {'trend': 'unknown'}
            
        # Simple linear regression on win rate
        x = np.arange(len(metrics['win_rate']))
        y = np.array(metrics['win_rate'])
        
        if len(x) < 2:
            return {'trend': 'insufficient_data'}
            
        slope = np.polyfit(x, y, 1)[0]
        
        if slope > 0.1:
            trend = 'improving_rapidly'
        elif slope > 0:
            trend = 'improving_steadily'
        elif slope > -0.1:
            trend = 'stable'
        else:
            trend = 'declining'
            
        return {
            'trend': trend,
            'confidence': min(abs(slope) * 10, 1)  # Convert slope to confidence score
        }
    
    def _estimate_potential_peak(self, metrics: Dict) -> Dict:
        """Estimate player's potential peak performance."""
        if not metrics['win_rate']:
            return {'peak': 'unknown'}
            
        current_level = np.mean(metrics['win_rate'][-5:]) if len(metrics['win_rate']) >= 5 else np.mean(metrics['win_rate'])
        
        # Estimate potential based on improvement rate and consistency
        improvement_rate = self._predict_skill_trend(metrics)
        consistency = np.std(metrics['win_rate']) if len(metrics['win_rate']) > 1 else 0
        
        potential_increase = 0.2  # Base potential increase
        if improvement_rate['trend'] == 'improving_rapidly':
            potential_increase += 0.2
        elif improvement_rate['trend'] == 'improving_steadily':
            potential_increase += 0.1
            
        if consistency < 0.2:  # High consistency
            potential_increase += 0.1
            
        peak_level = min(current_level + potential_increase, 1.0)
        
        return {
            'current_level': current_level,
            'estimated_peak': peak_level,
            'confidence': 0.7  # Could be adjusted based on data quality
        }
    
    def _identify_improvement_areas(self, metrics: Dict) -> List[Dict]:
        """Identify areas where player can improve."""
        areas = []
        
        if not metrics['win_rate']:
            return areas
            
        # Analyze various aspects of performance
        recent_win_rate = np.mean(metrics['win_rate'][-5:]) if len(metrics['win_rate']) >= 5 else np.mean(metrics['win_rate'])
        score_trend = np.mean(metrics['average_score'][-5:]) if len(metrics['average_score']) >= 5 else np.mean(metrics['average_score'])
        
        if recent_win_rate < 0.5:
            areas.append({
                'aspect': 'overall_strategy',
                'priority': 'high',
                'suggestion': 'Focus on developing a more effective game strategy'
            })
            
        if score_trend < 7:  # Assuming 8-ball pool
            areas.append({
                'aspect': 'shot_making',
                'priority': 'medium',
                'suggestion': 'Practice precision shots and cue ball control'
            })
            
        return areas 