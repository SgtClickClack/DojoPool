"""Security headers middleware.

This module provides security headers for all responses.
"""

from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, make_response, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse


def security_headers() -> Callable:
    """Add security headers to response.

    Returns:
        Callable: Decorator function for adding security headers
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            response = make_response(f(*args, **kwargs))

            # Security headers
            response.headers["X-Frame-Options"] = "DENY"  # Stricter than SAMEORIGIN
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
                "font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; "
                "form-action 'self'; base-uri 'self'; block-all-mixed-content; "
                "upgrade-insecure-requests;"
            )
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = (
                "geolocation=(), microphone=(), camera=(), payment=(), usb=(), "
                "magnetometer=(), accelerometer=(), gyroscope=()"
            )
            response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

            return response

        return wrapped

    return decorator


def api_security_headers() -> Callable:
    """Add security headers specific to API responses.

    Returns:
        Callable: Decorator function for adding API security headers
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            response = make_response(f(*args, **kwargs))

            # API-specific security headers
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Content-Security-Policy"] = "default-src 'none'"
            response.headers["Cache-Control"] = "no-store, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

            return response

        return wrapped

    return decorator
