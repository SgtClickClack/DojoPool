"""Security package for DojoPool."""

from functools import wraps
from typing import Any, Callable, List, Optional, TypeVar

from flask import current_app
from flask_login import current_user
from werkzeug.security import check_password_hash, generate_password_hash

from ..exceptions import AuthenticationError, AuthorizationError
from .session import SessionManager
from .tokens import (
    generate_confirmation_token,
    generate_reset_token,
    verify_confirmation_token,
    verify_reset_token,
)

F = TypeVar("F", bound=Callable[..., Any])


def require_auth(f: F) -> F:
    """
    Decorator to require authentication for a route.

    Args:
        f: The function to decorate.

    Returns:
        The decorated function.

    Raises:
        AuthenticationError: If user is not authenticated.
    """

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated:
            raise AuthenticationError("Authentication required")
        return f(*args, **kwargs)

    return decorated


def require_roles(roles: List[str]):
    """
    Decorator to require specific roles for a route.

    Args:
        roles: List of required role names.

    Returns:
        The decorator function.

    Raises:
        AuthorizationError: If user doesn't have required roles.
    """

    def decorator(f: F):
        @wraps(f)
        def decorated(*args: Any, **kwargs: Any) -> Any:
            if not current_user.is_authenticated:
                raise AuthenticationError("Authentication required")

            user_roles = getattr(current_user, "roles", [])
            if not any(role in user_roles for role in roles):
                raise AuthorizationError("Insufficient permissions")

            return f(*args, **kwargs)

        return decorated

    return decorator


__all__ = [
    "generate_password_hash",
    "check_password_hash",
    "generate_reset_token",
    "verify_reset_token",
    "generate_confirmation_token",
    "verify_confirmation_token",
    "require_auth",
    "require_roles",
    "generate_password_hash_with_method",
    "verify_password_hash",
]


def generate_password_hash_with_method(
    password: str, method: str = "pbkdf2:sha256", salt_length: int = 8
):
    """
    Generate a password hash using the specified method.

    Args:
        password: The plaintext password to hash.
        method: The hashing algorithm to use. Defaults to 'pbkdf2:sha256'.
        salt_length: Length of the salt. Defaults to 8.

    Returns:
        A string containing the hashed password.
    """
    return generate_password_hash(password, method=method, salt_length=salt_length)


def verify_password_hash(password: str, password_hash: str):
    """
    Verify a plaintext password against the stored hash.

    Args:
        password: The plaintext password to check.
        password_hash: The stored password hash.

    Returns:
        True if the password matches the hash, False otherwise.
    """
    return check_password_hash(password_hash, password)
