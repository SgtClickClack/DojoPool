"""Session security middleware."""

from functools import wraps
from typing import Any, Callable, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, abort, current_app, g, request
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.security.session import SessionManager
from dojopool.utils.security import secure_headers

session_manager: SessionManager = SessionManager()


def session_security_middleware() -> Callable:
    """Middleware to enforce session security.

    Returns:
        Callable: Decorator function for session security
    """

    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any):
            # Skip for non-authenticated endpoints
            if getattr(f, "skip_session_security", False):
                return f(*args, **kwargs)

            # Get session token
            session_token = request.cookies.get("session_token")
            if not session_token:
                abort(401, "Session token missing")

            # Validate session
            session_data = session_manager.validate_session(session_token)
            if not session_data:
                abort(401, "Invalid session")

            # Check session expiry
            if session_manager.is_session_expired(session_data):
                abort(401, "Session expired")

            # Check for session rotation
            if _should_rotate_session(session_data):
                new_token = session_manager.rotate_session(session_token)
                response = f(*args, **kwargs)
                response.set_cookie(
                    "session_token",
                    new_token,
                    secure=True,
                    httponly=True,
                    samesite="Strict",
                )
                return response

            # Add session data to request context
            g.session = session_data

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def _should_rotate_session(session_data: Dict[str, Any]) -> bool:
    """Check if session should be rotated based on age and activity.

    Args:
        session_data: Session data dictionary

    Returns:
        bool: Whether session should be rotated
    """
    # Rotate session after 12 hours or 100 requests
    return (
        session_data.get("age", 0) > 43200  # 12 hours in seconds
        or session_data.get("request_count", 0) > 100
    )


def rate_limit_middleware(requests: int = 100, window: int = 3600) -> Callable:
    """Rate limiting middleware for sessions.

    Args:
        requests: Maximum number of requests allowed in window
        window: Time window in seconds

    Returns:
        Callable: Decorator function for rate limiting
    """

    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any):
            # Get client identifier (IP or session token)
            client_id = request.cookies.get("session_token") or request.remote_addr

            # Check rate limit
            if not session_manager.check_rate_limit(client_id, requests, window):
                abort(429, "Rate limit exceeded")

            return f(*args, **kwargs)

        return decorated_function

    return decorator
