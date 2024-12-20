import pytest
import jwt
from datetime import datetime, timedelta
from src.models import User, Game, Match, Location
from src.config import Config

@pytest.fixture
def client(app):
    """Create a test client."""
    return app.test_client()

@pytest.fixture
def auth_headers(sample_user):
    """Create authentication headers with JWT token."""
    token = jwt.encode(
        {
            'user_id': sample_user.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        },
        Config.JWT_SECRET_KEY,
        algorithm='HS256'
    )
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def admin_user(user_factory):
    """Create an admin user."""
    return user_factory(
        username='admin',
        email='admin@example.com',
        password='adminpass123',
        is_admin=True
    )

@pytest.fixture
def admin_headers(admin_user):
    """Create authentication headers for admin user."""
    token = jwt.encode(
        {
            'user_id': admin_user.id,
            'is_admin': True,
            'exp': datetime.utcnow() + timedelta(days=1)
        },
        Config.JWT_SECRET_KEY,
        algorithm='HS256'
    )
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def expired_token_headers(sample_user):
    """Create expired authentication headers."""
    token = jwt.encode(
        {
            'user_id': sample_user.id,
            'exp': datetime.utcnow() - timedelta(days=1)
        },
        Config.JWT_SECRET_KEY,
        algorithm='HS256'
    )
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def invalid_token_headers():
    """Create invalid authentication headers."""
    return {'Authorization': 'Bearer invalid_token'}

@pytest.fixture
def game_data():
    """Create sample game data."""
    return {
        'game_type': 'eight_ball',
        'is_ranked': True,
        'status': 'pending'
    }

@pytest.fixture
def match_data(sample_location):
    """Create sample match data."""
    return {
        'game_type': 'eight_ball',
        'location_id': sample_location.id,
        'scheduled_time': (datetime.now() + timedelta(days=1)).isoformat(),
        'notes': 'Friendly match'
    }

@pytest.fixture
def location_data():
    """Create sample location data."""
    return {
        'name': 'Test Pool Hall',
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'postal_code': '12345',
        'country': 'Test Country',
        'operating_hours': {
            'monday': '9:00-22:00',
            'tuesday': '9:00-22:00',
            'wednesday': '9:00-22:00',
            'thursday': '9:00-22:00',
            'friday': '9:00-23:00',
            'saturday': '10:00-23:00',
            'sunday': '10:00-22:00'
        },
        'amenities': {
            'tables': 10,
            'has_bar': True,
            'has_restaurant': False,
            'parking_available': True
        }
    }

@pytest.fixture
def user_data():
    """Create sample user registration data."""
    return {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpass123'
    }

@pytest.fixture
def mock_rate_limit(mocker):
    """Mock rate limiting for tests."""
    return mocker.patch('src.api.decorators.rate_limit', return_value=True)

@pytest.fixture
def mock_email_service(mocker):
    """Mock email service for tests."""
    return mocker.patch('src.email.service.send_email', return_value=True)

@pytest.fixture
def mock_notification_service(mocker):
    """Mock notification service for tests."""
    return mocker.patch('src.notifications.service.send_notification', return_value=True)

@pytest.fixture
def api_version():
    """Get current API version."""
    return 'v1'

@pytest.fixture
def api_base_url(api_version):
    """Get base URL for API endpoints."""
    return f'/api/{api_version}'

@pytest.fixture
def pagination_params():
    """Get default pagination parameters."""
    return {
        'page': 1,
        'per_page': 10,
        'sort': '-created_at'
    }

@pytest.fixture
def error_responses():
    """Get common error response messages."""
    return {
        'not_found': 'Resource not found',
        'unauthorized': 'Unauthorized access',
        'forbidden': 'Access forbidden',
        'validation_error': 'Validation error',
        'rate_limit': 'Rate limit exceeded'
    } 