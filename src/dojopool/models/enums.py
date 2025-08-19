"""Model enumerations module."""

from enum import Enum

class GameType(Enum):
    """Game type enumeration."""

    EIGHT_BALL = "eight_ball"
    NINE_BALL = "nine_ball"
    TEN_BALL = "ten_ball"
    STRAIGHT_POOL = "straight_pool"
    ONE_POCKET = "one_pocket"
    BANK_POOL = "bank_pool"


class GameMode(Enum):
    """Game mode enumeration."""

    CASUAL = "casual"
    RANKED = "ranked"
    TOURNAMENT = "tournament"
    PRACTICE = "practice"


class GameStatus(str, Enum):
    """Game status enumeration."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentStatus(str, Enum):
    """Tournament status enumeration."""

    PENDING = "pending"
    REGISTRATION = "registration"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TournamentFormat(str, Enum):
    """Tournament format enumeration."""

    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss" 