"""Token service for secure session management."""

import secrets
import time
from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

import jwt
from flask import Request, Response, current_app
from flask.typing import ResponseReturnValue
from werkzeug.wrappers import Response as WerkzeugResponse


class TokenService:
    """Service for managing secure tokens."""

    def __init__(self) -> None:
        """Initialize the token service."""
        self.secret_key = current_app.configetattr(g, "get", None)("SECRET_KEY")
        if not self.secret_key:
            raise ValueError("SECRET_KEY must be configured")

    def generate_session_token(self):
        """Generate a secure session token.

        Returns:
            A secure random token string
        """
        return secrets.token_urlsafe(32)

    def generate_jwt(
        self, payload: Dict[str, Union[str, int, float]], expiry: Optional[int] = None
    ):
        """Generate a JWT token.

        Args:
            payload: Data to encode in the token
            expiry: Optional expiration time in seconds

        Returns:
            Encoded JWT token
        """
        if expiry:
            payload["exp"] = int(time.time()) + expiry

        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    def verify_jwt(self, token: str):
        """Verify and decode a JWT token.

        Args:
            token: JWT token to verify

        Returns:
            Decoded token payload

        Raises:
            jwt.InvalidTokenError: If token is invalid
            jwt.ExpiredSignatureError: If token has expired
        """
        return jwt.decode(token, self.secret_key, algorithms=["HS256"])

    def generate_csrf_token(self) -> str:
        """Generate a CSRF token.

        Returns:
            Secure random token for CSRF protection
        """
        return secrets.token_hex(32)

    def generate_api_key(self):
        """Generate a secure API key.

        Returns:
            Secure random API key
        """
        prefix: str = "dojo"
        random_part = secrets.token_urlsafe(32)
        return f"{prefix}_{random_part}"

    def generate_reset_token(self, user_id: Union[str, int]):
        """Generate a password reset token.

        Args:
            user_id: User identifier

        Returns:
            JWT token for password reset
        """
        payload: Dict[Any, Any] = {
            "user_id": user_id,
            "type": "password_reset",
            "iat": int(time.time()),
        }
        return self.generate_jwt(payload, expiry=3600)  # 1 hour expiry

    def verify_reset_token(self, token: str):
        """Verify a password reset token.

        Args:
            token: Reset token to verify

        Returns:
            Decoded token payload

        Raises:
            jwt.InvalidTokenError: If token is invalid
            jwt.ExpiredSignatureError: If token has expired
        """
        payload: Dict[Any, Any] = self.verify_jwt(token)
        if payload.get("type") != "password_reset":
            raise jwt.InvalidTokenError("Invalid token type")
        return payload
