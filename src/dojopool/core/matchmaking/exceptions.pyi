class MatchmakingError(Exception):
    pass

class QueueFullError(MatchmakingError):
    pass

class PlayerNotFoundError(MatchmakingError):
    pass

class InvalidPreferencesError(MatchmakingError):
    pass

class MatchmakingTimeoutError(MatchmakingError):
    pass

class IncompatiblePlayersError(MatchmakingError):
    pass

class BlockedPlayerError(MatchmakingError):
    pass

class RateLimitExceededError(MatchmakingError):
    pass

class VenueUnavailableError(MatchmakingError):
    pass

class SkillMismatchError(MatchmakingError):
    pass

class TimeConflictError(MatchmakingError):
    pass
