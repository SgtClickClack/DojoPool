"""Game state management module."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from ..extensions import db

# Association table for game players
game_players = db.Table(
    "game_players",
    db.Column("game_id", db.Integer, db.ForeignKey("game_states.id"), primary_key=True),
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
    extend_existing=True,
)


class GameType(Enum):
    """Supported game types."""

    EIGHT_BALL = "8ball"
    NINE_BALL = "9ball"
    STRAIGHT_POOL = "straight"
    ONE_POCKET = "one_pocket"


class GameStatus(Enum):
    """Game status states."""

    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GameState(db.Model):
    """Game state model for tracking game progress."""

    __tablename__ = "game_states"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False, default=GameStatus.PENDING.value)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Game details
    venue_id = db.Column(db.Integer, db.ForeignKey("venues.id"), nullable=False)
    table_number = db.Column(db.Integer)
    current_player_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    winner_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    # Relationships
    venue = db.relationship("Venue", backref=db.backref("games", lazy=True))
    current_player = db.relationship("User", foreign_keys=[current_player_id])
    winner = db.relationship("User", foreign_keys=[winner_id])
    players = db.relationship("User", secondary=game_players)
    events = db.relationship("GameEvent", backref="game", lazy=True)
    shots = db.relationship("Shot", backref="game", lazy=True)

    def __init__(self, game_type: str, venue_id: int, table_number: Optional[int] = None):
        """Initialize a new game state."""
        self.game_type = game_type
        self.venue_id = venue_id
        self.table_number = table_number
        self.status = GameStatus.PENDING.value

    def start_game(self, first_player_id: int) -> None:
        """Start the game with the specified first player."""
        if self.status != GameStatus.PENDING.value:
            raise ValueError("Game can only be started from pending status")

        self.status = GameStatus.ACTIVE.value
        self.current_player_id = first_player_id
        self.updated_at = datetime.utcnow()

    def end_game(self, winner_id: int) -> None:
        """End the game with the specified winner."""
        if self.status != GameStatus.ACTIVE.value:
            raise ValueError("Only active games can be ended")

        self.status = GameStatus.COMPLETED.value
        self.winner_id = winner_id
        self.updated_at = datetime.utcnow()

    def pause_game(self) -> None:
        """Pause the current game."""
        if self.status != GameStatus.ACTIVE.value:
            raise ValueError("Only active games can be paused")

        self.status = GameStatus.PAUSED.value
        self.updated_at = datetime.utcnow()

    def resume_game(self) -> None:
        """Resume a paused game."""
        if self.status != GameStatus.PAUSED.value:
            raise ValueError("Only paused games can be resumed")

        self.status = GameStatus.ACTIVE.value
        self.updated_at = datetime.utcnow()

    def cancel_game(self) -> None:
        """Cancel the current game."""
        if self.status == GameStatus.COMPLETED.value:
            raise ValueError("Completed games cannot be cancelled")

        self.status = GameStatus.CANCELLED.value
        self.updated_at = datetime.utcnow()

    def next_turn(self, next_player_id: int) -> None:
        """Set the next player's turn."""
        if self.status != GameStatus.ACTIVE.value:
            raise ValueError("Can only change turns in active games")

        if next_player_id not in [p.id for p in self.players]:
            raise ValueError("Next player must be a participant in the game")

        self.current_player_id = next_player_id
        self.updated_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert the game state to a dictionary."""
        return {
            "id": self.id,
            "game_type": self.game_type,
            "status": self.status,
            "venue_id": self.venue_id,
            "table_number": self.table_number,
            "current_player_id": self.current_player_id,
            "winner_id": self.winner_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "players": [p.id for p in self.players],
        }

    def __repr__(self) -> str:
        """String representation of the game state."""
        return f"<GameState {self.id}: {self.game_type} - {self.status}>"
