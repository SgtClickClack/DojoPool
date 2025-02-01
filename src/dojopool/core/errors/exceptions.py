"""Error classes for DojoPool."""

from typing import Any, Dict, Optional


class DojoPoolError(Exception):
    """Base exception for DojoPool errors."""

    def __init__(
        self, message: str, status_code: int = 500, payload: Optional[Dict[str, Any]] = None
    ):
        """Initialize error.

        Args:
            message: Error message
            status_code: HTTP status code
            payload: Additional error context
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary.

        Returns:
            Error dictionary
        """
        error_dict = {
            "error": self.__class__.__name__,
            "message": self.message,
            "status_code": self.status_code,
        }
        if self.payload:
            error_dict["details"] = self.payload
        return error_dict


class ValidationError(DojoPoolError):
    """Validation error."""

    def __init__(self, message: str, errors: Dict[str, str]):
        """Initialize validation error.

        Args:
            message: Error message
            errors: Validation errors by field
        """
        super().__init__(message=message, status_code=400, payload={"errors": errors})


class AuthenticationError(DojoPoolError):
    """Authentication error."""

    def __init__(self, message: str = "Authentication required"):
        """Initialize authentication error."""
        super().__init__(message=message, status_code=401)


class AuthorizationError(DojoPoolError):
    """Authorization error."""

    def __init__(self, message: str = "Permission denied"):
        """Initialize authorization error."""
        super().__init__(message=message, status_code=403)


class NotFoundError(DojoPoolError):
    """Resource not found error."""

    def __init__(self, resource: str, resource_id: Optional[int] = None):
        """Initialize not found error."""
        message = f"{resource} not found"
        if resource_id is not None:
            message = f"{resource} with ID {resource_id} not found"
        super().__init__(message=message, status_code=404)


class ConflictError(DojoPoolError):
    """Resource conflict error."""

    def __init__(self, message: str = "Resource conflict"):
        """Initialize conflict error."""
        super().__init__(message=message, status_code=409)


class RateLimitError(DojoPoolError):
    """Rate limit exceeded error."""

    def __init__(self, message: str = "Rate limit exceeded"):
        """Initialize rate limit error."""
        super().__init__(message=message, status_code=429)


class ServiceError(DojoPoolError):
    """External service error."""

    def __init__(self, service: str, message: str = "Service error"):
        """Initialize service error."""
        super().__init__(message=message, status_code=503, payload={"service": service})
