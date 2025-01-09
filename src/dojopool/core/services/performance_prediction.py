"""Performance prediction service with advanced AI capabilities."""
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import EfficientNetB0
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from src.extensions import cache
from src.core.config import AI_CONFIG
from src.core.services.shot_analysis import ShotAnalyzer
from src.core.services.game_analysis import GameAnalyzer

@dataclass
class SkillMetrics:
    """Represents player skill metrics."""
    technical: float
    tactical: float
    mental: float
    physical: float
    overall: float

@dataclass
class ProgressionMetrics:
    """Represents skill progression metrics."""
    learning_rate: float
    consistency_improvement: float
    adaptability_growth: float
    potential_ceiling: float
    current_trajectory: float

class PerformancePredictor:
    """Advanced AI performance predictor."""
    
    def __init__(self):
        """Initialize performance predictor with advanced models."""
        # Load pre-trained models
        self.skill_model = load_model(AI_CONFIG['SKILL_MODEL_PATH'])
        self.progression_model = load_model(AI_CONFIG['PROGRESSION_MODEL_PATH'])
        self.potential_model = load_model(AI_CONFIG['POTENTIAL_MODEL_PATH'])
        
        # Initialize feature extractors
        self.feature_extractor = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            pooling='avg'
        )
        
        # Initialize analyzers
        self.shot_analyzer = ShotAnalyzer()
        self.game_analyzer = GameAnalyzer()
        
        # Initialize scalers
        self.skill_scaler = StandardScaler()
        self.progression_scaler = StandardScaler()
        
        # Load calibration data
        self.skill_calibration = tf.keras.models.load_model(AI_CONFIG['SKILL_CALIBRATION_PATH'])
        self.potential_calibration = tf.keras.models.load_model(AI_CONFIG['POTENTIAL_CALIBRATION_PATH'])
    
    def predict_performance(
        self,
        player_data: Dict,
        timeframe: str = '6m',
        comparison_group: str = 'similar_skill'
    ) -> Dict:
        """Predict future performance with advanced metrics.
        
        Args:
            player_data: Historical player data including shots, games, and training
            timeframe: Prediction timeframe ('3m', '6m', '1y')
            comparison_group: Group to compare against ('similar_skill', 'similar_style', 'top_players')
            
        Returns:
            dict: Comprehensive performance prediction
        """
        # Try to get from cache
        cache_key = f'performance_prediction:{player_data["player_id"]}:{timeframe}:{comparison_group}'
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Calculate current skill metrics
        current_skills = self._calculate_skill_metrics(player_data)
        
        # Analyze progression patterns
        progression = self._analyze_progression(player_data)
        
        # Predict skill development
        future_skills = self._predict_skill_development(
            current_skills,
            progression,
            timeframe
        )
        
        # Generate comparative analysis
        comparison = self._generate_comparison(
            current_skills,
            future_skills,
            player_data,
            comparison_group
        )
        
        # Generate training recommendations
        recommendations = self._generate_training_recommendations(
            current_skills,
            future_skills,
            progression,
            comparison
        )
        
        # Compile comprehensive results
        results = {
            'current_skills': {
                'technical': current_skills.technical,
                'tactical': current_skills.tactical,
                'mental': current_skills.mental,
                'physical': current_skills.physical,
                'overall': current_skills.overall
            },
            'progression_metrics': {
                'learning_rate': progression.learning_rate,
                'consistency_improvement': progression.consistency_improvement,
                'adaptability_growth': progression.adaptability_growth,
                'potential_ceiling': progression.potential_ceiling,
                'current_trajectory': progression.current_trajectory
            },
            'predicted_skills': {
                'technical': future_skills.technical,
                'tactical': future_skills.tactical,
                'mental': future_skills.mental,
                'physical': future_skills.physical,
                'overall': future_skills.overall
            },
            'comparative_analysis': {
                'percentile': comparison['percentile'],
                'relative_strengths': comparison['strengths'],
                'relative_weaknesses': comparison['weaknesses'],
                'peer_comparison': comparison['peer_comparison']
            },
            'training_recommendations': {
                'focus_areas': recommendations['focus_areas'],
                'drills': recommendations['drills'],
                'milestones': recommendations['milestones'],
                'timeline': recommendations['timeline']
            }
        }
        
        # Cache results
        cache.set(cache_key, results, timeout=3600)
        
        return results
    
    def _calculate_skill_metrics(self, player_data: Dict) -> SkillMetrics:
        """Calculate current skill metrics using historical data."""
        # Extract relevant features
        shots = player_data.get('shots', [])
        games = player_data.get('games', [])
        training = player_data.get('training', [])
        
        # Calculate technical skill
        technical_features = self._extract_technical_features(shots, training)
        technical_score = self.skill_model.predict(technical_features)[0][0]
        
        # Calculate tactical skill
        tactical_features = self._extract_tactical_features(games)
        tactical_score = self.skill_model.predict(tactical_features)[0][1]
        
        # Calculate mental skill
        mental_features = self._extract_mental_features(games, training)
        mental_score = self.skill_model.predict(mental_features)[0][2]
        
        # Calculate physical skill
        physical_features = self._extract_physical_features(training)
        physical_score = self.skill_model.predict(physical_features)[0][3]
        
        # Calculate overall skill
        overall_score = self._calculate_overall_skill(
            technical_score,
            tactical_score,
            mental_score,
            physical_score
        )
        
        return SkillMetrics(
            technical=technical_score,
            tactical=tactical_score,
            mental=mental_score,
            physical=physical_score,
            overall=overall_score
        )
    
    def _analyze_progression(self, player_data: Dict) -> ProgressionMetrics:
        """Analyze skill progression patterns."""
        # Extract historical progression data
        history = self._extract_progression_history(player_data)
        
        # Calculate learning rate
        learning_rate = self._calculate_learning_rate(history)
        
        # Calculate consistency improvement
        consistency_improvement = self._calculate_consistency_improvement(history)
        
        # Calculate adaptability growth
        adaptability_growth = self._calculate_adaptability_growth(history)
        
        # Estimate potential ceiling
        potential_ceiling = self._estimate_potential_ceiling(
            history,
            learning_rate,
            consistency_improvement,
            adaptability_growth
        )
        
        # Calculate current trajectory
        current_trajectory = self._calculate_current_trajectory(
            history,
            potential_ceiling
        )
        
        return ProgressionMetrics(
            learning_rate=learning_rate,
            consistency_improvement=consistency_improvement,
            adaptability_growth=adaptability_growth,
            potential_ceiling=potential_ceiling,
            current_trajectory=current_trajectory
        )
    
    def _predict_skill_development(
        self,
        current_skills: SkillMetrics,
        progression: ProgressionMetrics,
        timeframe: str
    ) -> SkillMetrics:
        """Predict future skill development."""
        # Convert timeframe to months
        months = {
            '3m': 3,
            '6m': 6,
            '1y': 12
        }.get(timeframe, 6)
        
        # Prepare prediction features
        features = np.concatenate([
            [current_skills.technical, current_skills.tactical,
             current_skills.mental, current_skills.physical],
            [progression.learning_rate, progression.consistency_improvement,
             progression.adaptability_growth, progression.current_trajectory],
            [months]
        ])
        
        # Scale features
        scaled_features = self.progression_scaler.transform(features.reshape(1, -1))
        
        # Predict future skills
        predictions = self.progression_model.predict(scaled_features)
        
        # Scale predictions back
        predictions = self.progression_scaler.inverse_transform(predictions)[0]
        
        return SkillMetrics(
            technical=predictions[0],
            tactical=predictions[1],
            mental=predictions[2],
            physical=predictions[3],
            overall=self._calculate_overall_skill(*predictions[:4])
        )
    
    def _generate_comparison(
        self,
        current_skills: SkillMetrics,
        future_skills: SkillMetrics,
        player_data: Dict,
        comparison_group: str
    ) -> Dict:
        """Generate comparative analysis against peer group."""
        # Get comparison group data
        peer_data = self._get_peer_group_data(
            current_skills,
            player_data,
            comparison_group
        )
        
        # Calculate percentiles
        percentiles = self._calculate_percentiles(
            current_skills,
            peer_data
        )
        
        # Identify relative strengths
        strengths = self._identify_relative_strengths(
            current_skills,
            peer_data
        )
        
        # Identify relative weaknesses
        weaknesses = self._identify_relative_weaknesses(
            current_skills,
            peer_data
        )
        
        # Generate peer comparison details
        peer_comparison = self._generate_peer_comparison_details(
            current_skills,
            future_skills,
            peer_data
        )
        
        return {
            'percentile': percentiles,
            'strengths': strengths,
            'weaknesses': weaknesses,
            'peer_comparison': peer_comparison
        }
    
    def _generate_training_recommendations(
        self,
        current_skills: SkillMetrics,
        future_skills: SkillMetrics,
        progression: ProgressionMetrics,
        comparison: Dict
    ) -> Dict:
        """Generate personalized training recommendations."""
        # Identify focus areas
        focus_areas = self._identify_focus_areas(
            current_skills,
            future_skills,
            comparison
        )
        
        # Generate specific drills
        drills = self._generate_specific_drills(focus_areas)
        
        # Define milestones
        milestones = self._define_milestones(
            current_skills,
            future_skills,
            progression
        )
        
        # Create timeline
        timeline = self._create_training_timeline(
            focus_areas,
            drills,
            milestones
        )
        
        return {
            'focus_areas': focus_areas,
            'drills': drills,
            'milestones': milestones,
            'timeline': timeline
        }
    
    def _identify_focus_areas(
        self,
        current_skills: SkillMetrics,
        future_skills: SkillMetrics,
        comparison: Dict
    ) -> List[Dict]:
        """Identify key areas for improvement."""
        focus_areas = []
        
        # Analyze skill gaps
        skill_gaps = {
            'technical': future_skills.technical - current_skills.technical,
            'tactical': future_skills.tactical - current_skills.tactical,
            'mental': future_skills.mental - current_skills.mental,
            'physical': future_skills.physical - current_skills.physical
        }
        
        # Prioritize based on gaps and peer comparison
        for aspect, gap in skill_gaps.items():
            if gap > 0.1:  # Significant improvement needed
                percentile = comparison['percentile'].get(aspect, 0)
                
                priority = 'high' if percentile < 50 else 'medium'
                if gap > 0.2:
                    priority = 'high'
                
                focus_areas.append({
                    'aspect': aspect,
                    'current_level': getattr(current_skills, aspect),
                    'target_level': getattr(future_skills, aspect),
                    'gap': gap,
                    'priority': priority,
                    'peer_percentile': percentile
                })
        
        # Sort by priority and gap size
        focus_areas.sort(
            key=lambda x: (
                {'high': 0, 'medium': 1, 'low': 2}[x['priority']],
                -x['gap']
            )
        )
        
        return focus_areas
    
    def _generate_specific_drills(self, focus_areas: List[Dict]) -> List[Dict]:
        """Generate specific drills for each focus area."""
        drills = []
        
        for area in focus_areas:
            aspect = area['aspect']
            current_level = area['current_level']
            
            if aspect == 'technical':
                drills.extend([
                    {
                        'name': 'Precision Control',
                        'focus': 'technical',
                        'difficulty': 'intermediate',
                        'description': 'Focus on cue ball control and position play',
                        'duration': 30,  # minutes
                        'frequency': 3    # times per week
                    },
                    {
                        'name': 'Shot Making',
                        'focus': 'technical',
                        'difficulty': 'advanced',
                        'description': 'Practice various shot types and angles',
                        'duration': 45,
                        'frequency': 2
                    }
                ])
            
            elif aspect == 'tactical':
                drills.extend([
                    {
                        'name': 'Pattern Recognition',
                        'focus': 'tactical',
                        'difficulty': 'intermediate',
                        'description': 'Study and practice common patterns',
                        'duration': 40,
                        'frequency': 2
                    },
                    {
                        'name': 'Decision Making',
                        'focus': 'tactical',
                        'difficulty': 'advanced',
                        'description': 'Practice shot selection and planning',
                        'duration': 30,
                        'frequency': 3
                    }
                ])
            
            elif aspect == 'mental':
                drills.extend([
                    {
                        'name': 'Pressure Training',
                        'focus': 'mental',
                        'difficulty': 'intermediate',
                        'description': 'Practice under match-like conditions',
                        'duration': 45,
                        'frequency': 2
                    },
                    {
                        'name': 'Focus Development',
                        'focus': 'mental',
                        'difficulty': 'advanced',
                        'description': 'Concentration and visualization exercises',
                        'duration': 20,
                        'frequency': 4
                    }
                ])
            
            elif aspect == 'physical':
                drills.extend([
                    {
                        'name': 'Stamina Building',
                        'focus': 'physical',
                        'difficulty': 'intermediate',
                        'description': 'Extended practice sessions',
                        'duration': 60,
                        'frequency': 2
                    },
                    {
                        'name': 'Technique Endurance',
                        'focus': 'physical',
                        'difficulty': 'advanced',
                        'description': 'Maintain form during long sessions',
                        'duration': 45,
                        'frequency': 2
                    }
                ])
        
        return drills
    
    def _define_milestones(
        self,
        current_skills: SkillMetrics,
        future_skills: SkillMetrics,
        progression: ProgressionMetrics
    ) -> List[Dict]:
        """Define progression milestones."""
        milestones = []
        
        # Calculate intermediate targets
        for aspect in ['technical', 'tactical', 'mental', 'physical']:
            current = getattr(current_skills, aspect)
            target = getattr(future_skills, aspect)
            gap = target - current
            
            # Define 3 intermediate milestones
            for i in range(1, 4):
                milestone_target = current + (gap * (i/3))
                timeframe = self._estimate_milestone_timeframe(
                    current,
                    milestone_target,
                    progression.learning_rate
                )
                
                milestones.append({
                    'aspect': aspect,
                    'level': milestone_target,
                    'timeframe': timeframe,
                    'description': self._generate_milestone_description(
                        aspect,
                        milestone_target,
                        i
                    )
                })
        
        # Sort by timeframe
        milestones.sort(key=lambda x: x['timeframe'])
        
        return milestones
    
    def _create_training_timeline(
        self,
        focus_areas: List[Dict],
        drills: List[Dict],
        milestones: List[Dict]
    ) -> List[Dict]:
        """Create detailed training timeline."""
        timeline = []
        
        # Get current date
        current_date = datetime.now()
        
        # Create weekly schedule
        for week in range(1, 13):  # 12-week program
            week_start = current_date + timedelta(weeks=week-1)
            week_end = week_start + timedelta(days=6)
            
            # Get relevant milestones
            week_milestones = [
                m for m in milestones
                if self._is_milestone_in_week(m, week)
            ]
            
            # Select drills for the week
            week_drills = self._select_weekly_drills(
                drills,
                focus_areas,
                week
            )
            
            timeline.append({
                'week': week,
                'start_date': week_start.strftime('%Y-%m-%d'),
                'end_date': week_end.strftime('%Y-%m-%d'),
                'drills': week_drills,
                'milestones': week_milestones,
                'focus': self._determine_weekly_focus(
                    focus_areas,
                    week
                )
            })
        
        return timeline
    
    def _estimate_milestone_timeframe(
        self,
        current: float,
        target: float,
        learning_rate: float
    ) -> int:
        """Estimate weeks needed to reach milestone."""
        # Simple estimation based on learning rate
        gap = target - current
        weeks = int(gap / (learning_rate * 0.1))  # Assume 0.1 improvement per learning rate unit per week
        return max(1, min(12, weeks))  # Constrain to 1-12 weeks
    
    def _generate_milestone_description(
        self,
        aspect: str,
        target: float,
        milestone_number: int
    ) -> str:
        """Generate descriptive text for milestone."""
        descriptions = {
            'technical': [
                'Improve basic shot making consistency',
                'Master position play fundamentals',
                'Develop advanced shot making skills'
            ],
            'tactical': [
                'Understand basic pattern recognition',
                'Develop strategic thinking',
                'Master complex game planning'
            ],
            'mental': [
                'Build basic focus and concentration',
                'Develop pressure handling',
                'Master competitive mindset'
            ],
            'physical': [
                'Establish basic stamina',
                'Improve technique endurance',
                'Master long session performance'
            ]
        }
        
        return descriptions[aspect][milestone_number - 1]
    
    def _is_milestone_in_week(self, milestone: Dict, week: int) -> bool:
        """Check if milestone falls in given week."""
        return milestone['timeframe'] == week
    
    def _select_weekly_drills(
        self,
        drills: List[Dict],
        focus_areas: List[Dict],
        week: int
    ) -> List[Dict]:
        """Select appropriate drills for the week."""
        selected_drills = []
        
        # Determine week's focus aspects
        week_aspects = self._get_week_aspects(focus_areas, week)
        
        # Select relevant drills
        for aspect in week_aspects:
            aspect_drills = [d for d in drills if d['focus'] == aspect]
            
            # Adjust difficulty based on week
            difficulty = 'intermediate' if week < 6 else 'advanced'
            suitable_drills = [
                d for d in aspect_drills
                if d['difficulty'] == difficulty
            ]
            
            selected_drills.extend(suitable_drills[:2])  # Up to 2 drills per aspect
        
        return selected_drills
    
    def _determine_weekly_focus(
        self,
        focus_areas: List[Dict],
        week: int
    ) -> List[str]:
        """Determine focus areas for the week."""
        # Start with highest priority areas
        high_priority = [
            area['aspect'] for area in focus_areas
            if area['priority'] == 'high'
        ]
        
        # Add medium priority areas later in the program
        if week > 4:
            medium_priority = [
                area['aspect'] for area in focus_areas
                if area['priority'] == 'medium'
            ]
            high_priority.extend(medium_priority)
        
        return high_priority[:2]  # Focus on at most 2 areas per week
    
    def _get_week_aspects(
        self,
        focus_areas: List[Dict],
        week: int
    ) -> List[str]:
        """Get aspects to focus on for given week."""
        if week <= 4:
            # First month: focus on high priority
            return [
                area['aspect'] for area in focus_areas
                if area['priority'] == 'high'
            ][:2]
        elif week <= 8:
            # Second month: mix high and medium priority
            high_priority = [
                area['aspect'] for area in focus_areas
                if area['priority'] == 'high'
            ]
            medium_priority = [
                area['aspect'] for area in focus_areas
                if area['priority'] == 'medium'
            ]
            return high_priority[:1] + medium_priority[:1]
        else:
            # Final month: all priority levels
            return [area['aspect'] for area in focus_areas][:2] 