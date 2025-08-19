"""DojoPool validation module."""

from enum import Enum


class GameType(Enum):
    """Game type enumeration for validation."""
    
    EIGHT_BALL = "eight_ball"
    NINE_BALL = "nine_ball"
    TEN_BALL = "ten_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"
    SNOOKER = "snooker"


class GameValidator:
    """Base game validator class."""
    
    def __init__(self, game_type: str):
        self.game_type = game_type
    
    def validate_shot(self, shot_data):
        """Validate a shot."""
        return True, "Valid shot"
    
    def validate_state(self, state_data):
        """Validate game state."""
        return True, "Valid state"
