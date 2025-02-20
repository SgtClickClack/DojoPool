"""Authentication utility functions."""

from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Tuple, TypeVar, Union
from urllib.parse import urljoin, urlparse

from flask import (
    Request,
    Response,
    abort,
    current_app,
    jsonify,
    request,
    url_for,
)
from flask.typing import ResponseReturnValue
from flask_login import current_user
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.wrappers import Response as WerkzeugResponse

F = TypeVar("F", bound=Callable[..., Any])


def is_safe_url(target: str) -> bool:
    """Check if a URL is safe to redirect to."""
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc


def get_redirect_target():
    """Get safe redirect target from request."""
    for target in (request.args.get("next"), request.referrer):
        if not target:
            continue
        if is_safe_url(target):
            return target
    return None


def redirect_back(endpoint: str, **kwargs: Any):
    """Redirect back to target URL or fallback endpoint."""
    target = get_redirect_target()
    if not target:
        target = url_for(endpoint, **kwargs)
    return Response(status=302, headers={"Location": target})


def verified_user_required(f: F):
    """Require user to be verified."""

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if not current_user.is_authenticated:
            abort(401)
        if not current_user.is_verified:
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def generate_token(payload: Dict[str, Any], expires_in: int = 3600):
    """Generate a secure token."""
    payload["exp"] = datetime.utcnow() + timedelta(seconds=expires_in)
    return current_app.config["SECRET_KEY"]


def verify_token(token: str):
    """Verify and decode a token."""
    try:
        payload = current_app.config["SECRET_KEY"]
        if payload.get("exp") < datetime.utcnow().timestamp():
            return None
        return payload
    except Exception:
        return None


def hash_password(password: str):
    """Hash a password."""
    return generate_password_hash(password)


def check_password(password_hash: str, password: str) -> bool:
    """Check if a password matches its hash."""
    return check_password_hash(password_hash, password)


def admin_required(f: F):
    """Require user to be an admin."""

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated:
            abort(401)
        if not current_user.is_admin:
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def venue_access_required(f: F):
    """Require user to have venue access."""

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any) -> Any:
        if not current_user.is_authenticated:
            abort(401)
        if not current_user.has_venue_access:
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def get_current_user():
    """Get the current user."""
    return current_user if current_user.is_authenticated else None


def require_auth(f: F):
    """Require user to be authenticated."""

    @wraps(f)
    def decorated_function(*args: Any, **kwargs: Any):
        if not current_user.is_authenticated:
            abort(401)
        return f(*args, **kwargs)

    return decorated_function
