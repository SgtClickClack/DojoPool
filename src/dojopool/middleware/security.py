"""Security middleware for the application."""

from functools import wraps
from typing import Callable, Optional

from flask import Flask, Response, current_app, g, request
from werkzeug.exceptions import Unauthorized

from config.security_config import SecurityConfig
from services.token_service import TokenService


class SecurityMiddleware:
    """Middleware for handling security concerns."""

    def __init__(self, app: Flask, security_config: SecurityConfig):
        """Initialize security middleware.
        
        Args:
            app: Flask application instance
            security_config: Security configuration
        """
        self.app = app
        self.config = security_config
        self.token_service = TokenService()
        
        # Register middleware functions
        self.register_middleware()
    
    def register_middleware(self) -> None:
        """Register all middleware functions."""
        
        @self.app.before_request
        def validate_token() -> Optional[Response]:
            """Validate JWT token if present."""
            # Skip token validation for public endpoints
            if request.endpoint in self.app.config.get("PUBLIC_ENDPOINTS", set()):
                return None
                
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                return None
                
            try:
                token_type, token = auth_header.split()
                if token_type.lower() != "bearer":
                    raise Unauthorized("Invalid token type")
                    
                payload = self.token_service.verify_token(token)
                if not payload:
                    raise Unauthorized("Invalid token")
                    
                # Store token payload in g for route handlers
                g.token_payload = payload
                
            except (ValueError, Unauthorized) as e:
                return {"error": str(e)}, 401
        
        @self.app.after_request
        def add_security_headers(response: Response) -> Response:
            """Add security headers to response."""
            # Add all configured security headers
            for header, value in self.config.SECURE_HEADERS.items():
                if header not in response.headers:
                    response.headers[header] = value
                    
            return response
            
        @self.app.after_request
        def add_cache_headers(response: Response) -> Response:
            """Add cache control headers."""
            # Prevent caching of sensitive responses
            if request.endpoint not in self.app.config.get("CACHEABLE_ENDPOINTS", set()):
                response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
                response.headers["Pragma"] = "no-cache"
                response.headers["Expires"] = "0"
                
            return response
    
    @staticmethod
    def csrf_protect() -> Callable:
        """Decorator to enable CSRF protection for routes."""
        
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated(*args, **kwargs):
                if current_app.config.get("CSRF_ENABLED", True):
                    token = request.headers.get("X-CSRF-Token")
                    if not token or token != g.get("csrf_token"):
                        return {"error": "CSRF token missing or invalid"}, 403
                return f(*args, **kwargs)
            return decorated
        return decorator
    
    @staticmethod
    def rate_limit(
        requests: int,
        period: int,
        by: Optional[str] = None
    ) -> Callable:
        """Decorator to apply rate limiting to routes.
        
        Args:
            requests: Maximum number of requests allowed
            period: Time period in seconds
            by: Key to rate limit by (e.g., 'ip', 'user'). Defaults to IP.
        """
        
        def decorator(f: Callable) -> Callable:
            @wraps(f)
            def decorated(*args, **kwargs):
                # Get rate limit key
                if by == "user" and g.get("token_payload"):
                    key = f"rate_limit:{g.token_payload['uid']}"
                else:
                    key = f"rate_limit:{request.remote_addr}"
                
                # Check rate limit
                current = g.redis.get(key)
                if current and int(current) >= requests:
                    return {"error": "Rate limit exceeded"}, 429
                
                # Increment counter
                pipe = g.redis.pipeline()
                pipe.incr(key)
                pipe.expire(key, period)
                pipe.execute()
                
                return f(*args, **kwargs)
            return decorated
        return decorator 