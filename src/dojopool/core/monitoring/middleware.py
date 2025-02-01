"""
Monitoring middleware for Flask application.
Provides error logging, performance metric collection, and security monitoring.
"""

import threading
import time
import uuid
from functools import wraps
from typing import Any, Callable

import structlog
from flask import Flask, Response, current_app, g, request
from prometheus_client import Histogram, make_wsgi_app, start_http_server
from werkzeug.middleware.dispatcher import DispatcherMiddleware

from ...utils.monitoring import REQUEST_COUNT, REQUEST_LATENCY, REGISTRY
from .error_logger import ErrorSeverity, error_logger
from .monitoring_config import MetricsConfig, MetricsRegistry
from .security_monitor import security_monitor

logger = structlog.get_logger(__name__)

# Singleton metrics
_metrics = None
_metrics_lock = threading.Lock()


def get_metrics():
    """Get or create metrics singleton."""
    global _metrics
    if _metrics is None:
        with _metrics_lock:
            if _metrics is None:
                _metrics = {
                    "endpoint_latency": Histogram(
                        "app_endpoint_latency_seconds",
                        "Endpoint Latency",
                        ["endpoint", "method"],
                        registry=REGISTRY,
                    )
                }
    return _metrics


class MonitoringMiddleware:
    """Middleware for request monitoring and metrics collection."""

    def __init__(self, app: Flask, metrics: MetricsRegistry):
        """Initialize monitoring middleware.

        Args:
            app: Flask application
            metrics: Metrics registry instance
        """
        self.app = app
        self.metrics = metrics

        # Add Prometheus WSGI middleware
        self.app.wsgi_app = DispatcherMiddleware(self.app.wsgi_app, {"/metrics": make_wsgi_app()})

        # Register before/after request handlers
        self.app.before_request(self._before_request)
        self.app.after_request(self._after_request)

        # Register error handler
        self.app.errorhandler(Exception)(self._handle_error)

    def _before_request(self):
        """Handle before request actions."""
        g.start_time = time.time()
        g.request_id = str(uuid.uuid4())

        # Set request context for error logger
        error_logger.set_context(request_id=g.request_id)

    def _after_request(self, response: Response) -> Response:
        """Handle after request actions."""
        # Calculate request duration
        duration = time.time() - g.start_time

        # Record endpoint latency
        endpoint = request.endpoint or "unknown"
        get_metrics()["endpoint_latency"].labels(endpoint=endpoint, method=request.method).observe(
            duration
        )

        # Clear error logger context
        error_logger.clear_context()

        return response

    def _handle_error(self, error: Exception) -> Response:
        """Error handler.

        Args:
            error: Exception instance

        Returns:
            Flask response object
        """
        # Update error metrics
        self.metrics.error_counter.labels(
            type=error.__class__.__name__, component=request.endpoint or "unknown"
        ).inc()

        # Log error
        logger.error(
            "request_error",
            method=request.method,
            path=request.path,
            error=str(error),
            error_type=error.__class__.__name__,
            exc_info=True,
        )

        # Re-raise the error for Flask's error handlers
        raise error


def track_method_metrics(metrics: MetricsRegistry) -> Callable:
    """Decorator for tracking method-level metrics.

    Args:
        metrics: Metrics registry instance

    Returns:
        Decorator function
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            method_name = func.__name__

            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time

                # Record successful execution
                metrics.request_latency.labels(method=method_name, endpoint="method").observe(
                    duration
                )

                return result

            except Exception as e:
                # Record error
                metrics.error_counter.labels(type=e.__class__.__name__, component=method_name).inc()

                # Re-raise the exception
                raise

        return wrapper

    return decorator


def setup_monitoring(app: Flask) -> None:
    """Set up monitoring for Flask application.

    Args:
        app: Flask application
    """
    # Create metrics registry
    metrics = MetricsRegistry(MetricsConfig())

    # Initialize monitoring middleware
    MonitoringMiddleware(app, metrics)

    # Start Prometheus metrics server
    start_http_server(8000)

    logger.info("monitoring_initialized", metrics_endpoint="/metrics", prometheus_port=8000)


def monitoring_middleware() -> Callable:
    """Middleware for request monitoring and error logging."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Generate request ID
            request_id = str(uuid.uuid4())
            g.request_id = request_id

            # Set context for error logging
            error_logger.set_context(request_id=request_id, user_id=getattr(g, "user_id", None))

            # Start timing
            start_time = time.time()

            try:
                # Check for security threats
                if security_event := security_monitor.monitor_request(request):
                    # Add security event to request context
                    request.security_event = security_event

                    # If critical security event, block the request
                    if security_event.severity == SecuritySeverity.CRITICAL:
                        error_logger.log_error(
                            error="Critical security threat detected",
                            severity=ErrorSeverity.ERROR,
                            component=request.endpoint,
                            additional_data={"security_event": security_event.__dict__},
                        )
                        return current_app.response_class(
                            response="Access denied due to security threat", status=403
                        )

                # Execute request
                response = f(*args, **kwargs)

                # Record successful request
                REQUEST_COUNT.labels(
                    method=request.method,
                    endpoint=request.endpoint,
                    http_status=response.status_code,
                ).inc()

                return response

            except Exception as e:
                # Log the error
                error_logger.log_error(
                    error=e,
                    severity=ErrorSeverity.ERROR,
                    component=request.endpoint,
                    additional_data={
                        "method": request.method,
                        "path": request.path,
                        "args": dict(request.args),
                        "headers": dict(request.headers),
                        "security_event": (
                            getattr(request, "security_event", None).__dict__
                            if hasattr(request, "security_event")
                            else None
                        ),
                    },
                )

                # Record failed request
                REQUEST_COUNT.labels(
                    method=request.method, endpoint=request.endpoint, http_status=500
                ).inc()

                # Re-raise for error handler
                raise

            finally:
                # Record request latency
                duration = time.time() - start_time
                REQUEST_LATENCY.labels(method=request.method, endpoint=request.endpoint).observe(
                    duration
                )

                # Clear error logging context
                error_logger.clear_context()

        return wrapped

    return decorator


def init_monitoring(app):
    """Initialize monitoring for the Flask application."""
    # Initialize security monitoring
    security_monitor.init_security_monitoring(app)

    # Register error handlers
    @app.errorhandler(Exception)
    def handle_error(error):
        """Global error handler."""
        error_logger.log_error(
            error=error,
            severity=(
                ErrorSeverity.ERROR
                if not hasattr(error, "code") or error.code >= 500
                else ErrorSeverity.WARNING
            ),
            component="error_handler",
            additional_data={
                "method": request.method,
                "path": request.path,
                "args": dict(request.args),
                "headers": dict(request.headers),
                "security_event": (
                    getattr(request, "security_event", None).__dict__
                    if hasattr(request, "security_event")
                    else None
                ),
            },
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
            method=request.method, endpoint=request.endpoint or "unknown"
        ).observe(duration)

        # Record request count
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.endpoint or "unknown",
            http_status=response.status_code,
        ).inc()

        return response
