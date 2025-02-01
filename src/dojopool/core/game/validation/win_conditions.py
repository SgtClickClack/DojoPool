"""Win conditions detection module for pool games."""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, Optional


class WinCondition(Enum):
    """Types of win conditions."""

    NORMAL = "normal"  # Standard win (8-ball after group, 9-ball pocketed legally)
    OPPONENT_FOUL = "opponent_foul"  # Win due to opponent's foul on game ball
    POINTS_TARGET = "points_target"  # Reached target points (for points-based games)
    FRAMES_TARGET = "frames_target"  # Won required number of frames
    OPPONENT_FORFEIT = "opponent_forfeit"  # Opponent forfeited the game
    SPECIAL_RULE = "special_rule"  # Special winning condition (e.g., three consecutive fouls)


@dataclass
class WinResult:
    """Result of a win condition check."""

    is_winner: bool
    winner_id: Optional[str] = None
    condition: Optional[WinCondition] = None
    details: Optional[str] = None
    timestamp: datetime = datetime.utcnow()


class WinDetector:
    """Detects and validates win conditions in pool games."""

    def __init__(self, game_type: str, scoring_system: "ScoringSystem"):
        """Initialize win detector.

        Args:
            game_type: Type of game ('8ball', '9ball', etc.)
            scoring_system: Reference to the game's scoring system
        """
        self.game_type = game_type
        self.scoring_system = scoring_system
        self.special_rules = {
            "three_consecutive_fouls": True,  # Enable three consecutive fouls rule
            "ball_in_hand_foul": True,  # Enable ball-in-hand on fouls
            "eight_on_break": True,  # Enable winning on 8-ball break
            "nine_on_break": True,  # Enable winning on 9-ball break
        }

    def check_win_conditions(self, state: Dict) -> WinResult:
        """Check all possible win conditions.

        Args:
            state: Current game state

        Returns:
            WinResult indicating if and how the game was won
        """
        # Check scoring-based wins first
        score_win = self._check_scoring_win()
        if score_win.is_winner:
            return score_win

        # Check game-specific win conditions
        if self.game_type == "8ball":
            return self._check_eight_ball_win(state)
        elif self.game_type == "9ball":
            return self._check_nine_ball_win(state)

        return WinResult(is_winner=False)

    def _check_scoring_win(self) -> WinResult:
        """Check if game is won based on scoring system.

        Returns:
            WinResult for scoring-based wins
        """
        winner_id = self.scoring_system.check_winner()
        if winner_id:
            stats = self.scoring_system.get_player_stats(winner_id)
            if stats:
                if stats.frames_won >= self.scoring_system.target_score:
                    return WinResult(
                        is_winner=True,
                        winner_id=winner_id,
                        condition=WinCondition.FRAMES_TARGET,
                        details=f"Won {stats.frames_won} frames",
                    )
                elif stats.total_points >= self.scoring_system.target_score:
                    return WinResult(
                        is_winner=True,
                        winner_id=winner_id,
                        condition=WinCondition.POINTS_TARGET,
                        details=f"Reached {stats.total_points} points",
                    )

        return WinResult(is_winner=False)

    def _check_eight_ball_win(self, state: Dict) -> WinResult:
        """Check 8-ball specific win conditions.

        Args:
            state: Current game state

        Returns:
            WinResult for 8-ball wins
        """
        current_player = state["current_player"]

        # Check if 8-ball was pocketed
        eight_ball_pocketed = any(b["number"] == 8 and b.get("is_pocketed") for b in state["balls"])

        if eight_ball_pocketed:
            # Check if it was on the break
            if state.get("is_break", False) and self.special_rules["eight_on_break"]:
                return WinResult(
                    is_winner=True,
                    winner_id=current_player,
                    condition=WinCondition.SPECIAL_RULE,
                    details="8-ball pocketed on break",
                )

            player_group = state["player_groups"].get(current_player)
            if not player_group:
                return WinResult(is_winner=False)

            # Check if all of player's balls were pocketed first
            player_balls = [
                b
                for b in state["balls"]
                if not b.get("is_pocketed")
                and (b["number"] <= 7 if player_group == "solids" else 8 < b["number"] <= 15)
            ]

            if not player_balls:  # All balls of group were pocketed
                return WinResult(
                    is_winner=True,
                    winner_id=current_player,
                    condition=WinCondition.NORMAL,
                    details="8-ball legally pocketed after clearing group",
                )
            else:
                # Other player wins if 8-ball pocketed early
                other_player = next(p for p in state["players"] if p != current_player)
                return WinResult(
                    is_winner=True,
                    winner_id=other_player,
                    condition=WinCondition.OPPONENT_FOUL,
                    details="Opponent pocketed 8-ball before clearing their group",
                )

        # Check three consecutive fouls
        if self.special_rules["three_consecutive_fouls"]:
            for player_id in state["players"]:
                stats = self.scoring_system.get_player_stats(player_id)
                if stats and stats.fouls >= 3:
                    other_player = next(p for p in state["players"] if p != player_id)
                    return WinResult(
                        is_winner=True,
                        winner_id=other_player,
                        condition=WinCondition.SPECIAL_RULE,
                        details="Opponent committed three consecutive fouls",
                    )

        return WinResult(is_winner=False)

    def _check_nine_ball_win(self, state: Dict) -> WinResult:
        """Check 9-ball specific win conditions.

        Args:
            state: Current game state

        Returns:
            WinResult for 9-ball wins
        """
        current_player = state["current_player"]

        # Check if 9-ball was pocketed
        nine_ball_pocketed = any(b["number"] == 9 and b.get("is_pocketed") for b in state["balls"])

        if nine_ball_pocketed:
            # Check if it was on the break
            if state.get("is_break", False) and self.special_rules["nine_on_break"]:
                return WinResult(
                    is_winner=True,
                    winner_id=current_player,
                    condition=WinCondition.SPECIAL_RULE,
                    details="9-ball pocketed on break",
                )

            # Normal 9-ball win
            return WinResult(
                is_winner=True,
                winner_id=current_player,
                condition=WinCondition.NORMAL,
                details="9-ball legally pocketed",
            )

        # Check three consecutive fouls
        if self.special_rules["three_consecutive_fouls"]:
            for player_id in state["players"]:
                stats = self.scoring_system.get_player_stats(player_id)
                if stats and stats.fouls >= 3:
                    other_player = next(p for p in state["players"] if p != player_id)
                    return WinResult(
                        is_winner=True,
                        winner_id=other_player,
                        condition=WinCondition.SPECIAL_RULE,
                        details="Opponent committed three consecutive fouls",
                    )

        return WinResult(is_winner=False)

    def set_special_rule(self, rule_name: str, enabled: bool):
        """Enable or disable a special rule.

        Args:
            rule_name: Name of the rule to modify
            enabled: Whether to enable or disable the rule
        """
        if rule_name in self.special_rules:
            self.special_rules[rule_name] = enabled
