"""Session security middleware."""

from functools import wraps
from typing import Any, Callable

from flask import abort, g, request

from dojopool.core.security.session import SessionManager
from dojopool.utils.security import secure_headers

session_manager = SessionManager()


def session_security_middleware() -> Callable:
    """Middleware to enforce session security."""

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Skip for non-authenticated endpoints
            if request.endpoint in ["auth.login", "auth.register", "static"]:
                return f(*args, **kwargs)

            # Get session token from header or cookie
            session_token = request.headers.get("X-Session-Token") or request.cookies.get(
                "session_token"
            )

            if not session_token:
                abort(401)

            # Validate session
            session_data = session_manager.validate_session(session_token)
            if not session_data:
                abort(401)

            # Store session data in g for route handlers
            g.session = session_data
            g.user_id = session_data["user_id"]

            # Add security headers
            response = f(*args, **kwargs)
            if hasattr(response, "headers"):
                response.headers.update(secure_headers())

            # Rotate session periodically
            if _should_rotate_session(session_data):
                new_token = session_manager.rotate_session(session_token)
                if new_token and hasattr(response, "set_cookie"):
                    response.set_cookie(
                        "session_token", new_token, httponly=True, secure=True, samesite="Lax"
                    )

            return response

        return decorated_function

    return decorator


def _should_rotate_session(session_data: dict) -> bool:
    """Determine if session should be rotated based on activity."""
    from datetime import datetime, timedelta

    last_activity = datetime.fromisoformat(session_data["last_activity"])
    rotation_threshold = timedelta(minutes=30)  # Rotate every 30 minutes

    return datetime.utcnow() - last_activity > rotation_threshold


def rate_limit_middleware(requests: int = 100, window: int = 3600) -> Callable:
    """Rate limiting middleware.

    Args:
        requests: Maximum number of requests allowed
        window: Time window in seconds

    Returns:
        Callable: Decorated function
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            # Get client identifier (IP or session token)
            client_id = request.headers.get("X-Session-Token") or request.remote_addr

            # Check rate limit
            key = f"rate_limit:{client_id}"
            current = session_manager.redis_client.get(key)

            if current is not None and int(current) >= requests:
                abort(429)  # Too Many Requests

            # Increment counter
            if current is None:
                session_manager.redis_client.setex(key, window, 1)
            else:
                session_manager.redis_client.incr(key)

            return f(*args, **kwargs)

        return decorated_function

    return decorator
