"""Game analysis service for pattern recognition and performance analytics."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import numpy as np
from models.game_state import GameState
from models.player import Player
from services.game_strategy import GameStrategy
from services.shot_analysis import ShotAnalysis
from src.core.config import AI_CONFIG
from tensorflow.keras.models import load_model


@dataclass
class GamePattern:
    """Pattern detected in gameplay."""

    pattern_type: str  # Type of pattern (e.g., "shot_selection", "position_play")
    frequency: float  # How often pattern occurs (0-1)
    effectiveness: float  # How effective the pattern is (0-1)
    context: Dict[str, Any]  # Context when pattern occurs
    impact: float  # Impact on game outcome (-1 to 1)
    confidence: float  # Confidence in pattern detection (0-1)


@dataclass
class PerformanceMetrics:
    """Detailed performance metrics for analysis."""

    shot_accuracy: float  # Overall shot success rate
    position_control: float  # Quality of position play
    safety_effectiveness: float  # Effectiveness of safety plays
    break_success: float  # Success rate on break shots
    avg_difficulty: float  # Average shot difficulty attempted
    completion_rate: float  # Frame completion rate
    pressure_handling: float  # Performance under pressure
    consistency: float  # Consistency of play
    adaptability: float  # Ability to adapt to conditions
    strategic_rating: float  # Quality of strategic decisions


@dataclass
class GameAnalysis:
    """Complete analysis of a game or series of games."""

    patterns: List[GamePattern]  # Detected gameplay patterns
    metrics: PerformanceMetrics  # Performance metrics
    strengths: List[str]  # Identified strengths
    weaknesses: List[str]  # Areas for improvement
    recommendations: List[str]  # Strategic recommendations
    prediction: Dict[str, float]  # Predicted outcomes
    confidence: float  # Overall confidence in analysis


class GameAnalysisService:
    """Service for analyzing games and detecting patterns."""

    def __init__(self):
        """Initialize the game analysis service."""
        # Load ML models
        self.pattern_detector = load_model(AI_CONFIG["pattern_detector_path"])
        self.performance_analyzer = load_model(AI_CONFIG["performance_analyzer_path"])
        self.outcome_predictor = load_model(AI_CONFIG["outcome_predictor_path"])

        # Initialize related services
        self.shot_analysis = ShotAnalysis()
        self.game_strategy = GameStrategy()

        # Analysis parameters
        self.pattern_threshold = 0.6  # Minimum confidence for pattern detection
        self.metric_window = 20  # Number of shots for rolling metrics
        self.prediction_horizon = 5  # Number of frames for prediction

    async def analyze_game(
        self, game_states: List[GameState], player: Player, opponent: Player
    ) -> GameAnalysis:
        """Analyze a complete game or series of games.

        Args:
            game_states: List of game states to analyze
            player: Player to analyze
            opponent: Opponent player

        Returns:
            GameAnalysis containing patterns, metrics, and recommendations
        """
        # Detect patterns
        patterns = await self._detect_patterns(game_states, player)

        # Calculate performance metrics
        metrics = await self._calculate_metrics(game_states, player)

        # Identify strengths and weaknesses
        strengths = self._identify_strengths(patterns, metrics)
        weaknesses = self._identify_weaknesses(patterns, metrics)

        # Generate recommendations
        recommendations = self._generate_recommendations(
            patterns, metrics, strengths, weaknesses
        )

        # Predict outcomes
        prediction = await self._predict_outcomes(game_states, player, opponent)

        # Calculate confidence
        confidence = self._calculate_confidence(patterns, metrics, prediction)

        return GameAnalysis(
            patterns=patterns,
            metrics=metrics,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations,
            prediction=prediction,
            confidence=confidence,
        )

    async def _detect_patterns(self, game_states: List[GameState], player: Player):
        """Detect patterns in gameplay."""
        patterns = []

        # Extract features for pattern detection
        features = self._extract_pattern_features(game_states)

        # Get model predictions
        predictions = self.pattern_detector.predict(features)

        # Process each detected pattern
        for pred in predictions:
            if pred[0] >= self.pattern_threshold:
                pattern = await self._analyze_pattern(pred, game_states, player)
                if pattern:
                    patterns.append(pattern)

        return patterns

    async def _calculate_metrics(
        self, game_states: List[GameState], player: Player
    ) -> PerformanceMetrics:
        """Calculate detailed performance metrics."""
        # Extract features for performance analysis
        features = self._extract_performance_features(game_states, player)

        # Get model predictions
        self.performance_analyzer.predict(features)

        # Calculate base metrics
        shot_accuracy = self._calculate_shot_accuracy(game_states, player)
        position_control = self._calculate_position_control(game_states, player)
        safety_effectiveness = self._calculate_safety_effectiveness(game_states, player)

        # Calculate advanced metrics
        break_success = self._calculate_break_success(game_states, player)
        avg_difficulty = self._calculate_average_difficulty(game_states, player)
        completion_rate = self._calculate_completion_rate(game_states, player)

        # Calculate mental game metrics
        pressure_handling = self._calculate_pressure_handling(game_states, player)
        consistency = self._calculate_consistency(game_states, player)
        adaptability = self._calculate_adaptability(game_states, player)

        # Calculate strategic metrics
        strategic_rating = self._calculate_strategic_rating(game_states, player)

        return PerformanceMetrics(
            shot_accuracy=shot_accuracy,
            position_control=position_control,
            safety_effectiveness=safety_effectiveness,
            break_success=break_success,
            avg_difficulty=avg_difficulty,
            completion_rate=completion_rate,
            pressure_handling=pressure_handling,
            consistency=consistency,
            adaptability=adaptability,
            strategic_rating=strategic_rating,
        )

    def _identify_strengths(
        self, patterns: List[GamePattern], metrics: PerformanceMetrics
    ):
        """Identify player strengths based on patterns and metrics."""
        strengths = []

        # Check pattern-based strengths
        for pattern in patterns:
            if pattern.effectiveness > 0.7:
                strengths.append(
                    f"Effective {pattern.pattern_type} pattern "
                    f"(Success rate: {pattern.effectiveness:.0%})"
                )

        # Check metric-based strengths
        if metrics.shot_accuracy > 0.8:
            strengths.append(f"High shot accuracy ({metrics.shot_accuracy:.0%})")

        if metrics.position_control > 0.7:
            strengths.append(f"Strong position play ({metrics.position_control:.0%})")

        if metrics.safety_effectiveness > 0.75:
            strengths.append(
                f"Effective safety play ({metrics.safety_effectiveness:.0%})"
            )

        if metrics.pressure_handling > 0.7:
            strengths.append(f"Good under pressure ({metrics.pressure_handling:.0%})")

        if metrics.consistency > 0.8:
            strengths.append(f"Highly consistent ({metrics.consistency:.0%})")

        return strengths

    def _identify_weaknesses(
        self, patterns: List[GamePattern], metrics: PerformanceMetrics
    ) -> List[str]:
        """Identify areas for improvement."""
        weaknesses = []

        # Check pattern-based weaknesses
        for pattern in patterns:
            if pattern.effectiveness < 0.4:
                weaknesses.append(
                    f"Ineffective {pattern.pattern_type} pattern "
                    f"(Success rate: {pattern.effectiveness:.0%})"
                )

        # Check metric-based weaknesses
        if metrics.shot_accuracy < 0.6:
            weaknesses.append(f"Low shot accuracy ({metrics.shot_accuracy:.0%})")

        if metrics.position_control < 0.5:
            weaknesses.append(f"Weak position play ({metrics.position_control:.0%})")

        if metrics.safety_effectiveness < 0.5:
            weaknesses.append(
                f"Ineffective safety play ({metrics.safety_effectiveness:.0%})"
            )

        if metrics.pressure_handling < 0.5:
            weaknesses.append(
                f"Struggles under pressure ({metrics.pressure_handling:.0%})"
            )

        if metrics.consistency < 0.6:
            weaknesses.append(f"Inconsistent play ({metrics.consistency:.0%})")

        return weaknesses

    def _generate_recommendations(
        self,
        patterns: List[GamePattern],
        metrics: PerformanceMetrics,
        strengths: List[str],
        weaknesses: List[str],
    ) -> List[str]:
        """Generate strategic recommendations."""
        recommendations = []

        # Pattern-based recommendations
        for pattern in patterns:
            if pattern.effectiveness < 0.5:
                recommendations.append(
                    f"Avoid {pattern.pattern_type} pattern in "
                    f"{pattern.context.get('situation', 'similar situations')}"
                )
            elif pattern.effectiveness > 0.8:
                recommendations.append(
                    f"Continue utilizing {pattern.pattern_type} pattern in "
                    f"{pattern.context.get('situation', 'similar situations')}"
                )

        # Metric-based recommendations
        if metrics.shot_accuracy < 0.7:
            recommendations.append("Focus on fundamentals and shot consistency")

        if metrics.position_control < 0.6:
            recommendations.append("Practice position play and cue ball control")

        if metrics.safety_effectiveness < 0.6:
            recommendations.append("Develop defensive game and safety play options")

        if metrics.pressure_handling < 0.6:
            recommendations.append("Work on mental game and pressure situations")

        # Strategic recommendations
        if metrics.avg_difficulty > 0.7 and metrics.completion_rate < 0.5:
            recommendations.append("Consider taking higher percentage shots")

        if metrics.strategic_rating < 0.6:
            recommendations.append(
                "Focus on game planning and strategic decision-making"
            )

        return recommendations

    async def _predict_outcomes(
        self, game_states: List[GameState], player: Player, opponent: Player
    ) -> Dict[str, float]:
        """Predict future outcomes."""
        # Extract features for prediction
        features = self._extract_prediction_features(game_states, player, opponent)

        # Get model predictions
        predictions = self.outcome_predictor.predict(features)

        return {
            "win_probability": float(predictions[0]),
            "expected_frames": float(predictions[1]),
            "confidence": float(predictions[2]),
        }

    def _calculate_confidence(
        self,
        patterns: List[GamePattern],
        metrics: PerformanceMetrics,
        prediction: Dict[str, float],
    ):
        """Calculate overall confidence in analysis."""
        # Pattern confidence
        pattern_confidence = np.mean([p.confidence for p in patterns])

        # Metrics confidence based on sample size
        metrics_confidence = min(1.0, self.metric_window / 30)

        # Prediction confidence
        prediction_confidence = prediction.get("confidence", 0.5)

        # Weighted average
        confidence = (
            0.4 * pattern_confidence
            + 0.4 * metrics_confidence
            + 0.2 * prediction_confidence
        )

        return max(0.0, min(1.0, confidence))

    def _extract_pattern_features(self, game_states: List[GameState]):
        """Extract features for pattern detection."""
        features = []

        for state in game_states:
            # Game state features
            features.extend(
                [
                    state.score_difference / 10,  # Normalize score
                    state.remaining_balls / 15,  # Normalize remaining balls
                    state.difficulty_rating,
                ]
            )

            # Shot features
            if state.last_shot:
                features.extend(
                    [
                        state.last_shot.success,
                        state.last_shot.difficulty,
                        state.last_shot.position_quality,
                    ]
                )
            else:
                features.extend([0, 0, 0])

        return np.array(features).reshape(1, -1)

    def _extract_performance_features(
        self, game_states: List[GameState], player: Player
    ) -> np.ndarray:
        """Extract features for performance analysis."""
        features = []

        # Player features
        features.extend(
            [
                player.skill_level / 100,
                player.consistency / 100,
                player.risk_tolerance / 100,
            ]
        )

        # Game features
        for state in game_states[-self.metric_window :]:
            features.extend(
                [
                    state.score_difference / 10,
                    state.remaining_balls / 15,
                    state.difficulty_rating,
                ]
            )

        return np.array(features).reshape(1, -1)

    def _extract_prediction_features(
        self, game_states: List[GameState], player: Player, opponent: Player
    ) -> np.ndarray:
        """Extract features for outcome prediction."""
        features = []

        # Player comparison features
        features.extend(
            [
                player.skill_level / opponent.skill_level,
                player.consistency / opponent.consistency,
                player.risk_tolerance / opponent.risk_tolerance,
            ]
        )

        # Recent performance features
        recent_states = game_states[-self.prediction_horizon :]
        for state in recent_states:
            features.extend(
                [
                    state.score_difference / 10,
                    state.remaining_balls / 15,
                    state.difficulty_rating,
                ]
            )

        return np.array(features).reshape(1, -1)

    def _calculate_shot_accuracy(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate overall shot accuracy."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        return sum(1 for shot in shots if shot.success) / len(shots)

    def _calculate_position_control(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate position play effectiveness."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        return np.mean([shot.position_quality for shot in shots])

    def _calculate_safety_effectiveness(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate effectiveness of safety plays."""
        safeties = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if (
                state.last_shot
                and state.last_shot.player_id == player.id
                and state.last_shot.type == "safety"
            )
        ]

        if not safeties:
            return 0.0

        return np.mean([safety.defensive_success for safety in safeties])

    def _calculate_break_success(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate success rate on break shots."""
        breaks = [
            state.last_shot
            for state in game_states
            if (
                state.last_shot
                and state.last_shot.player_id == player.id
                and state.last_shot.type == "break"
            )
        ]

        if not breaks:
            return 0.0

        return sum(1 for brk in breaks if brk.success) / len(breaks)

    def _calculate_average_difficulty(
        self, game_states: List[GameState], player: Player
    ):
        """Calculate average difficulty of attempted shots."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        return np.mean([shot.difficulty for shot in shots])

    def _calculate_completion_rate(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate frame completion rate."""
        frames = [state for state in game_states if state.frame_complete]

        if not frames:
            return 0.0

        player_wins = sum(1 for frame in frames if frame.winner_id == player.id)

        return player_wins / len(frames)

    def _calculate_pressure_handling(
        self, game_states: List[GameState], player: Player
    ):
        """Calculate performance under pressure."""
        pressure_shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if (
                state.last_shot
                and state.last_shot.player_id == player.id
                and state.last_shot.pressure_situation
            )
        ]

        if not pressure_shots:
            return 0.0

        return sum(1 for shot in pressure_shots if shot.success) / len(pressure_shots)

    def _calculate_consistency(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate consistency of play."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        # Calculate rolling success rate
        success_rates = []
        window = 5
        for i in range(len(shots) - window + 1):
            window_shots = shots[i : i + window]
            rate = sum(1 for shot in window_shots if shot.success) / window
            success_rates.append(rate)

        # Consistency is inverse of standard deviation
        if not success_rates:
            return 0.0

        std_dev = np.std(success_rates)
        return max(0.0, min(1.0, 1 - std_dev))

    def _calculate_adaptability(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate ability to adapt to different situations."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        # Group shots by type
        shot_types = {}
        for shot in shots:
            if shot.type not in shot_types:
                shot_types[shot.type] = []
            shot_types[shot.type].append(shot.success)

        # Calculate success rate for each shot type
        type_rates = []
        for successes in shot_types.values():
            if successes:
                rate = sum(1 for s in successes if s) / len(successes)
                type_rates.append(rate)

        if not type_rates:
            return 0.0

        # Adaptability is average success rate across different shot types
        return np.mean(type_rates)

    def _calculate_strategic_rating(
        self, game_states: List[GameState], player: Player
    ) -> float:
        """Calculate quality of strategic decisions."""
        shots = [
            state.last_shot
            for state in game_states[-self.metric_window :]
            if state.last_shot and state.last_shot.player_id == player.id
        ]

        if not shots:
            return 0.0

        # Factors affecting strategic rating
        position_quality = np.mean([shot.position_quality for shot in shots])
        risk_reward = np.mean(
            [shot.success_probability / max(0.1, shot.difficulty) for shot in shots]
        )
        situation_handling = np.mean(
            [shot.strategic_value for shot in shots if hasattr(shot, "strategic_value")]
        )

        # Combine factors
        strategic_rating = (
            0.4 * position_quality + 0.3 * risk_reward + 0.3 * situation_handling
        )

        return max(0.0, min(1.0, strategic_rating))

    async def _analyze_pattern(
        self, prediction: np.ndarray, game_states: List[GameState], player: Player
    ) -> Optional[GamePattern]:
        """Analyze a detected pattern in detail."""
        # Extract pattern type and base confidence
        pattern_type = self._get_pattern_type(prediction)
        base_confidence = float(prediction[0])

        if not pattern_type:
            return None

        # Analyze pattern frequency
        frequency = self._calculate_pattern_frequency(pattern_type, game_states, player)

        # Analyze effectiveness
        effectiveness = self._calculate_pattern_effectiveness(
            pattern_type, game_states, player
        )

        # Get pattern context
        context = self._get_pattern_context(pattern_type, game_states, player)

        # Calculate impact
        impact = self._calculate_pattern_impact(pattern_type, game_states, player)

        # Adjust confidence based on sample size
        confidence = self._adjust_confidence(
            base_confidence, frequency, len(game_states)
        )

        return GamePattern(
            pattern_type=pattern_type,
            frequency=frequency,
            effectiveness=effectiveness,
            context=context,
            impact=impact,
            confidence=confidence,
        )

    def _get_pattern_type(self, prediction: np.ndarray):
        """Get the type of pattern from prediction."""
        # Implementation would map prediction to pattern type
        pass

    def _calculate_pattern_frequency(
        self, pattern_type: str, game_states: List[GameState], player: Player
    ):
        """Calculate how often a pattern occurs."""
        # Implementation would calculate pattern frequency
        pass

    def _calculate_pattern_effectiveness(
        self, pattern_type: str, game_states: List[GameState], player: Player
    ):
        """Calculate how effective a pattern is."""
        # Implementation would calculate pattern effectiveness
        pass

    def _get_pattern_context(
        self, pattern_type: str, game_states: List[GameState], player: Player
    ) -> Dict[str, Any]:
        """Get the context in which a pattern occurs."""
        # Implementation would determine pattern context
        pass

    def _calculate_pattern_impact(
        self, pattern_type: str, game_states: List[GameState], player: Player
    ):
        """Calculate the impact of a pattern on game outcome."""
        # Implementation would calculate pattern impact
        pass

    def _adjust_confidence(
        self, base_confidence: float, frequency: float, sample_size: int
    ):
        """Adjust confidence based on sample size."""
        # Implementation would adjust confidence
        pass
