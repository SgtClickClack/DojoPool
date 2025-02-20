from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple

from ...models.game import Game
from ...models.user import User
from ..config.matchmaking import MATCHMAKING_SETTINGS, TIME_SETTINGS
from .exceptions import MatchmakingError, QueueFullError
from .utils import calculate_skill_rating, get_queue_position

@dataclass
class QueueEntry:
    user_id: int
    game_type: str
    venue_id: int
    join_time: datetime
    skill_rating: float
    preferences: Dict[str, Any]

class Matchmaker:
    def __init__(self) -> None: ...
    def add_to_queue(
        self,
        user_id: int,
        game_type: str,
        venue_id: int,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> QueueEntry: ...
    def remove_from_queue(self, user_id: int) -> bool: ...
    def find_match(self, entry: QueueEntry) -> Optional[Tuple[QueueEntry, float]]: ...
    def get_queue_status(
        self, user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]: ...
    def clear_queue(self) -> None: ...
