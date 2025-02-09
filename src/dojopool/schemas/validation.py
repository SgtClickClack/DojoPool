from marshmallow import Schema, fields, validate, validates, ValidationError
import re

class UserSchema(Schema):
    """Schema for user data validation."""
    id = fields.Int(dump_only=True)
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=50),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error='Username can only contain letters, numbers, and underscores'
            )
        ]
    )
    email = fields.Email(required=True)
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8)
    )
    
    @validates('password')
    def validate_password(self, value):
        """Validate password complexity."""
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            raise ValidationError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')

class GameSchema(Schema):
    """Schema for game data validation."""
    id = fields.Int(dump_only=True)
    venue_id = fields.Int(required=True)
    player1_id = fields.Int(required=True)
    player2_id = fields.Int(required=True)
    game_type = fields.Str(
        required=True,
        validate=validate.OneOf(['8ball', '9ball', 'straight'])
    )
    status = fields.Str(
        validate=validate.OneOf(['pending', 'active', 'completed', 'cancelled'])
    )
    winner_id = fields.Int(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)

class VenueSchema(Schema):
    """Schema for venue data validation."""
    id = fields.Int(dump_only=True)
    name = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=100)
    )
    address = fields.Str(
        required=True,
        validate=validate.Length(min=5, max=200)
    )
    city = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100)
    )
    state = fields.Str(
        required=True,
        validate=validate.Length(equal=2)
    )
    zip_code = fields.Str(
        required=True,
        validate=validate.Regexp(
            r'^\d{5}(-\d{4})?$',
            error='Invalid ZIP code format'
        )
    )
    phone = fields.Str(
        validate=validate.Regexp(
            r'^\+?1?\d{9,15}$',
            error='Invalid phone number format'
        )
    )
    status = fields.Str(
        validate=validate.OneOf(['active', 'inactive', 'pending'])
    )

class TournamentSchema(Schema):
    """Schema for tournament data validation."""
    id = fields.Int(dump_only=True)
    name = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100)
    )
    venue_id = fields.Int(required=True)
    start_date = fields.DateTime(required=True)
    end_date = fields.DateTime(required=True)
    game_type = fields.Str(
        required=True,
        validate=validate.OneOf(['8ball', '9ball', 'straight'])
    )
    max_players = fields.Int(
        required=True,
        validate=validate.Range(min=2, max=128)
    )
    entry_fee = fields.Decimal(
        required=True,
        validate=validate.Range(min=0)
    )
    prize_pool = fields.Decimal(
        required=True,
        validate=validate.Range(min=0)
    )
    status = fields.Str(
        validate=validate.OneOf(['pending', 'active', 'completed', 'cancelled'])
    )
    
    @validates('end_date')
    def validate_end_date(self, value):
        """Validate end date is after start date."""
        if 'start_date' in self.context and value <= self.context['start_date']:
            raise ValidationError('End date must be after start date')

class PaymentSchema(Schema):
    """Schema for payment data validation."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(required=True)
    amount = fields.Decimal(
        required=True,
        validate=validate.Range(min=0)
    )
    payment_type = fields.Str(
        required=True,
        validate=validate.OneOf(['credit_card', 'debit_card', 'crypto'])
    )
    status = fields.Str(
        validate=validate.OneOf(['pending', 'completed', 'failed', 'refunded'])
    )
    transaction_id = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    
    @validates('transaction_id')
    def validate_transaction_id(self, value):
        """Validate transaction ID format."""
        if value and not re.match(r'^[A-Za-z0-9_-]{10,50}$', value):
            raise ValidationError('Invalid transaction ID format') 