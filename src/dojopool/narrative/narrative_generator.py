from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import List


class EventType(Enum):
    BATTLE = "battle"
    TRAINING = "training"
    RELATIONSHIP = "relationship"


@dataclass
class Event:
    timestamp: datetime
    event_type: EventType
    description: str


class NarrativeGenerator:
    def __init__(self):
        self.events: List[Event] = []
