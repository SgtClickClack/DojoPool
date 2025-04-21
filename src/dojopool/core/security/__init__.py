"""Security package for DojoPool."""

from .session import SessionManager
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask import current_app, request, jsonify, session, g
from functools import wraps

def generate_password_hash_with_method(password, method='pbkdf2:sha256', salt_length=16):
    """Generate a password hash using the specified method and salt length."""
    return generate_password_hash(password, method=method, salt_length=salt_length)

def check_password(hashed_password, password):
    """Check a password against its hash."""
    return check_password_hash(hashed_password, password)

def generate_reset_token(user_id, expires_sec=3600):
    """Generate a secure token for password reset."""
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return s.dumps({'user_id': user_id})

def verify_reset_token(token, expires_sec=3600):
    """Verify a password reset token and return the user_id if valid, else None."""
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_data = s.loads(token, max_age=expires_sec)
        return user_data['user_id']
    except Exception:
        return None

# --- Authentication Decorators ---
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated

def require_roles(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_roles = session.get('roles', [])
            if not any(role in user_roles for role in roles):
                return jsonify({'error': 'Insufficient role permissions'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# This file makes the 'security' directory a Python package
