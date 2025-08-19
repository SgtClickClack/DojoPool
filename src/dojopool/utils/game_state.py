from datetime import datetime
from enum import Enum
from typing import Dict, List


class GameStatus(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BallStatus(Enum):
    ON_TABLE = "on_table"
    POCKETED = "pocketed"
    SCRATCHED = "scratched"


class GameState:
    """Manage game state and rules"""

    def __init__(self, game_id: int, rules: Dict):
        self.game_id = game_id
        self.rules = rules
        self.status = GameStatus.PENDING
        self.current_player = None
        self.winner = None
        self.start_time = None
        self.end_time = None
        self.shots = {}  # Track shots per player
        self.fouls = {}  # Track fouls per player
        self.ball_states = self._initialize_ball_states()
        self.player_types = {}  # 'solids' or 'stripes'
        self.eight_ball_allowed = False

    def _initialize_ball_states(self) -> Dict[int, BallStatus]:
        """Initialize ball states at game start"""
        return {i: BallStatus.ON_TABLE for i in range(1, 16)}  # Balls 1-15

    def start_game(self, player1_id: int, player2_id: int):
        """Start the game"""
        self.status = GameStatus.ACTIVE
        self.current_player = player1_id
        self.start_time = datetime.utcnow()
        self.shots = {
            player1_id: {"total": 0, "successful": 0},
            player2_id: {"total": 0, "successful": 0},
        }
        self.fouls = {player1_id: 0, player2_id: 0}

    def take_shot(self, player_id: int, shot_data: Dict) -> Dict:
        """
        Process a shot taken by a player
        :param player_id: Player taking the shot
        :param shot_data: Shot details including pocketed balls and fouls
        :return: Shot result and next state
        """
        if self.status != GameStatus.ACTIVE:
            raise ValueError("Game is not active")

        if player_id != self.current_player:
            raise ValueError("Not your turn")

        # Update shot statistics
        self.shots[player_id]["total"] += 1

        result = {
            "valid": True,
            "pocketed_balls": [],
            "fouls": [],
            "next_player": None,
            "game_over": False,
        }

        # Process pocketed balls
        if "pocketed_balls" in shot_data:
            result["pocketed_balls"] = self._process_pocketed_balls(
                player_id, shot_data["pocketed_balls"]
            )

        # Process fouls
        if "fouls" in shot_data:
            result["fouls"] = self._process_fouls(player_id, shot_data["fouls"])

        # Determine if shot was successful
        if result["pocketed_balls"] and not result["fouls"]:
            self.shots[player_id]["successful"] += 1

        # Check for game over conditions
        if self._check_game_over(player_id, result):
            result["game_over"] = True
            return result

        # Determine next player
        result["next_player"] = self._determine_next_player(
            player_id, bool(result["pocketed_balls"]), bool(result["fouls"])
        )
        self.current_player = result["next_player"]

        return result

    def _process_pocketed_balls(self, player_id: int, pocketed_balls: List[int]) -> List[int]:
        """Process pocketed balls and update game state"""
        valid_pocketed = []

        for ball in pocketed_balls:
            if ball not in self.ball_states or self.ball_states[ball] != BallStatus.ON_TABLE:
                continue

            # Determine player's ball type if not yet set
            if not self.player_types and ball < 8:
                self.player_types[player_id] = "solids"
                other_player = next(pid for pid in self.shots.keys() if pid != player_id)
                self.player_types[other_player] = "stripes"

            # Validate ball type
            if self._is_valid_ball_for_player(player_id, ball):
                self.ball_states[ball] = BallStatus.POCKETED
                valid_pocketed.append(ball)

        return valid_pocketed

    def _is_valid_ball_for_player(self, player_id: int, ball: int) -> bool:
        """Check if ball is valid for player to pocket"""
        if ball == 8:
            return self.eight_ball_allowed

        if player_id not in self.player_types:
            return True  # First shot of the game

        is_solid = ball < 8
        return (is_solid and self.player_types[player_id] == "solids") or (
            not is_solid and self.player_types[player_id] == "stripes"
        )

    def _process_fouls(self, player_id: int, fouls: List[str]) -> List[str]:
        """Process fouls and update game state"""
        if fouls:
            self.fouls[player_id] += 1

            # Check if player has exceeded foul limit
            if self.fouls[player_id] >= self.rules["fouls_allowed"]:
                self._end_game(next(pid for pid in self.shots.keys() if pid != player_id), "fouls")

        return fouls

    def _check_game_over(self, player_id: int, result: Dict) -> bool:
        """Check if the game is over"""
        if self.status == GameStatus.COMPLETED:
            return True

        # Check if 8-ball was pocketed
        if 8 in result["pocketed_balls"]:
            if self.eight_ball_allowed:
                self._end_game(player_id, "eight_ball")
            else:
                self._end_game(
                    next(pid for pid in self.shots.keys() if pid != player_id), "early_eight"
                )
            return True

        return False

    def _determine_next_player(self, current_player: int, pocketed: bool, fouled: bool) -> int:
        """Determine who plays next"""
        if fouled or not pocketed:
            return next(pid for pid in self.shots.keys() if pid != current_player)
        return current_player

    def _end_game(self, winner_id: int, reason: str):
        """End the game"""
        self.status = GameStatus.COMPLETED
        self.winner = winner_id
        self.end_time = datetime.utcnow()

    def get_state(self) -> Dict:
        """Get current game state"""
        return {
            "game_id": self.game_id,
            "status": self.status.value,
            "current_player": self.current_player,
            "winner": self.winner,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "shots": self.shots,
            "fouls": self.fouls,
            "ball_states": {k: v.value for k, v in self.ball_states.items()},
            "player_types": self.player_types,
            "eight_ball_allowed": self.eight_ball_allowed,
            "rules": self.rules,
        }

    def load_state(self, state: Dict):
        """Load game state from dictionary"""
        self.status = GameStatus(state["status"])
        self.current_player = state["current_player"]
        self.winner = state["winner"]
        self.start_time = (
            datetime.fromisoformat(state["start_time"]) if state["start_time"] else None
        )
        self.end_time = datetime.fromisoformat(state["end_time"]) if state["end_time"] else None
        self.shots = state["shots"]
        self.fouls = state["fouls"]
        self.ball_states = {int(k): BallStatus(v) for k, v in state["ball_states"].items()}
        self.player_types = state["player_types"]
        self.eight_ball_allowed = state["eight_ball_allowed"]
        self.rules = state["rules"]

    def check_eight_ball_allowed(self, player_id: int) -> bool:
        """Check if player is allowed to pocket the 8-ball"""
        if player_id not in self.player_types:
            return False

        # Check if all of player's balls are pocketed
        is_solids = self.player_types[player_id] == "solids"
        target_balls = range(1, 8) if is_solids else range(9, 16)

        return all(self.ball_states[ball] == BallStatus.POCKETED for ball in target_balls)

    def update_eight_ball_permission(self):
        """Update permission to pocket 8-ball"""
        if self.current_player:
            self.eight_ball_allowed = self.check_eight_ball_allowed(self.current_player)

    def pause_game(self):
        """Pause the game"""
        if self.status == GameStatus.ACTIVE:
            self.status = GameStatus.PAUSED

    def resume_game(self):
        """Resume the game"""
        if self.status == GameStatus.PAUSED:
            self.status = GameStatus.ACTIVE

    def cancel_game(self):
        """Cancel the game"""
        self.status = GameStatus.CANCELLED
        self.end_time = datetime.utcnow()
