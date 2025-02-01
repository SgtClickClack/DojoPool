"""Core exceptions module.

This module contains custom exceptions used throughout the application.
"""

from typing import Any, Dict, List, Optional


class BaseError(Exception):
    """Base error class for custom exceptions."""

    pass


class APIError(BaseError):
    """Base class for API errors."""

    def __init__(
        self, message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None
    ):
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

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary.

        Returns:
            dict: Error details
        """
        error = {"message": self.message, "status_code": self.status_code}
        if self.details:
            error["details"] = self.details
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

    def __init__(
        self, message: str = "Authentication required", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize authentication error."""
        super().__init__(message=message, status_code=401, details=details)


class AuthorizationError(APIError):
    """Authorization error."""

    def __init__(
        self, message: str = "Permission denied", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize authorization error."""
        super().__init__(message=message, status_code=403, details=details)


class NotFoundError(APIError):
    """Resource not found error."""

    def __init__(
        self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize not found error."""
        super().__init__(message=message, status_code=404, details=details)


class ConflictError(APIError):
    """Resource conflict error."""

    def __init__(
        self, message: str = "Resource conflict", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize conflict error."""
        super().__init__(message=message, status_code=409, details=details)


class RateLimitError(APIError):
    """Rate limit exceeded error."""

    def __init__(
        self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize rate limit error."""
        super().__init__(message=message, status_code=429, details=details)


class ServerError(APIError):
    """Internal server error."""

    def __init__(
        self, message: str = "Internal server error", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize server error."""
        super().__init__(message=message, status_code=500, details=details)


class VenueError(APIError):
    """Venue-related error."""

    def __init__(
        self, message: str = "Venue operation failed", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize venue error."""
        super().__init__(message=message, status_code=400, details=details)


class PaymentError(APIError):
    """Payment-related error."""

    def __init__(
        self, message: str = "Payment operation failed", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize payment error."""
        super().__init__(message=message, status_code=400, details=details)


class NotificationError(APIError):
    """Notification-related error."""

    def __init__(
        self,
        message: str = "Notification operation failed",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize notification error."""
        super().__init__(message=message, status_code=400, details=details)


class AchievementError(APIError):
    """Achievement-related error."""

    def __init__(
        self,
        message: str = "Achievement operation failed",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
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
            "error": "rate_limit_exceeded",
            "message": self.message,
            "reset_time": self.reset_time,
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


class WebSocketError(Exception):
    """Base class for WebSocket errors."""

    def __init__(self, message, code=None, reason=None):
        super().__init__(message)
        self.code = code
        self.reason = reason

    def __str__(self):
        return f"{self.args[0]} (code={self.code}, reason={self.reason})"


class VisionSystemError(APIError):
    """Vision system related errors."""

    def __init__(
        self,
        message: str = "Vision system error",
        details: Optional[Dict[str, Any]] = None,
        frame_id: Optional[str] = None,
        detection_errors: Optional[List[str]] = None,
    ) -> None:
        """Initialize vision system error.

        Args:
            message: Error message
            details: Additional error details
            frame_id: ID of the problematic frame
            detection_errors: List of specific detection errors
        """
        super().__init__(message=message, status_code=500, details=details)
        self.frame_id = frame_id
        self.detection_errors = detection_errors or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary."""
        error = super().to_dict()
        error.update({"frame_id": self.frame_id, "detection_errors": self.detection_errors})
        return error


class MLModelError(APIError):
    """Machine learning model related errors."""

    def __init__(
        self,
        message: str = "Model error",
        details: Optional[Dict[str, Any]] = None,
        model_name: Optional[str] = None,
        prediction_errors: Optional[List[str]] = None,
    ) -> None:
        """Initialize ML model error.

        Args:
            message: Error message
            details: Additional error details
            model_name: Name of the problematic model
            prediction_errors: List of specific prediction errors
        """
        super().__init__(message=message, status_code=500, details=details)
        self.model_name = model_name
        self.prediction_errors = prediction_errors or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary."""
        error = super().to_dict()
        error.update({"model_name": self.model_name, "prediction_errors": self.prediction_errors})
        return error


class RealTimeProcessingError(APIError):
    """Real-time processing related errors."""

    def __init__(
        self,
        message: str = "Real-time processing error",
        details: Optional[Dict[str, Any]] = None,
        processing_stage: Optional[str] = None,
        latency: Optional[float] = None,
    ) -> None:
        """Initialize real-time processing error.

        Args:
            message: Error message
            details: Additional error details
            processing_stage: Stage where the error occurred
            latency: Processing latency when error occurred
        """
        super().__init__(message=message, status_code=500, details=details)
        self.processing_stage = processing_stage
        self.latency = latency

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary."""
        error = super().to_dict()
        error.update({"processing_stage": self.processing_stage, "latency": self.latency})
        return error
