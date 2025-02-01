"""
Security headers middleware for Flask application.
Applies security headers to all responses.
"""

from functools import wraps
from typing import Any, Callable

from flask import make_response

from . import security_config as config


def security_headers_middleware() -> Callable:
    """Middleware for applying security headers to responses."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            response = make_response(f(*args, **kwargs))

            # Apply security headers
            for header, value in config.SECURITY_HEADERS.items():
                response.headers[header] = value

            return response

        return wrapped

    return decorator


def init_security_headers(app):
    """Initialize security headers for the Flask application."""

    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses."""
        for header, value in config.SECURITY_HEADERS.items():
            if header not in response.headers:
                response.headers[header] = value
        return response
