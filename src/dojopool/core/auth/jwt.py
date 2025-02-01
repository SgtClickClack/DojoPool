import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import jwt

from ..utils.redis import RedisCache

# Constants
JWT_SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Redis cache for token blacklisting
redis_cache = RedisCache()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a new JWT access token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "access"})

    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """
    Create a new JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})

    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify a JWT token and return its payload
    Raises jwt.InvalidTokenError if token is invalid
    """
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Check if token is blacklisted
        if is_token_blacklisted(token):
            raise jwt.InvalidTokenError("Token has been blacklisted")

        return payload

    except jwt.ExpiredSignatureError:
        raise jwt.InvalidTokenError("Token has expired")
    except jwt.InvalidTokenError:
        raise jwt.InvalidTokenError("Invalid token")


async def blacklist_token(token: str, expires_in: int = None) -> bool:
    """
    Add a token to the blacklist
    """
    try:
        # Decode token without verification to get expiration time
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get("exp")

        if not expires_in and exp:
            # Calculate remaining time until token expiration
            exp_datetime = datetime.fromtimestamp(exp)
            remaining = (exp_datetime - datetime.utcnow()).total_seconds()
            expires_in = int(remaining) if remaining > 0 else 3600  # Default to 1 hour if expired

        # Add token to blacklist with expiration
        return await redis_cache.set(f"blacklist:{token}", "1", expire=expires_in or 3600)
    except Exception:
        return False


async def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted
    """
    try:
        return await redis_cache.exists(f"blacklist:{token}")
    except Exception:
        return False


def create_tokens_for_user(user_id: str, additional_claims: dict = None) -> tuple[str, str]:
    """
    Create both access and refresh tokens for a user
    """
    claims = {"sub": str(user_id)}
    if additional_claims:
        claims.update(additional_claims)

    access_token = create_access_token(claims)
    refresh_token = create_refresh_token(claims)

    return access_token, refresh_token


async def refresh_access_token(refresh_token: str) -> Optional[str]:
    """
    Create a new access token using a refresh token
    """
    try:
        payload = verify_token(refresh_token)

        # Verify this is a refresh token
        if payload.get("type") != "refresh":
            raise jwt.InvalidTokenError("Not a refresh token")

        # Create new access token
        user_id = payload.get("sub")
        if not user_id:
            raise jwt.InvalidTokenError("Invalid user ID in token")

        # Remove type and exp claims for new token
        claims = payload.copy()
        claims.pop("type", None)
        claims.pop("exp", None)
        claims.pop("iat", None)

        return create_access_token(claims)

    except jwt.InvalidTokenError:
        return None


def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Get the expiration datetime of a token
    """
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get("exp")
        return datetime.fromtimestamp(exp) if exp else None
    except Exception:
        return None
