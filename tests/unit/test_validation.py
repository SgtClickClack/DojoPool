import pytest
from marshmallow import ValidationError
from flask import Flask
from dojopool.core.validation import (
    BaseValidator,
    ValidationResult,
    validate_with
)
from dojopool.core.validation.schemas import (
    UserSchema,
    LoginSchema,
    GameSettingsSchema,
    PaginationSchema,
    DateRangeSchema,
    GameScoreSchema,
    TimeSlotSchema,
    PlayerHandicapSchema,
    TournamentSchema,
    MatchSchema
)
from dojopool.core.validation.utils import (
    validate_password_strength,
    validate_email_domain,
    validate_phone_number,
    validate_username,
    validate_game_score,
    validate_game_type,
    validate_time_slot,
    validate_player_handicap,
    validate_tournament_bracket_size,
    validate_race_to
)
from datetime import datetime, timedelta, time
import json

@pytest.fixture
def app():
    """Create a minimal Flask app for validation tests."""
    app = Flask('test')
    app.config.update({
        'TESTING': True,
        'WTF_CSRF_ENABLED': False
    })
    return app

@pytest.fixture
def app_context(app):
    """Create application context."""
    with app.app_context():
        yield app

def test_base_validator_valid_data():
    """Test BaseValidator with valid data."""
    schema = UserSchema
    validator = BaseValidator(schema)
    data = {
        'email': 'test@example.com',
        'password': 'Password123!',
        'name': 'Test User'
    }
    
    result = validator.validate(data)
    assert result.is_valid
    assert result.errors == {}
    assert result.data['email'] == data['email']
    assert result.data['name'] == data['name']

def test_base_validator_invalid_data():
    """Test BaseValidator with invalid data."""
    schema = UserSchema
    validator = BaseValidator(schema)
    data = {
        'email': 'invalid-email',
        'password': '123',  # Too short
        'name': 'T'  # Too short
    }
    
    result = validator.validate(data)
    assert not result.is_valid
    assert 'email' in result.errors
    assert 'password' in result.errors
    assert 'name' in result.errors

def test_login_schema():
    """Test LoginSchema validation."""
    schema = LoginSchema()
    valid_data = {
        'email': 'user@example.com',
        'password': 'password123'
    }
    invalid_data = {
        'email': 'invalid-email',
        'password': ''
    }
    
    # Test valid data
    result = schema.load(valid_data)
    assert result['email'] == valid_data['email']
    assert result['password'] == valid_data['password']
    assert result['remember'] is False  # Default value
    
    # Test invalid data
    with pytest.raises(ValidationError):
        schema.load(invalid_data)

def test_game_settings_schema():
    """Test GameSettingsSchema validation."""
    schema = GameSettingsSchema()
    valid_data = {
        'max_players': 6,
        'time_limit': 600,
        'difficulty': 'hard',
        'enable_hints': True
    }
    invalid_data = {
        'max_players': 10,  # Too many players
        'time_limit': 30,  # Too short
        'difficulty': 'extreme'  # Invalid difficulty
    }
    
    # Test valid data
    result = schema.load(valid_data)
    assert result == valid_data
    
    # Test invalid data
    with pytest.raises(ValidationError):
        schema.load(invalid_data)

def test_pagination_schema():
    """Test PaginationSchema validation."""
    schema = PaginationSchema()
    valid_data = {
        'page': 2,
        'per_page': 50,
        'sort_by': 'name',
        'sort_dir': 'desc'
    }
    invalid_data = {
        'page': 0,  # Invalid page number
        'per_page': 200,  # Too many items
        'sort_dir': 'invalid'  # Invalid direction
    }
    
    # Test valid data
    result = schema.load(valid_data)
    assert result == valid_data
    
    # Test invalid data
    with pytest.raises(ValidationError):
        schema.load(invalid_data)

def test_date_range_schema():
    """Test DateRangeSchema validation."""
    schema = DateRangeSchema()
    now = datetime.utcnow()
    valid_data = {
        'start_date': now.isoformat(),
        'end_date': (now + timedelta(days=1)).isoformat()
    }
    invalid_data = {
        'start_date': now.isoformat(),
        'end_date': (now - timedelta(days=1)).isoformat()  # End before start
    }
    
    # Test valid data
    result = schema.load(valid_data)
    assert result['start_date'] < result['end_date']
    
    # Test invalid data
    with pytest.raises(ValidationError):
        schema.load(invalid_data)

def test_password_strength_validation():
    """Test password strength validation."""
    # Test strong password
    strong_pass = validate_password_strength('StrongPass123!')
    assert strong_pass.is_valid
    assert not strong_pass.errors
    
    # Test weak password
    weak_pass = validate_password_strength('weak')
    assert not weak_pass.is_valid
    assert 'length' in weak_pass.errors
    assert 'uppercase' in weak_pass.errors
    assert 'numbers' in weak_pass.errors
    assert 'special' in weak_pass.errors

