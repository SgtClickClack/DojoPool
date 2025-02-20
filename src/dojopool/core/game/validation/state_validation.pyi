from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Tuple

from ..scoring import ScoringSystem
from .win_conditions import WinDetector

class GameState(Enum):
    pass

class GamePhase(Enum):
    pass

class Score:
    pass

class StateValidator:
    pass
