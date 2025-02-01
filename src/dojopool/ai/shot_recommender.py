"""AI-powered shot recommendation system."""

from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass
import numpy as np
from datetime import datetime
from ..tracking.game_tracker import BallPosition
from ..tracking.shot_difficulty import ShotDifficultyCalculator, DifficultyScore


@dataclass
class ShotOption:
    """Possible shot option with details."""

    target_ball: int
    target_pocket: Tuple[float, float]
    difficulty: DifficultyScore
    success_probability: float
    shot_type: str
    path_points: List[Tuple[float, float]]  # Key points along shot path
    english_type: str  # 'none', 'left', 'right', 'top', 'bottom'
    english_amount: float  # 0-1 scale
    power: float  # 0-1 scale
    expected_value: float  # Combines probability and strategic value


@dataclass
class GameContext:
    """Current game context for shot selection."""

    game_type: str  # '8-ball', '9-ball', etc.
    player_balls: Set[int]  # Ball numbers this player needs to pocket
    opponent_balls: Set[int]  # Ball numbers opponent needs to pocket
    is_open_table: bool
    score_difference: int  # Positive if winning, negative if losing
    shots_remaining: Optional[int]  # Estimated shots needed to win


class ShotRecommender:
    """Recommend optimal shots based on current table state."""

    def __init__(self) -> None:
        """Initialize recommender."""
        self.difficulty_calculator = ShotDifficultyCalculator()

        # Table dimensions (standard 8-foot table)
        self.table_width = 2.54  # meters
        self.table_height = 1.27  # meters

        # Physics parameters
        self.ball_radius = 0.05715  # meters
        self.friction_coefficient = 0.2
        self.cushion_restitution = 0.6

        # Strategy weights
        self.weights = {"difficulty": 0.3, "position": 0.3, "safety": 0.2, "strategic": 0.2}

    def get_shot_options(
        self, ball_positions: List[BallPosition], context: GameContext
    ) -> List[ShotOption]:
        """Get all possible shot options in current position."""
        options: List[ShotOption] = []

        # Get cue ball position
        cue_pos = next((p for p in ball_positions if p.ball_id == 0), None)
        if not cue_pos:
            return []

        # Get legal target balls
        target_balls = self._get_legal_targets(ball_positions, context)

        # Standard pocket positions
        pockets = [
            (0.0, 0.0),  # Top left
            (self.table_width / 2, 0.0),  # Top center
            (self.table_width, 0.0),  # Top right
            (0.0, self.table_height),  # Bottom left
            (self.table_width / 2, self.table_height),  # Bottom center
            (self.table_width, self.table_height),  # Bottom right
        ]

        # Check each target ball and pocket combination
        for ball_id in target_balls:
            ball_pos = next(p for p in ball_positions if p.ball_id == ball_id)

            for pocket in pockets:
                # Check direct shot
                direct_option = self._analyze_direct_shot(cue_pos, ball_pos, pocket, ball_positions)
                if direct_option:
                    options.append(direct_option)

                # Check bank shots
                bank_options = self._analyze_bank_shots(cue_pos, ball_pos, pocket, ball_positions)
                options.extend(bank_options)

                # Check combination shots
                combo_options = self._analyze_combination_shots(
                    cue_pos, ball_pos, pocket, ball_positions, context
                )
                options.extend(combo_options)

        # Calculate expected value for each option
        for option in options:
            option.expected_value = self._calculate_expected_value(option, context)

        # Sort by expected value
        options.sort(key=lambda x: x.expected_value, reverse=True)

        return options

    def _get_legal_targets(
        self, ball_positions: List[BallPosition], context: GameContext
    ) -> Set[int]:
        """Get set of legal target balls."""
        if context.game_type == "9-ball":
            # Must hit lowest numbered ball first
            lowest = min(p.ball_id for p in ball_positions if p.ball_id > 0)
            return {lowest}
        elif context.game_type == "8-ball":
            if context.is_open_table:
                return {p.ball_id for p in ball_positions if p.ball_id > 0 and p.ball_id != 8}
            else:
                # Must hit own group, except 8-ball if it's legal
                targets = context.player_balls
                if len(context.player_balls) == 1 and 8 in context.player_balls:
                    return {8}
                return targets - {8}
        else:
            return {p.ball_id for p in ball_positions if p.ball_id > 0}

    def _analyze_direct_shot(
        self,
        cue_pos: BallPosition,
        target_pos: BallPosition,
        pocket: Tuple[float, float],
        ball_positions: List[BallPosition],
    ) -> Optional[ShotOption]:
        """Analyze possibility of direct shot."""
        # Calculate angles
        cue_to_target = np.array([target_pos.x - cue_pos.x, target_pos.y - cue_pos.y])
        target_to_pocket = np.array([pocket[0] - target_pos.x, pocket[1] - target_pos.y])

        # Check if shot is geometrically possible
        if not self._is_shot_possible(cue_pos, target_pos, pocket):
            return None

        # Check for obstacles
        path_points = [(cue_pos.x, cue_pos.y), (target_pos.x, target_pos.y), pocket]
        if self._check_obstacles(path_points, ball_positions):
            return None

        # Calculate difficulty
        mock_shot = self._create_mock_shot(path_points, target_pos.ball_id)
        difficulty = self.difficulty_calculator.calculate_score(mock_shot)
        if not difficulty:
            return None

        # Calculate success probability
        success_prob = self._estimate_success_probability(difficulty)

        # Determine english requirements
        english_type, english_amount = self._calculate_english_requirements(
            cue_to_target, target_to_pocket
        )

        # Calculate required power
        power = self._calculate_required_power(path_points)

        return ShotOption(
            target_ball=target_pos.ball_id,
            target_pocket=pocket,
            difficulty=difficulty,
            success_probability=success_prob,
            shot_type="normal",
            path_points=path_points,
            english_type=english_type,
            english_amount=english_amount,
            power=power,
            expected_value=0.0,  # Will be calculated later
        )

    def _analyze_bank_shots(
        self,
        cue_pos: BallPosition,
        target_pos: BallPosition,
        pocket: Tuple[float, float],
        ball_positions: List[BallPosition],
    ) -> List[ShotOption]:
        """Analyze possibility of bank shots."""
        options = []

        # Check one-rail banks
        rails = [
            ("top", 0.0),  # y = 0
            ("bottom", self.table_height),  # y = height
            ("left", 0.0),  # x = 0
            ("right", self.table_width),  # x = width
        ]

        for rail_name, rail_pos in rails:
            bank_point = self._calculate_bank_point(target_pos, pocket, rail_name, rail_pos)
            if bank_point:
                path_points = [
                    (cue_pos.x, cue_pos.y),
                    (target_pos.x, target_pos.y),
                    bank_point,
                    pocket,
                ]

                if not self._check_obstacles(path_points, ball_positions):
                    mock_shot = self._create_mock_shot(
                        path_points, target_pos.ball_id, shot_type="bank"
                    )
                    difficulty = self.difficulty_calculator.calculate_score(mock_shot)
                    if difficulty:
                        success_prob = (
                            self._estimate_success_probability(difficulty) * 0.7
                        )  # Bank shots are harder

                        english_type, english_amount = self._calculate_english_requirements(
                            np.array(
                                [
                                    path_points[1][0] - path_points[0][0],
                                    path_points[1][1] - path_points[0][1],
                                ]
                            ),
                            np.array(
                                [
                                    path_points[2][0] - path_points[1][0],
                                    path_points[2][1] - path_points[1][1],
                                ]
                            ),
                        )

                        power = self._calculate_required_power(path_points)

                        options.append(
                            ShotOption(
                                target_ball=target_pos.ball_id,
                                target_pocket=pocket,
                                difficulty=difficulty,
                                success_probability=success_prob,
                                shot_type=f"bank_{rail_name}",
                                path_points=path_points,
                                english_type=english_type,
                                english_amount=english_amount,
                                power=power,
                                expected_value=0.0,
                            )
                        )

        return options

    def _analyze_combination_shots(
        self,
        cue_pos: BallPosition,
        target_pos: BallPosition,
        pocket: Tuple[float, float],
        ball_positions: List[BallPosition],
        context: GameContext,
    ) -> List[ShotOption]:
        """Analyze possibility of combination shots."""
        options = []

        # Look for potential intermediate balls
        for inter_pos in ball_positions:
            if inter_pos.ball_id in (0, target_pos.ball_id):
                continue

            # Check if intermediate ball is legal to hit
            if not context.is_open_table and inter_pos.ball_id not in context.player_balls:
                continue

            # Calculate paths
            path_points = [
                (cue_pos.x, cue_pos.y),
                (inter_pos.x, inter_pos.y),
                (target_pos.x, target_pos.y),
                pocket,
            ]

            if not self._check_obstacles(path_points, ball_positions):
                mock_shot = self._create_mock_shot(
                    path_points, target_pos.ball_id, shot_type="combination"
                )
                difficulty = self.difficulty_calculator.calculate_score(mock_shot)
                if difficulty:
                    success_prob = (
                        self._estimate_success_probability(difficulty) * 0.6
                    )  # Combinations are harder

                    english_type, english_amount = self._calculate_english_requirements(
                        np.array(
                            [
                                path_points[1][0] - path_points[0][0],
                                path_points[1][1] - path_points[0][1],
                            ]
                        ),
                        np.array(
                            [
                                path_points[2][0] - path_points[1][0],
                                path_points[2][1] - path_points[1][1],
                            ]
                        ),
                    )

                    power = self._calculate_required_power(path_points)

                    options.append(
                        ShotOption(
                            target_ball=target_pos.ball_id,
                            target_pocket=pocket,
                            difficulty=difficulty,
                            success_probability=success_prob,
                            shot_type=f"combination_{inter_pos.ball_id}",
                            path_points=path_points,
                            english_type=english_type,
                            english_amount=english_amount,
                            power=power,
                            expected_value=0.0,
                        )
                    )

        return options

    def _is_shot_possible(
        self, cue_pos: BallPosition, target_pos: BallPosition, pocket: Tuple[float, float]
    ) -> bool:
        """Check if shot is geometrically possible."""
        # Calculate angles
        cue_to_target = np.array([target_pos.x - cue_pos.x, target_pos.y - cue_pos.y])
        target_to_pocket = np.array([pocket[0] - target_pos.x, pocket[1] - target_pos.y])

        # Normalize vectors
        cue_to_target = cue_to_target / np.linalg.norm(cue_to_target)
        target_to_pocket = target_to_pocket / np.linalg.norm(target_to_pocket)

        # Calculate angle between vectors
        angle = np.arccos(np.clip(np.dot(cue_to_target, target_to_pocket), -1.0, 1.0))

        # Shot is possible if angle is less than 90 degrees
        return angle < np.pi / 2

    def _check_obstacles(
        self, path_points: List[Tuple[float, float]], ball_positions: List[BallPosition]
    ) -> bool:
        """Check if any balls obstruct the shot path."""
        for i in range(len(path_points) - 1):
            start = path_points[i]
            end = path_points[i + 1]

            for pos in ball_positions:
                # Skip balls that are part of the path
                if (pos.x, pos.y) in path_points:
                    continue

                # Calculate distance from ball to line segment
                dist = self._point_to_line_distance(start, end, (pos.x, pos.y))

                # Check if ball is too close to path
                if dist < self.ball_radius * 2:
                    return True

        return False

    def _calculate_bank_point(
        self, ball_pos: BallPosition, pocket: Tuple[float, float], rail: str, rail_pos: float
    ) -> Optional[Tuple[float, float]]:
        """Calculate bank point on rail."""
        if rail in ("top", "bottom"):
            # Calculate intersection with horizontal rail
            dx = pocket[0] - ball_pos.x
            dy = pocket[1] - ball_pos.y
            if dy == 0:
                return None

            t = (rail_pos - ball_pos.y) / dy
            x = ball_pos.x + t * dx

            if 0 <= x <= self.table_width:
                return (x, rail_pos)
        else:
            # Calculate intersection with vertical rail
            dx = pocket[0] - ball_pos.x
            dy = pocket[1] - ball_pos.y
            if dx == 0:
                return None

            t = (rail_pos - ball_pos.x) / dx
            y = ball_pos.y + t * dy

            if 0 <= y <= self.table_height:
                return (rail_pos, y)

        return None

    def _calculate_english_requirements(
        self, incoming: np.ndarray, outgoing: np.ndarray
    ) -> Tuple[str, float]:
        """Calculate english type and amount needed."""
        # Normalize vectors
        incoming = incoming / np.linalg.norm(incoming)
        outgoing = outgoing / np.linalg.norm(outgoing)

        # Calculate angle between vectors
        angle = np.arccos(np.clip(np.dot(incoming, outgoing), -1.0, 1.0))

        # Determine english direction
        cross_product = np.cross(incoming, outgoing)

        if angle < np.pi / 6:  # 30 degrees
            return "none", 0.0
        elif cross_product > 0:
            return "right", min(1.0, angle / np.pi)
        else:
            return "left", min(1.0, angle / np.pi)

    def _calculate_required_power(self, path_points: List[Tuple[float, float]]) -> float:
        """Calculate required power for shot."""
        # Calculate total distance
        total_distance = 0.0
        for i in range(len(path_points) - 1):
            dx = path_points[i + 1][0] - path_points[i][0]
            dy = path_points[i + 1][1] - path_points[i][1]
            total_distance += np.sqrt(dx * dx + dy * dy)

        # Scale power based on distance
        max_distance = np.sqrt(self.table_width**2 + self.table_height**2) * 2
        return min(1.0, total_distance / max_distance)

    def _estimate_success_probability(self, difficulty: DifficultyScore) -> float:
        """Estimate probability of success based on difficulty."""
        # Base probability decreases with difficulty
        base_prob = 1.0 - (difficulty.total_score / 200)  # 200 to make it harder

        # Adjust for confidence
        return base_prob * difficulty.confidence

    def _calculate_expected_value(self, option: ShotOption, context: GameContext) -> float:
        """Calculate expected value of shot option."""
        # Base value from success probability
        value = option.success_probability

        # Strategic value
        strategic_value = 0.0

        # Reward clearing own balls
        if option.target_ball in context.player_balls:
            strategic_value += 0.2

        # Extra value for ball-in-hand situations
        if context.score_difference < 0:
            strategic_value += 0.1

        # Value position play more when ahead
        if context.score_difference > 0:
            strategic_value += 0.1 * (1.0 - option.difficulty.total_score / 100)

        # Penalize difficult shots when safer options exist
        if option.difficulty.total_score > 70 and context.score_difference > 0:
            strategic_value -= 0.2

        # Combine values using weights
        total_value = (
            self.weights["difficulty"] * (1.0 - option.difficulty.total_score / 100)
            + self.weights["position"]
            * (1.0 - option.power)  # Lower power shots better for position
            + self.weights["safety"] * (1.0 - option.success_probability)
            + self.weights["strategic"] * strategic_value
        )

        return total_value

    def _create_mock_shot(
        self, path_points: List[Tuple[float, float]], target_ball: int, shot_type: str = "normal"
    ) -> Shot:
        """Create a mock shot for difficulty calculation."""
        now = datetime.now()
        return Shot(
            shot_id="mock_shot",
            start_time=now,
            end_time=now,
            ball_positions=[
                BallPosition(
                    ball_id=0 if i == 0 else target_ball,
                    x=point[0],
                    y=point[1],
                    confidence=0.9,
                    timestamp=now,
                )
                for i, point in enumerate(path_points[:-1])  # Exclude pocket
            ],
            is_valid=True,
            type=shot_type,
            pocketed_balls={target_ball},
            foul_detected=False,
            confidence=0.9,
        )
