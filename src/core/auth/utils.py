from itsdangerous import URLSafeTimedSerializer
from flask import current_app
from functools import wraps
from flask_login import current_user
import jwt
from datetime import datetime, timedelta
from flask import request, jsonify
from src.core.models import User

def generate_confirmation_token(email):
    """Generate email confirmation token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt=current_app.config['SECURITY_PASSWORD_SALT'])

def confirm_token(token, expiration=3600):
    """Confirm email token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(
            token,
            salt=current_app.config['SECURITY_PASSWORD_SALT'],
            max_age=expiration
        )
        return email
    except:
        return False

def generate_reset_token(user_id):
    """Generate password reset token."""
    return jwt.encode(
        {
            'reset_password': user_id,
            'exp': datetime.utcnow() + timedelta(hours=24)
        },
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

def verify_reset_token(token):
    """Verify password reset token."""
    try:
        data = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        return data.get('reset_password')
    except:
        return None

def verify_jwt_token(token):
    """Verify JWT token."""
    try:
        data = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        return data.get('user_id')
    except:
        return None

def get_token_from_header():
    """Extract token from Authorization header."""
    auth_header = request.headers.get('Authorization')
    if auth_header:
        try:
            return auth_header.split(' ')[1]
        except IndexError:
            return None
    return None 

def generate_token(user):
    """Generate a JWT token for the user."""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'is_admin': user.is_admin,
        'exp': datetime.utcnow() + timedelta(days=1)  # Extend token expiry for testing
    }
    return jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

def decode_token(token):
    """Decode JWT token and return payload."""
    try:
        return jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid token format'
                }), 401
        
        if not token:
            return jsonify({
                'status': 'error',
                'message': 'Token is missing'
            }), 401
            
        # Decode token
        payload = decode_token(token)
        if not payload:
            return jsonify({
                'status': 'error',
                'message': 'Token is invalid or expired'
            }), 401
        
        # Get user from token
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 401
            
        if not user.is_active:
            return jsonify({
                'status': 'error',
                'message': 'User account is deactivated'
            }), 401
        
        return f(user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    """Decorator to require admin privileges."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({
                    'status': 'error',
                    'message': 'Invalid token format'
                }), 401
        
        if not token:
            return jsonify({
                'status': 'error',
                'message': 'Token is missing'
            }), 401
            
        # Decode token
        payload = decode_token(token)
        if not payload:
            return jsonify({
                'status': 'error',
                'message': 'Token is invalid or expired'
            }), 401
        
        # Get user from token
        user = User.query.get(payload['user_id'])
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 401
            
        # Check admin status
        if not user.is_admin:
            return jsonify({
                'status': 'error',
                'message': 'Admin privileges required'
            }), 403
            
        if not user.is_active:
            return jsonify({
                'status': 'error',
                'message': 'User account is deactivated'
            }), 401
        
        return f(user, *args, **kwargs)
    
    return decorated 