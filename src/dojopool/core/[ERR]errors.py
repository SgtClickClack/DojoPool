"""Error handling module.

This module contains custom exceptions and error handlers for the application.
"""

from typing import Tuple, Union

from flask import Flask, jsonify, render_template, request
from werkzeug.exceptions import HTTPException

from dojopool.extensions import db


class DojoPoolError(Exception):
    """Base exception class for DojoPool application."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(DojoPoolError):
    """Raised when data validation fails."""

    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class AuthenticationError(DojoPoolError):
    """Raised when authentication fails."""

    def __init__(self, message: str):
        super().__init__(message, status_code=401)


class AuthorizationError(DojoPoolError):
    """Raised when authorization fails."""

    def __init__(self, message: str):
        super().__init__(message, status_code=403)


class ResourceNotFoundError(DojoPoolError):
    """Raised when a requested resource is not found."""

    def __init__(self, message: str):
        super().__init__(message, status_code=404)


class APIError(DojoPoolError):
    """Raised when an API request fails."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, status_code=status_code)


def handle_error(error: Union[HTTPException, DojoPoolError]) -> Tuple[Union[str, dict], int]:
    """Handle errors and return appropriate response.

    Args:
        error: The error to handle.

    Returns:
        Tuple containing the response and status code.
    """
    if hasattr(error, "status_code"):
        status_code = error.status_code
    elif hasattr(error, "code"):
        status_code = error.code
    else:
        status_code = 500

    if request.is_json or request.path.startswith("/api/"):
        return {"error": str(error), "status_code": status_code}, status_code

    return render_template("error.html", error=error), status_code


def register_error_handlers(app: Flask) -> None:
    """Register error handlers for the application.

    Args:
        app: Flask application instance.
    """

    @app.errorhandler(DojoPoolError)
    def handle_dojopool_error(error: DojoPoolError):
        """Handle custom DojoPool errors."""
        return handle_error(error)

    @app.errorhandler(404)
    def not_found_error(error):
        """Handle 404 errors."""
        return handle_error(error)

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        db.session.rollback()
        return handle_error(error)

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        """Handle unexpected errors."""
        app.logger.error(f"Unexpected error: {error}", exc_info=True)
        return handle_error(error)
