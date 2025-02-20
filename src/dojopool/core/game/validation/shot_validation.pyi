import math
from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

class BallType(Enum):
    CUE = "cue"
    SOLID = "solid"
    STRIPE = "stripe"
    EIGHT = "eight"

@dataclass
class Point:
    x: float
    y: float

@dataclass
class Ball:
    position: Point
    velocity: Point
    type: Optional[BallType] = None

@dataclass
class Shot:
    cue_ball: Ball
    target_ball: Ball
    force: float
    angle: float

class ShotValidator:
    def __init__(
        self, game_type: str, table_dimensions: Tuple[float, float] = (254, 127)
    ) -> None: ...
    def validate_shot(self, shot: Shot) -> bool: ...
    def calculate_trajectory(self, shot: Shot) -> List[Point]: ...
    def check_collision(self, ball1: Ball, ball2: Ball) -> bool: ...
    def predict_outcome(self, shot: Shot) -> Dict[str, Any]: ...