def test_email_domain_validation():
    """Test email domain validation."""
    # Test allowed domain
    allowed_domains = ['example.com', 'test.com']
    valid_email = validate_email_domain('user@example.com', allowed_domains)
    assert valid_email.is_valid
    
    # Test disallowed domain
    invalid_email = validate_email_domain('user@invalid.com', allowed_domains)
    assert not invalid_email.is_valid
    assert 'email' in invalid_email.errors

def test_phone_number_validation():
    """Test phone number validation."""
    # Test valid US phone number
    valid_phone = validate_phone_number('+12345678901')
    assert valid_phone.is_valid
    
    # Test invalid phone number
    invalid_phone = validate_phone_number('123')
    assert not invalid_phone.is_valid
    assert 'phone' in invalid_phone.errors

def test_username_validation():
    """Test username validation."""
    # Test valid username
    valid_user = validate_username('validuser123')
    assert valid_user.is_valid
    
    # Test too short username
    short_user = validate_username('ab')
    assert not short_user.is_valid
    assert 'length' in short_user.errors
    
    # Test too long username
    long_user = validate_username('a' * 31)
    assert not long_user.is_valid
    assert 'length' in long_user.errors

def test_validate_with_decorator(app):
    """Test validate_with decorator."""
    schema = UserSchema

    @validate_with(schema)
    def dummy_route(validated_data=None):
        from flask import jsonify
        return jsonify(validated_data)

    # Configure app for testing
    app.config['TESTING'] = True
    app.config['DEBUG'] = True

    # Add error handler for validation errors
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        from flask import jsonify
        response = jsonify({
            'message': str(error),
            'errors': error.errors
        })
        response.status_code = 400
        return response

    # Add route to app
    app.add_url_rule('/test', 'test_route', dummy_route, methods=['POST'])

    # Create test client
    client = app.test_client()

    # Test valid data
    valid_data = {
        'email': 'test@example.com',
        'password': 'Password123!',
        'name': 'Test User',
        'role': 'user'  # Add role field with valid value
    }

    response = client.post(
        '/test',
        json=valid_data,
        headers={'Content-Type': 'application/json'}
    )
    print(f"Valid data test result: {response.json}")
    assert response.status_code == 200, "Expected successful validation"
    assert response.json['email'] == valid_data['email'], "Validated email should match input"
    assert response.json['name'] == valid_data['name'], "Validated name should match input"
    assert response.json['role'] == valid_data['role'], "Validated role should match input"

    # Test invalid data
    invalid_data = {
        'email': 'invalid-email',
        'password': '123',  # Too short and missing required pattern
        'role': 'invalid'  # Invalid role value
    }

    response = client.post(
        '/test',
        json=invalid_data,
        headers={'Content-Type': 'application/json'}
    )
    print(f"Invalid data test result: {response.json}")
    assert response.status_code == 400, "Expected validation error"
    assert 'errors' in response.json, "Expected errors in response"
    
    errors = response.json['errors']
    assert 'email' in errors, "Expected email validation error"
    assert 'password' in errors, "Expected password validation error"
    assert 'role' in errors, "Expected role validation error"
    
    assert any('Not a valid email address' in msg for msg in errors['email']), "Expected invalid email error"
    assert any('Length must be between 8 and 72' in msg for msg in errors['password']), "Expected password length error"
    assert any('Must be one of: user, admin' in msg for msg in errors['role']), "Expected invalid role error"

def test_game_score_validation():
    """Test game score validation."""
    # Test 8-ball score
    valid_8ball = validate_game_score(1, game_type='8-ball')
    assert valid_8ball.is_valid
    
    invalid_8ball = validate_game_score(2, game_type='8-ball')
    assert not invalid_8ball.is_valid
    assert 'game_type' in invalid_8ball.errors
    
    # Test 9-ball score
    valid_9ball = validate_game_score(5, game_type='9-ball')
    assert valid_9ball.is_valid
    
    invalid_9ball = validate_game_score(10, game_type='9-ball')
    assert not invalid_9ball.is_valid
    assert 'game_type' in invalid_9ball.errors
    
    # Test straight pool score
    valid_straight = validate_game_score(10, game_type='straight')
    assert valid_straight.is_valid
    
    invalid_straight = validate_game_score(15, game_type='straight')
    assert not invalid_straight.is_valid
    assert 'game_type' in invalid_straight.errors
    
    # Test invalid score type
    invalid_type = validate_game_score('invalid')
    assert not invalid_type.is_valid
    assert 'type' in invalid_type.errors

def test_game_type_validation():
    """Test game type validation."""
    # Test valid game types
    valid_types = ['8-ball', '9-ball', 'straight', 'rotation', 'one-pocket', 'bank-pool']
    for game_type in valid_types:
        result = validate_game_type(game_type)
        assert result.is_valid
    
    # Test invalid game type
    invalid = validate_game_type('invalid')
    assert not invalid.is_valid
    assert 'game_type' in invalid.errors

def test_time_slot_validation():
    """Test time slot validation."""
    # Test valid time slot
    valid = validate_time_slot('14:00', '15:00')
    assert valid.is_valid
    
    # Test too short duration
    short = validate_time_slot('14:00', '14:15', min_duration=30)
    assert not short.is_valid
    assert 'duration' in short.errors
    
    # Test too long duration
    long = validate_time_slot('14:00', '20:00', max_duration=240)
    assert not long.is_valid
    assert 'duration' in long.errors
    
    # Test invalid time format
    invalid = validate_time_slot('invalid', '15:00')
    assert not invalid.is_valid
    assert 'format' in invalid.errors

