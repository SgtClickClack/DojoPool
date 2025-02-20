"""Shot difficulty scoring system for pool game tracking."""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import numpy as np

from .game_tracker import BallPosition, Shot


@dataclass
class ShotDifficultyMetrics:
    """Metrics used to calculate shot difficulty."""

    distance: float  # Distance from cue ball to target ball
    angle: float  # Angle of shot (0-180 degrees)
    cushion_count: int  # Number of cushions involved
    obstacle_count: int  # Number of balls potentially blocking the path
    pocket_angle: float  # Angle to pocket (0-90 degrees)
    english_required: float  # Amount of spin needed (0-1)
    jump_required: bool  # Whether shot requires jumping
    bank_required: bool  # Whether shot requires banking
    combination_length: int  # Number of balls in combination shot


@dataclass
class DifficultyScore:
    """Shot difficulty score with breakdown."""

    total_score: float  # 0-100 scale
    metrics: ShotDifficultyMetrics
    components: Dict[str, float]  # Breakdown of score components
    confidence: float  # Confidence in the scoring (0-1)


class ShotDifficultyCalculator:
    """Calculate difficulty scores for pool shots."""

    def __init__(self) -> None:
        """Initialize calculator."""
        # Component weights for scoring
        self.weights = {
            "distance": 0.15,
            "angle": 0.20,
            "cushions": 0.15,
            "obstacles": 0.15,
            "pocket_angle": 0.15,
            "english": 0.10,
            "special": 0.10,  # For jump/bank/combination shots
        }

        # Table dimensions (standard 8-foot table)
        self.table_width = 2.54  # meters
        self.table_height = 1.27  # meters

        # Thresholds
        self.max_distance = np.sqrt(self.table_width**2 + self.table_height**2)
        self.obstacle_radius = 0.05  # meters (ball diameter)
        self.cushion_bonus = 20  # Points per cushion
        self.combination_bonus = 15  # Points per ball in combination

    def calculate_metrics(self, shot: Shot) -> Optional[ShotDifficultyMetrics]:
        """Calculate shot difficulty metrics."""
        if not shot.ball_positions:
            return None

        # Find cue ball and target ball positions
        cue_pos = next((p for p in shot.ball_positions if p.ball_id == 0), None)
        if not cue_pos:
            return None

        # For combination shots, look at all involved balls
        target_balls = sorted(shot.pocketed_balls - {0})
        if not target_balls:
            return None

        # Get initial target ball
        target_pos = next(
            (p for p in shot.ball_positions if p.ball_id == target_balls[0]), None
        )
        if not target_pos:
            return None

        # Calculate base metrics
        distance = np.sqrt(
            (target_pos.x - cue_pos.x) ** 2 + (target_pos.y - cue_pos.y) ** 2
        )

        # Calculate angle (relative to table)
        dx = target_pos.x - cue_pos.x
        dy = target_pos.y - cue_pos.y
        angle = abs(np.degrees(np.arctan2(dy, dx)))

        # Count cushions from shot type
        cushion_count = shot.type.count("bank")

        # Count potential obstacles
        obstacles = 0
        for pos in shot.ball_positions:
            if pos.ball_id in (0, target_balls[0]):
                continue
            # Check if ball is near the line between cue and target
            d = self._point_to_line_distance(
                (cue_pos.x, cue_pos.y), (target_pos.x, target_pos.y), (pos.x, pos.y)
            )
            if d < self.obstacle_radius * 2:
                obstacles += 1

        # Calculate pocket angle (if we can determine the pocket)
        pocket_pos = self._estimate_target_pocket(target_pos)
        if pocket_pos:
            dx_pocket = pocket_pos[0] - target_pos.x
            dy_pocket = pocket_pos[1] - target_pos.y
            pocket_angle = abs(
                np.degrees(np.arctan2(dy_pocket, dx_pocket) - np.arctan2(dy, dx))
            )
        else:
            pocket_angle = 45  # Default to medium difficulty

        # Determine if english/spin was needed
        english_required = 0.0
        if "draw" in shot.type or "follow" in shot.type:
            english_required = 0.8
        elif cushion_count > 0:
            english_required = 0.5

        return ShotDifficultyMetrics(
            distance=distance,
            angle=angle,
            cushion_count=cushion_count,
            obstacle_count=obstacles,
            pocket_angle=pocket_angle,
            english_required=english_required,
            jump_required="jump" in shot.type,
            bank_required=cushion_count > 0,
            combination_length=len(target_balls),
        )

    def _point_to_line_distance(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        point: Tuple[float, float],
    ) -> float:
        """Calculate distance from point to line segment."""
        x1, y1 = start
        x2, y2 = end
        x0, y0 = point

        # Calculate distance
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        den = np.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2)

        return num / den if den > 0 else 0.0

    def _estimate_target_pocket(
        self, ball_pos: BallPosition
    ) -> Optional[Tuple[float, float]]:
        """Estimate which pocket was being targeted."""
        # Standard pocket positions
        pockets = [
            (0.0, 0.0),  # Top left
            (self.table_width / 2, 0.0),  # Top center
            (self.table_width, 0.0),  # Top right
            (0.0, self.table_height),  # Bottom left
            (self.table_width / 2, self.table_height),  # Bottom center
            (self.table_width, self.table_height),  # Bottom right
        ]

        # Find closest pocket
        min_dist = float("inf")
        closest_pocket = None

        for pocket in pockets:
            dist = np.sqrt(
                (pocket[0] - ball_pos.x) ** 2 + (pocket[1] - ball_pos.y) ** 2
            )
            if dist < min_dist:
                min_dist = dist
                closest_pocket = pocket

        return closest_pocket

    def calculate_score(self, shot: Shot) -> Optional[DifficultyScore]:
        """Calculate overall difficulty score."""
        metrics = self.calculate_metrics(shot)
        if not metrics:
            return None

        # Calculate component scores (0-100 scale)
        components = {
            "distance": min(100, (metrics.distance / self.max_distance) * 100),
            "angle": min(100, (metrics.angle / 90) * 100),
            "cushions": min(100, metrics.cushion_count * self.cushion_bonus),
            "obstacles": min(100, metrics.obstacle_count * 25),
            "pocket_angle": min(100, (metrics.pocket_angle / 90) * 100),
            "english": metrics.english_required * 100,
            "special": 0.0,  # Base score for special shots
        }

        # Add special shot bonuses
        special_score = 0.0
        if metrics.jump_required:
            special_score += 50
        if metrics.bank_required:
            special_score += 30
        if metrics.combination_length > 1:
            special_score += (metrics.combination_length - 1) * self.combination_bonus
        components["special"] = min(100, special_score)

        # Calculate weighted total
        total_score = sum(
            score * self.weights[component] for component, score in components.items()
        )

        # Calculate confidence based on shot detection confidence
        confidence = (
            shot.confidence * 0.8
        )  # Slightly lower confidence in difficulty scoring

        return DifficultyScore(
            total_score=total_score,
            metrics=metrics,
            components=components,
            confidence=confidence,
        )
