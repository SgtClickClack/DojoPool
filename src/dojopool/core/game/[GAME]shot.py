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


class CoreShotModel:
    """Core (non-SQLAlchemy) shot model for business logic or Pydantic use."""
    # Add business logic or Pydantic fields here as needed.
    pass
