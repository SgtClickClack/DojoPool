"""Security utilities module.

This module provides utility functions for security operations like
token generation and verification.
"""

import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Callable, Dict, Optional, Tuple, TypeVar, Union, cast

import jwt
from cryptography.fernet import Fernet
from flask import abort, current_app, request, session
from itsdangerous import URLSafeTimedSerializer
from itsdangerous.exc import BadData, BadSignature, SignatureExpired

from ..core.config import Config

F = TypeVar("F", bound=Callable[..., Any])

def generate_token(
    user_id: int, token_type: str, expires_in: int = 3600, **extra: Any
) -> str:
    """Generate a secure JWT token.

    Args:
        user_id: User ID to encode in token.
        token_type: Type of token (e.g., 'verify_email', 'reset_password').
        expires_in: Token expiration time in seconds.
        **extra: Additional data to encode in token.

    Returns:
        str: Generated JWT token.
    """
    now = datetime.utcnow()
    payload = {
        "user_id": user_id,
        "type": token_type,
        "exp": now + timedelta(seconds=expires_in),
        "iat": now,
        **extra,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

def verify_token(token: str, expected_type: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        if payload.get("type") != expected_type:
            return None
        return payload
    except jwt.InvalidTokenError:
        return None

def generate_csrf_token() -> str:
    """Generate a CSRF token."""
    if "csrf_token" not in session:
        session["csrf_token"] = secrets.token_urlsafe()
    return session["csrf_token"]

def validate_csrf_token(token: str) -> bool:
    """Validate a CSRF token."""
    return hmac.compare_digest(token, session.get("csrf_token", ""))

def csrf_protect() -> Callable[[F], F]:
    """CSRF protection decorator."""
    def decorator(f: F) -> F:
        @wraps(f)
        def decorated_function(*args: Any, **kwargs: Any) -> Any:
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                token = request.headers.get("X-CSRF-Token")
                if not token or not validate_csrf_token(token):
                    abort(403)
            return f(*args, **kwargs)
        return cast(F, decorated_function)
    return decorator

def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(length)

def verify_secure_token(token: str, max_age: int = 3600) :
    """Verify a secure token.

    Args:
        token: Token to verify.
        max_age: Maximum age of token in seconds.

    Returns:
        Optional[str]: Decoded data if valid, None otherwise.
    """
    serializer: URLSafeTimedSerializer = URLSafeTimedSerializer(str(Config.SECRET_KEY))
    try :
        return cast(str, serializer.loads(token, max_age=max_age))
    except (BadSignature, SignatureExpired, BadData):
        return None

def secure_headers():
    """
    Generate secure headers for responses
    :return: Dictionary of secure headers
    """
    return {
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    }

def verify_signature(signature, data, secret):
    """
    Verify HMAC signature
    :param signature: Signature to verify
    :param data: Original data
    :param secret: Secret key
    :return: True if valid, False otherwise
    """
    expected: Any = hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)

def hash_token(token: str) -> str:
    """Hash a token using SHA-256."""
    return hashlib.sha256(token.encode()).hexdigest()

def verify_token_hash(token: str, token_hash: str) -> bool:
    """Verify a token against its hash."""
    return hmac.compare_digest(hash_token(token), token_hash)

def encrypt_data(data: str) -> Tuple[str, str]:
    """Encrypt sensitive data using Fernet."""
    key = Fernet.generate_key()
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    return (
        base64.urlsafe_b64encode(encrypted_data).decode(),
        base64.urlsafe_b64encode(key).decode(),
    )

def decrypt_data(encrypted_data: str, key: str) -> str:
    """Decrypt sensitive data using Fernet."""
    f = Fernet(base64.urlsafe_b64decode(key.encode()))
    decrypted_data = f.decrypt(base64.urlsafe_b64decode(encrypted_data.encode()))
    return decrypted_data.decode()

def generate_fingerprint(device_info: dict) :
    """
    Generate a unique device fingerprint
    """
    fingerprint_data: Any = "|".join(
        [
            str(device_info.get("device_id", "")),
            str(device_info.get("platform", "")),
            str(device_info.get("os_version", "")),
            str(device_info.get("app_version", "")),
        ]
    )
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()

def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    """
    if len(password) < 12:
        return False, "Password must be at least 12 characters long"

    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"

    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"

    return True, "Password meets strength requirements"

def generate_totp_secret() -> str:
    """
    Generate a secret for TOTP-based 2FA
    """
    return base64.b32encode(os.urandom(20)).decode("utf-8")

def hash_password(password: str, salt: Optional[str] = None) -> Tuple[str, str]:
    """Hash a password using PBKDF2.

    Args:
        password: Password to hash.
        salt: Optional salt, generated if not provided.

    Returns:
        Tuple[str, str]: (password_hash, salt)
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    password_bytes: Any = password.encode('utf-8')
    salt_bytes: Any = salt.encode('utf-8')
    
    hash_bytes: Any = hashlib.pbkdf2_hmac(
        'sha256',
        password_bytes,
        salt_bytes,
        100000
    )
    
    password_hash: Any = base64.b64encode(hash_bytes).decode('utf-8')
    return password_hash, salt

def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """Verify a password against its hash.

    Args:
        password: Password to verify.
        password_hash: Stored password hash.
        salt: Salt used in hashing.

    Returns:
        bool: True if password matches, False otherwise.
    """
    password_bytes: Any = password.encode('utf-8')
    salt_bytes: Any = salt.encode('utf-8')
    
    hash_bytes: Any = hashlib.pbkdf2_hmac(
        'sha256',
        password_bytes,
        salt_bytes,
        100000
    )
    
    computed_hash: Any = base64.b64encode(hash_bytes).decode('utf-8')
    return hmac.compare_digest(password_hash, computed_hash)

def generate_api_key() -> Tuple[str, str]:
    """
    Generate an API key and its hash
    """
    api_key = f"dp_{base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')}"
    api_key_hash: hash_token = hash_token(api_key)
    return api_key, api_key_hash

def sanitize_input(input_str: str) -> str:
    """
    Sanitize user input to prevent XSS
    """
    return input_str.replace("<", "&lt;").replace(">", "&gt;")

def verify_csrf_token(token: str, session_token: str) -> bool:
    """
    Verify a CSRF token
    """
    return hmac.compare_digest(token, session_token)

def rate_limit_key(user_id: str, action: str) :
    """
    Generate a rate limit key
    """
    return f"rate_limit:{user_id}:{action}"

def is_rate_limited(
    user_id: str, action: str, max_attempts: int, window: timedelta
) :
    """
    Check if an action is rate limited
    """
    rate_limit_key(user_id, action)
    datetime.utcnow()

    # Implementation would depend on your caching system
    # This is a placeholder for the logic
    return False

def log_security_event(event_type: str, user_id: str, details: dict) :
    """
    Log a security event
    """
    {
        "event_type": event_type,
        "user_id": user_id,
        "details": details,
        "timestamp": datetime.utcnow(),
        "ip_address": details.get("ip_address"),
        "user_agent": details.get("user_agent"),
    }

    # Implementation would depend on your logging system
    # This is a placeholder for the logic
    pass

def encrypt_token(token: str, key: str) -> str:
    """Encrypt a token using Fernet.

    Args:
        token: Token to encrypt.
        key: Encryption key.

    Returns:
        str: Encrypted token.
    """
    f: Fernet = Fernet(key.encode('utf-8'))
    encrypted = f.encrypt(token.encode('utf-8'))
    return base64.b64encode(encrypted).decode('utf-8')

def decrypt_token(encrypted_token: str, key: str) -> str:
    """Decrypt a token using Fernet.

    Args:
        encrypted_token: Encrypted token.
        key: Encryption key.

    Returns:
        str: Decrypted token.
    """
    f: Fernet = Fernet(key.encode('utf-8'))
    encrypted_bytes = base64.b64decode(encrypted_token.encode('utf-8'))
    decrypted: Any = f.decrypt(encrypted_bytes)
    return decrypted.decode('utf-8')

def create_session_token(
    user_id: int,
    device_info: Dict[str, Any],
    ip_address: str,
    duration: Optional[timedelta] = None,
) -> Tuple[str, datetime]:
    """Create a new session token."""
    token = generate_secure_token()
    expires_at = datetime.utcnow() + (duration or timedelta(days=7))
    return token, expires_at
