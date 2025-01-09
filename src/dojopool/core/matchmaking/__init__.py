"""Matchmaking package initialization.

This package provides matchmaking functionality for pairing players
based on various factors like skill level, play style, and availability.
"""

from .matchmaker import Matchmaker, QueueEntry
from .events import (
    MatchEvent,
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent,
    EventManager
)
from .notifications import Notification, NotificationManager
from .exceptions import (
    MatchmakingError,
    QueueFullError,
    PlayerNotFoundError,
    InvalidPreferencesError,
    MatchmakingTimeoutError,
    IncompatiblePlayersError,
    BlockedPlayerError,
    RateLimitExceededError,
    VenueUnavailableError,
    SkillMismatchError,
    TimeConflictError
)
from .utils import (
    calculate_time_overlap,
    find_common_venues,
    calculate_distance,
    get_mutual_friends,
    check_scheduling_conflicts,
    validate_preferences,
    format_wait_time,
    check_rate_limit
)

__all__ = [
    # Matchmaker
    'Matchmaker',
    'QueueEntry',
    
    # Events
    'MatchEvent',
    'MatchFoundEvent',
    'MatchAcceptedEvent',
    'MatchDeclinedEvent',
    'MatchCancelledEvent',
    'MatchStartedEvent',
    'MatchCompletedEvent',
    'EventManager',
    
    # Notifications
    'Notification',
    'NotificationManager',
    
    # Exceptions
    'MatchmakingError',
    'QueueFullError',
    'PlayerNotFoundError',
    'InvalidPreferencesError',
    'MatchmakingTimeoutError',
    'IncompatiblePlayersError',
    'BlockedPlayerError',
    'RateLimitExceededError',
    'VenueUnavailableError',
    'SkillMismatchError',
    'TimeConflictError',
    
    # Utilities
    'calculate_time_overlap',
    'find_common_venues',
    'calculate_distance',
    'get_mutual_friends',
    'check_scheduling_conflicts',
    'validate_preferences',
    'format_wait_time',
    'check_rate_limit'
]
