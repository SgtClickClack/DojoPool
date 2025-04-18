from typing import List
from enum import Enum
from dataclasses import dataclass
from datetime import datetime


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
