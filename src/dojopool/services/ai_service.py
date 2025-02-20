from flask_caching import Cache
from multiprocessing import Pool
from flask_caching import Cache
from multiprocessing import Pool
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler

from ..core.ai.config import AIConfig, default_config
from ..core.ai.monitoring import AIMetricsTimer, AIMonitor
from ..core.cache import cache
from ..models.analytics import GameMetrics, UserMetrics
from ..models.match import Match
from ..models.shot import Shot
from ..models.user import User
from ..utils.data_processing import normalize_data, prepare_features
from ..utils.prompt_templates import STORY_PROMPT_TEMPLATE, get_story_template

CACHE_TTL = 3600  # 1 hour
CACHE_PREFIX = "ai:"


class AIServiceError(Exception):
    """Base exception for AI service errors."""

    pass


class ModelError(AIServiceError):
    """Error during model prediction."""

    pass


class DataError(AIServiceError):
    """Error with input data."""

    pass


class AIService:
    """AI service for game analysis and predictions."""

    def __init__(self, config: Optional[AIConfig] = None):
        """Initialize AI service."""
        self.config = config or default_config
        self.monitor = AIMonitor()
        self.scaler = StandardScaler()
        self._initialize_models()

    def _initialize_models(self):
        """Initialize ML models with configuration and monitoring."""
        try:
            start_time = datetime.utcnow()

            self.anomaly_detector = IsolationForest(
                n_estimators=self.config.model.n_estimators,
                random_state=self.config.model.random_state,
                max_samples=self.config.model.max_samples,
            )

            self.performance_predictor = RandomForestRegressor(
                n_estimators=self.config.model.n_estimators,
                random_state=self.config.model.random_state,
            )

            # Record model load time
            duration = (datetime.utcnow() - start_time).total_seconds()
            self.monitor.record_model_load("isolation_forest", duration)
            self.monitor.record_model_load("random_forest", duration)

        except Exception as e:
            self.monitor.record_prediction("model_init", 0, error=str(e))
            raise ModelError(f"Failed to initialize models: {str(e)}")

    def generate_story(
        self, user_id: int, match_id: int, context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate a personalized story based on match and user context."""
        cache_key = f"{CACHE_PREFIX}story:{match_id}:{user_id}"
        result = cache.get(cache_key)

        if result is None:
            # Get user data
            user = User.query.get(user_id)
            match = Match.query.get(match_id)

            # Get user's match history
            recent_matches = (
                Match.query.filter_by(user_id=user_id)
                .order_by(Match.created_at.desc())
                .limit(5)
                .all()
            )

            # Get user's performance metrics
            metrics = (
                UserMetrics.query.filter_by(user_id=user_id, metric_type="performance")
                .order_by(UserMetrics.date.desc())
                .limit(10)
                .all()
            )

            # Build rich context
            story_context = {
                "user_name": user.username,
                "user_level": user.level,
                "match_type": match.type,
                "match_duration": match.duration,
                "match_score": match.score,
                "recent_matches": [m.to_dict() for m in recent_matches],
                "performance_trend": [m.value for m in metrics],
                "additional_context": context or {},
            }

            # Generate story using template
            story = self._generate_story_from_template(story_context)

            result = {
                "story": story,
                "context": story_context,
                "generated_at": datetime.utcnow().isoformat(),
            }

            cache.set(cache_key, result, timeout=CACHE_TTL)

        return result

    def get_personalized_recommendations(
        self, user_id: int, recommendation_type: str = "training"
    ):
        """Get personalized recommendations with monitoring."""
        with AIMetricsTimer(self.monitor, f"recommendations_{recommendation_type}"):
            try:
                # Get user data
                user = User.get(user_id)
                if not user:
                    raise DataError(f"User {user_id} not found")

                # Get user metrics
                metrics = UserMetrics.get_recent(user_id)
                if not metrics:
                    raise DataError(f"No metrics found for user {user_id}")

                # Prepare features
                features = prepare_features(metrics)
                normalized_features = normalize_data(features)

                # Generate recommendations
                return self._generate_recommendations(
                    normalized_features, recommendation_type
                )

            except Exception as e:
                self.monitor.record_prediction(
                    f"recommendations_{recommendation_type}", 0, error=str(e)
                )
                raise

    def analyze_match(self, match_id: int, analysis_type: str = "full"):
        """Analyze a match with monitoring."""
        with AIMetricsTimer(self.monitor, f"match_analysis_{analysis_type}") as timer:
            cache_key = f"{self.config.cache.prefix}match:{match_id}:{analysis_type}"

            # Try to get from cache first
            cached_result = cache.get(cache_key)
            if cached_result:
                self.monitor.record_prediction(
                    f"match_analysis_{analysis_type}", 0, cache_hit=True
                )
                return cached_result

            try:
                # Get match data
                match = Match.get(match_id)
                if not match:
                    raise DataError(f"Match {match_id} not found")

                # Validate data
                if (
                    not match.shots
                    or len(match.shots) < self.config.analysis.min_shots_required
                ):
                    raise DataError(f"Insufficient shot data for match {match_id}")

                # Perform analysis based on type
                if analysis_type == "full":
                    result = self._perform_full_analysis(match)
                elif analysis_type == "basic":
                    result = self._perform_basic_analysis(match)
                else:
                    raise ValueError(f"Invalid analysis type: {analysis_type}")

                # Cache result
                cache.set(cache_key, result, ttl=self.config.cache.ttl)
                return result

            except Exception as e:
                timer.error = str(e)
                raise

    def get_difficulty_adjustment(self, user_id: int, game_id: int):
        """Calculate adaptive difficulty adjustment based on user performance."""
        # Get user's recent performance
        recent_matches = (
            Match.query.filter_by(user_id=user_id, game_id=game_id)
            .order_by(Match.created_at.desc())
            .limit(10)
            .all()
        )

        # Calculate performance metrics
        scores = [match.score for match in recent_matches]
        win_rate = sum(1 for match in recent_matches if match.won) / len(recent_matches)
        avg_duration = sum(match.duration for match in recent_matches) / len(
            recent_matches
        )

        # Calculate difficulty adjustment
        base_difficulty = self._calculate_base_difficulty(scores, win_rate)
        adjustments = self._calculate_adjustments(base_difficulty, avg_duration)

        return {
            "base_difficulty": base_difficulty,
            "adjustments": adjustments,
            "recommended_settings": self._get_recommended_settings(
                base_difficulty, adjustments
            ),
        }

    def _generate_story_from_template(self, context: Dict[str, Any]) -> str:
        """Generate story using template and context."""
        # Implement story generation logic using templates and NLP
        story = STORY_PROMPT_TEMPLATE.format(**context)
        return story

    def _generate_recommendations(self, features: np.ndarray, recommendation_type: str):
        """Generate recommendations based on user features."""
        # Implement recommendation logic using ML model
        predictions = self.performance_predictor.predict(features)
        return self._format_recommendations(predictions, recommendation_type)

    def _prepare_match_data(self, match: Match, metrics: List[GameMetrics]):
        """Prepare match data for analysis."""
        return {
            "match_details": match.to_dict(),
            "metrics": [metric.to_dict() for metric in metrics],
            "timeline": self._generate_match_timeline(match),
        }

    def _perform_full_analysis(self, match: Match):
        """Perform comprehensive match analysis."""
        match_data = self._prepare_match_data(match, match.metrics)
        return {
            "performance_analysis": self._analyze_performance(match_data),
            "strategy_analysis": self._analyze_strategy(match_data),
            "improvement_suggestions": self._generate_suggestions(match_data),
        }

    def _analyze_performance(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze player performance metrics."""
        metrics = match_data["metrics"]

        # Detect performance anomalies
        anomalies = self.anomaly_detector.fit_predict([[m["value"] for m in metrics]])

        return {
            "metrics_summary": self._summarize_metrics(metrics),
            "anomalies": self._format_anomalies(anomalies),
            "performance_trends": self._analyze_trends(metrics),
        }

    def _analyze_strategy(self, match_data: Dict[str, Any]):
        """Analyze player strategy and decision making."""
        timeline = match_data["timeline"]

        return {
            "key_moments": self._identify_key_moments(timeline),
            "strategy_patterns": self._analyze_patterns(timeline),
            "decision_analysis": self._analyze_decisions(timeline),
        }

    def _calculate_base_difficulty(self, scores: List[float], win_rate: float):
        """Calculate base difficulty level."""
        score_factor = np.mean(scores) / 100
        return 0.4 + (0.4 * win_rate) + (0.2 * score_factor)

    def _calculate_adjustments(self, base_difficulty: float, avg_duration: float):
        """Calculate specific difficulty adjustments."""
        return {
            "speed": self._adjust_speed(base_difficulty, avg_duration),
            "complexity": self._adjust_complexity(base_difficulty),
            "assistance": self._adjust_assistance(base_difficulty),
        }

    def _get_recommended_settings(
        self, base_difficulty: float, adjustments: Dict[str, float]
    ) -> Dict[str, Any]:
        """Get recommended game settings based on difficulty analysis."""
        return {
            "game_speed": round(adjustments["speed"] * 100),
            "complexity_level": round(adjustments["complexity"] * 5),
            "assistance_level": round(adjustments["assistance"] * 5),
            "target_score": round(base_difficulty * 1000),
        }

    def _format_recommendations(
        self, predictions: np.ndarray, recommendation_type: str
    ):
        """Format model predictions into actionable recommendations."""
        recommendations = []

        if recommendation_type == "training":
            # Generate training recommendations
            for pred in predictions:
                recommendation = {
                    "type": "training",
                    "focus_area": self._determine_focus_area(pred),
                    "difficulty": self._calculate_training_difficulty(pred),
                    "exercises": self._suggest_exercises(pred),
                    "duration": self._recommend_duration(pred),
                }
                recommendations.append(recommendation)
        elif recommendation_type == "strategy":
            # Generate strategy recommendations
            for pred in predictions:
                recommendation = {
                    "type": "strategy",
                    "pattern": self._identify_pattern(pred),
                    "suggestions": self._generate_strategy_suggestions(pred),
                    "priority": self._calculate_priority(pred),
                }
                recommendations.append(recommendation)

        return recommendations

    def _generate_match_timeline(self, match: Match):
        """Generate a detailed timeline of match events."""
        timeline = []

        # Get all shots in chronological order
        shots = match.shots.order_by(Shot.timestamp).all()

        for shot in shots:
            event = {
                "type": "shot",
                "timestamp": shot.timestamp.isoformat(),
                "position": shot.position,
                "target": shot.target,
                "result": shot.result,
                "duration": shot.duration,
                "difficulty": shot.difficulty,
                "spin": shot.spin,
                "power": shot.power,
            }
            timeline.append(event)

            # Add significant events
            if shot.result == "made" and shot.difficulty >= 0.8:
                timeline.append(
                    {
                        "type": "highlight",
                        "timestamp": shot.timestamp.isoformat(),
                        "description": "Excellent difficult shot",
                        "details": {
                            "difficulty": shot.difficulty,
                            "shot_type": shot.type,
                        },
                    }
                )

        return timeline

    def _summarize_metrics(self, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize performance metrics."""
        if not metrics:
            return {}

        summary = {}
        metric_values = {}

        # Group metrics by type
        for metric in metrics:
            metric_type = metric["type"]
            if metric_type not in metric_values:
                metric_values[metric_type] = []
            metric_values[metric_type].append(metric["value"])

        # Calculate summary statistics for each metric type
        for metric_type, values in metric_values.items():
            values_array = np.array(values)
            summary[metric_type] = {
                "mean": float(np.mean(values_array)),
                "std": float(np.std(values_array)),
                "min": float(np.min(values_array)),
                "max": float(np.max(values_array)),
                "trend": self._calculate_trend(values_array),
            }

        return summary

    def _format_anomalies(self, anomalies: np.ndarray):
        """Format anomaly detection results."""
        formatted_anomalies = []

        for i, is_anomaly in enumerate(anomalies):
            if is_anomaly == -1:  # Anomaly detected
                formatted_anomalies.append(
                    {
                        "index": i,
                        "severity": "high" if i % 3 == 0 else "medium",
                        "confidence": 0.8 + (i % 3) * 0.1,
                    }
                )

        return formatted_anomalies

    def _analyze_trends(self, metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze trends in performance metrics."""
        trends = {}

        if not metrics:
            return trends

        # Group metrics by type
        metric_groups = {}
        for metric in metrics:
            metric_type = metric["type"]
            if metric_type not in metric_groups:
                metric_groups[metric_type] = []
            metric_groups[metric_type].append(metric)

        # Analyze trends for each metric type
        for metric_type, group in metric_groups.items():
            values = [m["value"] for m in group]
            timestamps = [m["timestamp"] for m in group]

            trends[metric_type] = {
                "direction": self._calculate_trend_direction(values),
                "strength": self._calculate_trend_strength(values),
                "consistency": self._calculate_consistency(values),
                "recent_change": self._calculate_recent_change(values),
                "period_comparison": self._compare_periods(values, timestamps),
            }

        return trends

    def _identify_key_moments(self, timeline: List[Dict[str, Any]]):
        """Identify key moments in the match timeline."""
        key_moments = []

        if not timeline:
            return key_moments

        # Track state for identifying patterns
        current_streak = 0
        last_result = None

        for i, event in enumerate(timeline):
            if event["type"] == "shot":
                # Check for difficult shots
                if event["difficulty"] >= 0.8:
                    key_moments.append(
                        {
                            "type": "difficult_shot",
                            "timestamp": event["timestamp"],
                            "details": event,
                        }
                    )

                # Track streaks
                if last_result == event["result"]:
                    current_streak += 1
                    if current_streak >= 3:
                        key_moments.append(
                            {
                                "type": "streak",
                                "result": event["result"],
                                "length": current_streak,
                                "timestamp": event["timestamp"],
                            }
                        )
                else:
                    current_streak = 1
                    last_result = event["result"]

                # Check for turning points
                if i > 0 and i < len(timeline) - 1:
                    if self._is_turning_point(timeline[i - 1 : i + 2]):
                        key_moments.append(
                            {
                                "type": "turning_point",
                                "timestamp": event["timestamp"],
                                "context": timeline[i - 1 : i + 2],
                            }
                        )

        return key_moments

    def _analyze_patterns(self, timeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze patterns in player's strategy and shots."""
        patterns = []

        if not timeline:
            return patterns

        # Extract shot sequences
        shot_sequences = []
        current_sequence = []

        for event in timeline:
            if event["type"] == "shot":
                current_sequence.append(event)
            else:
                if len(current_sequence) >= 3:
                    shot_sequences.append(current_sequence)
                current_sequence = []

        # Analyze each sequence
        for sequence in shot_sequences:
            pattern = {
                "type": "shot_sequence",
                "length": len(sequence),
                "accuracy": sum(1 for shot in sequence if shot["result"] == "made")
                / len(sequence),
                "avg_difficulty": np.mean([shot["difficulty"] for shot in sequence]),
                "position_pattern": self._analyze_position_pattern(
                    [shot["position"] for shot in sequence]
                ),
                "timing_pattern": self._analyze_timing_pattern(
                    [shot["duration"] for shot in sequence]
                ),
            }
            patterns.append(pattern)

        return patterns

    def _analyze_decisions(self, timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze decision making patterns."""
        decisions = {
            "shot_selection": self._analyze_shot_selection(timeline),
            "risk_taking": self._analyze_risk_taking(timeline),
            "position_play": self._analyze_position_play(timeline),
            "time_management": self._analyze_time_management(timeline),
        }

        return decisions

    def _adjust_speed(self, base_difficulty: float, avg_duration: float):
        """Calculate speed adjustment factor."""
        speed_factor = 1.0

        # Adjust based on base difficulty
        speed_factor *= 1.0 + base_difficulty * 0.5

        # Adjust based on average shot duration
        if avg_duration > 30:  # Too slow
            speed_factor *= 1.2
        elif avg_duration < 10:  # Too fast
            speed_factor *= 0.8

        return min(max(speed_factor, 0.5), 2.0)

    def _adjust_complexity(self, base_difficulty: float) -> float:
        """Calculate complexity adjustment factor."""
        return min(max(base_difficulty * 1.5, 0.3), 1.0)

    def _adjust_assistance(self, base_difficulty: float):
        """Calculate assistance level adjustment."""
        return max(1.0 - base_difficulty, 0.0)

    def _calculate_trend_direction(self, values: List[float]) -> str:
        """Calculate the direction of a trend."""
        if len(values) < 2:
            return "stable"

        slope = np.polyfit(range(len(values)), values, 1)[0]
        if slope > 0.05:
            return "improving"
        elif slope < -0.05:
            return "declining"
        return "stable"

    def _calculate_trend_strength(self, values: List[float]) -> float:
        """Calculate the strength of a trend."""
        if len(values) < 2:
            return 0.0

        slope = np.polyfit(range(len(values)), values, 1)[0]
        return abs(slope)

    def _calculate_consistency(self, values: List[float]):
        """Calculate consistency score."""
        if not values:
            return 0.0

        return 1.0 - (np.std(values) / (np.mean(values) + 1e-6))

    def _calculate_recent_change(self, values: List[float]) -> float:
        """Calculate recent change in performance."""
        if len(values) < 2:
            return 0.0

        recent = np.mean(values[-3:])
        previous = np.mean(values[:-3])
        return (recent - previous) / (previous + 1e-6)

    def _compare_periods(
        self, values: List[float], timestamps: List[str]
    ) -> Dict[str, float]:
        """Compare performance between different periods."""
        if len(values) < 6:
            return {}

        half = len(values) // 2
        recent_half = values[half:]
        previous_half = values[:half]

        return {
            "improvement": float(np.mean(recent_half) - np.mean(previous_half)),
            "consistency_change": float(np.std(recent_half) - np.std(previous_half)),
        }

    def _is_turning_point(self, events: List[Dict[str, Any]]) -> bool:
        """Determine if a sequence represents a turning point."""
        if len(events) != 3:
            return False

        # Check for pattern changes
        results = [event["result"] for event in events]
        return (results[0] == results[1]) != (results[1] == results[2])

    def _analyze_position_pattern(self, positions: List[Dict[str, float]]):
        """Analyze patterns in shot positions."""
        if not positions:
            return {}

        x_coords = [pos["x"] for pos in positions]
        y_coords = [pos["y"] for pos in positions]

        return {
            "movement_range": {
                "x": max(x_coords) - min(x_coords),
                "y": max(y_coords) - min(y_coords),
            },
            "preferred_areas": self._identify_preferred_areas(positions),
            "movement_patterns": self._identify_movement_patterns(positions),
        }

    def _analyze_timing_pattern(self, durations: List[float]) -> Dict[str, Any]:
        """Analyze patterns in shot timing."""
        if not durations:
            return {}

        return {
            "avg_duration": float(np.mean(durations)),
            "consistency": float(1.0 - np.std(durations) / (np.mean(durations) + 1e-6)),
            "trend": self._calculate_trend_direction(durations),
        }

    def _analyze_shot_selection(self, timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze shot selection patterns."""
        shots = [event for event in timeline if event["type"] == "shot"]

        if not shots:
            return {}

        return {
            "difficulty_distribution": self._calculate_difficulty_distribution(shots),
            "shot_type_distribution": self._calculate_shot_type_distribution(shots),
            "success_rate_by_difficulty": self._calculate_success_by_difficulty(shots),
        }

    def _analyze_risk_taking(self, timeline: List[Dict[str, Any]]):
        """Analyze risk-taking behavior."""
        shots = [event for event in timeline if event["type"] == "shot"]

        if not shots:
            return {}

        difficult_shots = [shot for shot in shots if shot["difficulty"] >= 0.7]
        safe_shots = [shot for shot in shots if shot["difficulty"] < 0.3]

        return {
            "risk_level": len(difficult_shots) / (len(shots) + 1e-6),
            "risk_success_rate": sum(
                1 for shot in difficult_shots if shot["result"] == "made"
            )
            / (len(difficult_shots) + 1e-6),
            "safe_success_rate": sum(
                1 for shot in safe_shots if shot["result"] == "made"
            )
            / (len(safe_shots) + 1e-6),
        }

    def _analyze_position_play(self, timeline: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze position play effectiveness."""
        shots = [event for event in timeline if event["type"] == "shot"]

        if not shots:
            return {}

        return {
            "position_control": self._calculate_position_control(shots),
            "pattern_effectiveness": self._calculate_pattern_effectiveness(shots),
            "recovery_ability": self._calculate_recovery_ability(shots),
        }

    def _analyze_time_management(self, timeline: List[Dict[str, Any]]):
        """Analyze time management during the match."""
        shots = [event for event in timeline if event["type"] == "shot"]

        if not shots:
            return {}

        shot_durations = [shot["duration"] for shot in shots]

        return {
            "avg_shot_time": float(np.mean(shot_durations)),
            "time_consistency": float(
                1.0 - np.std(shot_durations) / (np.mean(shot_durations) + 1e-6)
            ),
            "time_pressure_performance": self._analyze_time_pressure(shots),
        }

    def _determine_focus_area(self, prediction: float) -> str:
        """Determine the main focus area based on prediction."""
        if prediction < 0.3:
            return "fundamentals"
        elif prediction < 0.6:
            return "consistency"
        elif prediction < 0.8:
            return "advanced_techniques"
        else:
            return "mastery"

    def _calculate_training_difficulty(self, prediction: float):
        """Calculate appropriate training difficulty."""
        return min(max(prediction * 1.2, 0.3), 1.0)

    def _suggest_exercises(self, prediction: float):
        """Suggest specific exercises based on prediction."""
        focus_area = self._determine_focus_area(prediction)
        difficulty = self._calculate_training_difficulty(prediction)

        exercises = []
        if focus_area == "fundamentals":
            exercises.extend(
                [
                    {
                        "type": "straight_shots",
                        "duration": 15,
                        "difficulty": difficulty,
                        "target_score": 80,
                    },
                    {
                        "type": "position_control",
                        "duration": 10,
                        "difficulty": difficulty,
                        "target_score": 75,
                    },
                ]
            )
        elif focus_area == "consistency":
            exercises.extend(
                [
                    {
                        "type": "pattern_practice",
                        "duration": 20,
                        "difficulty": difficulty,
                        "target_score": 85,
                    },
                    {
                        "type": "speed_control",
                        "duration": 15,
                        "difficulty": difficulty,
                        "target_score": 80,
                    },
                ]
            )
        elif focus_area == "advanced_techniques":
            exercises.extend(
                [
                    {
                        "type": "spin_control",
                        "duration": 25,
                        "difficulty": difficulty,
                        "target_score": 85,
                    },
                    {
                        "type": "complex_patterns",
                        "duration": 20,
                        "difficulty": difficulty,
                        "target_score": 80,
                    },
                ]
            )
        else:  # mastery
            exercises.extend(
                [
                    {
                        "type": "pressure_situations",
                        "duration": 30,
                        "difficulty": difficulty,
                        "target_score": 90,
                    },
                    {
                        "type": "advanced_strategy",
                        "duration": 25,
                        "difficulty": difficulty,
                        "target_score": 85,
                    },
                ]
            )

        return exercises

    def _recommend_duration(self, prediction: float):
        """Recommend training session duration in minutes."""
        base_duration = 45
        if prediction < 0.3:
            return base_duration
        elif prediction < 0.6:
            return base_duration + 15
        elif prediction < 0.8:
            return base_duration + 30
        else:
            return base_duration + 45

    def _identify_pattern(self, prediction: float) -> str:
        """Identify playing pattern from prediction."""
        if prediction < 0.3:
            return "cautious"
        elif prediction < 0.6:
            return "balanced"
        elif prediction < 0.8:
            return "aggressive"
        else:
            return "expert"

    def _generate_strategy_suggestions(self, prediction: float):
        """Generate strategy suggestions based on prediction."""
        pattern = self._identify_pattern(prediction)

        suggestions = []
        if pattern == "cautious":
            suggestions.extend(
                [
                    "Focus on high-percentage shots",
                    "Practice position play for easier shots",
                    "Work on consistency in basic shots",
                ]
            )
        elif pattern == "balanced":
            suggestions.extend(
                [
                    "Mix safe and challenging shots",
                    "Improve position play for multiple options",
                    "Develop shot selection strategy",
                ]
            )
        elif pattern == "aggressive":
            suggestions.extend(
                [
                    "Balance risk and reward",
                    "Practice recovery from difficult positions",
                    "Improve accuracy in challenging shots",
                ]
            )
        else:  # expert
            suggestions.extend(
                [
                    "Focus on advanced pattern recognition",
                    "Develop complex multi-shot strategies",
                    "Master pressure situation handling",
                ]
            )

        return suggestions

    def _calculate_priority(self, prediction: float) -> str:
        """Calculate priority level for recommendations."""
        if prediction < 0.3:
            return "high"
        elif prediction < 0.6:
            return "medium"
        elif prediction < 0.8:
            return "low"
        else:
            return "optional"

    def _identify_preferred_areas(self, positions: List[Dict[str, float]]):
        """Identify preferred areas on the table."""
        if not positions:
            return []

        # Create a grid of areas
        areas = []
        for x in range(3):  # Divide table into 3x3 grid
            for y in range(3):
                area = {
                    "x_range": (x * 0.33, (x + 1) * 0.33),
                    "y_range": (y * 0.33, (y + 1) * 0.33),
                    "count": 0,
                }
                areas.append(area)

        # Count shots in each area
        total_shots = len(positions)
        for pos in positions:
            for area in areas:
                if (
                    area["x_range"][0] <= pos["x"] < area["x_range"][1]
                    and area["y_range"][0] <= pos["y"] < area["y_range"][1]
                ):
                    area["count"] += 1

        # Calculate percentages and identify preferred areas
        preferred_areas = []
        for area in areas:
            percentage = area["count"] / total_shots
            if percentage > 0.15:  # More than 15% of shots
                preferred_areas.append(
                    {
                        "x_range": area["x_range"],
                        "y_range": area["y_range"],
                        "percentage": percentage,
                    }
                )

        return preferred_areas

    def _identify_movement_patterns(
        self, positions: List[Dict[str, float]]
    ) -> List[Dict[str, Any]]:
        """Identify patterns in player movement."""
        if len(positions) < 3:
            return []

        patterns = []
        for i in range(len(positions) - 2):
            # Analyze sequence of 3 positions
            sequence = positions[i : i + 3]
            pattern = {
                "start": sequence[0],
                "middle": sequence[1],
                "end": sequence[2],
                "distance": self._calculate_total_distance(sequence),
                "direction": self._calculate_movement_direction(sequence),
            }
            patterns.append(pattern)

        return patterns

    def _calculate_total_distance(self, positions: List[Dict[str, float]]) -> float:
        """Calculate total distance covered in a sequence."""
        total = 0.0
        for i in range(len(positions) - 1):
            dx = positions[i + 1]["x"] - positions[i]["x"]
            dy = positions[i + 1]["y"] - positions[i]["y"]
            total += (dx * dx + dy * dy) ** 0.5
        return total

    def _calculate_movement_direction(self, positions: List[Dict[str, float]]) -> str:
        """Calculate overall movement direction."""
        start = positions[0]
        end = positions[-1]

        dx = end["x"] - start["x"]
        dy = end["y"] - start["y"]

        if abs(dx) > abs(dy):
            return "horizontal" if dx > 0 else "horizontal_reverse"
        else:
            return "vertical" if dy > 0 else "vertical_reverse"

    def _calculate_difficulty_distribution(
        self, shots: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate distribution of shot difficulties."""
        if not shots:
            return {}

        easy = sum(1 for shot in shots if shot["difficulty"] < 0.3)
        medium = sum(1 for shot in shots if 0.3 <= shot["difficulty"] < 0.7)
        hard = sum(1 for shot in shots if shot["difficulty"] >= 0.7)

        total = len(shots)
        return {"easy": easy / total, "medium": medium / total, "hard": hard / total}

    def _calculate_shot_type_distribution(
        self, shots: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate distribution of shot types."""
        if not shots:
            return {}

        type_counts = {}
        total = len(shots)

        for shot in shots:
            shot_type = shot.get("type", "unknown")
            type_counts[shot_type] = type_counts.get(shot_type, 0) + 1

        return {shot_type: count / total for shot_type, count in type_counts.items()}

    def _calculate_success_by_difficulty(self, shots: List[Dict[str, Any]]):
        """Calculate success rate for different difficulty levels."""
        if not shots:
            return {}

        difficulty_groups = {
            "easy": {"made": 0, "total": 0},
            "medium": {"made": 0, "total": 0},
            "hard": {"made": 0, "total": 0},
        }

        for shot in shots:
            if shot["difficulty"] < 0.3:
                group = "easy"
            elif shot["difficulty"] < 0.7:
                group = "medium"
            else:
                group = "hard"

            difficulty_groups[group]["total"] += 1
            if shot["result"] == "made":
                difficulty_groups[group]["made"] += 1

        return {
            difficulty: (stats["made"] / stats["total"] if stats["total"] > 0 else 0.0)
            for difficulty, stats in difficulty_groups.items()
        }

    def _calculate_position_control(self, shots: List[Dict[str, Any]]) -> float:
        """Calculate position control score."""
        if len(shots) < 2:
            return 0.0

        # Calculate how well position was maintained for the next shot
        control_scores = []
        for i in range(len(shots) - 1):
            current_shot = shots[i]
            next_shot = shots[i + 1]

            if current_shot["result"] == "made":
                # Calculate position quality for next shot
                next_difficulty = next_shot["difficulty"]
                control_scores.append(1.0 - next_difficulty)

        return np.mean(control_scores) if control_scores else 0.0

    def _calculate_pattern_effectiveness(
        self, shots: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Calculate effectiveness of different shot patterns."""
        if len(shots) < 3:
            return {}

        patterns = {}
        for i in range(len(shots) - 2):
            sequence = shots[i : i + 3]
            pattern_key = self._get_pattern_key(sequence)

            if pattern_key not in patterns:
                patterns[pattern_key] = {"success": 0, "total": 0}

            patterns[pattern_key]["total"] += 1
            if all(shot["result"] == "made" for shot in sequence):
                patterns[pattern_key]["success"] += 1

        return {
            pattern: stats["success"] / stats["total"]
            for pattern, stats in patterns.items()
            if stats["total"] >= 3  # Only include patterns seen at least 3 times
        }

    def _calculate_recovery_ability(self, shots: List[Dict[str, Any]]) -> float:
        """Calculate ability to recover from missed shots."""
        if len(shots) < 2:
            return 0.0

        recovery_scores = []
        for i in range(len(shots) - 1):
            if shots[i]["result"] == "missed":
                next_shot = shots[i + 1]
                if next_shot["result"] == "made":
                    recovery_scores.append(1.0 + (0.5 * next_shot["difficulty"]))
                else:
                    recovery_scores.append(0.0)

        return np.mean(recovery_scores) if recovery_scores else 0.0

    def _analyze_time_pressure(self, shots: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze performance under time pressure."""
        if not shots:
            return {}

        # Consider shots with duration < 15 seconds as pressure shots
        pressure_shots = [shot for shot in shots if shot["duration"] < 15]
        normal_shots = [shot for shot in shots if shot["duration"] >= 15]

        pressure_success = (
            (
                sum(1 for shot in pressure_shots if shot["result"] == "made")
                / len(pressure_shots)
            )
            if pressure_shots
            else 0.0
        )

        normal_success = (
            (
                sum(1 for shot in normal_shots if shot["result"] == "made")
                / len(normal_shots)
            )
            if normal_shots
            else 0.0
        )

        return {
            "pressure_success_rate": pressure_success,
            "normal_success_rate": normal_success,
            "pressure_shots_percentage": len(pressure_shots) / len(shots),
            "performance_drop": normal_success - pressure_success,
        }

    def _get_pattern_key(self, sequence: List[Dict[str, Any]]) -> str:
        """Generate a key for a shot pattern."""
        return "_".join(f"{shot['type']}_{shot['difficulty']:.1f}" for shot in sequence)

    def _perform_basic_analysis(self, match_data: Dict[str, Any]):
        """Perform basic analysis of match data."""
        return {
            "duration": match_data.get("duration", 0),
            "total_shots": len(match_data.get("shots", [])),
            "successful_shots": sum(
                1
                for shot in match_data.get("shots", [])
                if shot.get("successful", False)
            ),
            "average_shot_time": match_data.get("avg_shot_time", 0),
            "fouls": match_data.get("fouls", 0),
        }

    def _generate_suggestions(self, analysis: Dict[str, Any]):
        """Generate improvement suggestions based on analysis."""
        suggestions = []

        # Check shot success rate
        if analysis.get("total_shots", 0) > 0:
            success_rate = analysis.get("successful_shots", 0) / analysis["total_shots"]
            if success_rate < 0.5:
                suggestions.append(
                    {
                        "type": "practice",
                        "focus": "accuracy",
                        "description": "Focus on improving shot accuracy through practice drills",
                    }
                )

        # Check average shot time
        if analysis.get("average_shot_time", 0) > 30:
            suggestions.append(
                {
                    "type": "timing",
                    "focus": "speed",
                    "description": "Work on reducing shot preparation time",
                }
            )

        # Check fouls
        if analysis.get("fouls", 0) > 3:
            suggestions.append(
                {
                    "type": "technique",
                    "focus": "control",
                    "description": "Practice controlled shots to reduce fouls",
                }
            )

        return suggestions

    def _calculate_trend(self, values: List[float]) -> Dict[str, Any]:
        """Calculate trend from a series of values."""
        if not values:
            return {"direction": "none", "strength": 0.0}

        # Calculate trend direction
        differences = [values[i] - values[i - 1] for i in range(1, len(values))]
        avg_diff = sum(differences) / len(differences) if differences else 0

        # Calculate trend strength (normalized between 0 and 1)
        max_diff = (
            max(abs(min(differences)), abs(max(differences))) if differences else 1
        )
        strength = abs(avg_diff) / max_diff if max_diff != 0 else 0

        return {
            "direction": "up" if avg_diff > 0 else "down" if avg_diff < 0 else "stable",
            "strength": strength,
        }
