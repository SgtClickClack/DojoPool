"""Error handling module for security-related issues."""

from typing import Dict, Optional, Union
from flask import jsonify, current_app
import logging
from werkzeug.exceptions import HTTPException

# Configure security logger
security_logger = logging.getLogger('security')

class SecurityError(HTTPException):
    """Base class for security-related errors."""
    
    def __init__(self, message: str, code: int = 400, details: Optional[Dict] = None):
        super().__init__(description=message)
        self.code = code
        self.details = details or {}
        
    def get_response(self):
        """Get formatted error response."""
        response = jsonify({
            'error': self.name,
            'message': self.description,
            'code': self.code,
            'details': self.details
        })
        response.status_code = self.code
        return response
        
    def log(self):
        """Log security error with appropriate severity."""
        security_logger.error(
            f"Security error: {self.name} - {self.description}",
            extra={
                'error_code': self.code,
                'details': self.details,
                'request_id': getattr(current_app, 'request_id', None)
            }
        )

class AuthenticationError(SecurityError):
    """Error raised for authentication failures."""
    
    name = 'authentication_error'
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict] = None):
        super().__init__(message=message, code=401, details=details)

class AuthorizationError(SecurityError):
    """Error raised for authorization failures."""
    
    name = 'authorization_error'
    
    def __init__(self, message: str = "Authorization failed", details: Optional[Dict] = None):
        super().__init__(message=message, code=403, details=details)

class InvalidTokenError(SecurityError):
    """Error raised for invalid or expired tokens."""
    
    name = 'invalid_token'
    
    def __init__(self, message: str = "Invalid or expired token", details: Optional[Dict] = None):
        super().__init__(message=message, code=401, details=details)

class RateLimitExceededError(SecurityError):
    """Error raised when rate limit is exceeded."""
    
    name = 'rate_limit_exceeded'
    
    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        details: Optional[Dict] = None
    ):
        details = details or {}
        if retry_after:
            details['retry_after'] = retry_after
        super().__init__(message=message, code=429, details=details)

class InvalidInputError(SecurityError):
    """Error raised for invalid or malicious input."""
    
    name = 'invalid_input'
    
    def __init__(self, message: str = "Invalid input", details: Optional[Dict] = None):
        super().__init__(message=message, code=400, details=details)

class CSRFError(SecurityError):
    """Error raised for CSRF token validation failures."""
    
    name = 'csrf_error'
    
    def __init__(self, message: str = "CSRF token validation failed", details: Optional[Dict] = None):
        super().__init__(message=message, code=403, details=details)

def handle_security_error(error: Union[SecurityError, Exception]) -> tuple:
    """Global handler for security-related errors.
    
    Args:
        error: The error to handle
        
    Returns:
        tuple: Response and status code
    """
    if isinstance(error, SecurityError):
        error.log()
        return error.get_response()
        
    # Handle unexpected errors
    security_logger.critical(
        f"Unexpected security error: {str(error)}",
        exc_info=True,
        extra={'request_id': getattr(current_app, 'request_id', None)}
    )
    
    if current_app.debug:
        return jsonify({
            'error': 'unexpected_error',
            'message': str(error),
            'type': error.__class__.__name__
        }), 500
    
    return jsonify({
        'error': 'internal_error',
        'message': 'An unexpected error occurred'
    }), 500

def setup_error_handlers(app):
    """Register security error handlers with the application.
    
    Args:
        app: Flask application instance
    """
    # Set up security logger
    if not app.debug:
        security_handler = logging.FileHandler('security.log')
        security_handler.setLevel(logging.INFO)
        security_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        security_handler.setFormatter(security_formatter)
        security_logger.addHandler(security_handler)
    
    # Register error handlers
    app.register_error_handler(SecurityError, handle_security_error)
    app.register_error_handler(AuthenticationError, handle_security_error)
    app.register_error_handler(AuthorizationError, handle_security_error)
    app.register_error_handler(InvalidTokenError, handle_security_error)
    app.register_error_handler(RateLimitExceededError, handle_security_error)
    app.register_error_handler(InvalidInputError, handle_security_error)
    app.register_error_handler(CSRFError, handle_security_error) 