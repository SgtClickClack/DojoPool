"""Error handling module.

This module contains custom exceptions and error handlers for the application.
"""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union, cast

from flask import Flask, Response, jsonify, render_template, request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.extensions import db


class DojoPoolError(Exception):
    """Base exception class for DojoPool application."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(DojoPoolError):
    """Raised when validation fails."""

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
    """Raised when a resource is not found."""

    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=404)


class APIError(DojoPoolError):
    """Raised when an API error occurs."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message, status_code=status_code)


def handle_error(
    error: Union[HTTPException, DojoPoolError],
):
    """Handle errors and return appropriate response.

    Args:
        error: The error to handle

    Returns:
        A Flask response with error details
    """
    if isinstance(error, HTTPException):
        return jsonify({"error": error.description}), error.code
    return jsonify({"error": error.message}), error.status_code


def register_error_handlers(app: Flask):
    """Register error handlers with the Flask application.

    Args:
        app: The Flask application instance
    """

    @app.errorhandler(DojoPoolError)
    def handle_dojopool_error(error: DojoPoolError) -> ResponseReturnValue:
        """Handle DojoPool application errors."""
        return handle_error(error)

    @app.errorhandler(404)
    def not_found_error(error: HTTPException):
        """Handle 404 errors."""
        return render_template("errors/404.html"), 404

    @app.errorhandler(500)
    def internal_error(error: Exception):
        """Handle 500 errors."""
        if db is not None and db.session is not None:
            db.session.rollback()
        return render_template("errors/500.html"), 500

    @app.errorhandler(Exception)
    def handle_unexpected_error(error: Exception):
        """Handle unexpected errors."""
        if db is not None and db.session is not None:
            db.session.rollback()
        return jsonify({"error": "An unexpected error occurred"}), 500
