"""Security headers middleware.

This module provides security headers for all responses.
"""

from functools import wraps
from flask import request, make_response

def security_headers():
    """Add security headers to response."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            response = make_response(f(*args, **kwargs))
            
            # Security headers
            response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
            response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
            response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
            
            return response
        return wrapped
    return decorator

def api_security_headers():
    """Add security headers specific to API responses."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            response = make_response(f(*args, **kwargs))
            
            # API-specific security headers
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            
            # Allow CORS if configured
            if request.application.config.get('ENABLE_CORS'):
                allowed_origins = request.application.config.get('ALLOWED_ORIGINS', [])
                origin = request.headers.get('Origin')
                if origin in allowed_origins:
                    response.headers['Access-Control-Allow-Origin'] = origin
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRF-Token'
                    response.headers['Access-Control-Max-Age'] = '3600'
                    
            return response
        return wrapped
    return decorator
