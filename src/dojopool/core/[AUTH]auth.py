"""
Authentication utilities for the application.
"""

import logging
from functools import wraps
from typing import Any, Callable, Dict

import jwt
from flask import current_app, g, request

logger = logging.getLogger(__name__)


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify and decode a JWT token.

    Args:
        token: The JWT token to verify

    Returns:
        The decoded token payload

    Raises:
        jwt.InvalidTokenError: If the token is invalid
    """
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def require_auth(f: Callable) -> Callable:
    """Decorator to require authentication."""

    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return {"error": "No authorization header"}, 401

        try:
            # Extract token from "Bearer <token>"
            token = auth_header.split(" ")[1]
            # Verify and decode token
            payload = verify_token(token)

            # Store user info in Flask's g object
            g.user_id = payload.get("sub")
            g.user_roles = payload.get("roles", [])

            return f(*args, **kwargs)
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            return {"error": "Invalid token"}, 401
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return {"error": "Authentication failed"}, 401

    return decorated


def is_admin() -> bool:
    """Check if the current user is an admin."""
    return "admin" in getattr(g, "user_roles", [])
