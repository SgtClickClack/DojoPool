"""
Monitoring middleware for Flask application.
Provides error logging, performance metric collection, and security monitoring.
"""

import threading
import time
import uuid
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Union

import structlog
from flask import Flask, Response, current_app, g, request
from flask.typing import ResponseReturnValue
from prometheus_client import Histogram, make_wsgi_app, start_http_server
from werkzeug.middleware.dispatcher import DispatcherMiddleware

from ...utils.monitoring import REGISTRY, REQUEST_COUNT, REQUEST_LATENCY
from .error_logger import ErrorSeverity, error_logger
from .monitoring_config import MetricsConfig, MetricsRegistry
from .security_monitor import security_monitor

logger = structlog.get_logger(__name__)

# Singleton metrics
_metrics: Optional[MetricsRegistry] = None


def get_metrics() -> MetricsRegistry:
    """Get or create metrics registry."""
    global _metrics
    if _metrics is None:
        _metrics = MetricsRegistry()
    return _metrics


class MonitoringMiddleware:
    """Monitoring middleware for Flask application."""

    def __init__(self, app: Flask, metrics: MetricsRegistry):
        """Initialize monitoring middleware."""
        self.app = app
        self.metrics = metrics
        self.app.before_request(self._before_request)
        self.app.after_request(self._after_request)
        self.app.errorhandler(Exception)(self._handle_error)

    def _before_request(self):
        """Handle before request."""
        g.start_time = time.time()
        g.request_id = str(uuid.uuid4())

    def _after_request(self, response: Response):
        """Handle after request."""
        request_time = time.time() - g.start_time
        self.metrics.request_latency.observe(request_time)
        self.metrics.request_count.inc()

        # Add request ID to response headers
        response.headers["X-Request-ID"] = g.request_id
        return response

    def _handle_error(self, error: Exception) -> Response:
        """Handle error."""
        error_logger.log_error(
            error=error,
            severity=ErrorSeverity.ERROR,
            request_id=g.get("request_id"),
            user_id=g.get("user_id"),
            endpoint=request.endpoint,
            method=request.method,
            path=request.path,
            args=request.args,
            data=request.get_json(silent=True),
        )
        return Response(response=str(error), status=500, mimetype="application/json")


def track_method_metrics(metrics: MetricsRegistry):
    """Decorator to track method metrics."""

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                metrics.success_count.inc()
                return result
            except Exception as e:
                metrics.error_count.inc()
                raise e
            finally:
                duration = time.time() - start_time
                metrics.method_latency.observe(duration)

        return wrapper

    return decorator


def setup_monitoring(app: Flask) -> None:
    """Set up monitoring for Flask application."""
    metrics = get_metrics()

    # Initialize middleware
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {"/metrics": make_wsgi_app()})

    # Start metrics server
    start_http_server(8000)

    # Add middleware
    MonitoringMiddleware(app, metrics)


def monitoring_middleware():
    """Monitoring middleware decorator."""

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            # Generate request ID
            request_id = str(uuid.uuid4())
            g.request_id = request_id

            # Start timing
            start_time = time.time()

            try:
                # Execute request
                response = f(*args, **kwargs)

                # Record metrics
                duration = time.time() - start_time
                REQUEST_LATENCY.observe(duration)
                REQUEST_COUNT.inc()

                # Add request ID to response
                if isinstance(response, Response):
                    response.headers["X-Request-ID"] = request_id

                return response

            except Exception as e:
                # Log error
                error_logger.log_error(
                    error=e,
                    severity=ErrorSeverity.ERROR,
                    request_id=request_id,
                    user_id=g.get("user_id"),
                    endpoint=request.endpoint,
                    method=request.method,
                    path=request.path,
                    args=request.args,
                    data=request.get_json(silent=True),
                )

                # Monitor security
                security_monitor.monitor_error(e)

                # Re-raise error
                raise

            finally:
                # Clean up request context
                if hasattr(g, "request_id"):
                    delattr(g, "request_id")

        return wrapped

    return decorator


def init_monitoring(app: Flask) -> None:
    """Initialize monitoring for Flask application."""

    @app.errorhandler(Exception)
    def handle_error(error: Exception):
        """Handle error."""
        error_logger.log_error(
            error=error,
            severity=ErrorSeverity.ERROR,
            request_id=g.get("request_id"),
            user_id=g.get("user_id"),
            endpoint=request.endpoint,
            method=request.method,
            path=request.path,
            args=request.args,
            data=request.get_json(silent=True),
        )
        return {"error": str(error)}, 500

    @app.before_request
    def before_request():
        """Handle before request."""
        g.start_time = time.time()
        g.request_id = str(uuid.uuid4())

    @app.after_request
    def after_request(response: Response):
        """Handle after request."""
        # Record request duration
        duration = time.time() - g.start_time
        REQUEST_LATENCY.observe(duration)
        REQUEST_COUNT.inc()

        # Add request ID to response
        response.headers["X-Request-ID"] = g.request_id
        return response
