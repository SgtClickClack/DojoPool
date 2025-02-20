"""Validation schemas for request data."""

import re

from marshmallow import Schema, ValidationError, fields, validates, validates_schema
from marshmallow.validate import Length, OneOf, Range, Regexp


class BaseSchema(Schema):
    """Base schema with common validation methods."""

    class Meta:
        """Meta class for schema configuration."""

        unknown = True  # Allow unknown fields by default

    @validates_schema
    def validate_not_empty(self, data, **kwargs):
        """Validate that the request contains data."""
        if not data:
            raise ValidationError("Request data cannot be empty")


class UserSchema(BaseSchema):
    """Schema for user data validation."""

    username = fields.Str(
        required=True,
        validate=[
            Length(min=3, max=50),
            Regexp(
                r"^[a-zA-Z0-9_-]+$",
                error="Username can only contain letters, numbers, underscores, and hyphens",
            ),
        ],
    )
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=Length(min=8, max=128))
    role = fields.Str(validate=OneOf(["user", "admin", "moderator"]))

    @validates("password")
    def validate_password_strength(self, value):
        """Validate password strength."""
        if not any(char.isupper() for char in value):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not any(char.islower() for char in value):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not any(char.isdigit() for char in value):
            raise ValidationError("Password must contain at least one number")
        if not any(char in "!@#$%^&*()" for char in value):
            raise ValidationError(
                "Password must contain at least one special character"
            )


class LoginSchema(BaseSchema):
    """Schema for login data validation."""

    username = fields.Str(required=True)
    password = fields.Str(required=True)
    remember_me = fields.Boolean(missing=False)


class PasswordResetSchema(BaseSchema):
    """Schema for password reset validation."""

    token = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=Length(min=8, max=128))
    confirm_password = fields.Str(required=True)

    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        """Validate that passwords match."""
        if data["new_password"] != data["confirm_password"]:
            raise ValidationError("Passwords must match")


class ProfileUpdateSchema(BaseSchema):
    """Schema for profile update validation."""

    display_name = fields.Str(validate=Length(min=2, max=50))
    bio = fields.Str(validate=Length(max=500))
    avatar_url = fields.Url()
    preferences = fields.Dict(keys=fields.Str(), values=fields.Raw())


class GameSessionSchema(BaseSchema):
    """Schema for game session validation."""

    venue_id = fields.Int(required=True)
    game_type = fields.Str(required=True, validate=OneOf(["8ball", "9ball", "snooker"]))
    players = fields.List(fields.Int(), validate=Length(min=2, max=4))
    stakes = fields.Float(validate=Range(min=0, max=1000))
    tournament_mode = fields.Boolean(missing=False)


class VenueSchema(BaseSchema):
    """Schema for venue validation."""

    name = fields.Str(required=True, validate=Length(min=3, max=100))
    address = fields.Str(required=True)
    contact_email = fields.Email()
    phone = fields.Str(
        validate=Regexp(r"^\+?1?\d{9,15}$", error="Invalid phone number format")
    )
    operating_hours = fields.Dict(keys=fields.Str(), values=fields.Str())
    features = fields.List(fields.Str())


class SearchSchema(BaseSchema):
    """Schema for search query validation."""

    query = fields.Str(required=True)
    filters = fields.Dict(keys=fields.Str(), values=fields.Raw())
    page = fields.Int(missing=1, validate=Range(min=1))
    per_page = fields.Int(missing=20, validate=Range(min=1, max=100))
    sort_by = fields.Str(
        missing="relevance", validate=OneOf(["relevance", "date", "rating"])
    )


class FileUploadSchema(BaseSchema):
    """Schema for file upload validation."""

    file_type = fields.Str(required=True, validate=OneOf(["image", "document"]))
    max_size = fields.Int(
        required=True, validate=Range(min=1, max=10 * 1024 * 1024)
    )  # 10MB max
    allowed_extensions = fields.List(fields.Str(), required=True)


class GameSchema(Schema):
    """Schema for game data validation."""

    id = fields.Int(dump_only=True)
    venue_id = fields.Int(required=True)
    player1_id = fields.Int(required=True)
    player2_id = fields.Int(required=True)
    game_type = fields.Str(
        required=True, validate=validate.OneOf(["8ball", "9ball", "straight"])
    )
    status = fields.Str(
        validate=validate.OneOf(["pending", "active", "completed", "cancelled"])
    )
    winner_id = fields.Int(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class TournamentSchema(Schema):
    """Schema for tournament data validation."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    venue_id = fields.Int(required=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    game_type = fields.Str(
        required=True, validate=validate.OneOf(["8ball", "9ball", "straight"])
    )
    max_players = fields.Int(required=True, validate=validate.Range(min=2, max=128))
    entry_fee = fields.Decimal(required=True, validate=validate.Range(min=0))
    prize_pool = fields.Decimal(required=True, validate=validate.Range(min=0))
    status = fields.Str(
        validate=validate.OneOf(["pending", "active", "completed", "cancelled"])
    )

    @validates("end_date")
    def validate_end_date(self, value):
        """Validate end date is after start date."""
        if "start_date" in self.context and value <= self.context["start_date"]:
            raise ValidationError("End date must be after start date")


class PaymentSchema(Schema):
    """Schema for payment data validation."""

    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    amount = fields.Decimal(required=True, validate=validate.Range(min=0))
    payment_type = fields.Str(
        required=True, validate=validate.OneOf(["credit_card", "debit_card", "crypto"])
    )
    status = fields.Str(
        validate=validate.OneOf(["pending", "completed", "failed", "refunded"])
    )
    transaction_id = fields.Str()
    created_at = fields.DateTime(dump_only=True)

    @validates("transaction_id")
    def validate_transaction_id(self, value):
        """Validate transaction ID format."""
        if value and not re.match(r"^[A-Za-z0-9_-]{10,50}$", value):
            raise ValidationError("Invalid transaction ID format")
