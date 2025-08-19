"""Matchmaking exceptions module.

This module defines exceptions specific to the matchmaking functionality.
"""


class MatchmakingError(Exception):
    """Base class for matchmaking exceptions."""

    pass


class QueueFullError(MatchmakingError):
    """Raised when attempting to add a player to a full queue."""

    def __init__(self, message="Matchmaking queue is full"):
        self.message = message
        super().__init__(self.message)


class PlayerNotFoundError(MatchmakingError):
    """Raised when a player cannot be found in the queue."""

    def __init__(self, user_id, message=None):
        self.user_id = user_id
        self.message = message or f"Player {user_id} not found in queue"
        super().__init__(self.message)


class InvalidPreferencesError(MatchmakingError):
    """Raised when matchmaking preferences are invalid."""

    def __init__(self, message="Invalid matchmaking preferences"):
        self.message = message
        super().__init__(self.message)


class MatchmakingTimeoutError(MatchmakingError):
    """Raised when matchmaking times out."""

    def __init__(self, wait_time, message=None):
        self.wait_time = wait_time
        self.message = message or f"Matchmaking timed out after {wait_time} seconds"
        super().__init__(self.message)


class IncompatiblePlayersError(MatchmakingError):
    """Raised when two players are incompatible for matching."""

    def __init__(self, user1_id, user2_id, reason=None):
        self.user1_id = user1_id
        self.user2_id = user2_id
        self.reason = reason
        self.message = f"Players {user1_id} and {user2_id} are incompatible"
        if reason:
            self.message += f": {reason}"
        super().__init__(self.message)


class BlockedPlayerError(MatchmakingError):
    """Raised when a player has blocked another player."""

    def __init__(self, blocker_id, blocked_id):
        self.blocker_id = blocker_id
        self.blocked_id = blocked_id
        self.message = f"Player {blocked_id} is blocked by {blocker_id}"
        super().__init__(self.message)


class RateLimitExceededError(MatchmakingError):
    """Raised when a player exceeds the rate limit."""

    def __init__(self, user_id, retry_after):
        self.user_id = user_id
        self.retry_after = retry_after
        self.message = (
            f"Rate limit exceeded for player {user_id}. Try again in {retry_after} seconds"
        )
        super().__init__(self.message)


class VenueUnavailableError(MatchmakingError):
    """Raised when no suitable venue is available."""

    def __init__(self, message="No suitable venue available for the match"):
        self.message = message
        super().__init__(self.message)


class SkillMismatchError(MatchmakingError):
    """Raised when players' skill levels are too different."""

    def __init__(self, user1_id, user2_id, rating_diff):
        self.user1_id = user1_id
        self.user2_id = user2_id
        self.rating_diff = rating_diff
        self.message = (
            f"Skill mismatch between players {user1_id} and {user2_id} (difference: {rating_diff})"
        )
        super().__init__(self.message)


class TimeConflictError(MatchmakingError):
    """Raised when there is a scheduling conflict between players."""

    def __init__(self, user1_id, user2_id):
        self.user1_id = user1_id
        self.user2_id = user2_id
        self.message = f"Schedule conflict between players {user1_id} and {user2_id}"
        super().__init__(self.message)
