"""Game state validation module."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple

from ..scoring import ScoringSystem
from .win_conditions import WinDetector


class GameState(Enum):
    """Game state enumeration."""

    INITIALIZING = "initializing"
    READY = "ready"
    IN_PROGRESS = "in_progress"
    SHOT_IN_PROGRESS = "shot_in_progress"
    BALL_IN_HAND = "ball_in_hand"
    GAME_OVER = "game_over"


class GamePhase(Enum):
    """Game phase enumeration."""

    BREAK = "break"
    OPEN_TABLE = "open_table"
    GROUP_ASSIGNED = "group_assigned"
    EIGHT_BALL = "eight_ball"
    NINE_BALL_NORMAL = "nine_ball_normal"
    NINE_BALL_FINAL = "nine_ball_final"


@dataclass
class Score:
    """Score representation."""

    points: int = 0
    fouls: int = 0
    scratches: int = 0
    innings: int = 0
    consecutive_fouls: int = 0


class StateValidator:
    """Validates game states and manages transitions."""

    def __init__(self, game_type: str, scoring_system: ScoringSystem):
        """Initialize state validator.

        Args:
            game_type: Type of game ('8ball', '9ball', etc.)
            scoring_system: Scoring system instance
        """
        self.game_type = game_type
        self.current_state = GameState.INITIALIZING
        self.current_phase = GamePhase.BREAK
        self.scores: Dict[str, Score] = {}  # player_id -> Score
        self.last_update = datetime.utcnow()
        self.last_foul: Optional[Dict] = None
        self.consecutive_legal_shots = 0
        self.scoring_system = scoring_system
        self.win_detector = WinDetector(game_type, scoring_system)

    def validate_state_transition(
        self, current_state: Dict, next_state: Dict
    ) -> Tuple[bool, str, Dict]:
        """Validate a state transition.

        Args:
            current_state: Current game state
            next_state: Proposed next state

        Returns:
            Tuple of (is_valid, message, updated_state)
        """
        # Validate basic state structure
        if not self._validate_state_structure(next_state):
            return False, "Invalid state structure", current_state

        # Check if transition is legal
        if not self._is_legal_transition(current_state, next_state):
            return False, "Illegal state transition", current_state

        # Update scores and statistics
        updated_state = self._update_scores(current_state, next_state)

        # Check win conditions
        win_result = self.win_detector.check_win_conditions(updated_state)
        if win_result.is_winner:
            updated_state["status"] = GameState.GAME_OVER.value
            updated_state["winner_id"] = win_result.winner_id
            updated_state["win_condition"] = win_result.condition.value
            updated_state["win_details"] = win_result.details
            return True, f"Game over - {win_result.details}", updated_state

        return True, "Valid transition", updated_state

    def _validate_state_structure(self, state: Dict) -> bool:
        """Validate state dictionary structure.

        Args:
            state: State to validate

        Returns:
            bool: True if structure is valid
        """
        required_fields = {
            "status",
            "current_player",
            "players",
            "balls",
            "fouls",
            "scores",
            "innings",
            "is_open_table",
        }

        if not all(field in state for field in required_fields):
            return False

        if self.game_type == "8ball" and "player_groups" not in state:
            return False

        return True

    def _is_legal_transition(self, current: Dict, next_state: Dict) -> bool:
        """Check if state transition is legal.

        Args:
            current: Current state
            next_state: Next state

        Returns:
            bool: True if transition is legal
        """
        current_status = GameState(current["status"])
        next_status = GameState(next_state["status"])

        # Define legal transitions
        legal_transitions = {
            GameState.INITIALIZING: {GameState.READY},
            GameState.READY: {GameState.IN_PROGRESS, GameState.BALL_IN_HAND},
            GameState.IN_PROGRESS: {
                GameState.SHOT_IN_PROGRESS,
                GameState.BALL_IN_HAND,
                GameState.GAME_OVER,
            },
            GameState.SHOT_IN_PROGRESS: {
                GameState.IN_PROGRESS,
                GameState.BALL_IN_HAND,
                GameState.GAME_OVER,
            },
            GameState.BALL_IN_HAND: {GameState.IN_PROGRESS},
            GameState.GAME_OVER: set(),  # No transitions from game over
        }

        return next_status in legal_transitions[current_status]

    def _update_scores(self, current: Dict, next_state: Dict) -> Dict:
        """Update scores based on state transition.

        Args:
            current: Current state
            next_state: Next state

        Returns:
            Dict: Updated state
        """
        updated = next_state.copy()
        current_player = current["current_player"]

        # Update innings if player changes
        if next_state["current_player"] != current_player:
            updated["innings"] = current.get("innings", 0) + 1

        # Process any new fouls
        new_fouls = next_state.get("fouls", [])
        if new_fouls and new_fouls != current.get("fouls", []):
            latest_foul = new_fouls[-1]
            self._process_foul(updated, latest_foul)

        # Update scores based on pocketed balls
        self._update_ball_scores(current, updated)

        return updated

    def _process_foul(self, state: Dict, foul: Dict):
        """Process a foul and update state accordingly.

        Args:
            state: Current state to update
            foul: Foul information
        """
        player_id = state["current_player"]

        # Update player's foul count
        if player_id not in self.scores:
            self.scores[player_id] = Score()
        self.scores[player_id].fouls += 1
        self.scores[player_id].consecutive_fouls += 1

        # Reset consecutive legal shots
        self.consecutive_legal_shots = 0

        # Handle scratch fouls
        if foul["type"] == "scratch":
            self.scores[player_id].scratches += 1
            state["ball_in_hand"] = True

        # Update state scores
        state["scores"] = {player_id: vars(score) for player_id, score in self.scores.items()}

        self.last_foul = foul

    def _update_ball_scores(self, current: Dict, next_state: Dict):
        """Update scores based on pocketed balls.

        Args:
            current: Current state
            next_state: Next state to update
        """
        current_player = current["current_player"]

        # Get newly pocketed balls
        current_pocketed = {b["number"] for b in current["balls"] if b.get("is_pocketed")}
        next_pocketed = {b["number"] for b in next_state["balls"] if b.get("is_pocketed")}
        new_pocketed = next_pocketed - current_pocketed

        if not new_pocketed:
            return

        # Initialize score if needed
        if current_player not in self.scores:
            self.scores[current_player] = Score()

        # Update scores based on game type
        if self.game_type == "9ball":
            # In 9-ball, points for pocketing 9-ball
            if 9 in new_pocketed:
                self.scores[current_player].points += 2
            # 1 point for any other legal pocket
            else:
                self.scores[current_player].points += len(new_pocketed)
        else:  # 8-ball
            # Points based on number of balls pocketed
            self.scores[current_player].points += len(new_pocketed)

        # Update consecutive legal shots
        self.consecutive_legal_shots += 1

        # Reset consecutive fouls
        self.scores[current_player].consecutive_fouls = 0

        # Update state scores
        next_state["scores"] = {player_id: vars(score) for player_id, score in self.scores.items()}

    def get_legal_shots(self, state: Dict) -> List[Dict]:
        """Get list of legal shots in current state.

        Args:
            state: Current game state

        Returns:
            List of legal shot descriptions
        """
        legal_shots = []

        if state["status"] != GameState.IN_PROGRESS.value:
            return legal_shots

        if self.game_type == "8ball":
            legal_shots = self._get_eight_ball_legal_shots(state)
        elif self.game_type == "9ball":
            legal_shots = self._get_nine_ball_legal_shots(state)

        return legal_shots

    def _get_eight_ball_legal_shots(self, state: Dict) -> List[Dict]:
        """Get legal shots for 8-ball.

        Args:
            state: Current game state

        Returns:
            List of legal shot descriptions
        """
        shots = []
        current_player = state["current_player"]
        player_group = state["player_groups"].get(current_player)

        # On open table, any ball except 8-ball is legal
        if state["is_open_table"]:
            for ball in state["balls"]:
                if not ball.get("is_pocketed") and ball["number"] != 8:
                    shots.append(
                        {
                            "ball": ball["number"],
                            "type": "open_table",
                            "called_pocket_required": True,
                        }
                    )
            return shots

        # Check if player can shoot at 8-ball
        player_balls = [
            b
            for b in state["balls"]
            if not b.get("is_pocketed")
            and (b["number"] <= 7 if player_group == "solids" else 8 < b["number"] <= 15)
        ]

        if not player_balls:  # All balls of group pocketed
            # Can shoot at 8-ball
            eight_ball = next(
                (b for b in state["balls"] if b["number"] == 8 and not b.get("is_pocketed")), None
            )
            if eight_ball:
                shots.append({"ball": 8, "type": "eight_ball", "called_pocket_required": True})
        else:
            # Must shoot at own group
            for ball in player_balls:
                shots.append(
                    {"ball": ball["number"], "type": player_group, "called_pocket_required": True}
                )

        return shots

    def _get_nine_ball_legal_shots(self, state: Dict) -> List[Dict]:
        """Get legal shots for 9-ball.

        Args:
            state: Current game state

        Returns:
            List of legal shot descriptions
        """
        shots = []

        # Must hit lowest numbered ball first
        lowest_ball = min(
            b["number"] for b in state["balls"] if not b.get("is_pocketed") and b["number"] > 0
        )

        shots.append({"ball": lowest_ball, "type": "nine_ball", "called_pocket_required": False})

        return shots
