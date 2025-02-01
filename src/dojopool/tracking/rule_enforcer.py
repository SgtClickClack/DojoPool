"""Pool game rule enforcement system."""

from typing import Dict, List, Set, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging
from enum import Enum, auto
from .game_tracker import Shot, BallPosition

logger = logging.getLogger(__name__)


class GameType(Enum):
    """Types of pool games."""

    EIGHT_BALL = auto()
    NINE_BALL = auto()
    TEN_BALL = auto()
    STRAIGHT_POOL = auto()


class FoulType(Enum):
    """Types of fouls."""

    NO_RAIL = auto()
    WRONG_BALL_FIRST = auto()
    SCRATCH = auto()
    PUSH_SHOT = auto()
    JUMP_SHOT = auto()
    MULTIPLE_HITS = auto()
    OUTSIDE_TABLE = auto()


@dataclass
class GameState:
    """Current state of the game."""

    game_type: GameType
    current_player: int
    player_groups: Dict[int, str]  # player -> 'stripes'/'solids'
    remaining_balls: Dict[int, Set[int]]  # player -> ball numbers
    on_ball: int  # The ball that must be hit first
    can_hit_rails: bool  # Whether balls must hit rails
    last_shot: Optional[Shot]
    is_open_table: bool
    winner: Optional[int]


@dataclass
class RuleViolation:
    """Rule violation details."""

    foul_type: FoulType
    description: str
    timestamp: datetime
    confidence: float
    evidence: List[BallPosition]


