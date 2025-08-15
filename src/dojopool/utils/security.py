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
from typing import Any, Dict, Optional, Tuple, Union

import jwt
from cryptography.fernet import Fernet
from flask import abort, current_app, request, session
from itsdangerous import URLSafeTimedSerializer
from itsdangerous.exc import BadData, BadSignature, SignatureExpired

from dojopool.config import BaseConfig


def generate_token(user_id: int, token_type: str, expires_in: int = 3600, **extra: Any) -> str:
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
    return jwt.encode(payload, BaseConfig.SECRET_KEY, algorithm="HS256")


def verify_token(token: str, expected_type: str) -> Optional[Union[int, Dict[str, Any]]]:
    """Verify and decode a JWT token.

    Args:
        token: JWT token to verify.
        expected_type: Expected token type.

    Returns:
        Optional[Union[int, Dict[str, Any]]]: User ID or token data if valid,
            None otherwise.
    """
    try:
        payload = jwt.decode(token, BaseConfig.SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return None

    # Check token type
    if payload.get("type") != expected_type:
        return None

    # Check expiration
    if datetime.utcnow() > datetime.fromtimestamp(payload["exp"]):
        return None

    # Return user_id for simple tokens or full payload for complex ones
    if len(payload) == 5:  # Basic token with standard claims
        return payload["user_id"]
    return payload


def generate_csrf_token() -> str:
    """
    Generate a CSRF token.

    Returns:
        A secure CSRF token string
    """
    if "csrf_token" not in session:
        session["csrf_token"] = generate_secure_token()
    return session["csrf_token"]


def validate_csrf_token(token: str) -> bool:
    """
    Validate a CSRF token.

    Args:
        token: The token to validate

    Returns:
        True if valid, False otherwise
    """
    return hmac.compare_digest(token, session.get("csrf_token", ""))


def csrf_protect():
    """CSRF protection decorator"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
                token = request.headers.get("X-CSRF-Token")
                if not token or not validate_csrf_token(token):
                    abort(403)
            return f(*args, **kwargs)

        return decorated_function

    return decorator


def generate_secure_token(data, expires_in=3600):
    """
    Generate a secure token for data
    :param data: Data to encode in token
    :param expires_in: Token expiration time in seconds
    :return: Secure token
    """
    serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
    return serializer.dumps(data, salt=current_app.config.get("SECURITY_SALT", "secure-salt"))


def verify_secure_token(token, max_age=3600):
    """
    Verify a secure token
    :param token: Token to verify
    :param max_age: Maximum age of token in seconds
    :return: Decoded data if valid, None otherwise
    """
    try:
        serializer = URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
        return serializer.loads(
            token, salt=current_app.config.get("SECURITY_SALT", "secure-salt"), max_age=max_age
        )
    except (SignatureExpired, BadSignature, BadData):
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
    expected = hmac.new(secret.encode(), data.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)


def generate_secure_token(length: int = 32) -> str:
    """
    Generate a secure random token.

    Args:
        length: Length of the token to generate

    Returns:
        A secure random token string
    """
    return secrets.token_urlsafe(length)


def hash_token(token: Optional[str]) -> str:
    """Hash a token using SHA-256."""
    if token is None:
        return ""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, token_hash: str) -> bool:
    """
    Verify a token against its hash
    """
    return hmac.compare_digest(hash_token(token), token_hash)


def encrypt_data(data: str) -> Tuple[str, str]:
    """
    Encrypt sensitive data using Fernet
    """
    key = Fernet.generate_key()
    f = Fernet(key)
    encrypted_data = f.encrypt(data.encode())
    return base64.urlsafe_b64encode(encrypted_data).decode(), base64.urlsafe_b64encode(key).decode()


def decrypt_data(encrypted_data: str, key: str) -> str:
    """
    Decrypt sensitive data using Fernet
    """
    f = Fernet(base64.urlsafe_b64decode(key.encode()))
    decrypted_data = f.decrypt(base64.urlsafe_b64decode(encrypted_data.encode()))
    return decrypted_data.decode()


def generate_fingerprint(device_info: dict) -> str:
    """
    Generate a unique device fingerprint
    """
    fingerprint_data = "|".join(
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


def hash_password(password: str, salt: str = None) -> Tuple[str, str]:
    """
    Hash a password using PBKDF2
    """
    if not salt:
        salt = os.urandom(16)

    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000, dklen=32)

    return base64.b64encode(key).decode(), base64.b64encode(salt).decode()


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    """
    Verify a password against its hash
    """
    salt = base64.b64decode(salt.encode())
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000, dklen=32)

    return hmac.compare_digest(base64.b64encode(key).decode(), password_hash)


def generate_api_key() -> Tuple[str, str]:
    """
    Generate an API key and its hash
    """
    api_key = f"dp_{base64.urlsafe_b64encode(os.urandom(32)).decode('utf-8')}"
    api_key_hash = hash_token(api_key)
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


def rate_limit_key(user_id: str, action: str) -> str:
    """
    Generate a rate limit key
    """
    return f"rate_limit:{user_id}:{action}"


def is_rate_limited(user_id: str, action: str, max_attempts: int, window: timedelta) -> bool:
    """
    Check if an action is rate limited
    """
    rate_limit_key(user_id, action)
    datetime.utcnow()

    # Implementation would depend on your caching system
    # This is a placeholder for the logic
    return False


def log_security_event(event_type: str, user_id: str, details: dict) -> None:
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
    """Encrypt a token using PBKDF2."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", key.encode(), salt, 100000)
    encrypted = base64.b64encode(salt + key).decode("utf-8")
    return encrypted


def decrypt_token(encrypted_token: str, key: str) -> str:
    """Decrypt a token using PBKDF2."""
    try:
        decoded = base64.b64decode(encrypted_token.encode())
        salt = decoded[:16]
        key = hashlib.pbkdf2_hmac("sha256", key.encode(), salt, 100000)
        return base64.b64encode(key).decode("utf-8")
    except Exception:
        return ""
