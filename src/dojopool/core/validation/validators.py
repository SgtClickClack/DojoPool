"""Validators module.

This module contains validators for various models.
"""

from typing import Any, Dict

from marshmallow import ValidationError, fields, validate, validates

from .base import BaseValidator


class UserValidator(BaseValidator):
    """User validator."""

    username = fields.String(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True, validate=validate.Length(max=100))
    password = fields.String(required=True, validate=validate.Length(min=8))
    first_name = fields.String(validate=validate.Length(max=50))
    last_name = fields.String(validate=validate.Length(max=50))
    is_active = fields.Boolean()
    role = fields.String(validate=validate.OneOf(["user", "admin", "moderator"]))
    preferences = fields.Dict()

    @validates("username")
    def validate_username(self, value):
        """Validate username format."""
        if not value.isalnum():
            raise ValidationError("Username must be alphanumeric")

    @validates("password")
    def validate_password(self, value):
        """Validate password strength."""
        if not any(c.isupper() for c in value):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in value):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in value):
            raise ValidationError("Password must contain at least one number")

    @validates("preferences")
    def validate_preferences(self, value):
        """Validate user preferences."""
        if not isinstance(value, dict):
            raise ValidationError("Preferences must be a dictionary")


class VenueValidator(BaseValidator):
    """Venue validator."""

    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(validate=validate.Length(max=500))
    address = fields.String(required=True, validate=validate.Length(min=1, max=200))
    city = fields.String(required=True, validate=validate.Length(min=1, max=100))
    state = fields.String(required=True, validate=validate.Length(min=2, max=2))
    zip_code = fields.String(required=True, validate=validate.Length(min=5, max=10))
    phone = fields.String(validate=validate.Length(max=20))
    email = fields.Email(validate=validate.Length(max=100))
    website = fields.String(validate=validate.URL())
    capacity = fields.Integer(validate=validate.Range(min=0))
    is_active = fields.Boolean()
    amenities = fields.List(fields.String())
    operating_hours = fields.Dict()

    @validates("operating_hours")
    def validate_operating_hours(self, value: Dict[str, Any]) -> None:
        """Validate venue operating hours."""
        if not isinstance(value, dict):
            raise ValidationError("Operating hours must be a dictionary")

        days = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ]
        for day in days:
            if day not in value:
                raise ValidationError(f"Operating hours must include {day}")

            day_hours = value[day]
            if not isinstance(day_hours, dict):
                raise ValidationError(f"Operating hours for {day} must be a dictionary")

            if "open" not in day_hours or "close" not in day_hours:
                raise ValidationError(
                    f"Operating hours for {day} must include open and close times"
                )

            try:
                # Validate time format (HH:MM)
                open_time = day_hours["open"]
                close_time = day_hours["close"]
                if open_time != "closed" and close_time != "closed":
                    hours, minutes = map(int, open_time.split(":"))
                    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
                        raise ValueError
                    hours, minutes = map(int, close_time.split(":"))
                    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
                        raise ValueError
            except (ValueError, AttributeError):
                raise ValidationError(
                    f'Invalid time format for {day}. Use HH:MM or "closed"'
                )


class GameValidator(BaseValidator):
    """Game validator."""

    match_id = fields.Integer(required=True, validate=validate.Range(min=1))
    player1_id = fields.Integer(required=True, validate=validate.Range(min=1))
    player2_id = fields.Integer(required=True, validate=validate.Range(min=1))
    winner_id = fields.Integer(validate=validate.Range(min=1))
    game_type = fields.String(
        validate=validate.OneOf(["8ball", "9ball", "straight", "rotation"])
    )
    status = fields.String(
        validate=validate.OneOf(["pending", "active", "completed", "cancelled"])
    )
    stats = fields.Dict()

    @validates("player2_id")
    def validate_players(self, value):
        """Validate that player1 and player2 are different."""
        if "player1_id" in self.data and value == self.data["player1_id"]:
            raise ValidationError("Player 1 and Player 2 must be different")

    @validates("winner_id")
    def validate_winner(self, value):
        """Validate that winner is one of the players."""
        if value not in [self.data.get("player1_id"), self.data.get("player2_id")]:
            raise ValidationError("Winner must be one of the players")

    @validates("stats")
    def validate_stats(self, value):
        """Validate game statistics."""
        if not isinstance(value, dict):
            raise ValidationError("Stats must be a dictionary")


