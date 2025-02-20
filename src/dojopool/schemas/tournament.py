"""Schemas for tournament-related data validation."""

from marshmallow import Schema, ValidationError, fields, validate, validates


class TournamentSchema(Schema):
    """Schema for tournament data."""

    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=500))
    venue_id = fields.Int(required=True)
    format = fields.Str(
        required=True,
        validate=validate.OneOf(
            ["single_elimination", "double_elimination", "round_robin", "swiss"]
        ),
    )
    status = fields.Str(dump_only=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    registration_deadline = fields.DateTime()
    max_participants = fields.Int(validate=validate.Range(min=2))
    entry_fee = fields.Float(validate=validate.Range(min=0))
    prize_pool = fields.Float(validate=validate.Range(min=0))
    rules = fields.Str(validate=validate.Length(max=1000))
    bracket_data = fields.Dict(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

    @validates("end_date")
    def validate_end_date(self, value):
        """Validate end date is after start date."""
        if (
            value
            and self.context.get("start_date")
            and value <= self.context["start_date"]
        ):
            raise ValidationError("End date must be after start date")

    @validates("registration_deadline")
    def validate_registration_deadline(self, value):
        """Validate registration deadline is before start date."""
        if (
            value
            and self.context.get("start_date")
            and value >= self.context["start_date"]
        ):
            raise ValidationError("Registration deadline must be before start date")


class TournamentParticipantSchema(Schema):
    """Schema for tournament participant data."""

    id = fields.Int(dump_only=True)
    tournament_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True)
    seed = fields.Int(dump_only=True)
    registered_at = fields.DateTime(dump_only=True)
    checked_in = fields.Bool(dump_only=True)
    checked_in_at = fields.DateTime(dump_only=True)
    eliminated = fields.Bool(dump_only=True)
    final_rank = fields.Int(dump_only=True)
    prize_amount = fields.Float(dump_only=True)
    stats = fields.Dict(dump_only=True)
    user = fields.Nested(
        "UserSchema", only=("id", "username", "avatar_url"), dump_only=True
    )


class TournamentMatchSchema(Schema):
    """Schema for tournament match data."""

    id = fields.Int(dump_only=True)
    tournament_id = fields.Int(dump_only=True)
    round_number = fields.Int(dump_only=True)
    match_number = fields.Int(dump_only=True)
    player1_id = fields.Int(dump_only=True)
    player2_id = fields.Int(dump_only=True)
    winner_id = fields.Int()
    next_match_id = fields.Int(dump_only=True)
    status = fields.Str(dump_only=True)
    start_time = fields.DateTime()
    end_time = fields.DateTime()
    table_number = fields.Int(validate=validate.Range(min=1))
    score = fields.Dict()
    stats = fields.Dict()
    notes = fields.Str(validate=validate.Length(max=500))
    player1 = fields.Nested(TournamentParticipantSchema, dump_only=True)
    player2 = fields.Nested(TournamentParticipantSchema, dump_only=True)
    winner = fields.Nested(TournamentParticipantSchema, dump_only=True)

    @validates("end_time")
    def validate_end_time(self, value):
        """Validate end time is after start time."""
        if (
            value
            and self.context.get("start_time")
            and value <= self.context["start_time"]
        ):
            raise ValidationError("End time must be after start time")
