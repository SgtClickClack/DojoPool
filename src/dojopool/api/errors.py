import gc
import gc
"""API error classes."""


class APIError(Exception):
    """Base class for API errors."""

    def __init__(self, message, status_code=500, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        """Convert error to dictionary format."""
        rv = dict(self.payload or ())
        rv["message"] = self.message
        return rv


class ValidationError(APIError):
    """Raised when request validation fails."""

    def __init__(self, message, errors=None):
        super().__init__(message, status_code=400)
        self.errors = errors or {}

    def to_dict(self):
        """Convert validation error to dictionary format."""
        rv = super().to_dict()
        rv["errors"] = self.errors
        return rv


class ResourceNotFoundError(APIError):
    """Raised when a requested resource is not found."""

    def __init__(self, message, resource_type=None):
        super().__init__(message, status_code=404)
        self.resource_type = resource_type

    def to_dict(self):
        """Convert not found error to dictionary format."""
        rv = super().to_dict()
        if self.resource_type:
            rv["resource_type"] = self.resource_type
        return rv


class AuthenticationError(APIError):
    """Raised when authentication fails."""

    def __init__(self, message):
        super().__init__(message, status_code=401)


class AuthorizationError(APIError):
    """Raised when authorization fails."""

    def __init__(self, message):
        super().__init__(message, status_code=403)


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""

    def __init__(self, message, retry_after):
        super().__init__(message, status_code=429)
        self.retry_after = retry_after

    def to_dict(self):
        """Convert rate limit error to dictionary format."""
        rv = super().to_dict()
        rv["retry_after"] = self.retry_after
        return rv