class AchievementValidator(BaseValidator):
    """Achievement validator."""

    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String(validate=validate.Length(max=500))
    category = fields.String(validate=validate.Length(max=50))
    points = fields.Integer(validate=validate.Range(min=0))
    icon_url = fields.String(validate=validate.URL())
    requirements = fields.Dict()
    rewards = fields.Dict()
    is_active = fields.Boolean()

    @validates("requirements")
    def validate_requirements(self, value: Dict[str, Any]):
        """Validate achievement requirements."""
        if not isinstance(value, dict):
            raise ValidationError("Requirements must be a dictionary")

        required_keys = ["type", "criteria"]
        for key in required_keys:
            if key not in value:
                raise ValidationError(f"Requirements must include {key}")

        valid_types = ["count", "score", "time", "streak", "custom"]
        if value["type"] not in valid_types:
            raise ValidationError(
                f"Invalid requirement type. Must be one of: {valid_types}"
            )

        if not isinstance(value["criteria"], dict):
            raise ValidationError("Criteria must be a dictionary")

        if value["type"] == "count":
            if "target" not in value["criteria"]:
                raise ValidationError("Count criteria must include target value")
            if not isinstance(value["criteria"]["target"], int):
                raise ValidationError("Count target must be an integer")
            if value["criteria"]["target"] <= 0:
                raise ValidationError("Count target must be positive")

        elif value["type"] == "score":
            if "threshold" not in value["criteria"]:
                raise ValidationError("Score criteria must include threshold value")
            if not isinstance(value["criteria"]["threshold"], (int, float)):
                raise ValidationError("Score threshold must be a number")
            if value["criteria"]["threshold"] <= 0:
                raise ValidationError("Score threshold must be positive")

        elif value["type"] == "time":
            if "duration" not in value["criteria"]:
                raise ValidationError("Time criteria must include duration value")
            if not isinstance(value["criteria"]["duration"], (int, float)):
                raise ValidationError("Time duration must be a number")
            if value["criteria"]["duration"] <= 0:
                raise ValidationError("Time duration must be positive")

        elif value["type"] == "streak":
            if "days" not in value["criteria"]:
                raise ValidationError("Streak criteria must include days value")
            if not isinstance(value["criteria"]["days"], int):
                raise ValidationError("Streak days must be an integer")
            if value["criteria"]["days"] <= 0:
                raise ValidationError("Streak days must be positive")

    @validates("rewards")
    def validate_rewards(self, value: Dict[str, Any]):
        """Validate achievement rewards."""
        if not isinstance(value, dict):
            raise ValidationError("Rewards must be a dictionary")

        valid_types = ["points", "badge", "title", "item", "custom"]
        if "type" not in value:
            raise ValidationError("Rewards must include type")
        if value["type"] not in valid_types:
            raise ValidationError(f"Invalid reward type. Must be one of: {valid_types}")

        if value["type"] == "points":
            if "amount" not in value:
                raise ValidationError("Points reward must include amount")
            if not isinstance(value["amount"], (int, float)):
                raise ValidationError("Points amount must be a number")
            if value["amount"] <= 0:
                raise ValidationError("Points amount must be positive")

        elif value["type"] in ["badge", "title"]:
            if "name" not in value:
                raise ValidationError(
                    f'{value["type"].capitalize()} reward must include name'
                )
            if not isinstance(value["name"], str):
                raise ValidationError(
                    f'{value["type"].capitalize()} name must be a string'
                )
            if len(value["name"]) == 0:
                raise ValidationError(
                    f'{value["type"].capitalize()} name cannot be empty'
                )

        elif value["type"] == "item":
            if "item_id" not in value:
                raise ValidationError("Item reward must include item_id")
            if not isinstance(value["item_id"], int):
                raise ValidationError("Item ID must be an integer")
            if value["item_id"] <= 0:
                raise ValidationError("Item ID must be positive")


class UserAchievementValidator(BaseValidator):
    """User achievement validator."""

    user_id = fields.Integer(required=True, validate=validate.Range(min=1))
    achievement_id = fields.Integer(required=True, validate=validate.Range(min=1))
    progress = fields.Dict()
    completed = fields.Boolean()

    @validates("progress")
    def validate_progress(self, value: Dict[str, Any]):
        """Validate user achievement progress."""
        if not isinstance(value, dict):
            raise ValidationError("Progress must be a dictionary")

        if "current" not in value:
            raise ValidationError("Progress must include current value")

        if not isinstance(value["current"], (int, float)):
            raise ValidationError("Progress current value must be a number")

        if value["current"] < 0:
            raise ValidationError("Progress current value cannot be negative")


__all__ = [
    "UserValidator",
    "VenueValidator",
    "GameValidator",
    "AchievementValidator",
    "UserAchievementValidator",
]
