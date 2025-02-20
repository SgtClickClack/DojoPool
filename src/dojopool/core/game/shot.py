from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional


class ShotType(Enum):
    """Types of pool shots."""

    NORMAL = "normal"
    BREAK = "break"
    JUMP = "jump"
    MASSE = "masse"
    BANK = "bank"
    COMBINATION = "combination"
    SAFETY = "safety"
    PUSH_OUT = "push_out"


@dataclass
class ShotResult:
    """Result of a pool shot."""

    success: bool
    balls_pocketed: List[int]
    foul_committed: bool
    foul_type: Optional[str]
    points_scored: int
    turn_continues: bool
    data: Optional[Dict[str, Any]] = None


@dataclass
class Shot:
    """Represents a pool shot."""

    shot_id: str
    game_id: str
    player_id: int
    shot_type: ShotType
    timestamp: datetime
    called_pocket: Optional[int]
    called_ball: Optional[int]
    result: Optional[ShotResult] = None
    data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert shot to dictionary."""
        return {
            "shot_id": self.shot_id,
            "game_id": self.game_id,
            "player_id": self.player_id,
            "shot_type": self.shot_type.value,
            "timestamp": self.timestamp.isoformat(),
            "called_pocket": self.called_pocket,
            "called_ball": self.called_ball,
            "result": (
                {
                    "success": self.result.success,
                    "balls_pocketed": self.result.balls_pocketed,
                    "foul_committed": self.result.foul_committed,
                    "foul_type": self.result.foul_type,
                    "points_scored": self.result.points_scored,
                    "turn_continues": self.result.turn_continues,
                    "data": self.result.data,
                }
                if self.result
                else None
            ),
            "data": self.data,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]):
        """Create shot from dictionary."""
        result_data = data.get("result")
        result = (
            ShotResult(
                success=result_data["success"],
                balls_pocketed=result_data["balls_pocketed"],
                foul_committed=result_data["foul_committed"],
                foul_type=result_data["foul_type"],
                points_scored=result_data["points_scored"],
                turn_continues=result_data["turn_continues"],
                data=result_data.get("data"),
            )
            if result_data
            else None
        )

        return cls(
            shot_id=data["shot_id"],
            game_id=data["game_id"],
            player_id=data["player_id"],
            shot_type=ShotType(data["shot_type"]),
            timestamp=datetime.fromisoformat(data["timestamp"]),
            called_pocket=data.get("called_pocket"),
            called_ball=data.get("called_ball"),
            result=result,
            data=data.get("data"),
        )
