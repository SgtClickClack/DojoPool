from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional

from ...models.user import User
from ...models.venue import Venue
from ..config.matchmaking import TIME_SETTINGS

@dataclass
class MatchEvent:
    timestamp: datetime
    user_id: int
    venue_id: int
    event_type: str
    data: Dict[str, str]

@dataclass
class MatchFoundEvent(MatchEvent):
    opponent_id: int
    game_type: str

@dataclass
class MatchAcceptedEvent(MatchEvent):
    match_id: int

@dataclass
class MatchDeclinedEvent(MatchEvent):
    match_id: int
    reason: Optional[str]

@dataclass
class MatchCancelledEvent(MatchEvent):
    match_id: int
    reason: str

@dataclass
class MatchStartedEvent(MatchEvent):
    match_id: int
    game_type: str

@dataclass
class MatchCompletedEvent(MatchEvent):
    match_id: int
    winner_id: int
    score: str

class EventManager:
    def __init__(self) -> None: ...
    def add_event(self, event: MatchEvent) -> None: ...
    def get_events(
        self, user_id: Optional[int] = None, event_type: Optional[str] = None
    ) -> List[MatchEvent]: ...
    def get_events_before(
        self, before_time: Optional[datetime] = None, event_type: Optional[str] = None
    ) -> List[MatchEvent]: ...
