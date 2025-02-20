"""
Security headers middleware for Flask application.
Applies security headers to all responses.
"""

from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Union

from flask import Flask, Response, make_response, request
from flask.typing import ResponseReturnValue

from . import security_config as config


def security_headers_middleware() -> Callable:
    """Middleware for applying security headers to responses."""

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            response = make_response(f(*args, **kwargs))

            # Apply security headers
            for header, value in config.SECURITY_HEADERS.items():
                response.headers[header] = value

            return response

        return wrapped

    return decorator


def init_security_headers(app: Flask):
    """Initialize security headers for Flask application."""

    @app.after_request
    def add_security_headers(response: Response) -> Response:
        """Add security headers to response."""
        # Content Security Policy
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data: https:; "
            "connect-src 'self' https:; "
            "frame-ancestors 'none'"
        )

        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"

        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"

        # X-XSS-Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Strict-Transport-Security
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

        # Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions-Policy
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )

        return response