class RuleEnforcer:
    """Enforce pool game rules."""

    def __init__(self, game_type: GameType):
        """Initialize rule enforcer."""
        self.game_type = game_type
        self._state = self._create_initial_state()
        self._violations: List[RuleViolation] = []

    def _create_initial_state(self) -> GameState:
        """Create initial game state."""
        if self.game_type == GameType.EIGHT_BALL:
            return GameState(
                game_type=GameType.EIGHT_BALL,
                current_player=1,
                player_groups={},  # Assigned after break
                remaining_balls={1: set(range(1, 8)), 2: set(range(9, 16))},  # Solids  # Stripes
                on_ball=0,  # Cue ball
                can_hit_rails=True,
                last_shot=None,
                is_open_table=True,
                winner=None,
            )
        elif self.game_type == GameType.NINE_BALL:
            return GameState(
                game_type=GameType.NINE_BALL,
                current_player=1,
                player_groups={},  # Not used in 9-ball
                remaining_balls={1: set(range(1, 10)), 2: set(range(1, 10))},
                on_ball=1,  # Must hit lowest ball first
                can_hit_rails=True,
                last_shot=None,
                is_open_table=False,
                winner=None,
            )
        else:
            raise ValueError(f"Unsupported game type: {self.game_type}")

    def _check_rail_contact(self, shot: Shot) -> Optional[RuleViolation]:
        """Check if any ball contacted a rail after contact."""
        if not self._state.can_hit_rails:
            return None

        # Simple rail detection based on ball positions
        rail_contact = False
        for pos in shot.ball_positions:
            # Check if ball is near any rail
            if (
                pos.x < 0.1 or pos.x > 2.44 or pos.y < 0.1 or pos.y > 1.17  # Standard table width
            ):  # Standard table height
                rail_contact = True
                break

        if not rail_contact:
            return RuleViolation(
                foul_type=FoulType.NO_RAIL,
                description="No ball contacted a rail after contact",
                timestamp=shot.end_time or datetime.now(),
                confidence=0.8,
                evidence=shot.ball_positions,
            )

        return None

    def _check_first_contact(self, shot: Shot) -> Optional[RuleViolation]:
        """Check if the correct ball was hit first."""
        if not shot.ball_positions:
            return None

        # Find first ball contact
        cue_ball_pos = None
        first_contact = None

        for positions in zip(shot.ball_positions[:-1], shot.ball_positions[1:]):
            prev_pos, curr_pos = positions

            # Track cue ball
            if prev_pos.ball_id == 0:
                cue_ball_pos = prev_pos

            # Detect collision by checking distance
            if cue_ball_pos:
                dx = curr_pos.x - cue_ball_pos.x
                dy = curr_pos.y - cue_ball_pos.y
                distance = (dx * dx + dy * dy) ** 0.5

                if distance < 0.1:  # Ball diameter threshold
                    first_contact = curr_pos.ball_id
                    break

        if first_contact is not None and first_contact != self._state.on_ball:
            return RuleViolation(
                foul_type=FoulType.WRONG_BALL_FIRST,
                description=f"Hit ball {first_contact} first instead of {self._state.on_ball}",
                timestamp=shot.end_time or datetime.now(),
                confidence=0.9,
                evidence=shot.ball_positions,
            )

        return None

    def _check_scratch(self, shot: Shot) -> Optional[RuleViolation]:
        """Check if the cue ball was pocketed."""
        if 0 in shot.pocketed_balls:
            return RuleViolation(
                foul_type=FoulType.SCRATCH,
                description="Cue ball pocketed",
                timestamp=shot.end_time or datetime.now(),
                confidence=1.0,
                evidence=shot.ball_positions,
            )
        return None

    def _update_game_state(self, shot: Shot) -> None:
        """Update game state based on shot outcome."""
        # Update pocketed balls
        current_player = self._state.current_player
        opponent = 3 - current_player  # Switch between 1 and 2

        if self.game_type == GameType.EIGHT_BALL:
            # Handle group assignment on first legal pocket
            if self._state.is_open_table and shot.pocketed_balls:
                first_pocket = min(shot.pocketed_balls - {0, 8})
                if first_pocket < 8:
                    self._state.player_groups[current_player] = "solids"
                    self._state.player_groups[opponent] = "stripes"
                else:
                    self._state.player_groups[current_player] = "stripes"
                    self._state.player_groups[opponent] = "solids"
                self._state.is_open_table = False

            # Update remaining balls
            for ball in shot.pocketed_balls:
                if ball != 0:  # Not cue ball
                    if ball in self._state.remaining_balls[current_player]:
                        self._state.remaining_balls[current_player].remove(ball)

            # Check for win condition
            if 8 in shot.pocketed_balls:
                if len(self._state.remaining_balls[current_player]) == 0:
                    self._state.winner = current_player
                else:
                    self._state.winner = opponent

        elif self.game_type == GameType.NINE_BALL:
            # Remove pocketed balls
            for ball in shot.pocketed_balls:
                if ball != 0:  # Not cue ball
                    self._state.remaining_balls[1].remove(ball)
                    self._state.remaining_balls[2].remove(ball)

            # Update next target ball
            if self._state.remaining_balls[1]:
                self._state.on_ball = min(self._state.remaining_balls[1])

            # Check for win condition
            if 9 in shot.pocketed_balls:
                self._state.winner = current_player

    def process_shot(self, shot: Shot) -> List[RuleViolation]:
        """Process a shot and check for rule violations."""
        violations = []

        # Check basic rules
        if rail_violation := self._check_rail_contact(shot):
            violations.append(rail_violation)

        if contact_violation := self._check_first_contact(shot):
            violations.append(contact_violation)

        if scratch_violation := self._check_scratch(shot):
            violations.append(scratch_violation)

        # Store violations
        self._violations.extend(violations)

        # Update game state if no fouls
        if not violations:
            self._update_game_state(shot)

        return violations

    def get_state(self) -> GameState:
        """Get current game state."""
        return self._state

    def get_violations(self) -> List[RuleViolation]:
        """Get list of rule violations."""
        return self._violations.copy()

    def switch_player(self) -> None:
        """Switch current player."""
        self._state.current_player = 3 - self._state.current_player  # Switch between 1 and 2

    def reset(self) -> None:
        """Reset game state."""
        self._state = self._create_initial_state()
        self._violations.clear()
