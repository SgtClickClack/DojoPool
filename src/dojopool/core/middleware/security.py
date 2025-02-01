"""Security headers middleware.

This module provides security headers for all responses.
"""

from functools import wraps

from flask import make_response, request


def security_headers():
    """Add security headers to response."""

    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            response = make_response(f(*args, **kwargs))

            # Security headers
            response.headers["X-Frame-Options"] = "DENY"  # Stricter than SAMEORIGIN
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Content-Security-Policy"] = (
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; block-all-mixed-content; upgrade-insecure-requests;"
            )
            response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
            response.headers["Permissions-Policy"] = (
                "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()"
            )
            response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

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
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
            response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
            response.headers["Cross-Origin-Resource-Policy"] = "same-origin"

            # Allow CORS if configured
            if request.application.config.get("ENABLE_CORS"):
                allowed_origins = request.application.config.get("ALLOWED_ORIGINS", [])
                origin = request.headers.get("Origin")
                if origin in allowed_origins:
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Methods"] = (
                        "GET, POST, PUT, DELETE, OPTIONS"
                    )
                    response.headers["Access-Control-Allow-Headers"] = (
                        "Content-Type, X-CSRF-Token, Authorization"
                    )
                    response.headers["Access-Control-Max-Age"] = "3600"
                    response.headers["Access-Control-Allow-Credentials"] = "true"

            return response

        return wrapped

    return decorator
