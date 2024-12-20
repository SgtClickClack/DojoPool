"""Middleware module for DojoPool."""

from typing import List, Callable, Any
from flask import Flask, request, g
from werkzeug.wrappers import Request, Response
from time import time
import uuid

class MiddlewareManager:
    """Manage middleware chain execution."""
    
    def __init__(self):
        """Initialize middleware manager."""
        self.middlewares: List[Callable] = []
    
    def add(self, middleware: Callable) -> None:
        """Add middleware to chain.
        
        Args:
            middleware: Middleware callable
        """
        self.middlewares.append(middleware)
    
    def process_request(self, request: Request) -> Any:
        """Process request through middleware chain.
        
        Args:
            request: Request object
            
        Returns:
            Modified request or response
        """
        for middleware in self.middlewares:
            response = middleware.process_request(request)
            if response is not None:
                return response
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Process response through middleware chain.
        
        Args:
            request: Request object
            response: Response object
            
        Returns:
            Modified response
        """
        for middleware in reversed(self.middlewares):
            response = middleware.process_response(request, response)
        return response

class BaseMiddleware:
    """Base middleware class."""
    
    def process_request(self, request: Request) -> Any:
        """Process request.
        
        Args:
            request: Request object
            
        Returns:
            Modified request or response
        """
        return None
    
    def process_response(self, request: Request, response: Response) -> Response:
        """Process response.
        
        Args:
            request: Request object
            response: Response object
            
        Returns:
            Modified response
        """
        return response

def init_app(app: Flask) -> None:
    """Initialize middleware for application.
    
    Args:
        app: Flask application instance
    """
    manager = MiddlewareManager()
    
    # Store manager in app
    app.middleware_manager = manager
    
    # Add middleware processing to request handling
    @app.before_request
    def process_request():
        """Process request through middleware chain."""
        response = manager.process_request(request)
        if response is not None:
            return response
    
    @app.after_request
    def process_response(response: Response) -> Response:
        """Process response through middleware chain."""
        return manager.process_response(request, response)

def add_middleware(app: Flask, middleware: BaseMiddleware) -> None:
    """Add middleware to application.
    
    Args:
        app: Flask application instance
        middleware: Middleware instance
    """
    if not hasattr(app, 'middleware_manager'):
        raise RuntimeError("Middleware not initialized. Call init_app first.")
    app.middleware_manager.add(middleware)

def init_middleware(app):
    """Initialize middleware for the application."""
    
    @app.before_request
    def before_request():
        """Process request before handling."""
        # Add request ID
        g.request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        
        # Add request timestamp
        g.start_time = time()
        
        # Add security headers
        @app.after_request
        def add_security_headers(response):
            """Add security headers to response."""
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
            return response
        
        # Add request timing
        @app.after_request
        def add_request_timing(response):
            """Add request timing information."""
            if hasattr(g, 'start_time'):
                elapsed = time() - g.start_time
                response.headers['X-Response-Time'] = f'{elapsed:0.3f}s'
            return response
        
        # Add request ID to response
        @app.after_request
        def add_request_id(response):
            """Add request ID to response headers."""
            if hasattr(g, 'request_id'):
                response.headers['X-Request-ID'] = g.request_id
            return response
        
        # Add CORS headers if enabled
        if app.config.get('CORS_ENABLED', False):
            @app.after_request
            def add_cors_headers(response):
                """Add CORS headers to response."""
                allowed_origins = app.config.get('CORS_ORIGINS', ['*'])
                allowed_methods = app.config.get('CORS_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
                allowed_headers = app.config.get('CORS_HEADERS', ['Content-Type', 'Authorization'])
                
                if '*' in allowed_origins:
                    response.headers['Access-Control-Allow-Origin'] = '*'
                elif request.origin in allowed_origins:
                    response.headers['Access-Control-Allow-Origin'] = request.origin
                
                response.headers['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
                response.headers['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
                response.headers['Access-Control-Max-Age'] = '3600'
                
                return response

__all__ = ['BaseMiddleware', 'init_app', 'add_middleware'] 