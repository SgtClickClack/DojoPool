"""Security middleware for the application."""

from functools import wraps
from flask import request, g, current_app, abort
import time
import re
from urllib.parse import urlparse
from .security import is_ip_blocked
from flask_login import current_user
from .extensions import cache
from .exceptions import RateLimitExceeded
import json
from typing import Dict, Any, Optional, Callable
from jsonschema import validate, ValidationError
import logging

logger = logging.getLogger(__name__)

# Rate limit configurations (requests per minute)
RATE_LIMITS = {
    'default': 60,        # Default rate limit
    'game_create': 10,    # Game creation
    'game_update': 30,    # Game updates
    'user_auth': 5,       # Authentication attempts
    'tournament': 20,     # Tournament operations
    'venue': 30,         # Venue operations
}

def get_rate_limit_key(endpoint, identifier):
    """Generate rate limit key.
    
    Args:
        endpoint: API endpoint name
        identifier: User/IP identifier
        
    Returns:
        str: Rate limit key
    """
    return f"ratelimit:{endpoint}:{identifier}"

def check_rate_limit(endpoint, identifier, limit=None):
    """Check if rate limit is exceeded.
    
    Args:
        endpoint: API endpoint name
        identifier: User/IP identifier
        limit: Optional custom limit
        
    Returns:
        tuple: (is_allowed, remaining_requests, reset_time)
    """
    key = get_rate_limit_key(endpoint, identifier)
    current = int(time.time())
    window_start = current - 60  # 1-minute window
    
    # Get request history
    request_history = cache.get(key) or []
    
    # Clean old requests
    request_history = [ts for ts in request_history if ts > window_start]
    
    # Check limit
    max_requests = limit or RATE_LIMITS.get(endpoint, RATE_LIMITS['default'])
    is_allowed = len(request_history) < max_requests
    
    if is_allowed:
        request_history.append(current)
        cache.set(key, request_history, timeout=60)
    
    remaining = max_requests - len(request_history)
    reset_time = window_start + 60
    
    return is_allowed, remaining, reset_time

def rate_limit(endpoint=None, limit=None, exempt_when=None):
    """Rate limiting decorator.
    
    Args:
        endpoint: API endpoint name for specific limits
        limit: Optional custom request limit
        exempt_when: Optional function to check for exemption
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check for exemption
            if exempt_when and exempt_when():
                return f(*args, **kwargs)
            
            # Get identifier (user ID or IP)
            identifier = (
                str(request.user.id) if hasattr(request, 'user') and request.user
                else request.remote_addr
            )
            
            # Check rate limit
            is_allowed, remaining, reset_time = check_rate_limit(
                endpoint or f.__name__,
                identifier,
                limit
            )
            
            if not is_allowed:
                raise RateLimitExceeded(
                    message="Rate limit exceeded",
                    reset_time=reset_time
                )
            
            # Set rate limit headers
            response = f(*args, **kwargs)
            response.headers['X-RateLimit-Remaining'] = str(remaining)
            response.headers['X-RateLimit-Reset'] = str(reset_time)
            
            return response
        return decorated_function
    return decorator

def is_admin():
    """Check if current user is admin."""
    return (
        hasattr(request, 'user') and
        request.user and
        request.user.is_admin
    )

class RateLimitMiddleware:
    """Rate limiting middleware."""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize middleware with app.
        
        Args:
            app: Flask application
        """
        @app.before_request
        def check_rate_limit():
            # Skip rate limiting for non-API routes
            if not request.path.startswith('/api/'):
                return
            
            # Get endpoint name from route
            endpoint = request.endpoint or 'default'
            
            # Get identifier (user ID or IP)
            identifier = (
                str(request.user.id) if hasattr(request, 'user') and request.user
                else request.remote_addr
            )
            
            # Check rate limit
            is_allowed, remaining, reset_time = check_rate_limit(endpoint, identifier)
            
            if not is_allowed:
                raise RateLimitExceeded(
                    message="Rate limit exceeded",
                    reset_time=reset_time
                )
            
            # Store rate limit info for response headers
            request.rate_limit_remaining = remaining
            request.rate_limit_reset = reset_time
        
        @app.after_request
        def add_rate_limit_headers(response):
            """Add rate limit headers to response."""
            if hasattr(request, 'rate_limit_remaining'):
                response.headers['X-RateLimit-Remaining'] = str(request.rate_limit_remaining)
            if hasattr(request, 'rate_limit_reset'):
                response.headers['X-RateLimit-Reset'] = str(request.rate_limit_reset)
            return response

