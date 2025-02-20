from typing import Any, Dict, List, Optional

class BaseError(Exception):
    pass

class APIError(BaseError):
    pass

class ValidationError(BaseError):
    pass

class GameError(BaseError):
    pass

class GameStateError(GameError):
    pass

class PlayerError(GameError):
    pass

class ScoringError(GameError):
    pass

class TournamentError(GameError):
    pass

class RuleViolationError(GameError):
    pass

class HandicapError(GameError):
    pass

class AuthenticationError(APIError):
    pass

class AuthorizationError(APIError):
    pass

class NotFoundError(APIError):
    pass

class ConflictError(APIError):
    pass

class RateLimitError(APIError):
    pass

class ServerError(APIError):
    pass

class VenueError(APIError):
    pass

class PaymentError(APIError):
    pass

class NotificationError(APIError):
    pass

class AchievementError(APIError):
    pass

class RateLimitExceeded(Exception):
    pass

class CSRFError(Exception):
    pass

class AnalysisError(Exception):
    pass

class WebSocketError(Exception):
    pass

class VisionSystemError(APIError):
    pass

class MLModelError(APIError):
    pass

class RealTimeProcessingError(APIError):
    pass
