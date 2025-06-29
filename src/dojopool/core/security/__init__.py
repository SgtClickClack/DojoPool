"""Security package for DojoPool."""

from .session import SessionManager
from werkzeug.security import generate_password_hash, check_password_hash
from itsdangerous import URLSafeTimedSerializer
from flask import current_app, request, jsonify, session, g
from functools import wraps
import jwt
import base64
import json

def generate_password_hash_with_method(password, method='pbkdf2:sha256', salt_length=16):
    """Generate a password hash using the specified method and salt length."""
    return generate_password_hash(password, method=method, salt_length=salt_length)

def check_password(hashed_password, password):
    """Check a password against its hash."""
    return check_password_hash(hashed_password, password)

def generate_reset_token(user_id, expires_sec=3600):
    """Generate a password reset token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='password-reset-salt')

def verify_reset_token(token, expires_sec=3600):
    """Verify a password reset token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = serializer.loads(
            token, salt='password-reset-salt', max_age=expires_sec
        )
        return user_id
    except:
        return None

def decode_jwt_token(token):
    """Decode a JWT token without verification (for development)."""
    try:
        # Split the token into parts
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        
        # Decode base64
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded.decode('utf-8'))
    except Exception as e:
        current_app.logger.error(f"Error decoding JWT token: {e}")
        return None

# --- Authentication Decorators ---
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # For development, always allow access with a mock user
        if current_app.config.get('ENV') == 'development':
            g.user_id = 1  # Mock user ID for development
            current_app.logger.info("DEBUG: Using mock user_id for development")
            return f(*args, **kwargs)
        
        # First try Flask-Login session
        user_id = session.get('user_id')
        if user_id:
            g.user_id = user_id
            return f(*args, **kwargs)
        
        # Then try JWT token (for development, accept any valid JWT)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                # For development, just decode the JWT without verification
                decoded_token = decode_jwt_token(token)
                current_app.logger.info(f"DEBUG: Decoded token: {decoded_token}")
                
                if decoded_token:
                    # Try to get user_id from various possible fields
                    user_id = decoded_token.get('user_id') or decoded_token.get('sub') or decoded_token.get('uid')
                    
                    if user_id:
                        g.user_id = user_id
                        current_app.logger.info(f"DEBUG: Set g.user_id to {user_id}")
                        return f(*args, **kwargs)
                    else:
                        current_app.logger.warning("DEBUG: No user_id found in token")
                else:
                    current_app.logger.warning("DEBUG: Failed to decode token")
            except Exception as e:
                current_app.logger.error(f"DEBUG: Error processing token: {e}")
        
        return {"error": "Authentication required"}, 401
    
    return decorated

def require_roles(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user_roles = session.get('roles', [])
            if not any(role in user_roles for role in roles):
                return {'error': 'Insufficient role permissions'}, 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# --- Session Management ---
session_manager = SessionManager()

# This file makes the 'security' directory a Python package

__all__ = [
    'SessionManager',
    'generate_password_hash_with_method',
    'check_password',
    'generate_reset_token',
    'verify_reset_token',
    'require_auth',
    'require_roles',
]
