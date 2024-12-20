"""Authentication and security utilities."""

import jwt
from datetime import datetime, timedelta
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash

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
    payload['exp'] = exp
    
    # Add issued at time
    payload['iat'] = datetime.utcnow()
    
    # Generate token
    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    return token

def verify_token(token):
    """Verify and decode a JWT token.
    
    Args:
        token (str): JWT token to verify
    
    Returns:
        dict: Decoded token payload
        
    Raises:
        jwt.InvalidTokenError: If token is invalid
    """
    return jwt.decode(
        token,
        current_app.config['JWT_SECRET_KEY'],
        algorithms=['HS256']
    )

def hash_password(password):
    """Hash a password.
    
    Args:
        password (str): Password to hash
    
    Returns:
        str: Hashed password
    """
    return generate_password_hash(password)

def verify_password(password_hash, password):
    """Verify a password against its hash.
    
    Args:
        password_hash (str): Hashed password
        password (str): Password to verify
    
    Returns:
        bool: True if password matches hash
    """
    return check_password_hash(password_hash, password)

def generate_reset_token(user_id):
    """Generate a password reset token.
    
    Args:
        user_id (int): ID of user requesting reset
    
    Returns:
        str: Reset token
    """
    payload = {
        'type': 'reset',
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return generate_token(payload)

def verify_reset_token(token):
    """Verify a password reset token.
    
    Args:
        token (str): Reset token to verify
    
    Returns:
        int: User ID from token if valid
        
    Raises:
        jwt.InvalidTokenError: If token is invalid
    """
    payload = verify_token(token)
    if payload.get('type') != 'reset':
        raise jwt.InvalidTokenError('Invalid token type')
    return payload['user_id'] 