"""Authentication utilities.

This module provides authentication-related utilities.
"""

from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Optional

from flask import current_app, g, jsonify, request
from flask_login import current_user
from jwt import ExpiredSignatureError, InvalidTokenError
from models.user import User

from services.token_service import TokenService

# Initialize token service
token_service = TokenService()

def generate_token(user_id: int, expiration: int = 3600) -> str:
    """Generate JWT token for user.

    Args:
        user_id: User ID to generate token for
        expiration: Token expiration time in seconds (default: 1 hour)

    Returns:
        str: Generated JWT token
    """
    user = User.query.get(user_id)
    if not user:
        raise ValueError("User not found")
    return token_service.generate_access_token(user)


def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token.

    Args:
        token: JWT token to verify

    Returns:
        dict: Token payload if valid, None otherwise
    """
    return token_service.verify_token(token)


def get_token_from_header() -> Optional[str]:
    """Extract token from Authorization header.

    Returns:
        str: Token if found, None otherwise
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    return parts[1]


def get_current_user() -> Optional[User]:
    """Get current authenticated user.

    Returns:
        User: Current user if authenticated, None otherwise
    """
    if not current_user or not current_user.is_authenticated:
        token = get_token_from_header()
        if not token:
            return None

        try:
            payload = verify_token(token)
            if not payload:
                return None

            user_id = payload.get("uid")  # Updated to use new payload format
            if not user_id:
                return None

            return User.query.get(user_id)
        except (IndexError, AttributeError):
            return None

    return current_user


def login_required(f: Callable) -> Callable:
    """Decorator to require authentication.

    Args:
        f: Function to decorate

    Returns:
        Callable: Decorated function
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "error": "Authentication required"}), 401
        g.current_user = user
        return f(*args, **kwargs)

    return decorated


def require_roles(*roles: str) -> Callable:
    """Decorator to require specific roles.

    Args:
        *roles: Required roles

    Returns:
        Callable: Decorated function
    """

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            user = get_current_user()
            if not user:
                return (
                    jsonify(
                        {
                            "error": "Authentication required",
                            "message": "No authentication token provided",
                        }
                    ),
                    401,
                )

            user_roles = {role.name for role in user.roles}
            if not any(role in user_roles for role in roles):
                return (
                    jsonify(
                        {"error": "Authorization failed", "message": "Insufficient permissions"}
                    ),
                    403,
                )

            return f(*args, **kwargs)

        return decorated

    return decorator


def admin_required(f: Callable) -> Callable:
    """Decorator to require admin privileges."""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        user = get_current_user()
        if not user:
            return jsonify({"status": "error", "error": "Authentication required"}), 401
        if not user.has_role("admin"):
            return jsonify({"status": "error", "error": "Admin privileges required"}), 403
        g.current_user = user
        return f(*args, **kwargs)

    return decorated


__all__ = [
    "generate_token",
    "verify_token",
    "get_current_user",
    "login_required",
    "require_roles",
    "admin_required",
]
