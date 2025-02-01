"""Authentication decorators for DojoPool."""

from functools import wraps
from typing import Any, Callable

from flask import current_app, jsonify, request

from .service import AuthenticationService


def login_required(f: Callable) -> Callable:
    """Decorator to require authentication.

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_service: AuthenticationService = current_app.auth_service

        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401

        try:
            token = auth_header.split()[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header"}), 401

        # Validate token
        user_id = auth_service.validate_access(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Add user_id to kwargs
        kwargs["user_id"] = user_id
        return f(*args, **kwargs)

    return decorated


def admin_required(f: Callable) -> Callable:
    """Decorator to require admin privileges.

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_service: AuthenticationService = current_app.auth_service

        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401

        try:
            token = auth_header.split()[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header"}), 401

        # Validate token
        user_id = auth_service.validate_access(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Check admin status
        # TODO: Implement admin check
        is_admin = False
        if not is_admin:
            return jsonify({"error": "Admin privileges required"}), 403

        # Add user_id to kwargs
        kwargs["user_id"] = user_id
        return f(*args, **kwargs)

    return decorated


def session_required(f: Callable) -> Callable:
    """Decorator to require valid session.

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_service: AuthenticationService = current_app.auth_service

        # Get session ID from header
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            return jsonify({"error": "No session ID"}), 401

        # Get session
        session = auth_service.session_manager.get_session(session_id)
        if not session:
            return jsonify({"error": "Invalid or expired session"}), 401

        # Add session data to kwargs
        kwargs["session"] = session
        return f(*args, **kwargs)

    return decorated


def rate_limit(limit: int, period: int) -> Callable:
    """Decorator to apply rate limiting.

    Args:
        limit: Number of requests allowed
        period: Time period in seconds

    Returns:
        Decorator function
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            # TODO: Implement rate limiting
            return f(*args, **kwargs)

        return decorated

    return decorator


def require_2fa(f: Callable) -> Callable:
    """Decorator to require two-factor authentication.

    Args:
        f: Function to decorate

    Returns:
        Decorated function
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        auth_service: AuthenticationService = current_app.auth_service

        # Get token from header
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "No authorization header"}), 401

        try:
            token = auth_header.split()[1]
        except IndexError:
            return jsonify({"error": "Invalid authorization header"}), 401

        # Validate token
        user_id = auth_service.validate_access(token)
        if not user_id:
            return jsonify({"error": "Invalid or expired token"}), 401

        # Get 2FA token from header
        totp_token = request.headers.get("X-TOTP-Token")
        if not totp_token:
            return jsonify({"error": "Two-factor authentication required"}), 401

        # Verify 2FA token
        if not auth_service.verify_2fa(user_id, totp_token):
            return jsonify({"error": "Invalid two-factor authentication code"}), 401

        # Add user_id to kwargs
        kwargs["user_id"] = user_id
        return f(*args, **kwargs)

    return decorated
