"""Authentication decorators."""
from functools import wraps
from flask import request, jsonify, current_app
from flask_login import current_user
import redis
from src.models import Token, Venue

def get_redis_client():
    """Get Redis client based on application config."""
    if current_app.config.get('TESTING'):
        return None
    return redis.from_url(current_app.config.get('REDIS_URL', 'redis://localhost:6379/0'))

def login_required(f):
    """Require user to be logged in."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    """Require user to be an admin."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        if not current_user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def token_required(f):
    """Require valid token."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Token required'}), 401
        
        try:
            token_type, token = auth_header.split(' ')
            if token_type.lower() != 'bearer':
                return jsonify({'error': 'Invalid token type'}), 401
            
            # Check token blacklist if Redis is available
            redis_client = get_redis_client()
            if redis_client and redis_client.get(f'blacklist:{token}'):
                return jsonify({'error': 'Token has been revoked'}), 401
            
            token_obj = Token.verify_token(token)
            if not token_obj:
                return jsonify({'error': 'Invalid token'}), 401
            
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 401
    return decorated_function

def moderator_required(f):
    """Require user to be a moderator."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        if not current_user.is_moderator:
            return jsonify({'error': 'Moderator privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

def venue_owner_required(f):
    """Require user to be the owner of the venue."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        
        venue_id = kwargs.get('venue_id') or request.view_args.get('venue_id')
        if not venue_id:
            return jsonify({'error': 'Venue ID required'}), 400
        
        venue = Venue.query.get(venue_id)
        if not venue:
            return jsonify({'error': 'Venue not found'}), 404
        
        if venue.owner_id != current_user.id and not current_user.is_admin:
            return jsonify({'error': 'You must be the venue owner to perform this action'}), 403
        
        return f(*args, **kwargs)
    return decorated_function 