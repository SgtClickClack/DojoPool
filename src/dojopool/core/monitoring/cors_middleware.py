"""CORS middleware module."""

from typing import Any, Callable, Dict, List, Optional, Set, Union

from flask import Flask, Response, request
from flask.typing import ResponseReturnValue


def setup_cors(app: Flask) -> None:
    """Set up CORS for the Flask application."""

    @app.after_request
    def after_request(response: Response):
        """Add CORS headers to response."""
        # Allow requests from any origin
        response.headers.add("Access-Control-Allow-Origin", "*")

        # Allow specific HTTP methods
        response.headers.add(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )

        # Allow specific headers
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key"
        )

        # Allow credentials
        response.headers.add("Access-Control-Allow-Credentials", "true")

        # Cache preflight response for 1 hour
        response.headers.add("Access-Control-Max-Age", "3600")

        return response


def cors_preflight_handler() -> Response:
    """Handle CORS preflight requests."""
    response = Response()

    # Allow requests from any origin
    response.headers.add("Access-Control-Allow-Origin", "*")

    # Allow specific HTTP methods
    response.headers.add(
        "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
    )

    # Allow specific headers
    response.headers.add(
        "Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key"
    )

    # Allow credentials
    response.headers.add("Access-Control-Allow-Credentials", "true")

    # Cache preflight response for 1 hour
    response.headers.add("Access-Control-Max-Age", "3600")

    return response
