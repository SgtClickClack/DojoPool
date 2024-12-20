"""Security middleware for the application."""

from functools import wraps
from flask import request, g, current_app, abort
import time
import re
from urllib.parse import urlparse
from .security import is_ip_blocked
from flask_login import current_user

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