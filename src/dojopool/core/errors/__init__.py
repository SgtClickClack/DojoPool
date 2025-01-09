"""Error handling module for DojoPool."""

from .exceptions import (
    DojoPoolError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    ServiceError
)
from .handlers import init_app

def register_error_handlers(app):
    """Register error handlers for the application."""
    init_app(app)

__all__ = [
    'register_error_handlers',
    'DojoPoolError',
    'ValidationError',
    'AuthenticationError',
    'AuthorizationError',
    'NotFoundError',
    'ConflictError',
    'RateLimitError',
    'ServiceError'
] 