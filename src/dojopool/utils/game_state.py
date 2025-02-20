import gc
import gc
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, TypedDict, Union

from ..models.game import GameMode, GameStatus, GameType


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


class PlayerState(TypedDict):
    """Player state type."""

    id: int
    name: str
    score: int
    fouls: int
    timeouts_remaining: int
    is_breaking: bool
    last_shot_time: Optional[str]


class BallState(TypedDict):
    """Ball state type."""

    number: int
    position: Dict[str, float]  # x, y coordinates
    pocketed: bool
    timestamp: str


class ShotData(TypedDict):
    """Shot data type."""

    player_id: int
    ball_numbers: List[int]
    pocketed: bool
    foul: bool
    shot_type: str
    power: float
    spin: str
    angle: float
    position: Dict[str, float]
    target: Dict[str, float]
    result: str
    notes: str


class GameState:
    """Game state class for tracking real-time game information."""

    def __init__(
        self,
        game_id: int,
        game_type: GameType,
        game_mode: GameMode,
        player1_id: int,
        player2_id: int,
    ) -> None:
        """Initialize game state."""
        self.game_id = game_id
        self.game_type = game_type
        self.game_mode = game_mode
        self.status = GameStatus.PENDING
        self.current_player_id = player1_id
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.last_action_time: Optional[datetime] = None

        # Initialize player states
        self.players: Dict[int, PlayerState] = {
            player1_id: {
                "id": player1_id,
                "name": "",
                "score": 0,
                "fouls": 0,
                "timeouts_remaining": 3,
                "is_breaking": True,
                "last_shot_time": None,
            },
            player2_id: {
                "id": player2_id,
                "name": "",
                "score": 0,
                "fouls": 0,
                "timeouts_remaining": 3,
                "is_breaking": False,
                "last_shot_time": None,
            },
        }

        # Initialize game tracking
        self.balls: Dict[int, BallState] = {}
        self.shots: List[ShotData] = []
        self.fouls: List[Dict[str, Any]] = []
        self.score_history: List[Dict[str, Any]] = []
        self.current_frame: int = 1
        self.frames_played: int = 0
        self.break_runs: Dict[int, List[int]] = {player1_id: [], player2_id: []}
        self.high_runs: Dict[int, int] = {player1_id: 0, player2_id: 0}

        # Statistics
        self.stats: Dict[str, Any] = {
            "total_shots": 0,
            "total_fouls": 0,
            "avg_shot_time": 0.0,
            "longest_run": 0,
            "breaks": [],
            "safeties_played": 0,
            "position_errors": 0,
        }

    def start_game(self):
        """Start the game."""
        self.status = GameStatus.IN_PROGRESS
        self.start_time = datetime.utcnow()
        self.last_action_time = self.start_time

    def end_game(self):
        """End the game."""
        self.status = GameStatus.COMPLETED
        self.end_time = datetime.utcnow()

    def record_shot(self, shot_data: ShotData):
        """Record a shot."""
        self.shots.append(shot_data)
        self.last_action_time = datetime.utcnow()
        self.stats["total_shots"] += 1

        if shot_data["foul"]:
            self.record_foul(shot_data["player_id"])

        # Update player's last shot time
        self.players[shot_data["player_id"]][
            "last_shot_time"
        ] = datetime.utcnow().isoformat()

    def record_foul(self, player_id: int) -> None:
        """Record a foul."""
        self.players[player_id]["fouls"] += 1
        self.stats["total_fouls"] += 1
        self.fouls.append(
            {
                "player_id": player_id,
                "timestamp": datetime.utcnow().isoformat(),
                "frame": self.current_frame,
            }
        )

    def update_score(self, player_id: int, points: int):
        """Update player score."""
        self.players[player_id]["score"] += points
        self.score_history.append(
            {
                "player_id": player_id,
                "points": points,
                "timestamp": datetime.utcnow().isoformat(),
                "frame": self.current_frame,
                "total_score": self.players[player_id]["score"],
            }
        )

    def switch_player(self):
        """Switch current player."""
        player_ids = list(self.players.keys())
        self.current_player_id = (
            player_ids[1] if self.current_player_id == player_ids[0] else player_ids[0]
        )

    def update_ball_positions(self, ball_positions: Dict[int, Dict[str, float]]):
        """Update ball positions."""
        timestamp = datetime.utcnow().isoformat()
        for ball_num, position in ball_positions.items():
            if ball_num not in self.balls:
                self.balls[ball_num] = {
                    "number": ball_num,
                    "position": position,
                    "pocketed": False,
                    "timestamp": timestamp,
                }
            else:
                self.balls[ball_num]["position"] = position
                self.balls[ball_num]["timestamp"] = timestamp

    def pocket_ball(self, ball_number: int) -> None:
        """Mark a ball as pocketed."""
        if ball_number in self.balls:
            self.balls[ball_number]["pocketed"] = True
            self.balls[ball_number]["timestamp"] = datetime.utcnow().isoformat()

    def get_state(self):
        """Get current game state."""
        return {
            "game_id": self.game_id,
            "game_type": self.game_type.value,
            "game_mode": self.game_mode.value,
            "status": self.status.value,
            "current_player_id": self.current_player_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "last_action_time": (
                self.last_action_time.isoformat() if self.last_action_time else None
            ),
            "players": self.players,
            "balls": self.balls,
            "current_frame": self.current_frame,
            "frames_played": self.frames_played,
            "stats": self.stats,
        }

    def load_state(self, state: Dict):
        """Load game state from dictionary"""
        self.status = GameStatus(state["status"])
        self.current_player_id = state["current_player_id"]
        self.start_time = (
            datetime.fromisoformat(state["start_time"]) if state["start_time"] else None
        )
        self.end_time = (
            datetime.fromisoformat(state["end_time"]) if state["end_time"] else None
        )
        self.players = state["players"]
        self.balls = state["balls"]
        self.current_frame = state["current_frame"]
        self.frames_played = state["frames_played"]
        self.stats = state["stats"]

    def check_eight_ball_allowed(self, player_id: int):
        """Check if player is allowed to pocket the 8-ball"""
        if player_id not in self.players:
            return False

        # Check if all of player's balls are pocketed
        is_breaking = self.players[player_id]["is_breaking"]
        target_balls = range(1, 8) if is_breaking else range(9, 16)

        return all(self.balls[ball]["pocketed"] for ball in target_balls)

    def update_eight_ball_permission(self):
        """Update permission to pocket 8-ball"""
        if self.current_player_id:
            self.eight_ball_allowed = self.check_eight_ball_allowed(
                self.current_player_id
            )

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
