"""Core exceptions module."""

class BaseError(Exception):
    """Base error class for all custom exceptions."""
    
    def __init__(self, message=None, code=None, details=None):
        """Initialize error."""
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

class ValidationError(BaseError):
    """Validation error."""
    
    def __init__(self, message="Invalid data", details=None):
        """Initialize validation error."""
        super().__init__(message=message, code=400, details=details)

class AuthenticationError(BaseError):
    """Authentication error."""
    
    def __init__(self, message="Authentication required", details=None):
        """Initialize authentication error."""
        super().__init__(message=message, code=401, details=details)

class AuthorizationError(BaseError):
    """Authorization error."""
    
    def __init__(self, message="Permission denied", details=None):
        """Initialize authorization error."""
        super().__init__(message=message, code=403, details=details)

class NotFoundError(BaseError):
    """Resource not found error."""
    
    def __init__(self, message="Resource not found", details=None):
        """Initialize not found error."""
        super().__init__(message=message, code=404, details=details)

class ConflictError(BaseError):
    """Resource conflict error."""
    
    def __init__(self, message="Resource conflict", details=None):
        """Initialize conflict error."""
        super().__init__(message=message, code=409, details=details)

class RateLimitError(BaseError):
    """Rate limit exceeded error."""
    
    def __init__(self, message="Rate limit exceeded", details=None):
        """Initialize rate limit error."""
        super().__init__(message=message, code=429, details=details)

class ServerError(BaseError):
    """Internal server error."""
    
    def __init__(self, message="Internal server error", details=None):
        """Initialize server error."""
        super().__init__(message=message, code=500, details=details) 