from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


class EventType(Enum):
    """Types of game events."""

    GAME_STARTED = "game_started"
    GAME_ENDED = "game_ended"
    SHOT_TAKEN = "shot_taken"
    BALL_POCKETED = "ball_pocketed"
    FOUL_COMMITTED = "foul_committed"
    TURN_CHANGED = "turn_changed"
    RACK_COMPLETED = "rack_completed"
    TIMEOUT_CALLED = "timeout_called"
    MATCH_POINT = "match_point"
    GAME_WON = "game_won"


@dataclass
class GameEvent:
    """Represents a game event."""

    event_type: EventType
    game_id: str
    user_id: int
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            "event_type": self.event_type.value,
            "game_id": self.game_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data or {},
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GameEvent":
        """Create event from dictionary."""
        return cls(
            event_type=EventType(data["event_type"]),
            game_id=data["game_id"],
            user_id=data["user_id"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            data=data.get("data"),
        )
