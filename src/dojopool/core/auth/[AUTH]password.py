"""Password management module.

This module handles password validation and reset functionality.
"""

import re
from datetime import datetime, timedelta
from typing import List, Optional

from flask import current_app, render_template
from flask_mail import Message

from ..extensions import db, mail
from .jwt import jwt_manager
from .models import User


class PasswordManager:
    """Password management service."""

    def __init__(self):
        self.reset_token_lifetime = timedelta(hours=1)

    def validate_password(self, password: str) -> List[str]:
        """Validate password against requirements.

        Args:
            password: Password to validate

        Returns:
            List of validation errors, empty if valid
        """
        errors = []

        # Check length
        min_length = current_app.config["PASSWORD_MIN_LENGTH"]
        if len(password) < min_length:
            errors.append(f"Password must be at least {min_length} characters long")

        # Check uppercase
        if current_app.config["PASSWORD_REQUIRE_UPPERCASE"]:
            if not re.search(r"[A-Z]", password):
                errors.append("Password must contain at least one uppercase letter")

        # Check lowercase
        if current_app.config["PASSWORD_REQUIRE_LOWERCASE"]:
            if not re.search(r"[a-z]", password):
                errors.append("Password must contain at least one lowercase letter")

        # Check numbers
        if current_app.config["PASSWORD_REQUIRE_NUMBERS"]:
            if not re.search(r"\d", password):
                errors.append("Password must contain at least one number")

        # Check special characters
        if current_app.config["PASSWORD_REQUIRE_SPECIAL"]:
            if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
                errors.append("Password must contain at least one special character")

        return errors

    def initiate_reset(self, email: str) -> Optional[str]:
        """Initiate password reset process.

        Args:
            email: User's email address

        Returns:
            Reset token if user exists, None otherwise
        """
        user = User.query.filter_by(email=email).first()

        if not user:
            return None

        # Generate reset token
        token = jwt_manager.create_tokens(user.id, {"purpose": "password_reset"})[
            0
        ]  # Use access token for reset

        # Send reset email
        msg = Message(
            "Password Reset Request",
            sender=current_app.config["MAIL_DEFAULT_SENDER"],
            recipients=[user.email],
        )

        reset_url = current_app.config["PASSWORD_RESET_URL"].format(token=token)

        msg.body = render_template(
            "email/reset_password.txt",
            user=user,
            reset_url=reset_url,
            expires_in=self.reset_token_lifetime,
        )

        msg.html = render_template(
            "email/reset_password.html",
            user=user,
            reset_url=reset_url,
            expires_in=self.reset_token_lifetime,
        )

        mail.send(msg)

        return token

    def complete_reset(self, token: str, new_password: str) -> bool:
        """Complete password reset process.

        Args:
            token: Reset token
            new_password: New password

        Returns:
            True if reset successful

        Raises:
            jwt.InvalidTokenError: If token is invalid
            ValueError: If password is invalid
        """
        # Verify token
        try:
            claims = jwt_manager.verify_token(token, "access")
            if claims.get("purpose") != "password_reset":
                raise jwt.InvalidTokenError("Invalid token purpose")
        except jwt.InvalidTokenError:
            return False

        # Get user
        user = User.query.get(claims["sub"])
        if not user:
            return False

        # Validate new password
        errors = self.validate_password(new_password)
        if errors:
            raise ValueError(errors[0])

        # Update password
        user.password = new_password
        user.password_changed_at = datetime.utcnow()

        # Invalidate all sessions
        user.sessions.delete()

        db.session.commit()

        return True


# Global instance
password_manager = PasswordManager()