def test_player_handicap_validation():
    """Test player handicap validation."""
    # Test valid handicap
    valid = validate_player_handicap(5.5)
    assert valid.is_valid
    
    # Test too low handicap
    low = validate_player_handicap(-1.0)
    assert not low.is_valid
    assert 'range' in low.errors
    
    # Test too high handicap
    high = validate_player_handicap(11.0)
    assert not high.is_valid
    assert 'range' in high.errors
    
    # Test invalid handicap type
    invalid = validate_player_handicap('invalid')
    assert not invalid.is_valid
    assert 'type' in invalid.errors

def test_tournament_bracket_size_validation():
    """Test tournament bracket size validation."""
    # Test valid sizes
    valid_sizes = [2, 4, 8, 16, 32, 64]
    for size in valid_sizes:
        result = validate_tournament_bracket_size(size)
        assert result.is_valid
    
    # Test invalid size
    invalid = validate_tournament_bracket_size(3)
    assert not invalid.is_valid
    assert 'size' in invalid.errors

def test_race_to_validation():
    """Test race length validation."""
    # Test valid race length
    valid = validate_race_to(5)
    assert valid.is_valid
    
    # Test too short race
    short = validate_race_to(0)
    assert not short.is_valid
    assert 'range' in short.errors
    
    # Test too long race
    long = validate_race_to(26)
    assert not long.is_valid
    assert 'range' in long.errors
    
    # Test one-pocket specific rule
    onepocket = validate_race_to(15, game_type='one-pocket')
    assert not onepocket.is_valid
    assert 'game_type' in onepocket.errors

def test_game_score_schema():
    """Test GameScoreSchema validation."""
    schema = GameScoreSchema()
    
    # Test valid 8-ball score
    valid_8ball = {
        'score': 1,
        'game_type': '8-ball'
    }
    result = schema.load(valid_8ball)
    assert result['score'] == 1
    assert result['game_type'] == '8-ball'
    
    # Test invalid 8-ball score
    invalid_8ball = {
        'score': 2,
        'game_type': '8-ball'
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(invalid_8ball)
    assert 'score' in exc.value.messages

def test_time_slot_schema():
    """Test TimeSlotSchema validation."""
    schema = TimeSlotSchema()
    
    # Test valid time slot
    valid = {
        'start_time': '14:00',
        'end_time': '15:00'
    }
    result = schema.load(valid)
    assert isinstance(result['start_time'], time)
    assert isinstance(result['end_time'], time)
    
    # Test invalid duration
    invalid = {
        'start_time': '14:00',
        'end_time': '14:15',
        'min_duration': 30
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(invalid)
    assert 'end_time' in exc.value.messages

def test_player_handicap_schema():
    """Test PlayerHandicapSchema validation."""
    schema = PlayerHandicapSchema()
    
    # Test valid handicap
    valid = {
        'handicap': 5.5,
        'game_type': '8-ball'
    }
    result = schema.load(valid)
    assert result['handicap'] == 5.5
    assert result['game_type'] == '8-ball'
    
    # Test invalid handicap
    invalid = {
        'handicap': 11.0,
        'game_type': '8-ball'
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(invalid)
    assert 'handicap' in exc.value.messages

def test_tournament_schema():
    """Test TournamentSchema validation."""
    schema = TournamentSchema()
    
    # Test valid tournament
    valid = {
        'name': 'Weekly 8-Ball',
        'bracket_size': 8,
        'game_type': '8-ball',
        'race_to': 3,
        'double_elimination': True,
        'seeded': True
    }
    result = schema.load(valid)
    assert result['name'] == valid['name']
    assert result['bracket_size'] == valid['bracket_size']
    
    # Test invalid bracket size
    invalid = {
        'name': 'Weekly 8-Ball',
        'bracket_size': 3,  # Invalid size
        'game_type': '8-ball',
        'race_to': 3
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(invalid)
    assert 'bracket_size' in exc.value.messages

def test_match_schema():
    """Test MatchSchema validation."""
    schema = MatchSchema()
    
    # Test valid match
    valid = {
        'player1_id': 1,
        'player2_id': 2,
        'game_type': '8-ball',
        'race_to': 3,
        'time_slot': {
            'start_time': '14:00',
            'end_time': '15:00'
        },
        'table_number': 1
    }
    result = schema.load(valid)
    assert result['player1_id'] == valid['player1_id']
    assert result['player2_id'] == valid['player2_id']
    
    # Test same players
    invalid = {
        'player1_id': 1,
        'player2_id': 1,  # Same player
        'game_type': '8-ball',
        'race_to': 3,
        'time_slot': {
            'start_time': '14:00',
            'end_time': '15:00'
        }
    }
    with pytest.raises(ValidationError) as exc:
        schema.load(invalid)
    assert 'player2_id' in exc.value.messages