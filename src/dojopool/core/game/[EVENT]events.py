"""Game events tracking module."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from ..extensions import db


class EventType(Enum):
    """Types of game events that can occur."""

    GAME_STARTED = "game_started"
    GAME_ENDED = "game_ended"
    TURN_CHANGE = "turn_change"
    SHOT_TAKEN = "shot_taken"
    FOUL = "foul"
    TIMEOUT = "timeout"
    SCORE_UPDATE = "score_update"
    GAME_PAUSED = "game_paused"
    GAME_RESUMED = "game_resumed"
    GAME_CANCELLED = "game_cancelled"


class GameEvent(db.Model):
    """Model for tracking game events."""

    __tablename__ = "game_events"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("game_states.id"), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    data = db.Column(db.JSON)

    # Relationships
    player = db.relationship("User", backref=db.backref("core_game_events", lazy=True))

    def __init__(
        self,
        game_id: int,
        event_type: EventType,
        player_id: Optional[int] = None,
        data: Optional[Dict[str, Any]] = None,
    ):
        """Initialize a new game event."""
        self.game_id = game_id
        self.event_type = event_type.value
        self.player_id = player_id
        self.data = data or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert the event to a dictionary."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "event_type": self.event_type,
            "player_id": self.player_id,
            "timestamp": self.timestamp.isoformat(),
            "data": self.data,
        }

    def __repr__(self) -> str:
        """String representation of the game event."""
        return f"<GameEvent {self.id}: {self.event_type}>"
