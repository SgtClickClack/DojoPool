"""Security utilities module."""

from werkzeug.security import check_password_hash as _check_password_hash
from werkzeug.security import generate_password_hash as _generate_password_hash


def generate_password_hash(password):
    """Generate a password hash."""
    return _generate_password_hash(password)


def check_password_hash(password_hash, password):
    """Check if a password matches its hash."""
    return _check_password_hash(password_hash, password)
