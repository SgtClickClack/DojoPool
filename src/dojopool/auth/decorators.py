"""Authentication and authorization decorators.

This module provides decorators for securing routes with authentication
and permission checks.
"""

from functools import wraps
from typing import Callable, List, Union

from flask import flash, redirect, request, url_for
from flask_login import current_user

from dojopool.core.errors import AuthenticationError, AuthorizationError


def login_required(f: Callable) -> Callable:
    """Require user to be logged in.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            if request.is_json:
                raise AuthenticationError("Authentication required")

            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))

        if current_user.is_locked():
            if request.is_json:
                raise AuthenticationError("Account is locked")

            flash("Your account is temporarily locked.", "error")
            return redirect(url_for("auth.login"))

        return f(*args, **kwargs)

    return decorated


def roles_required(roles: Union[str, List[str]]) -> Callable:
    """Require user to have specific roles.

    Args:
        roles: Required role name(s).

    Returns:
        Callable: Decorator function.
    """
    if isinstance(roles, str):
        roles = [roles]

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            if not current_user.is_authenticated:
                if request.is_json:
                    raise AuthenticationError("Authentication required")

                flash("Please log in to access this page.", "warning")
                return redirect(url_for("auth.login", next=request.url))

            if not any(current_user.has_role(role) for role in roles):
                if request.is_json:
                    raise AuthorizationError("Insufficient roles")

                flash("You do not have permission to access this page.", "error")
                return redirect(url_for("main.index"))

            return f(*args, **kwargs)

        return decorated

    return decorator


def permissions_required(permissions: Union[str, List[str]]) -> Callable:
    """Require user to have specific permissions.

    Args:
        permissions: Required permission(s).

    Returns:
        Callable: Decorator function.
    """
    if isinstance(permissions, str):
        permissions = [permissions]

    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated(*args, **kwargs):
            if not current_user.is_authenticated:
                if request.is_json:
                    raise AuthenticationError("Authentication required")

                flash("Please log in to access this page.", "warning")
                return redirect(url_for("auth.login", next=request.url))

            if not any(current_user.has_permission(perm) for perm in permissions):
                if request.is_json:
                    raise AuthorizationError("Insufficient permissions")

                flash("You do not have permission to access this page.", "error")
                return redirect(url_for("main.index"))

            return f(*args, **kwargs)

        return decorated

    return decorator


def verified_required(f: Callable) -> Callable:
    """Require user to have a verified email.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            if request.is_json:
                raise AuthenticationError("Authentication required")

            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))

        if not current_user.is_verified:
            if request.is_json:
                raise AuthorizationError("Email verification required")

            flash("Please verify your email address first.", "warning")
            return redirect(url_for("auth.verify_email"))

        return f(*args, **kwargs)

    return decorated


def admin_required(f: Callable) -> Callable:
    """Require user to be an administrator.

    Args:
        f: Function to decorate.

    Returns:
        Callable: Decorated function.
    """

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            if request.is_json:
                raise AuthenticationError("Authentication required")

            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))

        if not current_user.has_role("admin"):
            if request.is_json:
                raise AuthorizationError("Admin access required")

            flash("Administrator access required.", "error")
            return redirect(url_for("main.index"))

        return f(*args, **kwargs)

    return decorated
