"""Shot tracking module for game analysis."""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from ..extensions import db


class ShotType(Enum):
    """Types of shots that can be taken."""

    BREAK = "break"
    SAFETY = "safety"
    POWER = "power"
    FINESSE = "finesse"
    BANK = "bank"
    COMBINATION = "combination"
    JUMP = "jump"
    MASSE = "masse"


class ShotResult(Enum):
    """Possible outcomes of a shot."""

    MADE = "made"
    MISSED = "missed"
    SCRATCH = "scratch"
    FOUL = "foul"
    SAFETY_SUCCESS = "safety_success"
    SAFETY_FAIL = "safety_fail"


class Shot(db.Model):
    """Model for tracking individual shots in a game."""

    __tablename__ = "shots"
    __table_args__ = {"extend_existing": True}

    id = db.Column(db.Integer, primary_key=True)
    game_id = db.Column(db.Integer, db.ForeignKey("game_states.id"), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    shot_type = db.Column(db.String(20), nullable=False)
    result = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Shot analysis data
    difficulty = db.Column(db.Float)  # 0-1 scale
    speed = db.Column(db.Float)  # mph or similar unit
    spin = db.Column(db.String(50))  # JSON string for spin components
    angle = db.Column(db.Float)  # degrees
    position_data = db.Column(db.JSON)  # Ball positions before/after

    # Relationships
    player = db.relationship("User", backref=db.backref("shots", lazy=True))

    def __init__(
        self,
        game_id: int,
        player_id: int,
        shot_type: ShotType,
        result: ShotResult,
        difficulty: Optional[float] = None,
        speed: Optional[float] = None,
        spin: Optional[str] = None,
        angle: Optional[float] = None,
        position_data: Optional[Dict] = None,
    ):
        """Initialize a new shot record."""
        self.game_id = game_id
        self.player_id = player_id
        self.shot_type = shot_type.value
        self.result = result.value
        self.difficulty = difficulty
        self.speed = speed
        self.spin = spin
        self.angle = angle
        self.position_data = position_data or {}
        self.timestamp = datetime.utcnow()

    @property
    def was_successful(self) -> bool:
        """Check if the shot was successful."""
        return self.result in [ShotResult.MADE.value, ShotResult.SAFETY_SUCCESS.value]

    def to_dict(self) -> Dict[str, Any]:
        """Convert the shot to a dictionary."""
        return {
            "id": self.id,
            "game_id": self.game_id,
            "player_id": self.player_id,
            "shot_type": self.shot_type,
            "result": self.result,
            "timestamp": self.timestamp.isoformat(),
            "difficulty": self.difficulty,
            "speed": self.speed,
            "spin": self.spin,
            "angle": self.angle,
            "position_data": self.position_data,
            "was_successful": self.was_successful,
        }

    @classmethod
    def get_player_stats(cls, player_id: int) -> Dict[str, Any]:
        """Get shot statistics for a player."""
        shots = cls.query.filter_by(player_id=player_id).all()
        total_shots = len(shots)

        if not total_shots:
            return {"total_shots": 0}

        successful_shots = sum(1 for shot in shots if shot.was_successful)

        return {
            "total_shots": total_shots,
            "successful_shots": successful_shots,
            "success_rate": successful_shots / total_shots,
            "shot_types": {
                shot_type.value: len([s for s in shots if s.shot_type == shot_type.value])
                for shot_type in ShotType
            },
        }

    def __repr__(self) -> str:
        """String representation of the shot."""
        return f"<Shot {self.id}: {self.shot_type} - {self.result}>"
