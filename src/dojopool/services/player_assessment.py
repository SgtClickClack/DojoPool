"""Player skill assessment service for analyzing and tracking player performance."""

from dataclasses import dataclass
from datetime import timedelta
from typing import Any, Dict, List, Optional

import numpy as np
from models.player import Player
from models.shot import Shot
from services.shot_analysis import ShotAnalysis
from src.core.config import AI_CONFIG
from tensorflow.keras.models import load_model


@dataclass
class SkillMetrics:
    """Represents comprehensive player skill metrics."""

    overall_rating: float  # 0-100 scale
    accuracy: float  # 0-100%
    consistency: float  # 0-100%
    shot_difficulty: float  # Average difficulty of successful shots
    adaptability: float  # 0-100%
    improvement_rate: float  # % improvement over time
    strengths: List[str]  # List of strong areas
    weaknesses: List[str]  # Areas for improvement
    skill_breakdown: Dict[str, float]  # Detailed breakdown by shot type
    confidence_score: float  # 0-100%


class PlayerAssessment:
    """Service for assessing player skills and tracking improvement."""

    def __init__(self):
        """Initialize the player assessment service."""
        # Load ML models
        self.skill_predictor = load_model(AI_CONFIG["skill_predictor_path"])
        self.improvement_analyzer = load_model(AI_CONFIG["improvement_analyzer_path"])

        # Initialize shot analysis
        self.shot_analysis = ShotAnalysis()

        # Shot type categories
        self.shot_categories = [
            "straight",
            "cut",
            "bank",
            "combination",
            "jump",
            "masse",
            "draw",
            "follow",
            "position",
        ]

    async def assess_player(
        self, player_id: str, timeframe: Optional[timedelta] = None
    ) -> SkillMetrics:
        """Perform comprehensive skill assessment for a player.

        Args:
            player_id: ID of the player to assess
            timeframe: Optional timeframe to analyze, defaults to all time

        Returns:
            SkillMetrics containing detailed skill assessment
        """
        # Get player data
        player = await self._get_player_data(player_id)
        if not player:
            raise ValueError(f"Player {player_id} not found")

        # Get shot history
        shots = await self._get_shot_history(player_id, timeframe)
        if not shots:
            raise ValueError(f"No shot data found for player {player_id}")

        # Calculate base metrics
        accuracy = self._calculate_accuracy(shots)
        consistency = self._calculate_consistency(shots)
        difficulty = self._calculate_average_difficulty(shots)

        # Analyze shot patterns
        shot_patterns = self._analyze_shot_patterns(shots)
        adaptability = self._calculate_adaptability(shot_patterns)

        # Calculate improvement rate
        improvement = self._calculate_improvement_rate(shots)

        # Get skill breakdown
        skill_breakdown = self._calculate_skill_breakdown(shots)

        # Identify strengths and weaknesses
        strengths = self._identify_strengths(skill_breakdown)
        weaknesses = self._identify_weaknesses(skill_breakdown)

        # Calculate confidence score
        confidence = self._calculate_confidence(shots, skill_breakdown)

        # Calculate overall rating using ML model
        features = self._extract_assessment_features(
            accuracy,
            consistency,
            difficulty,
            adaptability,
            improvement,
            skill_breakdown,
        )
        overall_rating = float(self.skill_predictor.predict(features)[0])

        return SkillMetrics(
            overall_rating=overall_rating,
            accuracy=accuracy,
            consistency=consistency,
            shot_difficulty=difficulty,
            adaptability=adaptability,
            improvement_rate=improvement,
            strengths=strengths,
            weaknesses=weaknesses,
            skill_breakdown=skill_breakdown,
            confidence_score=confidence,
        )

    async def predict_improvement(self, player_id: str, target_timeframe: timedelta):
        """Predict player's potential improvement over time.

        Args:
            player_id: ID of the player
            target_timeframe: Timeframe to predict improvement for

        Returns:
            Dictionary containing predicted improvements and recommendations
        """
        # Get current assessment
        current = await self.assess_player(player_id)

        # Extract features for improvement prediction
        features = self._extract_improvement_features(current)

        # Get improvement predictions
        predictions = self.improvement_analyzer.predict(features)

        # Generate personalized training recommendations
        recommendations = self._generate_training_recommendations(current, predictions)

        return {
            "current_rating": current.overall_rating,
            "predicted_rating": float(predictions[0]),
            "improvement_areas": recommendations["areas"],
            "training_plan": recommendations["plan"],
            "milestones": recommendations["milestones"],
        }

    async def _get_player_data(self, player_id: str):
        """Retrieve player data from database."""
        # Implementation depends on data storage
        pass

    async def _get_shot_history(self, player_id: str, timeframe: Optional[timedelta]):
        """Retrieve shot history for the player."""
        # Implementation depends on data storage
        pass

    def _calculate_accuracy(self, shots: List[Shot]) -> float:
        """Calculate overall shot accuracy."""
        if not shots:
            return 0.0
        successful = sum(1 for shot in shots if shot.success)
        return (successful / len(shots)) * 100

    def _calculate_consistency(self, shots: List[Shot]):
        """Calculate player's shot consistency."""
        if not shots:
            return 0.0

        # Calculate moving average of success rate
        window_size = min(10, len(shots))
        success_rates = []

        for i in range(len(shots) - window_size + 1):
            window = shots[i : i + window_size]
            success_rate = sum(1 for shot in window if shot.success) / window_size
            success_rates.append(success_rate)

        # Calculate standard deviation of success rates
        std_dev = np.std(success_rates) if success_rates else 1.0

        # Convert to consistency score (lower std_dev = higher consistency)
        return max(0, 100 * (1 - std_dev))

    def _calculate_average_difficulty(self, shots: List[Shot]) -> float:
        """Calculate average difficulty of successful shots."""
        if not shots:
            return 0.0

        successful_shots = [shot for shot in shots if shot.success]
        if not successful_shots:
            return 0.0

        difficulties = [shot.difficulty for shot in successful_shots]
        return sum(difficulties) / len(difficulties)

    def _analyze_shot_patterns(self, shots: List[Shot]):
        """Analyze patterns in shot selection and execution."""
        patterns = {
            "type_distribution": {},
            "success_by_type": {},
            "difficulty_progression": [],
            "position_adaptation": [],
        }

        for shot in shots:
            # Update type distribution
            shot_type = shot.type
            patterns["type_distribution"][shot_type] = (
                patterns["type_distribution"].get(shot_type, 0) + 1
            )

            # Update success rate by type
            if shot_type not in patterns["success_by_type"]:
                patterns["success_by_type"][shot_type] = {"total": 0, "success": 0}
            patterns["success_by_type"][shot_type]["total"] += 1
            if shot.success:
                patterns["success_by_type"][shot_type]["success"] += 1

            # Track difficulty progression
            patterns["difficulty_progression"].append(shot.difficulty)

            # Analyze position adaptation
            if shot.position_quality is not None:
                patterns["position_adaptation"].append(shot.position_quality)

        return patterns

    def _calculate_adaptability(self, patterns: Dict[str, Any]):
        """Calculate player's adaptability score."""
        if not patterns["position_adaptation"]:
            return 0.0

        # Calculate trend in position quality
        position_trend = np.polyfit(
            range(len(patterns["position_adaptation"])),
            patterns["position_adaptation"],
            1,
        )[0]

        # Calculate variety in shot selection
        type_distribution = patterns["type_distribution"]
        total_shots = sum(type_distribution.values())
        shot_type_entropy = 0

        for count in type_distribution.values():
            p = count / total_shots
            shot_type_entropy -= p * np.log2(p)

        # Normalize entropy to 0-1 range
        max_entropy = np.log2(len(self.shot_categories))
        normalized_entropy = shot_type_entropy / max_entropy

        # Combine position trend and shot variety
        adaptability = (0.6 * normalized_entropy + 0.4 * (position_trend + 1) / 2) * 100
        return max(0, min(100, adaptability))

    def _calculate_improvement_rate(self, shots: List[Shot]) -> float:
        """Calculate player's rate of improvement."""
        if len(shots) < 10:
            return 0.0

        # Calculate success rate for first and last quarters
        quarter_size = len(shots) // 4
        first_quarter = shots[:quarter_size]
        last_quarter = shots[-quarter_size:]

        first_rate = sum(1 for shot in first_quarter if shot.success) / quarter_size
        last_rate = sum(1 for shot in last_quarter if shot.success) / quarter_size

        # Calculate improvement percentage
        if first_rate == 0:
            return 100 if last_rate > 0 else 0

        improvement = ((last_rate - first_rate) / first_rate) * 100
        return max(-100, min(100, improvement))

    def _calculate_skill_breakdown(self, shots: List[Shot]) -> Dict[str, float]:
        """Calculate skill ratings for different shot types."""
        breakdown = {}

        for category in self.shot_categories:
            category_shots = [shot for shot in shots if shot.type == category]
            if not category_shots:
                breakdown[category] = 0.0
                continue

            # Calculate weighted score based on success rate and difficulty
            success_rate = sum(1 for shot in category_shots if shot.success) / len(
                category_shots
            )
            avg_difficulty = sum(shot.difficulty for shot in category_shots) / len(
                category_shots
            )

            # Weight success rate more heavily for easier shots
            weight = 0.7 - (avg_difficulty * 0.4)  # weight ranges from 0.3 to 0.7
            score = (weight * success_rate + (1 - weight) * avg_difficulty) * 100

            breakdown[category] = max(0, min(100, score))

        return breakdown

    def _identify_strengths(self, skill_breakdown: Dict[str, float]) -> List[str]:
        """Identify player's strongest shot types."""
        threshold = 70  # Minimum score to be considered a strength
        return [
            shot_type
            for shot_type, score in skill_breakdown.items()
            if score >= threshold
        ]

    def _identify_weaknesses(self, skill_breakdown: Dict[str, float]) -> List[str]:
        """Identify areas needing improvement."""
        threshold = 50  # Maximum score to be considered a weakness
        return [
            shot_type
            for shot_type, score in skill_breakdown.items()
            if score <= threshold
        ]

    def _calculate_confidence(
        self, shots: List[Shot], skill_breakdown: Dict[str, float]
    ):
        """Calculate player's confidence score."""
        if not shots:
            return 0.0

        # Recent performance weight
        recent_shots = shots[-20:]  # Last 20 shots
        recent_success = sum(1 for shot in recent_shots if shot.success) / len(
            recent_shots
        )

        # Skill level weight
        avg_skill = sum(skill_breakdown.values()) / len(skill_breakdown)

        # Difficulty adaptation
        recent_difficulties = [shot.difficulty for shot in recent_shots]
        difficulty_trend = np.polyfit(
            range(len(recent_difficulties)), recent_difficulties, 1
        )[0]

        # Combine factors
        confidence = (
            0.4 * recent_success
            + 0.4 * (avg_skill / 100)
            + 0.2 * (1 + difficulty_trend) / 2
        ) * 100

        return max(0, min(100, confidence))

    def _extract_assessment_features(
        self,
        accuracy: float,
        consistency: float,
        difficulty: float,
        adaptability: float,
        improvement: float,
        skill_breakdown: Dict[str, float],
    ) -> np.ndarray:
        """Extract features for overall rating prediction."""
        features = [
            accuracy / 100,
            consistency / 100,
            difficulty,
            adaptability / 100,
            improvement / 100,
        ]

        # Add normalized skill breakdown
        for category in self.shot_categories:
            features.append(skill_breakdown.get(category, 0) / 100)

        return np.array(features).reshape(1, -1)

    def _extract_improvement_features(self, current: SkillMetrics) -> np.ndarray:
        """Extract features for improvement prediction."""
        features = [
            current.overall_rating / 100,
            current.accuracy / 100,
            current.consistency / 100,
            current.shot_difficulty,
            current.adaptability / 100,
            current.improvement_rate / 100,
            current.confidence_score / 100,
        ]

        # Add normalized skill breakdown
        for category in self.shot_categories:
            features.append(current.skill_breakdown.get(category, 0) / 100)

        return np.array(features).reshape(1, -1)

    def _generate_training_recommendations(
        self, current: SkillMetrics, predictions: np.ndarray
    ) -> Dict[str, Any]:
        """Generate personalized training recommendations."""
        recommendations = {"areas": [], "plan": [], "milestones": []}

        # Identify focus areas
        focus_areas = current.weaknesses[:3]  # Top 3 weaknesses
        recommendations["areas"] = focus_areas

        # Generate training plan
        for area in focus_areas:
            exercises = self._get_exercises_for_area(
                area, current.skill_breakdown[area]
            )
            recommendations["plan"].append(
                {
                    "area": area,
                    "current_level": current.skill_breakdown[area],
                    "target_level": min(100, current.skill_breakdown[area] + 20),
                    "exercises": exercises,
                }
            )

        # Set milestones
        current_rating = current.overall_rating
        predicted_rating = float(predictions[0]) * 100

        milestones = []
        steps = 4
        for i in range(1, steps + 1):
            target = current_rating + (predicted_rating - current_rating) * (i / steps)
            milestones.append(
                {
                    "level": target,
                    "timeframe": f"{i * 3} months",
                    "focus": focus_areas[i % len(focus_areas)],
                }
            )

        recommendations["milestones"] = milestones
        return recommendations

    def _get_exercises_for_area(
        self, area: str, current_level: float
    ) -> List[Dict[str, Any]]:
        """Get appropriate exercises for a specific area."""
        # Implementation would include a database of exercises
        # This is a placeholder returning sample exercises
        return [
            {
                "name": f"{area.title()} Basic Practice",
                "difficulty": "Beginner",
                "repetitions": 20,
                "success_target": 0.6,
            },
            {
                "name": f"{area.title()} Intermediate Drill",
                "difficulty": "Intermediate",
                "repetitions": 15,
                "success_target": 0.5,
            },
            {
                "name": f"{area.title()} Advanced Challenge",
                "difficulty": "Advanced",
                "repetitions": 10,
                "success_target": 0.4,
            },
        ]
