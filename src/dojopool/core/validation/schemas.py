"""Validation schemas.

This module provides Marshmallow schemas for data validation.
"""

from marshmallow import Schema, fields, validate, validates, ValidationError
from datetime import datetime, time


class UserSchema(Schema):
    """User data validation schema."""

    username = fields.String(required=True, validate=validate.Length(min=3, max=50))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))
    first_name = fields.String(validate=validate.Length(max=50))
    last_name = fields.String(validate=validate.Length(max=50))
    is_active = fields.Boolean(default=True)
    role = fields.String(validate=validate.OneOf(["user", "admin", "moderator"]))


class LoginSchema(Schema):
    """Login data validation schema."""

    email = fields.Email(required=True)
    password = fields.String(required=True)
    remember = fields.Boolean(default=False)


class GameSettingsSchema(Schema):
    """Game settings validation schema."""

    max_players = fields.Integer(validate=validate.Range(min=2, max=8))
    time_limit = fields.Integer(validate=validate.Range(min=60, max=3600))
    difficulty = fields.String(validate=validate.OneOf(["easy", "medium", "hard"]))
    enable_hints = fields.Boolean()


class PaginationSchema(Schema):
    """Pagination parameters validation schema."""

    page = fields.Integer(validate=validate.Range(min=1), default=1)
    per_page = fields.Integer(validate=validate.Range(min=1, max=100), default=20)
    sort_by = fields.String()
    sort_dir = fields.String(validate=validate.OneOf(["asc", "desc"]), default="asc")


class DateRangeSchema(Schema):
    """Date range validation schema."""

    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)

    @validates("end_date")
    def validate_end_date(self, value):
        """Validate that end_date is after start_date."""
        start_date = self.data.get("start_date")
        if start_date and value <= start_date:
            raise ValidationError("End date must be after start date")


class GameScoreSchema(Schema):
    """Game score validation schema."""

    player_id = fields.Integer(required=True, validate=validate.Range(min=1))
    score = fields.Integer(required=True, validate=validate.Range(min=0))
    game_type = fields.String(
        validate=validate.OneOf(["8ball", "9ball", "straight", "rotation"])
    )
    timestamp = fields.DateTime(default=datetime.utcnow)


class TimeSlotSchema(Schema):
    """Time slot validation schema."""

    start_time = fields.Time(required=True)
    end_time = fields.Time(required=True)
    venue_id = fields.Integer(validate=validate.Range(min=1))
    table_number = fields.Integer(validate=validate.Range(min=1))

    @validates("end_time")
    def validate_end_time(self, value):
        """Validate that end_time is after start_time."""
        start_time = self.data.get("start_time")
        if start_time and value <= start_time:
            raise ValidationError("End time must be after start time")


class PlayerHandicapSchema(Schema):
    """Player handicap validation schema."""

    player_id = fields.Integer(required=True, validate=validate.Range(min=1))
    handicap = fields.Float(required=True, validate=validate.Range(min=0, max=10))
    game_type = fields.String(
        validate=validate.OneOf(["8ball", "9ball", "straight", "rotation"])
    )
    last_updated = fields.DateTime(default=datetime.utcnow)


class TournamentSchema(Schema):
    """Tournament validation schema."""

    name = fields.String(required=True, validate=validate.Length(min=3, max=100))
    description = fields.String(validate=validate.Length(max=500))
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    venue_id = fields.Integer(validate=validate.Range(min=1))
    max_players = fields.Integer(validate=validate.Range(min=2, max=64))
    entry_fee = fields.Float(validate=validate.Range(min=0))
    prize_pool = fields.Float(validate=validate.Range(min=0))
    game_type = fields.String(
        validate=validate.OneOf(["8ball", "9ball", "straight", "rotation"])
    )
    format = fields.String(validate=validate.OneOf(["single", "double", "round_robin"]))
    status = fields.String(
        validate=validate.OneOf(["draft", "open", "closed", "in_progress", "completed"])
    )

    @validates("end_date")
    def validate_end_date(self, value):
        """Validate that end_date is after start_date."""
        start_date = self.data.get("start_date")
        if start_date and value <= start_date:
            raise ValidationError("End date must be after start date")


class MatchSchema(Schema):
    """Match validation schema."""

    tournament_id = fields.Integer(validate=validate.Range(min=1))
    player1_id = fields.Integer(required=True, validate=validate.Range(min=1))
    player2_id = fields.Integer(required=True, validate=validate.Range(min=1))
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    table_number = fields.Integer(validate=validate.Range(min=1))
    race_to = fields.Integer(validate=validate.Range(min=1, max=25))
    winner_id = fields.Integer(validate=validate.Range(min=1))
    status = fields.String(
        validate=validate.OneOf(["scheduled", "in_progress", "completed", "cancelled"])
    )

    @validates("player2_id")
    def validate_players(self, value):
        """Validate that player1 and player2 are different."""
        if value == self.data.get("player1_id"):
            raise ValidationError("Players must be different")

    @validates("winner_id")
    def validate_winner(self, value):
        """Validate that winner is one of the players."""
        if value not in [self.data.get("player1_id"), self.data.get("player2_id")]:
            raise ValidationError("Winner must be one of the players")

    @validates("end_time")
    def validate_end_time(self, value):
        """Validate that end_time is after start_time."""
        start_time = self.data.get("start_time")
        if start_time and value <= start_time:
            raise ValidationError("End time must be after start time")
