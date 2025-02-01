from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from typing import Dict, Any, List, Optional
import numpy as np
from datetime import timedelta


class GameAnalysis(models.Model):
    GAME_TYPES = [
        ("8ball", "8 Ball"),
        ("9ball", "9 Ball"),
        ("straight", "Straight Pool"),
        ("rotation", "Rotation"),
    ]

    game_id = models.CharField(max_length=100, unique=True)
    game_type = models.CharField(max_length=20, choices=GAME_TYPES)
    player1 = models.ForeignKey(User, related_name="games_as_p1", on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name="games_as_p2", on_delete=models.CASCADE)
    winner = models.ForeignKey(User, related_name="games_won", on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Game stats
    total_shots = models.IntegerField(default=0)
    successful_shots = models.IntegerField(default=0)
    average_shot_difficulty = models.FloatField(default=0.0)
    average_position_score = models.FloatField(default=0.0)
    breaks_attempted = models.IntegerField(default=0)
    balls_pocketed_on_break = models.IntegerField(default=0)

    # Advanced metrics
    shot_pattern_data = models.JSONField(default=dict)
    position_heat_map = models.JSONField(default=dict)
    shot_clustering = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Game {self.game_id}: {self.player1.username} vs {self.player2.username}"

    def calculate_metrics(self) -> Dict[str, Any]:
        """Calculate advanced game metrics"""
        return {
            "accuracy": self.successful_shots / max(1, self.total_shots),
            "avg_difficulty": self.average_shot_difficulty,
            "position_score": self.average_position_score,
            "break_success": self.balls_pocketed_on_break / max(1, self.breaks_attempted),
            "game_duration": (self.end_time - self.start_time).total_seconds() / 60.0,
        }


class ShotAnalysis(models.Model):
    SHOT_TYPES = [
        ("straight", "Straight In"),
        ("cut", "Cut Shot"),
        ("bank", "Bank Shot"),
        ("kick", "Kick Shot"),
        ("combo", "Combination"),
        ("carom", "Carom Shot"),
        ("jump", "Jump Shot"),
        ("masse", "Masse Shot"),
    ]

    game = models.ForeignKey(GameAnalysis, on_delete=models.CASCADE, related_name="shots")
    player = models.ForeignKey(User, on_delete=models.CASCADE)
    shot_number = models.IntegerField()
    shot_type = models.CharField(max_length=20, choices=SHOT_TYPES)

    # Shot details
    difficulty = models.FloatField()  # 0.0 to 1.0
    success = models.BooleanField()
    position_score = models.FloatField()  # 0.0 to 1.0
    english_applied = models.FloatField()  # -1.0 to 1.0
    speed = models.FloatField()  # 0.0 to 1.0

    # Position data
    cue_ball_start = models.JSONField()  # {x: float, y: float}
    cue_ball_end = models.JSONField(null=True)  # {x: float, y: float}
    object_ball_start = models.JSONField()  # {x: float, y: float}
    target_pocket = models.JSONField(null=True)  # {x: float, y: float}

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Shot {self.shot_number} by {self.player.username}"

    def calculate_difficulty(self) -> float:
        """Calculate shot difficulty based on various factors"""
        factors = {
            "distance": self._calculate_distance_factor(),
            "angle": self._calculate_angle_factor(),
            "obstacles": self._calculate_obstacle_factor(),
            "english": abs(self.english_applied),
            "speed_control": self._calculate_speed_factor(),
        }

        weights = {
            "distance": 0.2,
            "angle": 0.3,
            "obstacles": 0.2,
            "english": 0.15,
            "speed_control": 0.15,
        }

        return sum(factor * weights[key] for key, factor in factors.items())

    def _calculate_distance_factor(self) -> float:
        """Calculate difficulty factor based on shot distance"""
        cb_start = np.array([self.cue_ball_start["x"], self.cue_ball_start["y"]])
        ob_start = np.array([self.object_ball_start["x"], self.object_ball_start["y"]])
        distance = np.linalg.norm(cb_start - ob_start)
        return min(1.0, distance / 100.0)  # Normalize to table length

    def _calculate_angle_factor(self) -> float:
        """Calculate difficulty factor based on cut angle"""
        if not self.target_pocket:
            return 0.5

        cb = np.array([self.cue_ball_start["x"], self.cue_ball_start["y"]])
        ob = np.array([self.object_ball_start["x"], self.object_ball_start["y"]])
        pocket = np.array([self.target_pocket["x"], self.target_pocket["y"]])

        # Calculate vectors
        shot_line = ob - cb
        pocket_line = pocket - ob

        # Calculate angle between vectors
        cos_angle = np.dot(shot_line, pocket_line) / (
            np.linalg.norm(shot_line) * np.linalg.norm(pocket_line)
        )
        angle = np.arccos(np.clip(cos_angle, -1.0, 1.0))

        return angle / np.pi  # Normalize to [0, 1]

    def _calculate_obstacle_factor(self) -> float:
        """Calculate difficulty factor based on obstacles"""
        # This would use the game state to check for blocking balls
        # For now, return a placeholder value
        return 0.5

    def _calculate_speed_factor(self) -> float:
        """Calculate difficulty factor based on speed control requirements"""
        return self.speed


class PerformanceInsight(models.Model):
    INSIGHT_TYPES = [
        ("strength", "Strength"),
        ("weakness", "Weakness"),
        ("improvement", "Improvement"),
        ("pattern", "Pattern"),
        ("recommendation", "Recommendation"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    insight_type = models.CharField(max_length=20, choices=INSIGHT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    metrics = models.JSONField()
    confidence = models.FloatField()  # 0.0 to 1.0
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True)

    def __str__(self) -> str:
        return f"{self.insight_type} insight for {self.user.username}"

    @classmethod
    def generate_insights(
        cls, user: User, recent_games: List[GameAnalysis]
    ) -> List["PerformanceInsight"]:
        """Generate performance insights based on recent games"""
        insights = []

        # Analyze shot patterns
        shot_patterns = cls._analyze_shot_patterns(recent_games)
        if shot_patterns:
            insights.extend(cls._create_pattern_insights(user, shot_patterns))

        # Analyze strengths and weaknesses
        performance_analysis = cls._analyze_performance(recent_games)
        insights.extend(cls._create_performance_insights(user, performance_analysis))

        # Generate recommendations
        recommendations = cls._generate_recommendations(performance_analysis)
        insights.extend(cls._create_recommendation_insights(user, recommendations))

        return insights

    @staticmethod
    def _analyze_shot_patterns(games: List[GameAnalysis]) -> Dict[str, Any]:
        """Analyze shot patterns across games"""
        all_shots = []
        for game in games:
            all_shots.extend(game.shots.all())

        patterns = {
            "preferred_shots": {},
            "success_rates": {},
            "position_patterns": [],
            "common_mistakes": [],
        }

        # Analyze shot type preferences
        for shot in all_shots:
            shot_type = shot.shot_type
            patterns["preferred_shots"][shot_type] = (
                patterns["preferred_shots"].get(shot_type, 0) + 1
            )

            # Track success rates
            if shot_type not in patterns["success_rates"]:
                patterns["success_rates"][shot_type] = {"total": 0, "success": 0}
            patterns["success_rates"][shot_type]["total"] += 1
            if shot.success:
                patterns["success_rates"][shot_type]["success"] += 1

        return patterns

    @staticmethod
    def _analyze_performance(games: List[GameAnalysis]) -> Dict[str, Any]:
        """Analyze overall performance metrics"""
        total_shots = 0
        successful_shots = 0
        total_difficulty = 0
        total_position = 0

        for game in games:
            total_shots += game.total_shots
            successful_shots += game.successful_shots
            total_difficulty += game.average_shot_difficulty * game.total_shots
            total_position += game.average_position_score * game.total_shots

        return {
            "accuracy": successful_shots / max(1, total_shots),
            "avg_difficulty": total_difficulty / max(1, total_shots),
            "position_score": total_position / max(1, total_shots),
        }

    @classmethod
    def _create_pattern_insights(
        cls, user: User, patterns: Dict[str, Any]
    ) -> List["PerformanceInsight"]:
        """Create insights based on shot patterns"""
        insights = []

        # Analyze preferred shots
        total_shots = sum(patterns["preferred_shots"].values())
        for shot_type, count in patterns["preferred_shots"].items():
            percentage = count / total_shots
            if percentage > 0.3:  # Significant preference
                success_rate = (
                    patterns["success_rates"][shot_type]["success"]
                    / patterns["success_rates"][shot_type]["total"]
                )

                if success_rate > 0.7:
                    insights.append(
                        cls.objects.create(
                            user=user,
                            insight_type="strength",
                            title=f"Strong {shot_type} shots",
                            description=f"You excel at {shot_type} shots with a {success_rate:.1%} success rate",
                            metrics={"success_rate": success_rate, "frequency": percentage},
                            confidence=0.8,
                        )
                    )
                elif success_rate < 0.4:
                    insights.append(
                        cls.objects.create(
                            user=user,
                            insight_type="weakness",
                            title=f"Improve {shot_type} shots",
                            description=f"Consider practicing {shot_type} shots to improve your {success_rate:.1%} success rate",
                            metrics={"success_rate": success_rate, "frequency": percentage},
                            confidence=0.8,
                        )
                    )

        return insights

    @classmethod
    def _create_performance_insights(
        cls, user: User, performance: Dict[str, Any]
    ) -> List["PerformanceInsight"]:
        """Create insights based on overall performance"""
        insights = []

        if performance["accuracy"] > 0.7:
            insights.append(
                cls.objects.create(
                    user=user,
                    insight_type="strength",
                    title="High Accuracy Player",
                    description=f"Your accuracy of {performance['accuracy']:.1%} is above average",
                    metrics={"accuracy": performance["accuracy"]},
                    confidence=0.9,
                )
            )

        if performance["position_score"] < 0.5:
            insights.append(
                cls.objects.create(
                    user=user,
                    insight_type="weakness",
                    title="Position Play Needs Work",
                    description="Focus on improving your position play for better shot selection",
                    metrics={"position_score": performance["position_score"]},
                    confidence=0.85,
                )
            )

        return insights

    @classmethod
    def _create_recommendation_insights(
        cls, user: User, recommendations: Dict[str, Any]
    ) -> List["PerformanceInsight"]:
        """Create recommendation insights"""
        insights = []

        for aspect, recommendation in recommendations.items():
            insights.append(
                cls.objects.create(
                    user=user,
                    insight_type="recommendation",
                    title=f"Improve Your {aspect}",
                    description=recommendation["description"],
                    metrics=recommendation["metrics"],
                    confidence=recommendation["confidence"],
                )
            )

        return insights

    @staticmethod
    def _generate_recommendations(performance: Dict[str, Any]) -> Dict[str, Any]:
        """Generate training recommendations based on performance"""
        recommendations = {}

        if performance["accuracy"] < 0.6:
            recommendations["accuracy"] = {
                "description": "Practice fundamental shots to improve accuracy",
                "metrics": {"current_accuracy": performance["accuracy"]},
                "confidence": 0.9,
            }

        if performance["position_score"] < 0.5:
            recommendations["position"] = {
                "description": "Work on position play drills to improve shot selection",
                "metrics": {"current_position_score": performance["position_score"]},
                "confidence": 0.85,
            }

        return recommendations
