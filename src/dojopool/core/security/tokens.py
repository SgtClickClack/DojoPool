"""Token generation and verification module."""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

import jwt
from flask import current_app

from ..exceptions import TokenError


def generate_token(
    data: Dict[str, Any],
    expiration: Optional[timedelta] = None,
    secret: Optional[str] = None,
) -> str:
    """Generate a JWT token.

    Args:
        data: Data to encode in the token
        expiration: Optional token expiration time
        secret: Optional secret key for signing

    Returns:
        Encoded JWT token
    """
    if expiration is None:
        expiration = timedelta(days=1)

    payload = {
        **data,
        "exp": datetime.utcnow() + expiration,
        "iat": datetime.utcnow(),
    }

    return jwt.encode(
        payload,
        secret or current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def verify_token(token: str, secret: Optional[str] = None):
    """Verify and decode a JWT token.

    Args:
        token: Token to verify
        secret: Optional secret key for verification

    Returns:
        Decoded token payload

    Raises:
        TokenError: If token is invalid or expired
    """
    try:
        return jwt.decode(
            token,
            secret or current_app.config["SECRET_KEY"],
            algorithms=["HS256"],
        )
    except jwt.ExpiredSignatureError:
        raise TokenError("Token has expired")
    except jwt.InvalidTokenError:
        raise TokenError("Invalid token")


def generate_confirmation_token(user_id: Union[str, int]):
    """Generate a confirmation token for a user.

    Args:
        user_id: ID of the user to confirm

    Returns:
        Confirmation token
    """
    return generate_token(
        {"confirm": str(user_id)},
        expiration=timedelta(days=7),
    )


def verify_confirmation_token(token: str):
    """Verify a confirmation token.

    Args:
        token: Token to verify

    Returns:
        User ID from the token

    Raises:
        TokenError: If token is invalid or expired
    """
    data = verify_token(token)
    return str(data["confirm"])


def generate_reset_token(user_id: Union[str, int]) -> str:
    """Generate a password reset token for a user.

    Args:
        user_id: ID of the user requesting reset

    Returns:
        Reset token
    """
    return generate_token(
        {"reset": str(user_id)},
        expiration=timedelta(hours=1),
    )


def verify_reset_token(token: str):
    """Verify a password reset token.

    Args:
        token: Token to verify

    Returns:
        User ID from the token

    Raises:
        TokenError: If token is invalid or expired
    """
    data = verify_token(token)
    return str(data["reset"])
