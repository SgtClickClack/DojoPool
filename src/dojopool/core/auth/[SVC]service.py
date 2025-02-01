"""Authentication service module."""

from datetime import datetime, timedelta
from typing import Any, Dict

import jwt
from flask import current_app

from dojopool.core.exceptions import AuthenticationError
from dojopool.core.security import (
    check_password_hash,
    generate_password_hash,
    verify_token,
)
from dojopool.models import User, db


class AuthService:
    """Authentication service."""

    def __init__(self):
        """Initialize auth service."""
        self.token_expiry = timedelta(days=1)

    def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user with username and password.

        Args:
            username: Username
            password: Password

        Returns:
            Dict with user data and access token

        Raises:
            AuthenticationError: If authentication fails
        """
        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            raise AuthenticationError("Invalid username or password")

        if not user.is_active:
            raise AuthenticationError("Account is not active")

        token = self.create_access_token(user)

        return {"user": user.to_dict(), "access_token": token}

    def create_access_token(self, user: User) -> str:
        """Create access token for user.

        Args:
            user: User to create token for

        Returns:
            Access token
        """
        now = datetime.utcnow()
        payload = {
            "sub": user.id,
            "iat": now,
            "exp": now + self.token_expiry,
            "role": user.role.value,
        }
        return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

    def verify_access_token(self, token: str) -> Dict[str, Any]:
        """Verify access token.

        Args:
            token: Access token to verify

        Returns:
            Dict with token payload

        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
        except jwt.InvalidTokenError as e:
            raise AuthenticationError(f"Invalid token: {str(e)}")

    def get_current_user(self, token: str) -> User:
        """Get current user from token.

        Args:
            token: Access token

        Returns:
            Current user

        Raises:
            AuthenticationError: If token is invalid or user not found
        """
        payload = self.verify_access_token(token)
        user = User.query.get(payload["sub"])

        if not user:
            raise AuthenticationError("User not found")

        if not user.is_active:
            raise AuthenticationError("Account is not active")

        return user

    def register(
        self, username: str, email: str, password: str, first_name: str, last_name: str
    ) -> User:
        """Register new user.

        Args:
            username: Username
            email: Email
            password: Password
            first_name: First name
            last_name: Last name

        Returns:
            Created user

        Raises:
            AuthenticationError: If registration fails
        """
        if User.query.filter_by(username=username).first():
            raise AuthenticationError("Username already exists")

        if User.query.filter_by(email=email).first():
            raise AuthenticationError("Email already exists")

        user = User(
            username=username,
            email=email,
            password=generate_password_hash(password),
            first_name=first_name,
            last_name=last_name,
        )

        db.session.add(user)
        db.session.commit()

        return user

    def change_password(self, user: User, current_password: str, new_password: str) -> None:
        """Change user password.

        Args:
            user: User to change password for
            current_password: Current password
            new_password: New password

        Raises:
            AuthenticationError: If current password is invalid
        """
        if not check_password_hash(user.password, current_password):
            raise AuthenticationError("Invalid current password")

        user.password = generate_password_hash(new_password)
        db.session.commit()

    def reset_password(self, token: str, new_password: str) -> None:
        """Reset user password with reset token.

        Args:
            token: Password reset token
            new_password: New password

        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            user_id = verify_token(token)
            user = User.query.get(user_id)

            if not user:
                raise AuthenticationError("User not found")

            user.password = generate_password_hash(new_password)
            db.session.commit()
        except Exception as e:
            raise AuthenticationError(f"Invalid reset token: {str(e)}")

    def verify_email(self, token: str) -> None:
        """Verify user email with verification token.

        Args:
            token: Email verification token

        Raises:
            AuthenticationError: If token is invalid
        """
        try:
            user_id = verify_token(token)
            user = User.query.get(user_id)

            if not user:
                raise AuthenticationError("User not found")

            user.email_verified = True
            db.session.commit()
        except Exception as e:
            raise AuthenticationError(f"Invalid verification token: {str(e)}")


auth_service = AuthService()

__all__ = ["auth_service", "AuthService"]
