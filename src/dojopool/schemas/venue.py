"""Schemas for venue-related data validation."""

from marshmallow import Schema, ValidationError, fields, validate, validates


class VenueSchema(Schema):
    """Schema for venue data."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=500))
    address = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    city = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    state = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    country = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    postal_code = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    latitude = fields.Float()
    longitude = fields.Float()
    phone = fields.Str(validate=validate.Length(max=20))
    email = fields.Email(validate=validate.Length(max=100))
    website = fields.URL(validate=validate.Length(max=200))
    hours = fields.Dict(keys=fields.Str(), values=fields.Dict())
    features = fields.List(fields.Str())
    tables = fields.Int(required=True, validate=validate.Range(min=1))
    pricing = fields.Dict(keys=fields.Str(), values=fields.Float())
    rating = fields.Float(dump_only=True)
    total_ratings = fields.Int(dump_only=True)
    is_verified = fields.Bool(dump_only=True)
    is_active = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("latitude")
    def validate_latitude(self, value):
        """Validate latitude is within valid range."""
        if value and (value < -90 or value > 90):
            raise ValidationError("Latitude must be between -90 and 90")

    @validates("longitude")
    def validate_longitude(self, value):
        """Validate longitude is within valid range."""
        if value and (value < -180 or value > 180):
            raise ValidationError("Longitude must be between -180 and 180")


class VenueCheckInSchema(Schema):
    """Schema for venue check-in data."""

    id = fields.Int(dump_only=True)
    venue_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    table_number = fields.Int(validate=validate.Range(min=1))
    game_type = fields.Str(validate=validate.Length(max=50))
    checked_in_at = fields.DateTime(dump_only=True)
    checked_out_at = fields.DateTime(dump_only=True)


class VenueLeaderboardSchema(Schema):
    """Schema for venue leaderboard data."""

    id = fields.Int(dump_only=True)
    venue_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    points = fields.Int(dump_only=True)
    wins = fields.Int(dump_only=True)
    losses = fields.Int(dump_only=True)
    current_streak = fields.Int(dump_only=True)
    highest_streak = fields.Int(dump_only=True)
    last_played = fields.DateTime(dump_only=True)


class VenueEventSchema(Schema):
    """Schema for venue event data."""

    id = fields.Int(dump_only=True)
    venue_id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=500))
    event_type = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    start_time = fields.DateTime(required=True)
    end_time = fields.DateTime(required=True)
    registration_deadline = fields.DateTime()
    max_participants = fields.Int(validate=validate.Range(min=1))
    entry_fee = fields.Float(validate=validate.Range(min=0))
    prize_pool = fields.Float(validate=validate.Range(min=0))
    status = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("end_time")
    def validate_end_time(self, value):
        """Validate end time is after start time."""
        if (
            value
            and self.context.get("start_time")
            and value <= self.context["start_time"]
        ):
            raise ValidationError("End time must be after start time")

    @validates("registration_deadline")
    def validate_registration_deadline(self, value):
        """Validate registration deadline is before start time."""
        if (
            value
            and self.context.get("start_time")
            and value >= self.context["start_time"]
        ):
            raise ValidationError("Registration deadline must be before start time")
