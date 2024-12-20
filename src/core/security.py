"""Security configuration and utilities."""

from functools import wraps
from flask import request, abort, current_app, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from werkzeug.exceptions import TooManyRequests
from flask_login import current_user
from werkzeug.security import generate_password_hash, check_password_hash
import os
import jwt
from datetime import datetime, timedelta

# Initialize security extensions
limiter = Limiter(key_func=get_remote_address)
csrf = CSRFProtect()

def init_security(app):
    """Initialize security configurations."""
    # Initialize CSRF protection
    csrf.init_app(app)
    
    # Initialize rate limiting
    limiter.init_app(app)
    
    # Configure security headers
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses."""
        # Enable HTTP Strict Transport Security (HSTS)
        if not app.debug:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Prevent browsers from performing MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable Cross-Site Script (XSS) filter
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Prevent page from being displayed in an iframe
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Content Security Policy
        csp = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],  # Adjust based on needs
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'font-src': ["'self'"],
            'connect-src': ["'self'"],
            'frame-ancestors': ["'none'"],
            'form-action': ["'self'"]
        }
        
        response.headers['Content-Security-Policy'] = '; '.join(
            f"{key} {' '.join(values)}" for key, values in csp.items()
        )
        
        return response

# Rate limiting decorators
def api_rate_limit():
    """Rate limit for API endpoints."""
    return limiter.limit("100/minute")

def login_rate_limit():
    """Rate limit for login attempts."""
    return limiter.limit("5/minute")

def register_rate_limit():
    """Rate limit for registration attempts."""
    return limiter.limit("3/minute")

# Input validation decorator
def validate_json(*required_fields):
    """Validate required fields in JSON request."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                abort(400, description="Request must be JSON")
            
            data = request.get_json()
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                abort(400, description=f"Missing required fields: {', '.join(missing_fields)}")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# IP blocking utility
def is_ip_blocked(ip_address):
    """Check if an IP address is blocked."""
    # Implement IP blocking logic here
    # This could be backed by Redis or database
    return False

# Request validation decorator
def validate_request():
    """Validate incoming requests for security."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if IP is blocked
            if is_ip_blocked(get_remote_address()):
                abort(403, description="Access denied")
            
            # Validate request size
            content_length = request.content_length
            if content_length and content_length > current_app.config['MAX_CONTENT_LENGTH']:
                abort(413, description="Request too large")
            
            # Additional security checks can be added here
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator 

def admin_required(f):
    """Decorator to require admin role for a route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        
        if not any(role.name == 'admin' for role in current_user.roles):
            return jsonify({'error': 'Admin privileges required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

def api_rate_limit(limit=100, per=60):
    """Decorator to apply rate limiting to API routes."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get user identifier (IP or user ID)
            identifier = current_user.id if current_user.is_authenticated else request.remote_addr
            
            # Check rate limit
            key = f'rate_limit:{identifier}:{f.__name__}'
            try:
                current = int(current_app.redis.get(key) or 0)
                if current >= limit:
                    return jsonify({
                        'error': 'Rate limit exceeded',
                        'retry_after': per
                    }), 429
                
                # Increment counter
                current_app.redis.incr(key)
                if current == 0:
                    current_app.redis.expire(key, per)
                
            except Exception as e:
                current_app.logger.error(f'Rate limit error: {str(e)}')
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def generate_token(data, expires_in=3600):
    """Generate a JWT token."""
    payload = {
        'data': data,
        'exp': datetime.utcnow() + timedelta(seconds=expires_in),
        'iat': datetime.utcnow()
    }
    return jwt.encode(
        payload,
        current_app.config['SECRET_KEY'],
        algorithm='HS256'
    )

def verify_token(token):
    """Verify a JWT token."""
    try:
        payload = jwt.decode(
            token,
            current_app.config['SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload['data']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def hash_password(password):
    """Hash a password."""
    return generate_password_hash(password)

def verify_password(password_hash, password):
    """Verify a password against its hash."""
    return check_password_hash(password_hash, password)

def get_token_from_header():
    """Extract token from Authorization header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        auth_type, token = auth_header.split()
        if auth_type.lower() != 'bearer':
            return None
        return token
    except ValueError:
        return None