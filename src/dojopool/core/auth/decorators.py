"""Authentication decorators for DojoPool."""

from functools import wraps
from typing import Any, Callable, Dict, List, Optional, TypeVar, cast

from flask import Response, current_app, flash, redirect, request, url_for
from flask_login import current_user
from werkzeug.wrappers import Response as WerkzeugResponse

F = TypeVar("F", bound=Callable[..., Any])


def login_required(f: F) -> F:
    """Require user to be logged in.

    This decorator ensures that the user is authenticated before accessing
    the decorated route. If not authenticated, redirects to login page.

    Args:
        f: Function to decorate

    Returns:
        Decorated function requiring login
    """

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))
        return f(*args, **kwargs)

    return cast(F, decorated_function)


def admin_required(f: F):
    """Require user to be an admin.

    This decorator ensures that the user is authenticated and has admin privileges
    before accessing the decorated route. If not, redirects to appropriate page.

    Args:
        f: Function to decorate

    Returns:
        Decorated function requiring admin privileges
    """

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated:
            flash("Please log in to access this page.", "warning")
            return redirect(url_for("auth.login", next=request.url))
        if not current_user.is_admin:
            flash("You do not have permission to access this page.", "error")
            return redirect(url_for("main.index"))
        return f(*args, **kwargs)

    return cast(F, decorated_function)


def session_required(f: F) -> F:
    """Require valid session.

    This decorator ensures that the user has a valid session before accessing
    the decorated route. If not, redirects to login page.

    Args:
        f: Function to decorate

    Returns:
        Decorated function requiring valid session
    """

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated or not current_user.has_valid_session():
            flash("Your session has expired. Please log in again.", "warning")
            return redirect(url_for("auth.login", next=request.url))
        return f(*args, **kwargs)

    return cast(F, decorated_function)


__all__ = ["login_required", "admin_required", "session_required"]
