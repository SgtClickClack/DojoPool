"""Authentication utilities."""

from datetime import datetime, timedelta
from functools import wraps
from urllib.parse import urljoin, urlparse

import jwt
from flask import current_app, jsonify, request, url_for, abort
from flask_login import current_user
from werkzeug.security import check_password_hash, generate_password_hash


def is_safe_url(target):
    """Check if the URL is safe to redirect to."""
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ("http", "https") and ref_url.netloc == test_url.netloc


def get_safe_redirect_url():
    """Get safe URL to redirect to after login."""
    url = request.args.get("next")
    if url and is_safe_url(url):
        return url
    return url_for("main.index")


def verified_user_required(f):
    """Decorator to require a verified user."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
        if not current_user.is_verified:
            return jsonify({"error": "Email verification required"}), 403
        return f(*args, **kwargs)

    return decorated_function


def generate_token(payload, expires_in=3600):
    """Generate a JWT token.

    Args:
        payload (dict): Data to encode in the token
        expires_in (int): Token expiration time in seconds

    Returns:
        str: Encoded JWT token
    """
    # Add expiration time to payload
    exp = datetime.utcnow() + timedelta(seconds=expires_in)
    payload["exp"] = exp

    # Add issued at time
    payload["iat"] = datetime.utcnow()

    # Generate token
    token = jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")

    return token


def verify_token(token):
    """Verify a JWT token.

    Args:
        token (str): Token to verify

    Returns:
        dict: Token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def hash_password(password):
    """Hash a password."""
    return generate_password_hash(password)


def check_password(password_hash, password):
    """Check if a password matches its hash."""
    return check_password_hash(password_hash, password)


def verify_password(user, password):
    """Verify a user's password."""
    return user.check_password(password)


def admin_required(f):
    """Require admin role for view."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.has_role("admin"):
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def venue_access_required(f):
    """Require venue access for view."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.has_role("venue_manager"):
            abort(403)
        return f(*args, **kwargs)

    return decorated_function


def get_current_user():
    """Get current user."""
    return current_user if current_user.is_authenticated else None


def require_auth(f):
    """Require authentication for view."""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            abort(401)
        return f(*args, **kwargs)

    return decorated_function


def require_admin(f):
    """Require admin role for view."""
    return admin_required(f)


def require_venue_access(f):
    """Require venue access for view."""
    return venue_access_required(f)
