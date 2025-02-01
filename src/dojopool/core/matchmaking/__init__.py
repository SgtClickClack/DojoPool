"""Matchmaking package initialization.

This package provides matchmaking functionality for pairing players
based on various factors like skill level, play style, and availability.
"""

from .events import (
    EventManager,
    MatchAcceptedEvent,
    MatchCancelledEvent,
    MatchCompletedEvent,
    MatchDeclinedEvent,
    MatchEvent,
    MatchFoundEvent,
    MatchStartedEvent,
)
from .exceptions import (
    BlockedPlayerError,
    IncompatiblePlayersError,
    InvalidPreferencesError,
    MatchmakingError,
    MatchmakingTimeoutError,
    PlayerNotFoundError,
    QueueFullError,
    RateLimitExceededError,
    SkillMismatchError,
    TimeConflictError,
    VenueUnavailableError,
)
from .matchmaker import Matchmaker, QueueEntry
from .notifications import Notification, NotificationManager
from .utils import (
    calculate_distance,
    calculate_time_overlap,
    check_rate_limit,
    check_scheduling_conflicts,
    find_common_venues,
    format_wait_time,
    get_mutual_friends,
    validate_preferences,
)

__all__ = [
    # Matchmaker
    "Matchmaker",
    "QueueEntry",
    # Events
    "MatchEvent",
    "MatchFoundEvent",
    "MatchAcceptedEvent",
    "MatchDeclinedEvent",
    "MatchCancelledEvent",
    "MatchStartedEvent",
    "MatchCompletedEvent",
    "EventManager",
    # Notifications
    "Notification",
    "NotificationManager",
    # Exceptions
    "MatchmakingError",
    "QueueFullError",
    "PlayerNotFoundError",
    "InvalidPreferencesError",
    "MatchmakingTimeoutError",
    "IncompatiblePlayersError",
    "BlockedPlayerError",
    "RateLimitExceededError",
    "VenueUnavailableError",
    "SkillMismatchError",
    "TimeConflictError",
    # Utilities
    "calculate_time_overlap",
    "find_common_venues",
    "calculate_distance",
    "get_mutual_friends",
    "check_scheduling_conflicts",
    "validate_preferences",
    "format_wait_time",
    "check_rate_limit",
]
