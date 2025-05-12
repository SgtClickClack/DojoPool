"""Authentication resources module.

This module provides API resources for authentication operations.
"""

from flask import current_app
from flask_login import login_user, logout_user, current_user
from marshmallow import Schema, fields, validate

from dojopool.core.security import (
    generate_password_hash_with_method,
    check_password,
    generate_reset_token,
    verify_reset_token,
)
from dojopool.core.exceptions import AuthenticationError, ValidationError
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
        try:
            print("[LOGIN] Entered post method", flush=True)
            print("[LOGIN] Incoming request", flush=True)
            data = self.get_json_data()
            print("[LOGIN] Data:", data, flush=True)

            user = User.query.filter_by(email=data["email"]).first()

            if not user or not check_password(user.password_hash, data["password"]):
                raise AuthenticationError("Invalid email or password")

            if not user.is_active:
                raise AuthenticationError("Account is not active")

            login_user(user, remember=data["remember"])

            return self.success_response(
                message="Login successful", data={"user_id": user.id}
            )
        except Exception as e:
            print("[LOGIN ERROR]", e, flush=True)
            raise


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
        # Import db within the method to avoid potential circular imports
        from dojopool.core.extensions import db
        
        data = self.get_json_data()
        if data is None: # Ensure payload exists
             raise ValidationError('Request body cannot be empty.')

        if data["password"] != data["confirm_password"]:
            raise ValidationError("Passwords do not match")

        if User.query.filter_by(email=data["email"]).first():
            raise ValidationError("Email already registered")

        if User.query.filter_by(username=data["username"]).first():
            raise ValidationError("Username already taken")

        # Create empty user instance (no __init__ args needed)
        user = User()
        user.username = data["username"] # Set username
        user.email = data["email"]
        # Assuming User model has first_name/last_name attributes - uncomment if they exist
        # user.first_name = data["first_name"]
        # user.last_name = data["last_name"]
        user.set_password(data["password"])
        
        db.session.add(user)
        db.session.commit()
        
        # Flush to get the generated ID for the token
        # db.session.flush() # Optional: only needed if ID is used immediately
        # If token generation relies on user.id, ensure commit happens first or flush

        # Send confirmation email
        # token = generate_reset_token(user.id) # Needs user.id after commit/flush
        # TODO: Implement email sending

        # Return user ID from the committed instance
        user_id_to_return = user.id 

        return self.success_response(
            message="Registration successful",
            data={"user_id": user_id_to_return},
            status_code=201,
        )


class PasswordResetResource(BaseResource):
    """Resource for password reset requests."""

    schema = PasswordResetSchema()

    def post(self):
        """Handle password reset request."""
        data = self.get_json_data()

        user = User.query.filter_by(email=data["email"]).first()

        if user:
            token = generate_reset_token(user.id)
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
        data = self.get_json_data()

        if data["password"] != data["confirm_password"]:
            raise ValidationError("Passwords do not match")

        try:
            user_id = verify_reset_token(data["token"])
        except AuthenticationError:
            raise ValidationError("Invalid or expired reset token")

        user = User.query.get(user_id)
        if not user:
            raise ValidationError("User not found")

        user.password = generate_password_hash_with_method(data["password"])
        user.save()

        return self.success_response(message="Password reset successful")
