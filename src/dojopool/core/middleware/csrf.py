"""CSRF protection middleware.

This module provides CSRF protection for forms and API endpoints.
"""

import hmac
import secrets
from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, abort, current_app, request, session
from flask.typing import ResponseReturnValue
from src.core.exceptions import CSRFError
from werkzeug.wrappers import Response as WerkzeugResponse


def generate_csrf_token() -> str:
    """Generate a new CSRF token.

    Returns:
        str: Generated token
    """
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_hex(32)
    return session["csrf_token"]


def verify_csrf_token(token: Optional[str]):
    """Verify a CSRF token.

    Args:
        token: Token to verify

    Returns:
        bool: Whether token is valid
    """
    if not token or not session.get("csrf_token"):
        return False
    return hmac.compare_digest(token, session["csrf_token"])


def csrf_protect(exempt_methods: Optional[List[str]] = None):
    """CSRF protection decorator.

    Args:
        exempt_methods: List of HTTP methods exempt from CSRF protection

    Returns:
        Callable: Decorated function
    """
    if exempt_methods is None:
        exempt_methods = ["GET", "HEAD", "OPTIONS", "TRACE"]

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any) -> Any:
            if request.method not in exempt_methods:
                token = request.form.get("csrf_token", type=str)
                if not token:
                    token = request.headers.get("X-CSRF-Token")

                if not verify_csrf_token(token):
                    abort(403, "CSRF token missing or invalid")

            return f(*args, **kwargs)

        return wrapped

    return decorator


def csrf_exempt(f: Callable) -> Callable:
    """Mark a view as exempt from CSRF protection."""
    setattr(f, "csrf_exempt", True)
    return f


def api_csrf_protect():
    """CSRF protection specifically for API endpoints.

    Returns:
        Callable: Decorator function for CSRF protection
    """

    def decorator(f: Callable):
        @wraps(f)
        def wrapped(*args: Any, **kwargs: Any):
            # Skip CSRF for exempt views
            if getattr(f, "csrf_exempt", False):
                return f(*args, **kwargs)

            # Verify Origin header
            origin = request.headers.get("Origin")
            if origin:
                if origin not in current_app.config["ALLOWED_ORIGINS"]:
                    abort(403, "Invalid Origin")

            # Verify CSRF token for unsafe methods
            if request.method not in ["GET", "HEAD", "OPTIONS", "TRACE"]:
                token = request.headers.get("X-CSRF-Token")
                if not verify_csrf_token(token):
                    raise CSRFError("CSRF token missing or invalid")

            return f(*args, **kwargs)

        return wrapped

    return decorator
