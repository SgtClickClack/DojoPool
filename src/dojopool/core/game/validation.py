"""Game state validation module for enforcing pool game rules."""

from datetime import datetime
from enum import Enum
from typing import Dict, Optional, List, Any
from dataclasses import dataclass


class GameType(Enum):
    """Types of pool games."""

    EIGHT_BALL = "8_ball"
    NINE_BALL = "9_ball"
    TEN_BALL = "10_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"


@dataclass
class GameRules:
    """Rules for a pool game."""

    game_type: GameType
    balls_required: List[int]
    fouls_allowed: int
    timeout_limit: int
    rack_pattern: List[List[int]]
    special_rules: Dict[str, Any]


class ValidationResult:
    """Result of a game state validation."""

    def __init__(self, valid: bool, message: str = "", data: Optional[Dict] = None):
        self.valid = valid
        self.message = message
        self.data = data or {}
        self.timestamp = datetime.utcnow().isoformat()


class GameValidator:
    """Validates game rules and events."""

    def __init__(self) -> None:
        self.rules: Dict[GameType, GameRules] = {
            GameType.EIGHT_BALL: GameRules(
                game_type=GameType.EIGHT_BALL,
                balls_required=list(range(1, 16)),
                fouls_allowed=3,
                timeout_limit=1,
                rack_pattern=[[1], [2, 3], [4, 8, 5], [6, 9, 10, 7], [11, 12, 13, 14, 15]],
                special_rules={
                    "call_shots": True,
                    "ball_in_hand": True,
                    "must_hit_own_group": True,
                },
            ),
            GameType.NINE_BALL: GameRules(
                game_type=GameType.NINE_BALL,
                balls_required=list(range(1, 10)),
                fouls_allowed=3,
                timeout_limit=1,
                rack_pattern=[[1], [2, 3], [4, 9, 5], [6, 7, 8]],
                special_rules={
                    "must_hit_lowest": True,
                    "ball_in_hand": True,
                    "push_out_allowed": True,
                },
            ),
        }

    def validate_rack(self, game_type: GameType, rack_balls: List[int]) -> bool:
        """Validate rack formation."""
        rules = self.rules.get(game_type)
        if not rules:
            return False

        # Check if all required balls are present
        if sorted(rack_balls) != sorted(rules.balls_required):
            return False

        return True

    def validate_shot(self, game_type: GameType, shot_data: Dict[str, Any]) -> bool:
        """Validate a shot according to game rules."""
        rules = self.rules.get(game_type)
        if not rules:
            return False

        # Validate according to game type
        if game_type == GameType.NINE_BALL:
            return self._validate_nine_ball_shot(shot_data, rules)
        elif game_type == GameType.EIGHT_BALL:
            return self._validate_eight_ball_shot(shot_data, rules)

        return True

    def _validate_nine_ball_shot(self, shot_data: Dict[str, Any], rules: GameRules) -> bool:
        """Validate a 9-ball shot."""
        first_hit = shot_data.get("first_ball_hit")
        lowest_ball = shot_data.get("lowest_ball")

        if not first_hit or not lowest_ball:
            return False

        # Must hit lowest numbered ball first
        if rules.special_rules["must_hit_lowest"] and first_hit != lowest_ball:
            return False

        return True

    def _validate_eight_ball_shot(self, shot_data: Dict[str, Any], rules: GameRules) -> bool:
        """Validate an 8-ball shot."""
        if not rules.special_rules["call_shots"]:
            return True

        called_pocket = shot_data.get("called_pocket")
        actual_pocket = shot_data.get("actual_pocket")

        if called_pocket is None or actual_pocket is None:
            return False

        # Shot must go in called pocket
        return called_pocket == actual_pocket

    def get_game_rules(self, game_type: GameType) -> Optional[GameRules]:
        """Get rules for a game type."""
        return self.rules.get(game_type)

    def validate_pocket(self, game_state: Dict, pocket_data: Dict) -> ValidationResult:
        """Validate a ball being pocketed."""
        result = None

        if not self._validate_pocket_basics(pocket_data):
            result = ValidationResult(False, "Invalid pocket data")

        # Game-specific pocket validation
        elif game_type == GameType.EIGHT_BALL:
            result = self._validate_eight_ball_pocket(game_state, pocket_data)
        elif game_type == GameType.NINE_BALL:
            result = self._validate_nine_ball_pocket(game_state, pocket_data)
        elif game_type == GameType.ONE_POCKET:
            result = self._validate_one_pocket_pocket(game_state, pocket_data)
        elif game_type == GameType.BANK_POOL:
            result = self._validate_bank_pool_pocket(game_state, pocket_data)
        elif game_type == GameType.SNOOKER:
            result = self._validate_snooker_pocket(game_state, pocket_data)
        else:
            result = ValidationResult(True)

        # Record validation result
        self._record_validation(result, "pocket", pocket_data)
        return result

    def _validate_one_pocket_shot(self, game_state: Dict, shot_data: Dict) -> ValidationResult:
        """Validate a shot in one pocket."""
        player_id = shot_data["player_id"]
        player_pocket = game_state.get("player_pockets", {}).get(str(player_id))

        if not player_pocket:
            return ValidationResult(False, "No assigned pocket")

        # Validate shot is toward assigned pocket
        shot_angle = shot_data.get("angle")
        if not self._is_shot_toward_pocket(shot_angle, player_pocket):
            return ValidationResult(False, "Shot not toward assigned pocket")

        return ValidationResult(True)

    def _validate_bank_pool_shot(self, game_state: Dict, shot_data: Dict) -> ValidationResult:
        """Validate a shot in bank pool."""
        # Check if shot includes at least one rail
        if not shot_data.get("rails", 0):
            return ValidationResult(False, "Shot must include at least one rail")

        return ValidationResult(True)

    def _validate_snooker_shot(self, game_state: Dict, shot_data: Dict) -> ValidationResult:
        """Validate a shot in snooker."""
        current_color = game_state.get("current_color")
        target_ball = shot_data.get("target_ball")

        if not current_color:
            return ValidationResult(False, "No current color set")

        # Must hit red first if reds remain, unless in color sequence
        reds_remaining = game_state.get("remaining_reds", 0)
        if reds_remaining > 0 and current_color != "red" and target_ball != "red":
            return ValidationResult(False, "Must hit red ball first")

        return ValidationResult(True)

    def _validate_one_pocket_pocket(self, game_state: Dict, pocket_data: Dict) -> ValidationResult:
        """Validate a pocket in one pocket."""
        player_id = pocket_data["player_id"]
        pocket_number = pocket_data["pocket_number"]
        player_pocket = game_state.get("player_pockets", {}).get(str(player_id))

        if pocket_number != player_pocket:
            return ValidationResult(False, "Wrong pocket for player")

        return ValidationResult(True)

    def _validate_bank_pool_pocket(self, game_state: Dict, pocket_data: Dict) -> ValidationResult:
        """Validate a pocket in bank pool."""
        # Ensure the shot included required rails
        if not pocket_data.get("rails", 0):
            return ValidationResult(False, "Ball must hit at least one rail before pocketing")

        return ValidationResult(True)

    def _validate_snooker_pocket(self, game_state: Dict, pocket_data: Dict) -> ValidationResult:
        """Validate a pocket in snooker."""
        ball_color = pocket_data.get("ball_color")
        current_color = game_state.get("current_color")

        if not ball_color or not current_color:
            return ValidationResult(False, "Invalid ball or current color")

        if ball_color != current_color:
            return ValidationResult(False, f"Must pocket {current_color} ball")

        return ValidationResult(True)

    def _is_shot_toward_pocket(self, shot_angle: float, target_pocket: int) -> bool:
        """Check if shot angle is toward the target pocket."""
        # Pocket angles (approximate)
        pocket_angles = {
            1: 45,  # Top right
            2: 90,  # Top center
            3: 135,  # Top left
            4: 225,  # Bottom left
            5: 270,  # Bottom center
            6: 315,  # Bottom right
        }

        target_angle = pocket_angles.get(target_pocket)
        if not target_angle or not shot_angle:
            return False

        # Allow for some deviation (±30 degrees)
        angle_diff = abs(shot_angle - target_angle)
        return angle_diff <= 30 or angle_diff >= 330

    def _record_validation(self, result: ValidationResult, action_type: str, data: Dict):
        """Record validation result for history tracking."""
        self.validation_history.append(
            {
                "timestamp": result.timestamp,
                "action_type": action_type,
                "valid": result.valid,
                "message": result.message,
                "data": data,
            }
        )

        # Keep only last 100 validations
        if len(self.validation_history) > 100:
            self.validation_history = self.validation_history[-100:]
