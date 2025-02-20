"""Secure JWT implementation using PyJWT."""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional

import jwt
from jwt.exceptions import InvalidTokenError

from dojopool.core.config import settings

from ..utils.redis import RedisCache

# Constants
JWT_SECRET_KEY = settings.SECRET_KEY
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Redis cache for token blacklisting
redis_cache = RedisCache()


class JWTManager:
    """Secure JWT token manager using PyJWT."""

    def __init__(
        self,
        secret_key: str = settings.SECRET_KEY,
        algorithm: str = "HS256",
        access_token_expire_minutes: int = 30,
        refresh_token_expire_days: int = 7,
    ):
        """Initialize the JWT manager."""
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days

    def _create_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create a JWT token with the given data and expiration."""
        to_encode = data.copy()

        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)

        to_encode.update(
            {
                "exp": expire,
                "iat": datetime.utcnow(),
                "type": data.get("type", "access"),
            }
        )

        return jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)

    def create_access_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ):
        """Create an access token."""
        if expires_delta is None:
            expires_delta = timedelta(minutes=self.access_token_expire_minutes)

        data["type"] = "access"
        return self._create_token(data, expires_delta)

    def create_refresh_token(
        self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None
    ):
        """Create a refresh token."""
        if expires_delta is None:
            expires_delta = timedelta(days=self.refresh_token_expire_days)

        data["type"] = "refresh"
        return self._create_token(data, expires_delta)

    def decode_token(self, token: str):
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "require": ["exp", "iat", "type"],
                },
            )
            return payload
        except InvalidTokenError as e:
            raise ValueError(f"Invalid token: {str(e)}")

    def refresh_access_token(self, refresh_token: str) -> str:
        """Create a new access token from a refresh token."""
        try:
            payload = self.decode_token(refresh_token)
            if payload["type"] != "refresh":
                raise ValueError("Invalid token type")

            # Create new access token without refresh token specific data
            data = payload.copy()
            data.pop("exp", None)
            data.pop("iat", None)
            data.pop("type", None)

            return self.create_access_token(data)
        except (InvalidTokenError, ValueError) as e:
            raise ValueError(f"Invalid refresh token: {str(e)}")

    def verify_token(self, token: str, token_type: str = "access"):
        """Verify if a token is valid and of the correct type."""
        try:
            payload = self.decode_token(token)
            return payload["type"] == token_type
        except (InvalidTokenError, ValueError):
            return False


def create_tokens_for_user(user_id: str, additional_claims: dict = None):
    """
    Create both access and refresh tokens for a user
    """
    claims = {"sub": str(user_id)}
    if additional_claims:
        claims.update(additional_claims)

    access_token = create_access_token(claims)
    refresh_token = create_refresh_token(claims)

    return access_token, refresh_token


def get_token_expiration(token: str):
    """
    Get the expiration datetime of a token
    """
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get("exp")
        return datetime.fromtimestamp(exp) if exp else None
    except Exception:
        return None
