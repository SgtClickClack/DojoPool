"""Core error classes for the DojoPool application."""

import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any, Dict, List, NoReturn, Optional, Set, Tuple, Type, Union
from uuid import UUID

from flask import Flask, Request, Response, current_app, jsonify, request
from flask.typing import ResponseReturnValue
from sqlalchemy import ForeignKey
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Mapped, mapped_column, relationship
from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.extensions import db

logger = logging.getLogger(__name__)


class DojoPoolError(Exception):
    """Base error class for DojoPool application."""

    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code or "INTERNAL_ERROR"
        self.details = details or {}

    def to_dict(self):
        """Convert error to dictionary format."""
        return {"error": self.code, "message": self.message, "details": self.details}


def handle_error(
    error: Union[DojoPoolError, HTTPException, SQLAlchemyError, Exception],
):
    """Global error handler for all exceptions."""
    if isinstance(error, DojoPoolError):
        response = jsonify(error.to_dict())
        response.status_code = 400
    elif isinstance(error, HTTPException):
        response = jsonify(
            {"error": error.name, "message": error.description, "details": {}}
        )
        response.status_code = error.code
    elif isinstance(error, SQLAlchemyError):
        db.session.rollback()
        response = jsonify(
            {"error": "DATABASE_ERROR", "message": str(error), "details": {}}
        )
        response.status_code = 500
    else:
        logger.error(f"Unhandled error: {str(error)}", exc_info=True)
        response = jsonify(
            {
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {},
            }
        )
        response.status_code = 500

    return response


def init_error_handlers(app: Flask):
    """Initialize error handlers for the application."""
    app.register_error_handler(DojoPoolError, handle_error)
    app.register_error_handler(HTTPException, handle_error)
    app.register_error_handler(SQLAlchemyError, handle_error)
    app.register_error_handler(Exception, handle_error)


class SecurityError(Exception):
    """Base class for security-related errors."""

    def __init__(
        self, message: str, code: int = 400, details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize security error.

        Args:
            message: Error message
            code: HTTP status code
            details: Additional error details
        """
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}

        # Log the error
        self._log_error()

    def to_dict(self):
        """Convert error to dictionary format.

        Returns:
            Dictionary representation of the error
        """
        error_dict: Dict[Any, Any] = {
            "error": {
                "type": self.__class__.__name__,
                "message": self.message,
                "code": self.code,
            }
        }

        if self.details:
            error_dict["error"]["details"] = self.details

        return error_dict

    def _log_error(self):
        """Log error details."""
        log_data: Dict[Any, Any] = {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "code": self.code,
            "details": self.details,
            "request_id": request.headers.get("X-Request-ID"),
            "user_id": getattr(request, "user_id", None),
            "ip_address": request.remote_addr,
            "user_agent": request.user_agent.string,
            "endpoint": request.endpoint,
            "method": request.method,
            "path": request.path,
        }

        logger.error(
            f"Security error occurred: {self.__class__.__name__}", extra=log_data
        )


class AuthenticationError(SecurityError):
    """Error raised for authentication failures."""

    def __init__(
        self,
        message: str = "Authentication failed",
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Initialize authentication error."""
        super().__init__(message, code=401, details=details)


class AuthorizationError(SecurityError):
    """Error raised for authorization failures."""

    def __init__(
        self,
        message: str = "Unauthorized access",
        details: Optional[Dict[str, Any]] = None,
    ):
        """Initialize authorization error."""
        super().__init__(message, code=403, details=details)


class InvalidTokenError(SecurityError):
    """Error raised for invalid token issues."""

    def __init__(
        self, message: str = "Invalid token", details: Optional[Dict[str, Any]] = None
    ):
        """Initialize invalid token error."""
        super().__init__(message, code=401, details=details)


class RateLimitExceededError(SecurityError):
    """Error raised when rate limit is exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        details: Optional[Dict[str, Any]] = None,
    ):
        """Initialize rate limit error."""
        super().__init__(message, code=429, details=details)


class InvalidInputError(SecurityError):
    """Error raised for invalid input data."""

    def __init__(
        self, message: str = "Invalid input", details: Optional[Dict[str, Any]] = None
    ) -> None:
        """Initialize invalid input error."""
        super().__init__(message, code=400, details=details)


class CSRFError(SecurityError):
    """Error raised for CSRF token validation failures."""

    def __init__(
        self,
        message: str = "CSRF token validation failed",
        details: Optional[Dict[str, Any]] = None,
    ):
        """Initialize CSRF error."""
        super().__init__(message, code=400, details=details)


def handle_security_error(error: SecurityError):
    """Handle security-related errors."""
    response: Dict[Any, Any] = {
        "error": error.__class__.__name__,
        "message": str(error),
    }
    return jsonify(response), 500


def handle_database_error(error: SQLAlchemyError) -> Response:
    """Handle database errors."""
    db.session.rollback()
    response: Dict[Any, Any] = {"error": "DATABASE_ERROR", "message": str(error)}
    return jsonify(response), 500


def handle_http_error(error: HTTPException):
    """Handle HTTP errors.

    Args:
        error: HTTP exception instance

    Returns:
        Tuple of error response and status code
    """
    response: Dict[Any, Any] = {
        "error": {
            "type": error.__class__.__name__,
            "message": str(error),
            "code": error.code,
        }
    }
    return response, error.code


def handle_unknown_error(error: Exception):
    """Handle unknown errors.

    Args:
        error: Exception instance

    Returns:
        Tuple of error response and status code
    """
    # Log the unknown error
    logger.exception("An unknown error occurred")

    response: Dict[Any, Any] = {
        "error": {
            "type": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "code": 500,
        }
    }
    return response, 500


def register_error_handlers(app: Flask):
    """Register error handlers for the application."""
    # Register handlers for security errors
    error_classes: List[Type[Exception]] = [
        SecurityError,
        SecurityMetricsError,
        SecurityScanError,
        SecurityComplianceError,
        SecurityIncidentError,
        SecurityNotificationError,
    ]

    for error_cls in error_classes:
        app.register_error_handler(error_cls, handle_security_error)

    # Register handler for database errors
    app.register_error_handler(SQLAlchemyError, handle_database_error)

    # Register handler for HTTP exceptions
    app.register_error_handler(
        HTTPException,
        lambda e: (jsonify({"error": e.__class__.__name__, "message": str(e)}), e.code),
    )


class SecurityMetricsError(SecurityError):
    """Error related to security metrics collection."""

    def __init__(self, message: str = "Failed to collect security metrics") -> None:
        super().__init__(message)


class SecurityScanError(SecurityError):
    """Error related to security scanning."""

    def __init__(self, message: str = "Security scan failed"):
        super().__init__(message)


class SecurityComplianceError(SecurityError):
    """Error related to security compliance checks."""

    def __init__(self, message: str = "Security compliance check failed"):
        super().__init__(message)


class SecurityIncidentError(SecurityError):
    """Error related to security incident handling."""

    def __init__(self, message: str = "Security incident handling failed"):
        super().__init__(message)


class SecurityNotificationError(SecurityError):
    """Error related to security notifications."""

    def __init__(self, message: str = "Failed to send security notification") -> None:
        super().__init__(message)
