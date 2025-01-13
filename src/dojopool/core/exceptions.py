"""Core exceptions module.

This module contains custom exceptions used throughout the application.
"""

class BaseError(Exception):
    """Base error class for custom exceptions."""
    pass

class APIError(BaseError):
    """Base class for API errors."""
    
    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        """Initialize API error.
        
        Args:
            message: Error message
            status_code: HTTP status code
            details: Additional error details
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}
    
    def to_dict(self) -> dict:
        """Convert error to dictionary.
        
        Returns:
            dict: Error details
        """
        error = {
            'message': self.message,
            'status_code': self.status_code
        }
        if self.details:
            error['details'] = self.details
        return error

class ValidationError(BaseError):
    """Raised when validation fails."""
    pass

class GameError(BaseError):
    """Base class for game-related errors."""
    pass

class GameStateError(GameError):
    """Raised when an operation is invalid for the current game state."""
    pass

class PlayerError(GameError):
    """Raised when there's an issue with player operations."""
    pass

class ScoringError(GameError):
    """Raised when there's an issue with game scoring."""
    pass

class TournamentError(GameError):
    """Raised when there's an issue with tournament operations."""
    pass

class RuleViolationError(GameError):
    """Raised when a game rule is violated."""
    pass

class HandicapError(GameError):
    """Raised when there's an issue with handicap calculations or application."""
    pass

class AuthenticationError(APIError):
    """Authentication error."""
    
    def __init__(self, message="Authentication required", details=None):
        """Initialize authentication error."""
        super().__init__(message=message, status_code=401, details=details)

class AuthorizationError(APIError):
    """Authorization error."""
    
    def __init__(self, message="Permission denied", details=None):
        """Initialize authorization error."""
        super().__init__(message=message, status_code=403, details=details)

class NotFoundError(APIError):
    """Resource not found error."""
    
    def __init__(self, message="Resource not found", details=None):
        """Initialize not found error."""
        super().__init__(message=message, status_code=404, details=details)

class ConflictError(APIError):
    """Resource conflict error."""
    
    def __init__(self, message="Resource conflict", details=None):
        """Initialize conflict error."""
        super().__init__(message=message, status_code=409, details=details)

class RateLimitError(APIError):
    """Rate limit exceeded error."""
    
    def __init__(self, message="Rate limit exceeded", details=None):
        """Initialize rate limit error."""
        super().__init__(message=message, status_code=429, details=details)

class ServerError(APIError):
    """Internal server error."""
    
    def __init__(self, message="Internal server error", details=None):
        """Initialize server error."""
        super().__init__(message=message, status_code=500, details=details)

class VenueError(APIError):
    """Venue-related error."""
    
    def __init__(self, message="Venue operation failed", details=None):
        """Initialize venue error."""
        super().__init__(message=message, status_code=400, details=details)

class PaymentError(APIError):
    """Payment-related error."""
    
    def __init__(self, message="Payment operation failed", details=None):
        """Initialize payment error."""
        super().__init__(message=message, status_code=400, details=details)

class NotificationError(APIError):
    """Notification-related error."""
    
    def __init__(self, message="Notification operation failed", details=None):
        """Initialize notification error."""
        super().__init__(message=message, status_code=400, details=details)

class AchievementError(APIError):
    """Achievement-related error."""
    
    def __init__(self, message="Achievement operation failed", details=None):
        """Initialize achievement error."""
        super().__init__(message=message, status_code=400, details=details)

class RateLimitExceeded(Exception):
    """Rate limit exceeded error."""
    
    def __init__(self, message, reset_time):
        """Initialize rate limit error.
        
        Args:
            message: Error message
            reset_time: When rate limit resets
        """
        self.message = message
        self.reset_time = reset_time
        super().__init__(message)
        
    def to_dict(self):
        """Convert exception to dictionary.
        
        Returns:
            dict: Exception details
        """
        return {
            'error': 'rate_limit_exceeded',
            'message': self.message,
            'reset_time': self.reset_time
        } 

class CSRFError(Exception):
    """CSRF validation error."""
    
    def __init__(self, message="CSRF validation failed"):
        """Initialize CSRF error.
        
        Args:
            message: Error message
        """
        self.message = message
        super().__init__(message) 

"""Custom exceptions for the application."""

class AnalysisError(Exception):
    """Exception raised when analysis operations fail."""
    pass 