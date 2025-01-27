"""
Monitoring middleware for Flask application.
Provides error logging and performance metric collection.
"""

import time
import uuid
from functools import wraps
from flask import request, g, current_app
from prometheus_client import Histogram
from typing import Callable, Any

from .error_logger import error_logger, ErrorSeverity
from ...utils.monitoring import REQUEST_LATENCY, REQUEST_COUNT

# Additional performance metrics
ENDPOINT_LATENCY = Histogram(
    'app_endpoint_latency_seconds',
    'Endpoint Latency',
    ['endpoint', 'method']
)

def monitoring_middleware() -> Callable:
    """Middleware for request monitoring and error logging."""
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Generate request ID
            request_id = str(uuid.uuid4())
            g.request_id = request_id
            
            # Set context for error logging
            error_logger.set_context(
                request_id=request_id,
                user_id=getattr(g, 'user_id', None)
            )
            
            # Start timing
            start_time = time.time()
            
            try:
                # Execute request
                response = f(*args, **kwargs)
                
                # Record successful request
                REQUEST_COUNT.labels(
                    method=request.method,
                    endpoint=request.endpoint,
                    http_status=response.status_code
                ).inc()
                
                return response
                
            except Exception as e:
                # Log the error
                error_logger.log_error(
                    error=e,
                    severity=ErrorSeverity.ERROR,
                    component=request.endpoint,
                    additional_data={
                        'method': request.method,
                        'path': request.path,
                        'args': dict(request.args),
                        'headers': dict(request.headers)
                    }
                )
                
                # Record failed request
                REQUEST_COUNT.labels(
                    method=request.method,
                    endpoint=request.endpoint,
                    http_status=500
                ).inc()
                
                # Re-raise for error handler
                raise
                
            finally:
                # Record request latency
                duration = time.time() - start_time
                REQUEST_LATENCY.labels(
                    method=request.method,
                    endpoint=request.endpoint
                ).observe(duration)
                
                ENDPOINT_LATENCY.labels(
                    endpoint=request.endpoint,
                    method=request.method
                ).observe(duration)
                
                # Clear error logging context
                error_logger.clear_context()
        
        return wrapped
    return decorator

def init_monitoring(app):
    """Initialize monitoring for the Flask application."""
    # Register error handlers
    @app.errorhandler(Exception)
    def handle_error(error):
        """Global error handler."""
        error_logger.log_error(
            error=error,
            severity=ErrorSeverity.ERROR if not hasattr(error, 'code') or error.code >= 500 else ErrorSeverity.WARNING,
            component='error_handler',
            additional_data={
                'method': request.method,
                'path': request.path,
                'args': dict(request.args),
                'headers': dict(request.headers)
            }
        )
        
        # Let Flask handle the response
        return current_app.handle_exception(error)
    
    # Apply monitoring middleware to all routes
    @app.before_request
    def before_request():
        g.start_time = time.time()
        g.request_id = str(uuid.uuid4())
    
    @app.after_request
    def after_request(response):
        # Record request duration
        duration = time.time() - g.start_time
        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.endpoint or 'unknown'
        ).observe(duration)
        
        ENDPOINT_LATENCY.labels(
            endpoint=request.endpoint or 'unknown',
            method=request.method
        ).observe(duration)
        
        # Record request count
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.endpoint or 'unknown',
            http_status=response.status_code
        ).inc()
        
        return response 