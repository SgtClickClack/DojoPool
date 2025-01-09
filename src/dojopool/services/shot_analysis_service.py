from typing import Dict, List, Optional, Any
import numpy as np
from datetime import datetime
from models.shot import Shot
from models.player import Player
from utils.validation import validate_shot_data
from utils.analysis import calculate_shot_metrics

class ShotAnalysisService:
    def __init__(self):
        self.shot_types = {
            'break': {'power_range': (60, 100), 'accuracy_impact': 0.8},
            'power': {'power_range': (80, 100), 'accuracy_impact': 0.6},
            'position': {'power_range': (20, 60), 'accuracy_impact': 1.0},
            'safety': {'power_range': (30, 70), 'accuracy_impact': 0.9},
            'spin': {'power_range': (40, 80), 'accuracy_impact': 0.7}
        }

    def analyze_shot(self, shot_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single shot and return detailed metrics
        """
        # Validate shot data
        validate_shot_data(shot_data)

        # Extract shot parameters
        power = shot_data.get('power', 0)
        angle = shot_data.get('angle', 0)
        spin = shot_data.get('spin', 0)
        english = shot_data.get('english', 0)
        result = shot_data.get('result', False)

        # Calculate base metrics
        metrics = calculate_shot_metrics(power, angle, spin, english)
        
        # Determine shot type
        shot_type = self._determine_shot_type(power, spin, result)
        
        # Calculate shot difficulty
        difficulty = self._calculate_difficulty(power, angle, spin, english)
        
        # Calculate success probability
        success_prob = self._calculate_success_probability(
            power, angle, spin, english, difficulty
        )
        
        # Calculate shot effectiveness
        effectiveness = self._calculate_effectiveness(
            result, difficulty, success_prob
        )

        return {
            'shot_type': shot_type,
            'difficulty': difficulty,
            'success_probability': success_prob,
            'effectiveness': effectiveness,
            'metrics': metrics,
            'timestamp': datetime.utcnow()
        }

    def analyze_player_performance(
        self, 
        player_id: str, 
        time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """
        Analyze player's performance over a given time range
        """
        # Get player's shots
        shots = Shot.get_player_shots(player_id, time_range)
        
        if not shots:
            return {
                'error': 'No shots found for analysis',
                'player_id': player_id
            }

        # Calculate aggregate metrics
        total_shots = len(shots)
        successful_shots = sum(1 for shot in shots if shot.result)
        success_rate = successful_shots / total_shots if total_shots > 0 else 0

        # Analyze shot patterns
        shot_patterns = self._analyze_shot_patterns(shots)
        
        # Calculate performance trends
        trends = self._calculate_performance_trends(shots)
        
        # Generate strengths and weaknesses
        analysis = self._generate_player_analysis(
            shot_patterns, trends, success_rate
        )

        return {
            'player_id': player_id,
            'total_shots': total_shots,
            'success_rate': success_rate,
            'shot_patterns': shot_patterns,
            'trends': trends,
            'analysis': analysis,
            'timestamp': datetime.utcnow()
        }

    def _determine_shot_type(
        self, 
        power: float, 
        spin: float, 
        result: bool
    ) -> str:
        """
        Determine the type of shot based on its characteristics
        """
        for shot_type, params in self.shot_types.items():
            power_range = params['power_range']
            if power_range[0] <= power <= power_range[1]:
                return shot_type
        return 'position'  # default type

    def _calculate_difficulty(
        self, 
        power: float, 
        angle: float, 
        spin: float, 
        english: float
    ) -> float:
        """
        Calculate shot difficulty based on various parameters
        """
        # Base difficulty from power
        difficulty = power / 100

        # Adjust for angle complexity
        angle_factor = abs(angle) / 90
        difficulty += angle_factor * 0.3

        # Adjust for spin complexity
        spin_factor = abs(spin) / 100
        difficulty += spin_factor * 0.2

        # Adjust for english complexity
        english_factor = abs(english) / 100
        difficulty += english_factor * 0.2

        return min(1.0, difficulty)

    def _calculate_success_probability(
        self, 
        power: float, 
        angle: float, 
        spin: float, 
        english: float, 
        difficulty: float
    ) -> float:
        """
        Calculate the probability of shot success
        """
        # Base probability inversely related to difficulty
        base_prob = 1 - difficulty

        # Adjust for power accuracy relationship
        power_factor = 1 - (power / 200)  # Higher power reduces accuracy
        
        # Adjust for spin control
        spin_control = 1 - (abs(spin) / 150)
        
        # Adjust for english precision
        english_precision = 1 - (abs(english) / 150)

        # Combine factors
        probability = base_prob * power_factor * spin_control * english_precision
        
        return max(0.1, min(0.95, probability))

    def _calculate_effectiveness(
        self, 
        result: bool, 
        difficulty: float, 
        success_prob: float
    ) -> float:
        """
        Calculate overall shot effectiveness
        """
        if not result:
            return 0.0

        # Reward more for completing difficult shots
        base_effectiveness = 1 + difficulty

        # Adjust based on success probability
        prob_factor = 1 + (1 - success_prob)

        return base_effectiveness * prob_factor * 0.5

    def _analyze_shot_patterns(self, shots: List[Shot]) -> Dict[str, Any]:
        """
        Analyze patterns in player's shots
        """
        shot_types = {}
        success_by_type = {}
        
        for shot in shots:
            shot_type = self._determine_shot_type(
                shot.power, shot.spin, shot.result
            )
            
            shot_types[shot_type] = shot_types.get(shot_type, 0) + 1
            
            if shot_type not in success_by_type:
                success_by_type[shot_type] = {'total': 0, 'success': 0}
            
            success_by_type[shot_type]['total'] += 1
            if shot.result:
                success_by_type[shot_type]['success'] += 1

        # Calculate success rates by type
        for shot_type in success_by_type:
            total = success_by_type[shot_type]['total']
            success = success_by_type[shot_type]['success']
            success_by_type[shot_type]['rate'] = success / total if total > 0 else 0

        return {
            'shot_types': shot_types,
            'success_by_type': success_by_type
        }

    def _calculate_performance_trends(self, shots: List[Shot]) -> Dict[str, Any]:
        """
        Calculate performance trends over time
        """
        # Sort shots by timestamp
        sorted_shots = sorted(shots, key=lambda x: x.timestamp)
        
        # Calculate moving averages
        window_size = min(10, len(shots))
        success_trend = []
        difficulty_trend = []
        
        for i in range(len(sorted_shots) - window_size + 1):
            window = sorted_shots[i:i + window_size]
            
            # Success rate trend
            success_rate = sum(1 for shot in window if shot.result) / window_size
            success_trend.append({
                'timestamp': window[-1].timestamp,
                'value': success_rate
            })
            
            # Difficulty trend
            avg_difficulty = np.mean([
                self._calculate_difficulty(
                    shot.power, shot.angle, shot.spin, shot.english
                ) for shot in window
            ])
            difficulty_trend.append({
                'timestamp': window[-1].timestamp,
                'value': float(avg_difficulty)
            })

        return {
            'success_trend': success_trend,
            'difficulty_trend': difficulty_trend
        }

    def _generate_player_analysis(
        self, 
        shot_patterns: Dict[str, Any], 
        trends: Dict[str, Any], 
        success_rate: float
    ) -> Dict[str, Any]:
        """
        Generate detailed player analysis
        """
        strengths = []
        weaknesses = []
        
        # Analyze success rates by shot type
        for shot_type, stats in shot_patterns['success_by_type'].items():
            if stats['rate'] > 0.7:
                strengths.append(f"High success rate with {shot_type} shots")
            elif stats['rate'] < 0.4:
                weaknesses.append(f"Low success rate with {shot_type} shots")

        # Analyze trends
        if trends['success_trend']:
            recent_success = trends['success_trend'][-1]['value']
            if recent_success > success_rate:
                strengths.append("Improving success rate")
            elif recent_success < success_rate:
                weaknesses.append("Declining success rate")

        # Analyze shot selection
        shot_distribution = shot_patterns['shot_types']
        total_shots = sum(shot_distribution.values())
        
        for shot_type, count in shot_distribution.items():
            ratio = count / total_shots
            if ratio > 0.4:
                weaknesses.append(f"Over-reliance on {shot_type} shots")
            elif ratio < 0.1:
                weaknesses.append(f"Limited use of {shot_type} shots")

        return {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'overall_rating': self._calculate_overall_rating(
                success_rate, shot_patterns, trends
            )
        }

    def _calculate_overall_rating(
        self, 
        success_rate: float, 
        shot_patterns: Dict[str, Any], 
        trends: Dict[str, Any]
    ) -> float:
        """
        Calculate overall player rating
        """
        # Base rating from success rate
        rating = success_rate * 60

        # Adjust for shot variety
        shot_types = len(shot_patterns['shot_types'])
        variety_bonus = min(20, shot_types * 4)
        rating += variety_bonus

        # Adjust for trend
        if trends['success_trend']:
            trend_direction = trends['success_trend'][-1]['value'] - success_rate
            rating += trend_direction * 20

        return min(100, max(0, rating)) 