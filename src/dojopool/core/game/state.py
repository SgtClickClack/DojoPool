from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Any, Optional, Set


class GameStatus(Enum):
    """Game status states."""

    WAITING = "waiting"
    STARTING = "starting"
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ERROR = "error"


class GameType(Enum):
    """Types of pool games."""

    EIGHT_BALL = "8_ball"
    NINE_BALL = "9_ball"
    TEN_BALL = "10_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"


@dataclass
class GameState:
    """Represents the current state of a pool game."""

    game_id: str
    game_type: GameType
    status: GameStatus
    current_player_id: int
    player_ids: List[int]
    player_groups: Dict[int, str]  # player_id -> group (stripes/solids)
    balls_on_table: Set[int]
    balls_pocketed: Dict[int, List[int]]  # player_id -> [ball numbers]
    fouls: Dict[int, int]  # player_id -> foul count
    score: Dict[int, int]  # player_id -> score
    innings: int
    rack_number: int
    started_at: datetime
    last_action_at: datetime
    winner_id: Optional[int] = None
    data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert game state to dictionary."""
        return {
            "game_id": self.game_id,
            "game_type": self.game_type.value,
            "status": self.status.value,
            "current_player_id": self.current_player_id,
            "player_ids": self.player_ids,
            "player_groups": self.player_groups,
            "balls_on_table": list(self.balls_on_table),
            "balls_pocketed": self.balls_pocketed,
            "fouls": self.fouls,
            "score": self.score,
            "innings": self.innings,
            "rack_number": self.rack_number,
            "started_at": self.started_at.isoformat(),
            "last_action_at": self.last_action_at.isoformat(),
            "winner_id": self.winner_id,
            "data": self.data,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GameState":
        """Create game state from dictionary."""
        return cls(
            game_id=data["game_id"],
            game_type=GameType(data["game_type"]),
            status=GameStatus(data["status"]),
            current_player_id=data["current_player_id"],
            player_ids=data["player_ids"],
            player_groups=data["player_groups"],
            balls_on_table=set(data["balls_on_table"]),
            balls_pocketed=data["balls_pocketed"],
            fouls=data["fouls"],
            score=data["score"],
            innings=data["innings"],
            rack_number=data["rack_number"],
            started_at=datetime.fromisoformat(data["started_at"]),
            last_action_at=datetime.fromisoformat(data["last_action_at"]),
            winner_id=data.get("winner_id"),
            data=data.get("data"),
        )

    def is_game_over(self) -> bool:
        """Check if the game is over."""
        return self.status in (GameStatus.COMPLETED, GameStatus.CANCELLED, GameStatus.ERROR)

    def get_player_score(self, player_id: int) -> int:
        """Get a player's current score."""
        return self.score.get(player_id, 0)

    def get_player_balls(self, player_id: int) -> List[int]:
        """Get balls pocketed by a player."""
        return self.balls_pocketed.get(player_id, [])

    def get_player_group(self, player_id: int) -> Optional[str]:
        """Get a player's ball group (stripes/solids)."""
        return self.player_groups.get(player_id)

    def get_remaining_balls(self) -> Set[int]:
        """Get balls remaining on the table."""
        return self.balls_on_table.copy()

    def get_game_duration(self) -> float:
        """Get game duration in seconds."""
        if self.is_game_over():
            end_time = self.last_action_at
        else:
            end_time = datetime.now()
        return (end_time - self.started_at).total_seconds()

    def get_player_stats(self, player_id: int) -> Dict[str, Any]:
        """Get comprehensive stats for a player."""
        return {
            "score": self.get_player_score(player_id),
            "balls_pocketed": len(self.get_player_balls(player_id)),
            "fouls": self.fouls.get(player_id, 0),
            "group": self.get_player_group(player_id),
            "is_current_player": player_id == self.current_player_id,
            "is_winner": player_id == self.winner_id,
        }
