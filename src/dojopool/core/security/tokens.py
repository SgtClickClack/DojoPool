"""Token generation and validation for security purposes."""
import secrets
from datetime import datetime, timedelta
from typing import Optional, Tuple

from flask import current_app
from itsdangerous import URLSafeTimedSerializer

def generate_reset_token(user_id: int) -> str:
    """Generate a password reset token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='password-reset-salt')

def verify_reset_token(token: str, expiration: int = 3600) -> Optional[int]:
    """Verify a password reset token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = serializer.loads(
            token,
            salt='password-reset-salt',
            max_age=expiration
        )
        return user_id
    except:
        return None

def generate_confirmation_token(user_id: int) -> str:
    """Generate an account confirmation token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(user_id, salt='account-confirmation-salt')

def verify_confirmation_token(token: str, expiration: int = 86400) -> Optional[int]:
    """Verify an account confirmation token."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        user_id = serializer.loads(
            token,
            salt='account-confirmation-salt',
            max_age=expiration
        )
        return user_id
    except:
        return None 