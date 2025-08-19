"""Shot validation module for pool games."""

import math
from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional, Tuple


class BallType(Enum):
    """Ball type enumeration."""

    SOLID = "solid"
    STRIPE = "stripe"
    CUE = "cue"
    EIGHT = "eight"
    NINE = "nine"
    TEN = "ten"


@dataclass
class Point:
    """2D point representation."""

    x: float
    y: float

    def distance_to(self, other: "Point") -> float:
        """Calculate distance to another point."""
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)


@dataclass
class Ball:
    """Ball representation."""

    number: int
    position: Point
    velocity: Optional[Point] = None
    is_pocketed: bool = False
    type: Optional[BallType] = None

    def __post_init__(self):
        """Set ball type based on number."""
        if self.number == 0:
            self.type = BallType.CUE
        elif self.number == 8:
            self.type = BallType.EIGHT
        elif self.number == 9:
            self.type = BallType.NINE
        elif self.number == 10:
            self.type = BallType.TEN
        elif 1 <= self.number <= 7:
            self.type = BallType.SOLID
        elif 11 <= self.number <= 15:
            self.type = BallType.STRIPE


@dataclass
class Shot:
    """Shot representation."""

    cue_ball: Ball
    target_ball: Optional[Ball]
    angle: float  # in degrees
    power: float  # 0-1 scale
    english: float  # -1 to 1 scale
    elevation: float  # 0-90 degrees
    called_pocket: Optional[int] = None  # 1-6 for called shots
    called_ball: Optional[int] = None  # ball number for called shots


class ShotValidator:
    """Validates pool shots."""

    def __init__(self, game_type: str, table_dimensions: Tuple[float, float] = (254, 127)):
        """Initialize shot validator.

        Args:
            game_type: Type of game ('8ball', '9ball', etc.)
            table_dimensions: Table dimensions in cm (length, width)
        """
        self.game_type = game_type
        self.table_length, self.table_width = table_dimensions
        self.pocket_positions = self._initialize_pocket_positions()

    def validate_eight_ball_shot(self, game_state: Dict, shot: Shot) -> Tuple[bool, str]:
        """Validate an 8-ball shot.

        Args:
            game_state: Current game state
            shot: Shot to validate

        Returns:
            Tuple of (is_valid, message)
        """
        # Check if player's group is assigned
        player_group = game_state.get("player_groups", {}).get(str(game_state["current_player"]))
        if not player_group and not game_state.get("is_open_table", False):
            return False, "Player group not assigned"

        # Validate first hit
        if not shot.target_ball:
            return False, "No target ball specified"

        # On open table, any ball except 8-ball is valid
        if game_state.get("is_open_table", False):
            if shot.target_ball.number == 8:
                return False, "Cannot hit 8-ball on open table"
            return True, "Valid shot on open table"

        # Check if shooting at correct group
        if player_group == "solids" and shot.target_ball.type != BallType.SOLID:
            return False, "Must hit solid ball first"
        if player_group == "stripes" and shot.target_ball.type != BallType.STRIPE:
            return False, "Must hit striped ball first"

        # Special 8-ball rules
        if shot.target_ball.number == 8:
            # Check if player can shoot at 8-ball
            remaining_balls = [
                b
                for b in game_state["balls"]
                if not b["is_pocketed"]
                and (b["number"] <= 7 if player_group == "solids" else 8 <= b["number"] <= 15)
            ]
            if len(remaining_balls) > 0:
                return False, "Cannot shoot at 8-ball with group balls remaining"

            # Must call pocket for 8-ball
            if shot.called_pocket is None:
                return False, "Must call pocket for 8-ball"

        return True, "Valid shot"

    def validate_nine_ball_shot(self, game_state: Dict, shot: Shot) -> Tuple[bool, str]:
        """Validate a 9-ball shot.

        Args:
            game_state: Current game state
            shot: Shot to validate

        Returns:
            Tuple of (is_valid, message)
        """
        if not shot.target_ball:
            return False, "No target ball specified"

        # Must hit lowest numbered ball first
        lowest_ball = min(
            b["number"] for b in game_state["balls"] if not b["is_pocketed"] and b["number"] > 0
        )
        if shot.target_ball.number != lowest_ball:
            return False, f"Must hit {lowest_ball} ball first"

        return True, "Valid shot"

    def validate_shot_physics(self, shot: Shot) -> Tuple[bool, str]:
        """Validate shot physics.

        Args:
            shot: Shot to validate

        Returns:
            Tuple of (is_valid, message)
        """
        # Validate power
        if not 0 <= shot.power <= 1:
            return False, "Invalid shot power"

        # Validate english
        if not -1 <= shot.english <= 1:
            return False, "Invalid english"

        # Validate elevation
        if not 0 <= shot.elevation <= 90:
            return False, "Invalid elevation"

        # Check if shot is possible (basic physics)
        if shot.target_ball:
            distance = shot.cue_ball.position.distance_to(shot.target_ball.position)
            if distance < 5.715:  # 2.25 inches in cm (minimum distance for legal hit)
                return False, "Balls too close for legal hit"

        return True, "Valid shot physics"

    def validate_rail_contact(self, shot: Shot, rail_contacts: int) -> Tuple[bool, str]:
        """Validate rail contacts after shot.

        Args:
            shot: Shot that was made
            rail_contacts: Number of rail contacts

        Returns:
            Tuple of (is_valid, message)
        """
        # Most games require at least one rail contact after hitting object ball
        # unless a ball is pocketed
        if rail_contacts == 0:
            return False, "No rail contact after hit"

        return True, "Valid rail contact"

    def _initialize_pocket_positions(self) -> Dict[int, Point]:
        """Initialize pocket positions based on table dimensions."""
        return {
            1: Point(0, 0),  # Top left
            2: Point(self.table_length / 2, 0),  # Top center
            3: Point(self.table_length, 0),  # Top right
            4: Point(0, self.table_width),  # Bottom left
            5: Point(self.table_length / 2, self.table_width),  # Bottom center
            6: Point(self.table_length, self.table_width),  # Bottom right
        }

    def is_path_clear(self, start: Point, end: Point, balls: List[Ball]) -> bool:
        """Check if path between two points is clear of obstacles.

        Args:
            start: Starting point
            end: Ending point
            balls: List of balls to check for interference

        Returns:
            bool: True if path is clear
        """
        # Vector from start to end
        path_vector = Point(end.x - start.x, end.y - start.y)
        path_length = math.sqrt(path_vector.x**2 + path_vector.y**2)

        # Unit vector
        unit_vector = Point(path_vector.x / path_length, path_vector.y / path_length)

        # Check each ball
        ball_diameter = 5.715  # cm
        for ball in balls:
            if ball.is_pocketed or ball.position == start or ball.position == end:
                continue

            # Vector from start to ball
            to_ball = Point(ball.position.x - start.x, ball.position.y - start.y)

            # Project to_ball onto path
            projection = to_ball.x * unit_vector.x + to_ball.y * unit_vector.y

            # If projection is negative or greater than path length, ball is not between points
            if projection < 0 or projection > path_length:
                continue

            # Find closest point on path to ball
            closest = Point(
                start.x + unit_vector.x * projection, start.y + unit_vector.y * projection
            )

            # If distance from closest point to ball is less than ball diameter, path is blocked
            if ball.position.distance_to(closest) < ball_diameter:
                return False

        return True
