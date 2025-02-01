from enum import Enum
from typing import Dict


class RankTier(Enum):
    NOVICE = "novice"
    EXPERT = "expert"
    MASTER = "master"


class RankingSystem:
    def __init__(self):
        self.rankings: Dict[str, Dict] = {}
