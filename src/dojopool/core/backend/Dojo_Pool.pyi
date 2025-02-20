from dataclasses import asdict, dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Union

def verify_git_settings() -> bool: ...

class Avatar:
    name: str
    image_url: str
    created_at: datetime

    def __init__(self, name: str, image_url: str) -> None: ...
    def to_dict(self) -> Dict[str, Any]: ...

class EventType(Enum):
    MATCH = "match"
    ACHIEVEMENT = "achievement"
    RANKING = "ranking"

class Event:
    type: EventType
    timestamp: datetime
    data: Dict[str, Any]

    def __init__(self, type: EventType, data: Dict[str, Any]) -> None: ...
    def to_dict(self) -> Dict[str, Any]: ...

class NarrativeGenerator:
    def __init__(self) -> None: ...
    def generate_narrative(self, events: List[Event]) -> str: ...
    def summarize_events(self, events: List[Event]) -> Dict[str, str]: ...
