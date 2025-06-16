"""
CORS (Cross-Origin Resource Sharing) middleware for Flask application.
Handles CORS headers and preflight requests.
"""

import re
from functools import wraps
from typing import Any, Callable, Optional

from flask import make_response, request

from . import security_config as config


def _get_origin_response_header(request_origin: Optional[str]) -> Optional[str]:
    """Get appropriate Origin response header based on request origin."""
    if not request_origin:
        return None

    allowed_origins = config.CORS_CONFIG["allowed_origins"]

    # Check exact matches
    if request_origin in allowed_origins:
        return request_origin

    # Check wildcard patterns
    for pattern in allowed_origins:
        if "*" in pattern:
            # Convert wildcard pattern to regex
            regex_pattern = pattern.replace(".", r"\.").replace("*", r"[^.]+")
            if re.match(regex_pattern, request_origin):
                return request_origin

    return None


def cors_middleware() -> Callable:
    """Middleware for handling CORS requests."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            # Handle preflight requests
            if request.method == "OPTIONS":
                response = make_response()

                # Get origin from request
                request_origin = request.headers.get("Origin")
                if allowed_origin := _get_origin_response_header(request_origin):
                    response.headers["Access-Control-Allow-Origin"] = allowed_origin

                    # Allow credentials if configured
                    if config.CORS_CONFIG["supports_credentials"]:
                        response.headers["Access-Control-Allow-Credentials"] = "true"

                    # Set allowed methods
                    response.headers["Access-Control-Allow-Methods"] = ", ".join(
                        config.CORS_CONFIG["allowed_methods"]
                    )

                    # Set allowed headers
                    if request_headers := request.headers.get("Access-Control-Request-Headers"):
                        allowed_headers = [
                            h
                            for h in request_headers.split(",")
                            if h.strip().lower()
                            in [h.lower() for h in config.CORS_CONFIG["allowed_headers"]]
                        ]
                        if allowed_headers:
                            response.headers["Access-Control-Allow-Headers"] = ", ".join(
                                allowed_headers
                            )

                    # Set exposed headers
                    if config.CORS_CONFIG["expose_headers"]:
                        response.headers["Access-Control-Expose-Headers"] = ", ".join(
                            config.CORS_CONFIG["expose_headers"]
                        )

                    # Set max age
                    response.headers["Access-Control-Max-Age"] = str(config.CORS_CONFIG["max_age"])

                return response

            # Handle actual request - don't wrap Flask-RESTful responses
            result = f(*args, **kwargs)
            
            # If result is already a Response object, add CORS headers to it
            if hasattr(result, 'headers'):
                response = result
            else:
                # For non-Response objects, create a response
                response = make_response(result)

            # Get origin from request
            request_origin = request.headers.get("Origin")
            if allowed_origin := _get_origin_response_header(request_origin):
                response.headers["Access-Control-Allow-Origin"] = allowed_origin

                # Allow credentials if configured
                if config.CORS_CONFIG["supports_credentials"]:
                    response.headers["Access-Control-Allow-Credentials"] = "true"

                # Set exposed headers
                if config.CORS_CONFIG["expose_headers"]:
                    response.headers["Access-Control-Expose-Headers"] = ", ".join(
                        config.CORS_CONFIG["expose_headers"]
                    )

            return response

        return wrapped

    return decorator


def init_cors(app):
    """Initialize CORS handling for the Flask application."""

    @app.before_request
    def handle_preflight():
        """Handle CORS preflight requests."""
        if request.method == "OPTIONS":
            response = make_response()

            # Get origin from request
            request_origin = request.headers.get("Origin")
            if allowed_origin := _get_origin_response_header(request_origin):
                response.headers["Access-Control-Allow-Origin"] = allowed_origin

                # Allow credentials if configured
                if config.CORS_CONFIG["supports_credentials"]:
                    response.headers["Access-Control-Allow-Credentials"] = "true"

                # Set allowed methods
                response.headers["Access-Control-Allow-Methods"] = ", ".join(
                    config.CORS_CONFIG["allowed_methods"]
                )

                # Set allowed headers
                if request_headers := request.headers.get("Access-Control-Request-Headers"):
                    allowed_headers = [
                        h
                        for h in request_headers.split(",")
                        if h.strip().lower()
                        in [h.lower() for h in config.CORS_CONFIG["allowed_headers"]]
                    ]
                    if allowed_headers:
                        response.headers["Access-Control-Allow-Headers"] = ", ".join(
                            allowed_headers
                        )

                # Set exposed headers
                if config.CORS_CONFIG["expose_headers"]:
                    response.headers["Access-Control-Expose-Headers"] = ", ".join(
                        config.CORS_CONFIG["expose_headers"]
                    )

                # Set max age
                response.headers["Access-Control-Max-Age"] = str(config.CORS_CONFIG["max_age"])

            return response

    @app.after_request
    def handle_cors(response):
        """Handle CORS for all responses."""
        # Get origin from request
        request_origin = request.headers.get("Origin")
        if allowed_origin := _get_origin_response_header(request_origin):
            response.headers["Access-Control-Allow-Origin"] = allowed_origin

            # Allow credentials if configured
            if config.CORS_CONFIG["supports_credentials"]:
                response.headers["Access-Control-Allow-Credentials"] = "true"

            # Set exposed headers
            if config.CORS_CONFIG["expose_headers"]:
                response.headers["Access-Control-Expose-Headers"] = ", ".join(
                    config.CORS_CONFIG["expose_headers"]
                )

        return response
