"""Error handling module for security-related errors."""

import logging
from typing import Any, Dict, Optional, Union

from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

logger = logging.getLogger(__name__)

class SecurityError(Exception):
    """Base class for security-related errors."""

    def __init__(self, 
                 message: str, 
                 code: int = 400, 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize security error.
        
        Args:
            message: Error message
            code: HTTP status code
            details: Additional error details
        """
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}
        
        # Log the error
        self._log_error()
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary format.
        
        Returns:
            Dictionary representation of the error
        """
        error_dict = {
            'error': {
                'type': self.__class__.__name__,
                'message': self.message,
                'code': self.code
            }
        }
        
        if self.details:
            error_dict['error']['details'] = self.details
            
        return error_dict
        
    def _log_error(self) -> None:
        """Log error details."""
        log_data = {
            'error_type': self.__class__.__name__,
            'message': self.message,
            'code': self.code,
            'details': self.details,
            'request_id': request.headers.get('X-Request-ID'),
            'user_id': getattr(request, 'user_id', None),
            'ip_address': request.remote_addr,
            'user_agent': request.user_agent.string,
            'endpoint': request.endpoint,
            'method': request.method,
            'path': request.path
        }
        
        logger.error(
            f"Security error occurred: {self.__class__.__name__}",
            extra=log_data
        )

class AuthenticationError(SecurityError):
    """Error raised for authentication failures."""

    def __init__(self, 
                 message: str = 'Authentication failed', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize authentication error."""
        super().__init__(message, code=401, details=details)

class AuthorizationError(SecurityError):
    """Error raised for authorization failures."""

    def __init__(self, 
                 message: str = 'Unauthorized access', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize authorization error."""
        super().__init__(message, code=403, details=details)

class InvalidTokenError(SecurityError):
    """Error raised for invalid token issues."""

    def __init__(self, 
                 message: str = 'Invalid token', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize invalid token error."""
        super().__init__(message, code=401, details=details)

class RateLimitExceededError(SecurityError):
    """Error raised when rate limit is exceeded."""

    def __init__(self, 
                 message: str = 'Rate limit exceeded', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize rate limit error."""
        super().__init__(message, code=429, details=details)

class InvalidInputError(SecurityError):
    """Error raised for invalid input data."""

    def __init__(self, 
                 message: str = 'Invalid input', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize invalid input error."""
        super().__init__(message, code=400, details=details)

class CSRFError(SecurityError):
    """Error raised for CSRF token validation failures."""

    def __init__(self, 
                 message: str = 'CSRF token validation failed', 
                 details: Optional[Dict[str, Any]] = None) -> None:
        """Initialize CSRF error."""
        super().__init__(message, code=400, details=details)

def handle_security_error(error: SecurityError) -> tuple[Dict[str, Any], int]:
    """Handle security errors.
    
    Args:
        error: Security error instance
        
    Returns:
        Tuple of error response and status code
    """
    return error.to_dict(), error.code

def handle_http_error(error: HTTPException) -> tuple[Dict[str, Any], int]:
    """Handle HTTP errors.
    
    Args:
        error: HTTP exception instance
        
    Returns:
        Tuple of error response and status code
    """
    response = {
        'error': {
            'type': error.__class__.__name__,
            'message': str(error),
            'code': error.code
        }
    }
    return response, error.code

def handle_unknown_error(error: Exception) -> tuple[Dict[str, Any], int]:
    """Handle unknown errors.
    
    Args:
        error: Exception instance
        
    Returns:
        Tuple of error response and status code
    """
    # Log the unknown error
    logger.exception('An unknown error occurred')
    
    response = {
        'error': {
            'type': 'InternalServerError',
            'message': 'An unexpected error occurred',
            'code': 500
        }
    }
    return response, 500

def setup_error_handlers(app: Flask) -> None:
    """Set up error handlers for the application.
    
    Args:
        app: Flask application instance
    """
    app.register_error_handler(SecurityError, handle_security_error)
    app.register_error_handler(HTTPException, handle_http_error)
    app.register_error_handler(Exception, handle_unknown_error)
    
    # Register specific security error handlers
    for error_cls in [
        AuthenticationError,
        AuthorizationError,
        InvalidTokenError,
        RateLimitExceededError,
        InvalidInputError,
        CSRFError
    ]:
        app.register_error_handler(error_cls, handle_security_error) 