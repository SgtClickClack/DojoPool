"""Input validation and sanitization for DojoPool."""

import json
import logging
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import bleach
from marshmallow import Schema, ValidationError, fields, validate

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Custom validation error."""

    def __init__(self, message: str, errors: Optional[Dict[str, List[str]]] = None):
        """Initialize ValidationError.

        Args:
            message: Error message
            errors: Dictionary of field errors
        """
        super().__init__(message)
        self.message = message
        self.errors = errors or {}


class BaseValidator:
    """Base validator class."""

    @staticmethod
    def sanitize_string(value: str) -> str:
        """Sanitize string input.

        Args:
            value: Input string

        Returns:
            Sanitized string
        """
        if not isinstance(value, str):
            return str(value)

        # Remove control characters and normalize whitespace
        value = " ".join(value.split())

        # HTML escape special characters
        return bleach.clean(value, tags=[], strip=True)

    @staticmethod
    def sanitize_html(value: str, allowed_tags: Optional[List[str]] = None):
        """Sanitize HTML input.

        Args:
            value: Input HTML
            allowed_tags: List of allowed HTML tags

        Returns:
            Sanitized HTML
        """
        if not isinstance(value, str):
            return str(value)

        default_tags = ["p", "br", "strong", "em", "u", "ol", "ul", "li"]
        allowed = allowed_tags or default_tags

        return bleach.clean(
            value,
            tags=allowed,
            attributes={},
            styles=[],
            protocols=["http", "https", "mailto"],
        )

    @staticmethod
    def validate_email(email: str):
        """Validate email format.

        Args:
            email: Email address

        Returns:
            True if valid
        """
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format.

        Args:
            username: Username

        Returns:
            True if valid
        """
        pattern = r"^[a-zA-Z0-9_-]{3,32}$"
        return bool(re.match(pattern, username))

    @staticmethod
    def validate_password(password: str) -> Dict[str, bool]:
        """Validate password strength.

        Args:
            password: Password

        Returns:
            Dictionary of validation results
        """
        return {
            "length": len(password) >= 8,
            "uppercase": bool(re.search(r"[A-Z]", password)),
            "lowercase": bool(re.search(r"[a-z]", password)),
            "digits": bool(re.search(r"\d", password)),
            "special": bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password)),
        }

    @staticmethod
    def validate_date(date_str: str, format: str = "%Y-%m-%d") -> bool:
        """Validate date format.

        Args:
            date_str: Date string
            format: Expected date format

        Returns:
            True if valid
        """
        try:
            datetime.strptime(date_str, format)
            return True
        except ValueError:
            return False

    @staticmethod
    def validate_json(json_str: str):
        """Validate JSON string.

        Args:
            json_str: JSON string

        Returns:
            True if valid
        """
        try:
            json.loads(json_str)
            return True
        except json.JSONDecodeError:
            return False


class UserSchema(Schema):
    """User data validation schema."""

    username = fields.Str(
        required=True, validate=validate.Regexp(r"^[a-zA-Z0-9_-]{3,32}$")
    )
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    first_name = fields.Str(validate=validate.Length(max=50))
    last_name = fields.Str(validate=validate.Length(max=50))
    birth_date = fields.Date()


class GameSchema(Schema):
    """Game data validation schema."""

    title = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=1000))
    max_players = fields.Int(validate=validate.Range(min=1))
    min_players = fields.Int(validate=validate.Range(min=1))
    duration = fields.Int(validate=validate.Range(min=1))
    difficulty = fields.Str(validate=validate.OneOf(["easy", "medium", "hard"]))


class InputValidator:
    """Input validation handler."""

    def __init__(self):
        """Initialize InputValidator."""
        self.base = BaseValidator()
        self.user_schema = UserSchema()
        self.game_schema = GameSchema()

    def validate_user_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate user data.

        Args:
            data: User data dictionary

        Returns:
            Validated and sanitized data

        Raises:
            ValidationError: If validation fails
        """
        try:
            # Validate schema
            validated = self.user_schema.load(data)

            # Additional validation
            if not self.base.validate_username(validated["username"]):
                raise ValidationError("Invalid username format")

            if not self.base.validate_email(validated["email"]):
                raise ValidationError("Invalid email format")

            password_validation = self.base.validate_password(validated["password"])
            if not all(password_validation.values()):
                raise ValidationError("Password does not meet requirements")

            # Sanitize strings
            for field in ["first_name", "last_name"]:
                if field in validated:
                    validated[field] = self.base.sanitize_string(validated[field])

            return validated

        except ValidationError as e:
            raise ValidationError("User data validation failed", e.messages)

    def validate_game_data(self, data: Dict[str, Any]):
        """Validate game data.

        Args:
            data: Game data dictionary

        Returns:
            Validated and sanitized data

        Raises:
            ValidationError: If validation fails
        """
        try:
            # Validate schema
            validated = self.game_schema.load(data)

            # Sanitize strings
            validated["title"] = self.base.sanitize_string(validated["title"])
            if "description" in validated:
                validated["description"] = self.base.sanitize_html(
                    validated["description"], ["p", "br", "strong", "em"]
                )

            # Additional validation
            if (
                "min_players" in validated
                and "max_players" in validated
                and validated["min_players"] > validated["max_players"]
            ):
                raise ValidationError("Minimum players cannot exceed maximum players")

            return validated

        except ValidationError as e:
            raise ValidationError("Game data validation failed", e.messages)

    def validate_search_query(self, query: str) -> str:
        """Validate and sanitize search query.

        Args:
            query: Search query

        Returns:
            Sanitized query

        Raises:
            ValidationError: If validation fails
        """
        if not query or len(query.strip()) < 2:
            raise ValidationError("Search query too short")

        # Remove special characters and excess whitespace
        sanitized = re.sub(r"[^\w\s-]", "", query)
        sanitized = " ".join(sanitized.split())

        return sanitized

    def validate_file_upload(
        self, file: Any, allowed_types: List[str], max_size: int
    ) -> bool:
        """Validate file upload.

        Args:
            file: File object
            allowed_types: List of allowed MIME types
            max_size: Maximum file size in bytes

        Returns:
            True if valid

        Raises:
            ValidationError: If validation fails
        """
        if not file:
            raise ValidationError("No file provided")

        if not hasattr(file, "content_type"):
            raise ValidationError("Invalid file object")

        if file.content_type not in allowed_types:
            raise ValidationError("File type not allowed")

        if hasattr(file, "content_length"):
            size = file.content_length
        elif hasattr(file, "seek") and hasattr(file, "tell"):
            file.seek(0, 2)  # Seek to end
            size = file.tell()
            file.seek(0)  # Reset position
        else:
            raise ValidationError("Cannot determine file size")

        if size > max_size:
            raise ValidationError("File too large")

        return True
