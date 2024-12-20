"""Common middleware implementations for DojoPool."""

import time
from typing import List, Optional, Dict, Any
from flask import current_app, g, request
from werkzeug.wrappers import Request, Response
from . import BaseMiddleware
from ..logging.utils import log_error

class RequestIdMiddleware(BaseMiddleware):
    """Add unique request ID to each request."""
    
    def process_request(self, request: Request) -> None:
        """Add request ID to request context."""
        import uuid
        g.request_id = str(uuid.uuid4())
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Add request ID to response headers."""
        response.headers['X-Request-ID'] = g.get('request_id', 'unknown')
        return response

class RequestTimingMiddleware(BaseMiddleware):
    """Track request timing information."""
    
    def process_request(self, request: Request) -> None:
        """Store request start time."""
        g.start_time = time.time()
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Add timing information to response headers."""
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            response.headers['X-Request-Time'] = f"{duration:.3f}s"
        return response

class SecurityHeadersMiddleware(BaseMiddleware):
    """Add security headers to responses."""
    
    def __init__(self, headers: Optional[Dict[str, str]] = None):
        """Initialize security headers.
        
        Args:
            headers: Optional custom security headers
        """
        self.headers = {
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'",
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        }
        if headers:
            self.headers.update(headers)
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Add security headers to response."""
        for header, value in self.headers.items():
            response.headers[header] = value
        return response

class CORSMiddleware(BaseMiddleware):
    """Handle CORS (Cross-Origin Resource Sharing)."""
    
    def __init__(
        self,
        allowed_origins: List[str],
        allowed_methods: Optional[List[str]] = None,
        allowed_headers: Optional[List[str]] = None,
        expose_headers: Optional[List[str]] = None,
        max_age: int = 600
    ):
        """Initialize CORS settings.
        
        Args:
            allowed_origins: List of allowed origins
            allowed_methods: List of allowed HTTP methods
            allowed_headers: List of allowed headers
            expose_headers: List of exposed headers
            max_age: Max age for preflight requests
        """
        self.allowed_origins = allowed_origins
        self.allowed_methods = allowed_methods or ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
        self.allowed_headers = allowed_headers or ['Content-Type', 'Authorization']
        self.expose_headers = expose_headers or ['X-Request-ID']
        self.max_age = max_age
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Add CORS headers to response."""
        origin = request.headers.get('Origin')
        
        if origin and origin in self.allowed_origins:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = ', '.join(self.allowed_methods)
            response.headers['Access-Control-Allow-Headers'] = ', '.join(self.allowed_headers)
            response.headers['Access-Control-Expose-Headers'] = ', '.join(self.expose_headers)
            response.headers['Access-Control-Max-Age'] = str(self.max_age)
            
            if request.method == 'OPTIONS':
                return response
        
        return response

class ErrorHandlingMiddleware(BaseMiddleware):
    """Handle uncaught errors in middleware chain."""
    
    def process_request(self, request: Request) -> None:
        """Store original path in case of errors."""
        g.original_path = request.path
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Handle any uncaught errors."""
        try:
            return response
        except Exception as e:
            log_error(
                e,
                "Uncaught error in middleware chain",
                original_path=g.get('original_path')
            )
            return current_app.make_response((
                {'error': 'Internal server error'},
                500
            ))

class RequestLoggingMiddleware(BaseMiddleware):
    """Log request and response information."""
    
    def process_request(self, request: Request) -> None:
        """Log request information."""
        current_app.logger.info(
            "Request started",
            extra={
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.user_agent.string
            }
        )
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Log response information."""
        current_app.logger.info(
            "Request finished",
            extra={
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code,
                'content_length': response.content_length
            }
        )
        return response 