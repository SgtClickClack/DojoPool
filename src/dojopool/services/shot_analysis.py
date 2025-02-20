from multiprocessing import Pool
from multiprocessing import Pool
"""Unified shot analysis service combining AI/ML capabilities with statistical analysis."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import cv2
import mediapipe as mp
import numpy as np
import tensorflow as tf
from models.shot import Shot
from src.core.config import AI_CONFIG
from src.extensions import cache
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import load_model
from utils.analysis import calculate_shot_metrics
from utils.validation import validate_shot_data


@dataclass
class PoseKeypoints:
    """Represents detected pose keypoints."""

    shoulders: Tuple[float, float]
    elbow: Tuple[float, float]
    wrist: Tuple[float, float]
    hip: Tuple[float, float]
    knee: Tuple[float, float]
    ankle: Tuple[float, float]
    confidence: float


@dataclass
class ShotMetrics:
    """Represents comprehensive shot analysis metrics."""

    power: float
    accuracy: float
    spin: float
    difficulty: float
    form_score: float
    consistency: float
    shot_type: str
    success_probability: float
    effectiveness: float


@dataclass
class PredictionMetrics:
    """Represents shot prediction metrics."""

    success_rate: float
    optimal_power: float
    optimal_angle: float
    optimal_spin: float
    optimal_english: float
    difficulty_rating: float
    confidence_score: float
    alternative_shots: List[Dict[str, float]]


class ShotAnalysis:
    """Unified shot analysis system combining AI/ML capabilities with statistical analysis."""

    def __init__(self):
        """Initialize the unified shot analysis system."""
        # Initialize AI models
        self.pose_model = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7,
        )
        self.shot_classifier = load_model(AI_CONFIG["SHOT_MODEL_PATH"])
        self.difficulty_estimator = load_model(AI_CONFIG["DIFFICULTY_MODEL_PATH"])
        self.spin_detector = load_model(AI_CONFIG["SPIN_MODEL_PATH"])

        # Initialize video processing
        self.ball_detector = cv2.createBackgroundSubtractorMOG2(
            history=100, varThreshold=40, detectShadows=False
        )

        # Initialize feature extraction
        self.feature_extractor = MobileNetV2(
            weights="imagenet", include_top=False, pooling="avg"
        )

        # Load calibration models
        self.power_scaler = tf.keras.models.load_model(
            AI_CONFIG["POWER_CALIBRATION_PATH"]
        )
        self.accuracy_scaler = tf.keras.models.load_model(
            AI_CONFIG["ACCURACY_CALIBRATION_PATH"]
        )

        # Load prediction models
        self.shot_predictor = load_model(AI_CONFIG["shot_predictor_path"])
        self.position_analyzer = load_model(AI_CONFIG["position_analyzer_path"])

        # Shot type definitions
        self.shot_types = {
            "break": {"power_range": (60, 100), "accuracy_impact": 0.8},
            "power": {"power_range": (80, 100), "accuracy_impact": 0.6},
            "position": {"power_range": (20, 60), "accuracy_impact": 1.0},
            "safety": {"power_range": (30, 70), "accuracy_impact": 0.9},
            "spin": {"power_range": (40, 80), "accuracy_impact": 0.7},
        }

    def analyze_shot(
        self, shot_data: Dict[str, Any], video_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze a shot using both AI/ML and statistical analysis.

        Args:
            shot_data: Dictionary containing shot parameters
            video_path: Optional path to video file for AI analysis

        Returns:
            dict: Comprehensive shot analysis
        """
        # Validate shot data
        validate_shot_data(shot_data)

        # Get base metrics from shot data
        base_metrics = self._analyze_shot_data(shot_data)

        # If video is provided, enhance with AI analysis
        if video_path:
            ai_metrics = self._analyze_video(video_path)
            if not ai_metrics.get("error"):
                base_metrics = self._combine_metrics(base_metrics, ai_metrics)

        return base_metrics

    def _analyze_shot_data(self, shot_data: Dict[str, Any]):
        """Analyze shot based on input data."""
        # Extract parameters
        power = shot_data.get("power", 0)
        angle = shot_data.get("angle", 0)
        spin = shot_data.get("spin", 0)
        english = shot_data.get("english", 0)
        result = shot_data.get("result", False)

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

        # Calculate effectiveness
        effectiveness = self._calculate_effectiveness(result, difficulty, success_prob)

        return {
            "shot_type": shot_type,
            "difficulty": difficulty,
            "success_probability": success_prob,
            "effectiveness": effectiveness,
            "metrics": metrics,
            "timestamp": datetime.utcnow(),
        }

    def _analyze_video(self, video_path: str):
        """Analyze shot using video footage."""
        # Try to get from cache
        cache_key = f"shot_analysis:{video_path}"
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Extract and preprocess frames
        frames = self._extract_frames(video_path)
        if not frames:
            return {"error": "Failed to extract video frames"}

        # Analyze pose sequence
        pose_sequence = self._analyze_pose_sequence(frames)

        # Track ball movement
        ball_trajectory = self._track_ball_advanced(frames)

        # Calculate metrics
        metrics = self._calculate_shot_metrics_from_video(
            pose_sequence, ball_trajectory
        )

        # Generate feedback
        feedback = self._generate_detailed_feedback(
            pose_sequence, ball_trajectory, metrics
        )

        results = {
            "pose_analysis": {
                "stance_score": self._analyze_stance(pose_sequence),
                "bridge_score": self._analyze_bridge(pose_sequence),
                "stroke_score": self._analyze_stroke(pose_sequence),
                "follow_through": self._analyze_follow_through(pose_sequence),
            },
            "ball_analysis": {
                "trajectory": ball_trajectory,
                "spin_characteristics": self._analyze_spin_characteristics(
                    ball_trajectory
                ),
                "power_curve": self._analyze_power_curve(ball_trajectory),
            },
            "feedback": feedback,
        }

        # Cache results
        cache.set(cache_key, results, timeout=3600)

        return results

    def analyze_player_performance(
        self, player_id: str, time_range: Optional[Dict[str, datetime]] = None
    ):
        """Analyze player's performance over time."""
        # Get player's shots
        shots = Shot.get_player_shots(player_id, time_range)

        if not shots:
            return {"error": "No shots found for analysis", "player_id": player_id}

        # Calculate aggregate metrics
        total_shots = len(shots)
        successful_shots = sum(1 for shot in shots if shot.result)
        success_rate = successful_shots / total_shots if total_shots > 0 else 0

        # Analyze patterns
        shot_patterns = self._analyze_shot_patterns(shots)

        # Calculate trends
        trends = self._calculate_performance_trends(shots)

        # Generate analysis
        analysis = self._generate_player_analysis(shot_patterns, trends, success_rate)

        return {
            "player_id": player_id,
            "total_shots": total_shots,
            "success_rate": success_rate,
            "shot_patterns": shot_patterns,
            "trends": trends,
            "analysis": analysis,
            "timestamp": datetime.utcnow(),
        }

    def _combine_metrics(
        self, statistical_metrics: Dict[str, Any], ai_metrics: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Combine statistical and AI-based metrics."""
        combined = statistical_metrics.copy()

        # Update pose-related metrics
        if "pose_analysis" in ai_metrics:
            combined["pose_analysis"] = ai_metrics["pose_analysis"]

        # Update ball-related metrics
        if "ball_analysis" in ai_metrics:
            combined["ball_analysis"] = ai_metrics["ball_analysis"]

        # Merge feedback
        if "feedback" in ai_metrics:
            combined["feedback"] = {
                "statistical": combined.get("feedback", {}),
                "ai_based": ai_metrics["feedback"],
            }

        return combined

    async def predict_shot(
        self,
        table_state: Dict[str, Any],
        player_position: Tuple[float, float],
        target_ball: Dict[str, Any],
        pocket: Optional[Dict[str, Any]] = None,
    ) -> PredictionMetrics:
        """Predict optimal shot parameters and success probability.

        Args:
            table_state: Current positions of all balls
            player_position: (x, y) coordinates of player
            target_ball: Position and properties of target ball
            pocket: Optional target pocket information

        Returns:
            PredictionMetrics with optimal shot parameters and success probability
        """
        # Validate inputs
        if not self._validate_table_state(table_state):
            raise ValueError("Invalid table state provided")

        # Analyze position and angles
        position_features = self._extract_position_features(
            table_state, player_position, target_ball, pocket
        )
        position_analysis = self.position_analyzer.predict(position_features)

        # Generate shot options
        shot_options = self._generate_shot_options(
            position_analysis, table_state, target_ball
        )

        # Predict success rates for each option
        predictions = self.shot_predictor.predict(shot_options)

        # Select optimal shot parameters
        optimal_shot = self._select_optimal_shot(predictions, shot_options)

        # Generate alternative shots
        alternatives = self._generate_alternatives(predictions, shot_options)

        return PredictionMetrics(
            success_rate=optimal_shot["success_rate"],
            optimal_power=optimal_shot["power"],
            optimal_angle=optimal_shot["angle"],
            optimal_spin=optimal_shot["spin"],
            optimal_english=optimal_shot["english"],
            difficulty_rating=optimal_shot["difficulty"],
            confidence_score=optimal_shot["confidence"],
            alternative_shots=alternatives,
        )

    def _validate_table_state(self, table_state: Dict[str, Any]):
        """Validate the provided table state."""
        try:
            required_keys = ["balls", "dimensions", "obstacles"]
            return all(key in table_state for key in required_keys)
        except Exception:
            return False

    def _extract_position_features(
        self,
        table_state: Dict[str, Any],
        player_position: Tuple[float, float],
        target_ball: Dict[str, Any],
        pocket: Optional[Dict[str, Any]],
    ):
        """Extract relevant features for position analysis."""
        features = []

        # Add player position
        features.extend(player_position)

        # Add target ball features
        features.extend(
            [
                target_ball["x"],
                target_ball["y"],
                target_ball.get("velocity_x", 0),
                target_ball.get("velocity_y", 0),
            ]
        )

        # Add pocket features if available
        if pocket:
            features.extend([pocket["x"], pocket["y"], pocket["width"]])
        else:
            features.extend([0, 0, 0])  # Default values

        # Add obstacle features
        features.extend(self._encode_obstacles(table_state["obstacles"]))

        return np.array(features).reshape(1, -1)

    def _generate_shot_options(
        self,
        position_analysis: np.ndarray,
        table_state: Dict[str, Any],
        target_ball: Dict[str, Any],
    ) -> np.ndarray:
        """Generate possible shot options based on position analysis."""
        # Extract key angles and distances
        direct_angle = self._calculate_direct_angle(position_analysis)
        distance = self._calculate_distance(position_analysis)

        # Generate range of parameters
        powers = np.linspace(0.2, 1.0, 5)
        angles = np.linspace(direct_angle - 0.2, direct_angle + 0.2, 5)
        spins = np.linspace(-0.5, 0.5, 5)
        english_values = np.linspace(-0.5, 0.5, 5)

        # Create combinations
        options = []
        for power in powers:
            for angle in angles:
                for spin in spins:
                    for english in english_values:
                        options.append([power, angle, spin, english, distance])

        return np.array(options)

    def _select_optimal_shot(
        self, predictions: np.ndarray, shot_options: np.ndarray
    ) -> Dict[str, float]:
        """Select the optimal shot parameters based on predictions."""
        best_idx = np.argmax(predictions)
        best_option = shot_options[best_idx]

        return {
            "success_rate": float(predictions[best_idx]),
            "power": float(best_option[0]),
            "angle": float(best_option[1]),
            "spin": float(best_option[2]),
            "english": float(best_option[3]),
            "difficulty": self._calculate_difficulty(*best_option),
            "confidence": float(np.max(predictions)),
        }

    def _generate_alternatives(
        self,
        predictions: np.ndarray,
        shot_options: np.ndarray,
        num_alternatives: int = 3,
    ):
        """Generate alternative shots based on predictions."""
        # Get indices of top shots excluding the best one
        top_indices = np.argsort(predictions)[-num_alternatives - 1 : -1]

        alternatives = []
        for idx in top_indices:
            option = shot_options[idx]
            alternatives.append(
                {
                    "success_rate": float(predictions[idx]),
                    "power": float(option[0]),
                    "angle": float(option[1]),
                    "spin": float(option[2]),
                    "english": float(option[3]),
                    "difficulty": self._calculate_difficulty(*option),
                }
            )

        return alternatives

    def _encode_obstacles(self, obstacles: List[Dict[str, Any]]) -> List[float]:
        """Encode obstacle information for the model."""
        encoded = []
        for obstacle in obstacles[:3]:  # Consider up to 3 nearest obstacles
            encoded.extend([obstacle["x"], obstacle["y"], obstacle["radius"]])
        # Pad with zeros if less than 3 obstacles
        while len(encoded) < 9:
            encoded.extend([0, 0, 0])
        return encoded

    def _calculate_direct_angle(self, position_analysis: np.ndarray):
        """Calculate the direct angle to the target."""
        return float(position_analysis[0])  # Assuming first value is the angle

    def _calculate_distance(self, position_analysis: np.ndarray):
        """Calculate the distance to the target."""
        return float(position_analysis[1])  # Assuming second value is the distance

    # ... (keeping existing helper methods from both implementations) ...
