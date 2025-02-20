"""Authentication resources module.

This module provides API resources for authentication operations.
"""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Request, Response, current_app, request
from flask.typing import ResponseReturnValue
from flask_login import current_user, login_user, logout_user
from marshmallow import Schema, fields, validate
from werkzeug.wrappers import Response as WerkzeugResponse

from dojopool.core.exceptions import AuthenticationError, ValidationError
from dojopool.core.security import (
    generate_password_hash_with_method,
    generate_reset_token,
    verify_password_hash,
    verify_reset_token,
)
from dojopool.core.security.tokens import generate_confirmation_token
from dojopool.database import db
from dojopool.models.user import User

from .base import BaseResource


class LoginSchema(Schema):
    """Schema for login data validation."""

    email = fields.Email(required=True)
    password = fields.String(required=True)
    remember = fields.Boolean(missing=False)


class RegisterSchema(Schema):
    """Schema for registration data validation."""

    email = fields.Email(required=True)
    password = fields.String(
        required=True,
        validate=[validate.Length(min=8, max=128)],  # Using reasonable defaults
    )
    confirm_password = fields.String(required=True)
    username = fields.String(required=True)
    first_name = fields.String(required=True)
    last_name = fields.String(required=True)


class PasswordResetSchema(Schema):
    """Schema for password reset request validation."""

    email = fields.Email(required=True)


class PasswordResetConfirmSchema(Schema):
    """Schema for password reset confirmation validation."""

    token = fields.String(required=True)
    password = fields.String(
        required=True,
        validate=[validate.Length(min=8, max=128)],  # Using reasonable defaults
    )
    confirm_password = fields.String(required=True)


class LoginResource(BaseResource):
    """Resource for user login."""

    schema = LoginSchema()

    def post(self):
        """Handle login request."""
        data: Any = self.get_json_data()

        user: User = User.query.filter_by(email=data["email"]).first()

        if not user or not verify_password_hash(data["password"], user.password):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account is not active")

        login_user(user, remember=data["remember"])

        return self.success_response(
            message="Login successful", data={"user_id": user.id}
        )


class LogoutResource(BaseResource):
    """Resource for user logout."""

    def post(self):
        """Handle logout request."""
        if current_user.is_authenticated:
            logout_user()

        return self.success_response(message="Logout successful")


class RegisterResource(BaseResource):
    """Resource for user registration."""

    schema = RegisterSchema()

    def post(self):
        """Handle registration request."""
        data: Any = self.get_json_data()

        if data["password"] != data["confirm_password"]:
            raise ValidationError("Passwords do not match")

        if User.query.filter_by(email=data["email"]).first():
            raise ValidationError("Email already registered")

        if User.query.filter_by(username=data["username"]).first():
            raise ValidationError("Username already taken")

        user: User = User(
            email=data["email"],
            username=data["username"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            password=generate_password_hash_with_method(data["password"]),
        )
        user.save()

        # Send confirmation email
        token: str = generate_reset_token(user.id)
        # TODO: Implement email sending

        return self.success_response(
            message="Registration successful",
            data={"user_id": user.id},
            status_code=201,
        )


class PasswordResetResource(BaseResource):
    """Resource for password reset requests."""

    schema = PasswordResetSchema()

    def post(self):
        """Handle password reset request."""
        data: Any = self.get_json_data()

        user: User = User.query.filter_by(email=data["email"]).first()

        if user:
            token: str = generate_reset_token(user.id)
            # TODO: Implement email sending

        # Always return success to prevent email enumeration
        return self.success_response(
            message="Password reset instructions sent if email exists"
        )


class PasswordResetConfirmResource(BaseResource):
    """Resource for password reset confirmation."""

    schema = PasswordResetConfirmSchema()

    def post(self):
        """Handle password reset confirmation."""
        data: Any = self.get_json_data()

        if data["password"] != data["confirm_password"]:
            raise ValidationError("Passwords do not match")

        try:
            user_id: int = verify_reset_token(data["token"])
        except AuthenticationError:
            raise ValidationError("Invalid or expired reset token")

        user: User = User.query.get(user_id)
        if not user:
            raise ValidationError("User not found")

        user.password: Any = generate_password_hash_with_method(data["password"])
        user.save()

        return self.success_response(message="Password reset successful")


def login() -> Dict[str, Any]:
    data: Any = request.get_json()
    # Implement authentication logic here
    return {"status": "logged in"}


def register():
    data: Any = request.get_json()
    # Remove unsupported keyword arguments (first_name, last_name) if User doesn't expect them
    user: User = User(
        username=data.get("username", ""),
        email=data.get("email", ""),
        password=data.get("password", ""),
    )
    db.session.add(user)
    db.session.commit()
    return {"status": "registered"}


def forgot_password():
    # Implement forgot password functionality as needed
    return {"status": "forgot password endpoint"}


def confirm_email():
    token_str: str = request.args.get("token", "", type=str)
    try:
        user_id: int = int(token_str)
    except ValueError:
        user_id: int = 0
    confirmation: str = generate_confirmation_token(user_id)
    return {"confirmation": confirmation}


def reset_password() -> Dict[str, Any]:
    # Implement password reset functionality
    return {"status": "password reset requested"}
