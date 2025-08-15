from typing import Dict, Set
from datetime import datetime

class SpectatorSystem:
    def __init__(self):
        self.active_streams: Dict[str, Dict] = {}
        self.viewers: Dict[str, Set[str]] = {}
