from flask_caching import Cache
from sqlalchemy.orm import joinedload
from flask_caching import Cache
from sqlalchemy.orm import joinedload
"""Game analysis models for DojoPool."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID

import numpy as np
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.extensions import db
from .user import User


class GameAnalysis(Base):
    """Game analysis model."""

    __tablename__: str = "game_analysis"
    __table_args__ = {"extend_existing": True}

    GAME_TYPES: List[Any] = ["8ball", "9ball", "straight", "rotation"]

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[str] = mapped_column(String(100), unique=True)
    game_type: Mapped[str] = mapped_column(String(20))
    player1_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    player2_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    winner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    start_time: Mapped[datetime] = mapped_column()
    end_time: Mapped[datetime] = mapped_column()

    # Game stats
    total_shots: Mapped[int] = mapped_column(default=0)
    successful_shots: Mapped[int] = mapped_column(default=0)
    average_shot_difficulty: Mapped[float] = mapped_column(default=0.0)
    average_position_score: Mapped[float] = mapped_column(default=0.0)
    breaks_attempted: Mapped[int] = mapped_column(default=0)
    balls_pocketed_on_break: Mapped[int] = mapped_column(default=0)

    # Advanced metrics
    shot_pattern_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    position_heat_map: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    shot_clustering: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    player1: relationship = relationship(
        User, foreign_keys=[player1_id], backref="games_as_p1", lazy="select"
    )
    player2: relationship = relationship(
        User, foreign_keys=[player2_id], backref="games_as_p2", lazy="select"
    )
    winner: relationship = relationship(
        User, foreign_keys=[winner_id], backref="games_won", lazy="select"
    )
    shots: relationship = relationship(
        "ShotAnalysis",
        back_populates="game",
        lazy="select",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return (
            f"Game {self.game_id}: {self.player1.username} vs {self.player2.username}"
        )

    def calculate_metrics(self):
        """Calculate advanced game metrics."""
        return {
            "accuracy": self.successful_shots / max(1, self.total_shots),
            "avg_difficulty": self.average_shot_difficulty,
            "position_score": self.average_position_score,
            "break_success": self.balls_pocketed_on_break
            / max(1, self.breaks_attempted),
            "game_duration": (self.end_time - self.start_time).total_seconds() / 60.0,
        }


class ShotAnalysis(Base):
    """Shot analysis model."""

    __tablename__: str = "shot_analysis"
    __table_args__ = {"extend_existing": True}

    SHOT_TYPES: List[Any] = [
        "straight",
        "cut",
        "bank",
        "kick",
        "combo",
        "carom",
        "jump",
        "masse",
    ]

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("game_analysis.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    shot_number: Mapped[int] = mapped_column()
    shot_type: Mapped[str] = mapped_column(String(20))

    # Shot details
    difficulty: Mapped[float] = mapped_column()  # 0.0 to 1.0
    success: Mapped[bool] = mapped_column()
    position_score: Mapped[float] = mapped_column()  # 0.0 to 1.0
    english_applied: Mapped[float] = mapped_column()  # -1.0 to 1.0
    speed: Mapped[float] = mapped_column()  # 0.0 to 1.0

    # Position data
    cue_ball_start: Mapped[Dict[str, float]] = mapped_column(
        JSON
    )  # {x: float, y: float}
    cue_ball_end: Mapped[Optional[Dict[str, float]]] = mapped_column(
        JSON, nullable=True
    )  # {x: float, y: float}
    object_ball_start: Mapped[Dict[str, float]] = mapped_column(
        JSON
    )  # {x: float, y: float}
    target_pocket: Mapped[Optional[Dict[str, float]]] = mapped_column(
        JSON, nullable=True
    )  # {x: float, y: float}

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    # Relationships
    game: relationship = relationship(
        "GameAnalysis", back_populates="shots", lazy="select"
    )
    player: relationship = relationship(User, lazy="select")

    def __repr__(self) -> str:
        """Return string representation."""
        return f"Shot {self.shot_number} by {self.player.username}"

    def calculate_difficulty(self):
        """Calculate shot difficulty based on various factors."""
        factors: Dict[Any, Any] = {
            "distance": self._calculate_distance_factor(),
            "angle": self._calculate_angle_factor(),
            "obstacles": self._calculate_obstacle_factor(),
            "english": abs(self.english_applied),
            "speed_control": self._calculate_speed_factor(),
        }

        weights: Dict[Any, Any] = {
            "distance": 0.2,
            "angle": 0.3,
            "obstacles": 0.2,
            "english": 0.15,
            "speed_control": 0.15,
        }

        return sum(factor * weights[key] for key, factor in factors.items())

    def _calculate_distance_factor(self):
        """Calculate difficulty factor based on shot distance."""
        cb_start: Any = np.array([self.cue_ball_start["x"], self.cue_ball_start["y"]])
        ob_start = np.array([self.object_ball_start["x"], self.object_ball_start["y"]])
        distance: Any = np.linalg.norm(cb_start - ob_start)
        return min(1.0, distance / 100.0)  # Normalize to table length

    def _calculate_angle_factor(self) -> float:
        """Calculate difficulty factor based on cut angle."""
        if not self.target_pocket:
            return 0.5

        cb = np.array([self.cue_ball_start["x"], self.cue_ball_start["y"]])
        ob: Any = np.array([self.object_ball_start["x"], self.object_ball_start["y"]])
        pocket: Any = np.array([self.target_pocket["x"], self.target_pocket["y"]])

        # Calculate vectors
        shot_line = ob - cb
        pocket_line: Any = pocket - ob

        # Calculate angle between vectors
        cos_angle: Any = np.dot(shot_line, pocket_line) / (
            np.linalg.norm(shot_line) * np.linalg.norm(pocket_line)
        )
        angle: Any = np.arccos(np.clip(cos_angle, -1.0, 1.0))

        return angle / np.pi  # Normalize to [0, 1]

    def _calculate_obstacle_factor(self) -> float:
        """Calculate difficulty factor based on obstacles."""
        # This would use the game state to check for blocking balls
        # For now, return a placeholder value
        return 0.5

    def _calculate_speed_factor(self):
        """Calculate difficulty factor based on speed control requirements."""
        return self.speed


class PerformanceInsight(Base):
    INSIGHT_TYPES: List[Any] = [
        ("strength", "Strength"),
        ("weakness", "Weakness"),
        ("improvement", "Improvement"),
        ("pattern", "Pattern"),
        ("recommendation", "Recommendation"),
    ]

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    insight_type: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(200))
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column()  # 0.0 to 1.0
    generated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column()

    # Relationships
    user: relationship = relationship(User, foreign_keys=[user_id], lazy="select")

    def __repr__(self):
        return f"{self.insight_type} insight for {self.user.username}"

    @classmethod
    def generate_insights(cls, user: User, recent_games: List[GameAnalysis]):
        """Generate performance insights based on recent games"""
        insights = []

        # Analyze shot patterns
        shot_patterns: Any = cls._analyze_shot_patterns(recent_games)
        if shot_patterns:
            insights.extend(cls._create_pattern_insights(user, shot_patterns))

        # Analyze strengths and weaknesses
        performance_analysis: Any = cls._analyze_performance(recent_games)
        insights.extend(cls._create_performance_insights(user, performance_analysis))

        # Generate recommendations
        recommendations = cls._generate_recommendations(performance_analysis)
        insights.extend(cls._create_recommendation_insights(user, recommendations))

        return insights

    @staticmethod
    def _analyze_shot_patterns(games: List[GameAnalysis]) -> Dict[str, Any]:
        """Analyze shot patterns across games"""
        all_shots: relationship = []
        for game in games:
            all_shots.extend(game.shots.all())

        patterns: Dict[Any, Any] = {
            "preferred_shots": {},
            "success_rates": {},
            "position_patterns": [],
            "common_mistakes": [],
        }

        # Analyze shot type preferences
        for shot in all_shots:
            shot_type: Any = shot.shot_type
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
    def _analyze_performance(games: List[GameAnalysis]):
        """Analyze overall performance metrics"""
        total_shots: relationship = 0
        successful_shots: relationship = 0
        total_difficulty = 0
        total_position: int = 0

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
    def _create_pattern_insights(cls, user: User, patterns: Dict[str, Any]):
        """Create insights based on shot patterns"""
        insights = []

        # Analyze preferred shots
        total_shots: relationship = sum(patterns["preferred_shots"].values())
        for shot_type, count in patterns["preferred_shots"].items():
            percentage: Any = count / total_shots
            if percentage > 0.3:  # Significant preference
                success_rate: Any = (
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
                            metrics={
                                "success_rate": success_rate,
                                "frequency": percentage,
                            },
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
                            metrics={
                                "success_rate": success_rate,
                                "frequency": percentage,
                            },
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
    def _generate_recommendations(performance: Dict[str, Any]):
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