class SecurityMiddleware:
    """Security middleware for request processing."""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize middleware with app."""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Process request before handling."""
        # Store request start time
        g.start = time.time()
        
        # Check if IP is blocked
        if is_ip_blocked(request.remote_addr):
            abort(403, description="IP address is blocked")
        
        # Validate request method
        if request.method not in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
            abort(405, description="Method not allowed")
        
        # Validate request size
        if request.content_length and request.content_length > current_app.config['MAX_CONTENT_LENGTH']:
            abort(413, description="Request too large")
        
        # Validate content type for POST/PUT/PATCH requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            if request.is_json:
                if not request.content_type.startswith('application/json'):
                    abort(415, description="Content type must be application/json")
            elif request.files:
                if not request.content_type.startswith('multipart/form-data'):
                    abort(415, description="Content type must be multipart/form-data")
        
        # Validate URL
        url = urlparse(request.url)
        if not url.scheme or not url.netloc:
            abort(400, description="Invalid URL")
        
        # Additional security checks can be added here
    
    def after_request(self, response):
        """Process response after handling."""
        # Add security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Add timing header in development
        if current_app.debug:
            response.headers['X-Response-Time'] = str(time.time() - g.start)
        
        return response

def require_https():
    """Decorator to require HTTPS."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_secure and not current_app.debug:
                abort(403, description="HTTPS required")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_host():
    """Decorator to validate request host."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            allowed_hosts = current_app.config.get('ALLOWED_HOSTS', [])
            if request.host not in allowed_hosts and not current_app.debug:
                abort(400, description="Invalid host")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_origin():
    """Decorator to validate request origin."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            origin = request.headers.get('Origin')
            if origin:
                allowed_origins = current_app.config.get('ALLOWED_ORIGINS', [])
                if origin not in allowed_origins and not current_app.debug:
                    abort(400, description="Invalid origin")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_referrer():
    """Decorator to validate request referrer."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            referrer = request.referrer
            if referrer:
                allowed_referrers = current_app.config.get('ALLOWED_REFERRERS', [])
                if not any(re.match(pattern, referrer) for pattern in allowed_referrers):
                    abort(400, description="Invalid referrer")
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def login_required_for_api(f):
    """Decorator to require login for API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return {'error': 'Authentication required'}, 401
        return f(*args, **kwargs)
    return decorated_function 

class InputValidation:
    def __init__(self):
        """Initialize input validation middleware."""
        self.schemas: Dict[str, Dict[str, Any]] = {}
    
    def register_schema(self, name: str, schema: Dict[str, Any]):
        """Register a validation schema.
        
        Args:
            name: Schema name
            schema: JSON Schema definition
        """
        self.schemas[name] = schema
    
    def validate_data(self, data: Any, schema_name: str) -> Optional[str]:
        """Validate data against a schema.
        
        Args:
            data: Data to validate
            schema_name: Name of schema to use
            
        Returns:
            Error message if validation fails, None otherwise
        """
        if schema_name not in self.schemas:
            return f"Schema '{schema_name}' not found"
        
        try:
            validate(instance=data, schema=self.schemas[schema_name])
            return None
        except ValidationError as e:
            return str(e)

def validate_input(validator: InputValidation, schema_name: str):
    """Decorator for input validation.
    
    Args:
        validator: InputValidation instance
        schema_name: Name of schema to use
        
    Returns:
        Decorated function
    """
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            request_data = kwargs.get('data')
            
            if not request_data:
                raise ValueError('No data provided for validation')
            
            error = validator.validate_data(request_data, schema_name)
            if error:
                raise ValidationError(error)
            
            return func(*args, **kwargs)
        return wrapper
    return decorator

class ErrorHandling:
    """Error handling middleware."""
    
    @staticmethod
    def handle_error(error: Exception) -> Dict[str, Any]:
        """Handle different types of errors.
        
        Args:
            error: Exception to handle
            
        Returns:
            Dict containing error details
        """
        if isinstance(error, ValidationError):
            return {
                'status': 400,
                'error': 'Validation Error',
                'message': str(error)
            }
        elif isinstance(error, ValueError):
            return {
                'status': 400,
                'error': 'Value Error',
                'message': str(error)
            }
        else:
            return {
                'status': 500,
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred'
            }

class RequestLogging:
    """Request logging middleware."""
    
    def __init__(self):
        """Initialize request logging middleware."""
        self.logger = logging.getLogger(__name__)
    
    def log_request(self, request: Any):
        """Log request details.
        
        Args:
            request: Request object to log
        """
        self.logger.info(
            f"Request: {request.method} {request.path} "
            f"(Client: {request.remote_addr})"
        )
    
    def log_response(self, response: Any):
        """Log response details.
        
        Args:
            response: Response object to log
        """
        self.logger.info(
            f"Response: {response.status_code} "
            f"(Content-Length: {response.content_length})"
        )

def with_error_handling(func: Callable):
    """Decorator for error handling.
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_handler = ErrorHandling()
            return error_handler.handle_error(e)
    return wrapper

def with_logging(func: Callable):
    """Decorator for request logging.
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger = RequestLogging()
        request = kwargs.get('request')
        
        if request:
            logger.log_request(request)
        
        response = func(*args, **kwargs)
        
        if response:
            logger.log_response(response)
        
        return response
    return wrapper 