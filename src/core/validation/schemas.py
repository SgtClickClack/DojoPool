"""Common validation schemas for DojoPool."""

from marshmallow import Schema, validate, validates, validates_schema, ValidationError
from marshmallow.fields import (
    Int, Str, DateTime, List, Dict, Raw, Email, Boolean, Float, Time, Nested
)

class PaginationSchema(Schema):
    """Schema for pagination parameters."""
    
    page = Int(
        load_default=1,
        validate=validate.Range(min=1)
    )
    per_page = Int(
        load_default=20,
        validate=validate.Range(min=1, max=100)
    )
    sort_by = Str(load_default='id')
    sort_dir = Str(
        load_default='asc',
        validate=validate.OneOf(['asc', 'desc'])
    )

class DateRangeSchema(Schema):
    """Schema for date range parameters."""
    
    start_date = DateTime(required=True)
    end_date = DateTime(required=True)
    
    @validates_schema
    def validate_dates(self, data, **kwargs):
        """Validate end date is after start date."""
        if data['end_date'] < data['start_date']:
            raise ValidationError('End date must be after start date', field_name='end_date')

class SearchSchema(Schema):
    """Schema for search parameters."""
    
    query = Str(required=True)
    fields = List(Str(), load_default=['name'])
    exact = Boolean(load_default=False)

class IDSchema(Schema):
    """Schema for ID validation."""
    
    id = Int(required=True, validate=validate.Range(min=1))

class EmailSchema(Schema):
    """Schema for email validation."""
    
    email = Email(required=True)

class PasswordSchema(Schema):
    """Schema for password validation."""
    
    password = Str(
        required=True,
        validate=[
            validate.Length(min=8, max=72),
            validate.Regexp(
                r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]',
                error='Password must contain at least one letter and one number'
            )
        ]
    )

class UserSchema(Schema):
    """Schema for user data."""
    
    email = Email(required=True)
    password = Str(
        required=True,
        validate=[
            validate.Length(min=8, max=72),
            validate.Regexp(
                r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]',
                error='Password must contain at least one letter and one number'
            )
        ]
    )
    name = Str(validate=validate.Length(min=2, max=100))
    role = Str(
        load_default='user',
        validate=validate.OneOf(['user', 'admin'])
    )

class LoginSchema(Schema):
    """Schema for login data."""
    
    email = Email(required=True)
    password = Str(required=True)
    remember = Boolean(load_default=False)

class TokenSchema(Schema):
    """Schema for token validation."""
    
    token = Str(required=True)
    token_type = Str(
        load_default='access',
        validate=validate.OneOf(['access', 'refresh'])
    )

class FileUploadSchema(Schema):
    """Schema for file uploads."""
    
    file = Raw(required=True)
    file_type = Str(
        required=True,
        validate=validate.OneOf(['image', 'document', 'video'])
    )
    description = Str(validate=validate.Length(max=200))

class GameSettingsSchema(Schema):
    """Schema for game settings."""
    
    max_players = Int(
        load_default=4,
        validate=validate.Range(min=2, max=8)
    )
    time_limit = Int(
        load_default=300,
        validate=validate.Range(min=60, max=3600)
    )
    difficulty = Str(
        load_default='medium',
        validate=validate.OneOf(['easy', 'medium', 'hard'])
    )
    enable_hints = Boolean(load_default=True)
    custom_rules = Dict(keys=Str(), values=Raw()) 

class GameScoreSchema(Schema):
    """Schema for game score validation."""
    
    score = Int(required=True)
    game_type = Str(required=True, validate=validate.OneOf([
        '8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool'
    ]))
    
    @validates_schema
    def validate_score_for_game_type(self, data, **kwargs):
        """Validate score based on game type."""
        score = data['score']
        game_type = data['game_type']
        
        if game_type == '8-ball' and score not in [0, 1]:
            raise ValidationError('8-ball score must be 0 (loss) or 1 (win)', field_name='score')
        elif game_type == '9-ball' and score not in range(10):
            raise ValidationError('9-ball score must be between 0 and 9', field_name='score')
        elif game_type == 'straight' and score not in range(15):
            raise ValidationError('Straight pool score must be between 0 and 14', field_name='score')

class TimeSlotSchema(Schema):
    """Schema for time slot validation."""
    
    start_time = Time(required=True, format='%H:%M')
    end_time = Time(required=True, format='%H:%M')
    min_duration = Int(load_default=30)  # minutes
    max_duration = Int(load_default=240)  # minutes
    
    @validates_schema
    def validate_time_slot(self, data, **kwargs):
        """Validate time slot duration."""
        start = data['start_time']
        end = data['end_time']
        
        # Convert times to minutes for comparison
        start_minutes = start.hour * 60 + start.minute
        end_minutes = end.hour * 60 + end.minute
        
        # Handle case where end time is on the next day
        if end_minutes < start_minutes:
            end_minutes += 24 * 60
        
        duration = end_minutes - start_minutes
        
        if duration < data['min_duration']:
            raise ValidationError(
                f"Time slot must be at least {data['min_duration']} minutes",
                field_name='end_time'
            )
        
        if duration > data['max_duration']:
            raise ValidationError(
                f"Time slot must be at most {data['max_duration']} minutes",
                field_name='end_time'
            )

class PlayerHandicapSchema(Schema):
    """Schema for player handicap validation."""
    
    handicap = Float(
        required=True,
        validate=validate.Range(min=0.0, max=10.0)
    )
    game_type = Str(required=True, validate=validate.OneOf([
        '8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool'
    ]))

class TournamentSchema(Schema):
    """Schema for tournament validation."""
    
    name = Str(required=True, validate=validate.Length(min=3, max=100))
    bracket_size = Int(required=True, validate=validate.OneOf([2, 4, 8, 16, 32, 64]))
    game_type = Str(required=True, validate=validate.OneOf([
        '8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool'
    ]))
    race_to = Int(required=True, validate=validate.Range(min=1, max=25))
    double_elimination = Boolean(load_default=False)
    seeded = Boolean(load_default=True)
    
    @validates_schema
    def validate_race_length(self, data, **kwargs):
        """Validate race length based on game type."""
        if data['game_type'] == 'one-pocket' and data['race_to'] > 10:
            raise ValidationError(
                'One-pocket races should not exceed 10',
                field_name='race_to'
            )

class MatchSchema(Schema):
    """Schema for match validation."""
    
    player1_id = Int(required=True, validate=validate.Range(min=1))
    player2_id = Int(required=True, validate=validate.Range(min=1))
    game_type = Str(required=True, validate=validate.OneOf([
        '8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool'
    ]))
    race_to = Int(required=True, validate=validate.Range(min=1, max=25))
    time_slot = Nested(TimeSlotSchema, required=True)
    table_number = Int(validate=validate.Range(min=1))
    
    @validates_schema
    def validate_players(self, data, **kwargs):
        """Validate player IDs are different."""
        if data['player1_id'] == data['player2_id']:
            raise ValidationError(
                'Players must be different',
                field_name='player2_id'
            )
    
    @validates_schema
    def validate_race_length(self, data, **kwargs):
        """Validate race length based on game type."""
        if data['game_type'] == 'one-pocket' and data['race_to'] > 10:
            raise ValidationError(
                'One-pocket races should not exceed 10',
                field_name='race_to'
            ) 