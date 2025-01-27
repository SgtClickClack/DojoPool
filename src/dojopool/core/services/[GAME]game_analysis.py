"""Game analysis service with advanced AI capabilities."""
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.applications import ResNet50
from scipy.stats import gaussian_kde
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple
from src.extensions import cache
from src.core.config import AI_CONFIG
from src.core.services.shot_analysis import ShotAnalyzer

@dataclass
class GameMetrics:
    """Represents game analysis metrics."""
    shot_selection: float
    position_control: float
    safety_play: float
    break_building: float
    defensive_skill: float
    overall_strategy: float

@dataclass
class PlayerStyle:
    """Represents a player's playing style characteristics."""
    aggression: float
    consistency: float
    creativity: float
    precision: float
    speed: float
    adaptability: float

class GameAnalyzer:
    """Advanced AI game analyzer."""
    
    def __init__(self):
        """Initialize game analyzer with advanced models."""
        # Load pre-trained models
        self.pattern_model = load_model(AI_CONFIG['PATTERN_MODEL_PATH'])
        self.strategy_model = load_model(AI_CONFIG['STRATEGY_MODEL_PATH'])
        self.position_model = load_model(AI_CONFIG['POSITION_MODEL_PATH'])
        
        # Initialize feature extractors
        self.feature_extractor = ResNet50(
            weights='imagenet',
            include_top=False,
            pooling='avg'
        )
        
        # Initialize shot analyzer
        self.shot_analyzer = ShotAnalyzer()
        
        # Load calibration data
        self.style_calibration = tf.keras.models.load_model(AI_CONFIG['STYLE_CALIBRATION_PATH'])
        self.strategy_calibration = tf.keras.models.load_model(AI_CONFIG['STRATEGY_CALIBRATION_PATH'])
        
    def analyze_game(
        self,
        game_data: Dict,
        player_id: str,
        real_time: bool = False
    ) -> Dict:
        """Analyze a game with advanced metrics and insights.
        
        Args:
            game_data: Game data including shots, positions, and outcomes
            player_id: ID of the player to analyze
            real_time: Whether to provide real-time analysis
            
        Returns:
            dict: Comprehensive game analysis
        """
        # Try to get from cache if not real-time
        if not real_time:
            cache_key = f'game_analysis:{game_data["game_id"]}:{player_id}'
            cached = cache.get(cache_key)
            if cached:
                return cached
        
        # Extract game features
        shots = game_data['shots']
        positions = game_data['positions']
        outcomes = game_data['outcomes']
        
        # Analyze patterns
        patterns = self._analyze_patterns(shots, positions, outcomes)
        
        # Calculate game metrics
        metrics = self._calculate_game_metrics(shots, positions, outcomes)
        
        # Analyze player style
        style = self._analyze_player_style(shots, positions, outcomes)
        
        # Generate heat maps
        shot_heatmap = self._generate_shot_heatmap(shots)
        position_heatmap = self._generate_position_heatmap(positions)
        
        # Generate strategic recommendations
        strategy = self._generate_strategy(
            patterns,
            metrics,
            style,
            shot_heatmap,
            position_heatmap
        )
        
        # Compile comprehensive results
        results = {
            'patterns': {
                'shot_patterns': patterns['shots'],
                'position_patterns': patterns['positions'],
                'strategy_patterns': patterns['strategies']
            },
            'metrics': {
                'shot_selection': metrics.shot_selection,
                'position_control': metrics.position_control,
                'safety_play': metrics.safety_play,
                'break_building': metrics.break_building,
                'defensive_skill': metrics.defensive_skill,
                'overall_strategy': metrics.overall_strategy
            },
            'style': {
                'aggression': style.aggression,
                'consistency': style.consistency,
                'creativity': style.creativity,
                'precision': style.precision,
                'speed': style.speed,
                'adaptability': style.adaptability
            },
            'heatmaps': {
                'shots': shot_heatmap,
                'positions': position_heatmap
            },
            'strategy': {
                'strengths': strategy['strengths'],
                'weaknesses': strategy['weaknesses'],
                'recommendations': strategy['recommendations'],
                'adaptations': strategy['adaptations']
            }
        }
        
        # Cache results if not real-time
        if not real_time:
            cache.set(cache_key, results, timeout=3600)
        
        return results
    
    def _analyze_patterns(
        self,
        shots: List[Dict],
        positions: List[Dict],
        outcomes: List[Dict]
    ) -> Dict:
        """Analyze game patterns using advanced pattern recognition."""
        # Extract shot patterns
        shot_patterns = self._extract_shot_patterns(shots)
        
        # Extract position patterns
        position_patterns = self._extract_position_patterns(positions)
        
        # Extract strategy patterns
        strategy_patterns = self._extract_strategy_patterns(
            shots,
            positions,
            outcomes
        )
        
        return {
            'shots': shot_patterns,
            'positions': position_patterns,
            'strategies': strategy_patterns
        }
    
    def _extract_shot_patterns(self, shots: List[Dict]) -> List[Dict]:
        """Extract recurring shot patterns."""
        patterns = []
        
        # Group shots by type
        shot_types = {}
        for shot in shots:
            shot_type = shot['type']
            if shot_type not in shot_types:
                shot_types[shot_type] = []
            shot_types[shot_type].append(shot)
        
        # Analyze patterns for each shot type
        for shot_type, type_shots in shot_types.items():
            # Calculate success rate
            success_rate = sum(1 for s in type_shots if s['outcome'] == 'success') / len(type_shots)
            
            # Calculate average position
            avg_position = np.mean([
                [s['start_position'][0], s['start_position'][1]]
                for s in type_shots
            ], axis=0)
            
            # Calculate position variance
            position_variance = np.var([
                [s['start_position'][0], s['start_position'][1]]
                for s in type_shots
            ], axis=0)
            
            # Identify common sequences
            sequences = self._identify_shot_sequences(type_shots)
            
            patterns.append({
                'shot_type': shot_type,
                'frequency': len(type_shots) / len(shots),
                'success_rate': success_rate,
                'avg_position': avg_position.tolist(),
                'position_variance': position_variance.tolist(),
                'common_sequences': sequences
            })
        
        return patterns
    
    def _extract_position_patterns(self, positions: List[Dict]) -> List[Dict]:
        """Extract recurring position patterns."""
        patterns = []
        
        # Calculate position transitions
        transitions = self._calculate_position_transitions(positions)
        
        # Identify key positions
        key_positions = self._identify_key_positions(positions)
        
        # Analyze position control
        control_areas = self._analyze_position_control(positions)
        
        # Combine patterns
        for key_position in key_positions:
            position_transitions = [
                t for t in transitions
                if np.allclose(t['start'], key_position['position'])
            ]
            
            patterns.append({
                'position': key_position['position'],
                'frequency': key_position['frequency'],
                'control_score': key_position['control_score'],
                'transitions': position_transitions,
                'control_area': next(
                    (a for a in control_areas if np.allclose(a['center'], key_position['position'])),
                    None
                )
            })
        
        return patterns
    
    def _extract_strategy_patterns(
        self,
        shots: List[Dict],
        positions: List[Dict],
        outcomes: List[Dict]
    ) -> List[Dict]:
        """Extract recurring strategy patterns."""
        patterns = []
        
        # Analyze decision making
        decisions = self._analyze_decision_making(shots, positions, outcomes)
        
        # Identify tactical sequences
        tactics = self._identify_tactical_sequences(shots, positions)
        
        # Analyze risk management
        risk_patterns = self._analyze_risk_patterns(shots, outcomes)
        
        # Combine patterns
        for decision in decisions:
            related_tactics = [
                t for t in tactics
                if t['context'] == decision['context']
            ]
            
            related_risks = [
                r for r in risk_patterns
                if r['situation'] == decision['context']
            ]
            
            patterns.append({
                'context': decision['context'],
                'frequency': decision['frequency'],
                'success_rate': decision['success_rate'],
                'tactics': related_tactics,
                'risk_assessment': related_risks[0] if related_risks else None
            })
        
        return patterns
    
    def _calculate_game_metrics(
        self,
        shots: List[Dict],
        positions: List[Dict],
        outcomes: List[Dict]
    ) -> GameMetrics:
        """Calculate comprehensive game metrics."""
        # Calculate shot selection score
        shot_selection = self._calculate_shot_selection(shots, outcomes)
        
        # Calculate position control score
        position_control = self._calculate_position_control(positions)
        
        # Calculate safety play score
        safety_play = self._calculate_safety_play(shots, outcomes)
        
        # Calculate break building score
        break_building = self._calculate_break_building(shots, outcomes)
        
        # Calculate defensive skill score
        defensive_skill = self._calculate_defensive_skill(shots, positions, outcomes)
        
        # Calculate overall strategy score
        overall_strategy = self._calculate_overall_strategy(
            shot_selection,
            position_control,
            safety_play,
            break_building,
            defensive_skill
        )
        
        return GameMetrics(
            shot_selection=shot_selection,
            position_control=position_control,
            safety_play=safety_play,
            break_building=break_building,
            defensive_skill=defensive_skill,
            overall_strategy=overall_strategy
        )
    
    def _analyze_player_style(
        self,
        shots: List[Dict],
        positions: List[Dict],
        outcomes: List[Dict]
    ) -> PlayerStyle:
        """Analyze player's playing style characteristics."""
        # Calculate aggression score
        aggression = self._calculate_aggression(shots, outcomes)
        
        # Calculate consistency score
        consistency = self._calculate_consistency(shots, outcomes)
        
        # Calculate creativity score
        creativity = self._calculate_creativity(shots, positions)
        
        # Calculate precision score
        precision = self._calculate_precision(shots, outcomes)
        
        # Calculate speed score
        speed = self._calculate_speed(shots, positions)
        
        # Calculate adaptability score
        adaptability = self._calculate_adaptability(shots, positions, outcomes)
        
        return PlayerStyle(
            aggression=aggression,
            consistency=consistency,
            creativity=creativity,
            precision=precision,
            speed=speed,
            adaptability=adaptability
        )
    
    def _generate_shot_heatmap(self, shots: List[Dict]) -> Dict:
        """Generate shot distribution heat map."""
        # Extract shot positions
        positions = np.array([
            [shot['start_position'][0], shot['start_position'][1]]
            for shot in shots
        ])
        
        # Calculate kernel density estimation
        if len(positions) > 1:
            kde = gaussian_kde(positions.T)
            
            # Generate grid points
            x = np.linspace(0, 1, 50)
            y = np.linspace(0, 1, 25)
            X, Y = np.meshgrid(x, y)
            xy = np.vstack([X.ravel(), Y.ravel()])
            
            # Calculate density
            Z = kde(xy).reshape(X.shape)
            
            return {
                'x': x.tolist(),
                'y': y.tolist(),
                'density': Z.tolist()
            }
        else:
            return {
                'x': [],
                'y': [],
                'density': []
            }
    
    def _generate_position_heatmap(self, positions: List[Dict]) -> Dict:
        """Generate player position heat map."""
        # Extract player positions
        pos_array = np.array([
            [pos['x'], pos['y']]
            for pos in positions
        ])
        
        # Calculate kernel density estimation
        if len(pos_array) > 1:
            kde = gaussian_kde(pos_array.T)
            
            # Generate grid points
            x = np.linspace(0, 1, 50)
            y = np.linspace(0, 1, 25)
            X, Y = np.meshgrid(x, y)
            xy = np.vstack([X.ravel(), Y.ravel()])
            
            # Calculate density
            Z = kde(xy).reshape(X.shape)
            
            return {
                'x': x.tolist(),
                'y': y.tolist(),
                'density': Z.tolist()
            }
        else:
            return {
                'x': [],
                'y': [],
                'density': []
            }
    
    def _generate_strategy(
        self,
        patterns: Dict,
        metrics: GameMetrics,
        style: PlayerStyle,
        shot_heatmap: Dict,
        position_heatmap: Dict
    ) -> Dict:
        """Generate strategic recommendations."""
        # Identify strengths
        strengths = self._identify_strengths(patterns, metrics, style)
        
        # Identify weaknesses
        weaknesses = self._identify_weaknesses(patterns, metrics, style)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            strengths,
            weaknesses,
            patterns,
            metrics,
            style
        )
        
        # Generate adaptations
        adaptations = self._generate_adaptations(
            patterns,
            metrics,
            style,
            shot_heatmap,
            position_heatmap
        )
        
        return {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'recommendations': recommendations,
            'adaptations': adaptations
        }
    
    def _identify_strengths(
        self,
        patterns: Dict,
        metrics: GameMetrics,
        style: PlayerStyle
    ) -> List[Dict]:
        """Identify player's strengths."""
        strengths = []
        
        # Analyze metrics
        if metrics.shot_selection > 0.7:
            strengths.append({
                'aspect': 'Shot Selection',
                'score': metrics.shot_selection,
                'details': 'Excellent shot selection and decision making'
            })
        
        if metrics.position_control > 0.7:
            strengths.append({
                'aspect': 'Position Control',
                'score': metrics.position_control,
                'details': 'Strong position play and table control'
            })
        
        if metrics.break_building > 0.7:
            strengths.append({
                'aspect': 'Break Building',
                'score': metrics.break_building,
                'details': 'Effective break building and run out ability'
            })
        
        # Analyze style
        if style.consistency > 0.7:
            strengths.append({
                'aspect': 'Consistency',
                'score': style.consistency,
                'details': 'High level of consistency in execution'
            })
        
        if style.precision > 0.7:
            strengths.append({
                'aspect': 'Precision',
                'score': style.precision,
                'details': 'Excellent precision and accuracy'
            })
        
        return strengths
    
    def _identify_weaknesses(
        self,
        patterns: Dict,
        metrics: GameMetrics,
        style: PlayerStyle
    ) -> List[Dict]:
        """Identify player's weaknesses."""
        weaknesses = []
        
        # Analyze metrics
        if metrics.safety_play < 0.6:
            weaknesses.append({
                'aspect': 'Safety Play',
                'score': metrics.safety_play,
                'details': 'Safety play needs improvement'
            })
        
        if metrics.defensive_skill < 0.6:
            weaknesses.append({
                'aspect': 'Defensive Skills',
                'score': metrics.defensive_skill,
                'details': 'Defensive game needs development'
            })
        
        # Analyze style
        if style.adaptability < 0.6:
            weaknesses.append({
                'aspect': 'Adaptability',
                'score': style.adaptability,
                'details': 'Could improve adaptability to different situations'
            })
        
        if style.creativity < 0.6:
            weaknesses.append({
                'aspect': 'Creativity',
                'score': style.creativity,
                'details': 'Could benefit from more creative shot selection'
            })
        
        return weaknesses
    
    def _generate_recommendations(
        self,
        strengths: List[Dict],
        weaknesses: List[Dict],
        patterns: Dict,
        metrics: GameMetrics,
        style: PlayerStyle
    ) -> List[Dict]:
        """Generate strategic recommendations."""
        recommendations = []
        
        # Generate recommendations for each weakness
        for weakness in weaknesses:
            if weakness['aspect'] == 'Safety Play':
                recommendations.append({
                    'aspect': 'Safety Play',
                    'priority': 'high',
                    'drills': [
                        'Safety shot practice',
                        'Defensive positioning drills',
                        'Risk management exercises'
                    ],
                    'tactics': [
                        'Focus on ball control in safety shots',
                        'Practice various safety options',
                        'Develop better risk assessment'
                    ]
                })
            
            elif weakness['aspect'] == 'Defensive Skills':
                recommendations.append({
                    'aspect': 'Defensive Skills',
                    'priority': 'high',
                    'drills': [
                        'Defensive shot practice',
                        'Position play drills',
                        'Tactical thinking exercises'
                    ],
                    'tactics': [
                        'Improve defensive shot selection',
                        'Work on defensive positioning',
                        'Develop tactical awareness'
                    ]
                })
            
            elif weakness['aspect'] == 'Adaptability':
                recommendations.append({
                    'aspect': 'Adaptability',
                    'priority': 'medium',
                    'drills': [
                        'Situation-based practice',
                        'Pattern recognition drills',
                        'Adaptation exercises'
                    ],
                    'tactics': [
                        'Practice different playing styles',
                        'Develop multiple approaches',
                        'Improve situation reading'
                    ]
                })
            
            elif weakness['aspect'] == 'Creativity':
                recommendations.append({
                    'aspect': 'Creativity',
                    'priority': 'medium',
                    'drills': [
                        'Creative shot practice',
                        'Problem-solving drills',
                        'Innovation exercises'
                    ],
                    'tactics': [
                        'Experiment with different shots',
                        'Practice unusual situations',
                        'Develop creative thinking'
                    ]
                })
        
        return recommendations
    
    def _generate_adaptations(
        self,
        patterns: Dict,
        metrics: GameMetrics,
        style: PlayerStyle,
        shot_heatmap: Dict,
        position_heatmap: Dict
    ) -> List[Dict]:
        """Generate situational adaptations."""
        adaptations = []
        
        # Analyze patterns for adaptation opportunities
        shot_patterns = patterns['shots']
        position_patterns = patterns['positions']
        strategy_patterns = patterns['strategies']
        
        # Generate adaptations based on patterns
        for pattern in strategy_patterns:
            if pattern['success_rate'] < 0.5:
                adaptations.append({
                    'situation': pattern['context'],
                    'current_approach': {
                        'tactics': pattern['tactics'],
                        'success_rate': pattern['success_rate']
                    },
                    'suggested_adaptations': self._suggest_adaptations(
                        pattern,
                        metrics,
                        style
                    )
                })
        
        # Generate adaptations based on position control
        weak_positions = self._identify_weak_positions(position_heatmap)
        for position in weak_positions:
            adaptations.append({
                'situation': f'Position control at {position}',
                'current_approach': {
                    'control_score': position['control_score'],
                    'frequency': position['frequency']
                },
                'suggested_adaptations': self._suggest_position_adaptations(
                    position,
                    metrics,
                    style
                )
            })
        
        return adaptations
    
    def _suggest_adaptations(
        self,
        pattern: Dict,
        metrics: GameMetrics,
        style: PlayerStyle
    ) -> List[Dict]:
        """Suggest specific adaptations for a pattern."""
        adaptations = []
        
        # Analyze pattern context
        context = pattern['context']
        current_tactics = pattern['tactics']
        
        # Generate tactical adaptations
        if 'aggressive' in context and style.aggression > 0.7:
            adaptations.append({
                'type': 'tactical',
                'description': 'Consider more conservative approach',
                'specific_changes': [
                    'Reduce risk-taking',
                    'Focus on position play',
                    'Prioritize safety when needed'
                ]
            })
        
        elif 'defensive' in context and metrics.defensive_skill < 0.6:
            adaptations.append({
                'type': 'tactical',
                'description': 'Improve defensive options',
                'specific_changes': [
                    'Develop better safety shots',
                    'Practice defensive positioning',
                    'Work on risk management'
                ]
            })
        
        # Generate technical adaptations
        technical_issues = [t for t in current_tactics if t.get('success_rate', 1) < 0.5]
        for issue in technical_issues:
            adaptations.append({
                'type': 'technical',
                'description': f'Improve execution of {issue["name"]}',
                'specific_changes': [
                    'Practice specific technique',
                    'Focus on consistency',
                    'Develop better control'
                ]
            })
        
        return adaptations
    
    def _suggest_position_adaptations(
        self,
        position: Dict,
        metrics: GameMetrics,
        style: PlayerStyle
    ) -> List[Dict]:
        """Suggest adaptations for position control."""
        adaptations = []
        
        # Analyze position characteristics
        location = position['position']
        control_score = position['control_score']
        
        # Generate positional adaptations
        if control_score < 0.5:
            adaptations.append({
                'type': 'positional',
                'description': 'Improve position control',
                'specific_changes': [
                    'Practice position play',
                    'Develop better angle awareness',
                    'Work on cue ball control'
                ]
            })
        
        # Generate strategic adaptations
        if metrics.position_control < 0.6:
            adaptations.append({
                'type': 'strategic',
                'description': 'Enhance strategic positioning',
                'specific_changes': [
                    'Study table patterns',
                    'Practice position routes',
                    'Improve planning'
                ]
            })
        
        return adaptations
    
    def _identify_weak_positions(self, position_heatmap: Dict) -> List[Dict]:
        """Identify positions with weak control."""
        weak_positions = []
        
        # Analyze position density
        if position_heatmap['density']:
            density = np.array(position_heatmap['density'])
            x = np.array(position_heatmap['x'])
            y = np.array(position_heatmap['y'])
            
            # Find low density areas
            low_density_mask = density < np.mean(density) - np.std(density)
            for i, j in zip(*np.where(low_density_mask)):
                weak_positions.append({
                    'position': [x[j], y[i]],
                    'control_score': float(density[i, j]),
                    'frequency': float(density[i, j] / np.max(density))
                })
        
        return weak_positions 