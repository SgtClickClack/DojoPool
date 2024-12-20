import pytest
from flask import url_for
from src.core.validation import get_validator
from src.core.validation.schemas import UserSchema, LoginSchema

def test_validation_initialization(test_client, app):
    """Test validation system initialization."""
    # Verify validators are registered
    assert hasattr(app, 'validators')
    assert 'user' in app.validators
    assert 'login' in app.validators
    assert 'game_settings' in app.validators

def test_validation_in_auth_flow(test_client):
    """Test validation in authentication flow."""
    # Test registration with invalid data
    invalid_registration = {
        'email': 'invalid-email',
        'password': '123',  # Too short
        'name': 'T'  # Too short
    }
    response = test_client.post('/auth/register', json=invalid_registration)
    assert response.status_code == 400
    assert 'email' in response.json['errors']
    assert 'password' in response.json['errors']
    
    # Test registration with valid data
    valid_registration = {
        'email': 'test@example.com',
        'password': 'Password123!',
        'name': 'Test User'
    }
    response = test_client.post('/auth/register', json=valid_registration)
    assert response.status_code == 201
    
    # Test login with invalid data
    invalid_login = {
        'email': 'invalid-email',
        'password': ''
    }
    response = test_client.post('/auth/login', json=invalid_login)
    assert response.status_code == 400
    assert 'email' in response.json['errors']
    
    # Test login with valid data
    valid_login = {
        'email': 'test@example.com',
        'password': 'Password123!'
    }
    response = test_client.post('/auth/login', json=valid_login)
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_validation_in_game_settings(test_client, auth_token):
    """Test validation in game settings."""
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test invalid game settings
    invalid_settings = {
        'max_players': 10,  # Too many players
        'time_limit': 30,  # Too short
        'difficulty': 'extreme'  # Invalid difficulty
    }
    response = test_client.post(
        '/game/settings',
        json=invalid_settings,
        headers=headers
    )
    assert response.status_code == 400
    assert 'max_players' in response.json['errors']
    assert 'time_limit' in response.json['errors']
    assert 'difficulty' in response.json['errors']
    
    # Test valid game settings
    valid_settings = {
        'max_players': 6,
        'time_limit': 600,
        'difficulty': 'hard',
        'enable_hints': True
    }
    response = test_client.post(
        '/game/settings',
        json=valid_settings,
        headers=headers
    )
    assert response.status_code == 200

def test_validation_error_handling(test_client):
    """Test validation error handling."""
    # Test malformed JSON
    response = test_client.post(
        '/auth/register',
        data='invalid json',
        content_type='application/json'
    )
    assert response.status_code == 400
    assert 'error' in response.json
    
    # Test missing required fields
    response = test_client.post(
        '/auth/register',
        json={'email': 'test@example.com'}  # Missing password
    )
    assert response.status_code == 400
    assert 'password' in response.json['errors']

def test_validation_with_file_upload(test_client, auth_token):
    """Test validation with file upload."""
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test invalid file type
    data = {
        'file_type': 'invalid',
        'description': 'Test file'
    }
    files = {
        'file': ('test.txt', b'test content', 'text/plain')
    }
    response = test_client.post(
        '/upload',
        data=data,
        files=files,
        headers=headers
    )
    assert response.status_code == 400
    assert 'file_type' in response.json['errors']
    
    # Test valid file upload
    data = {
        'file_type': 'image',
        'description': 'Test image'
    }
    files = {
        'file': ('test.jpg', b'fake image content', 'image/jpeg')
    }
    response = test_client.post(
        '/upload',
        data=data,
        files=files,
        headers=headers
    )
    assert response.status_code == 201

def test_validation_with_query_params(test_client, auth_token):
    """Test validation with query parameters."""
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test invalid pagination params
    response = test_client.get(
        '/games?page=0&per_page=200',  # Invalid values
        headers=headers
    )
    assert response.status_code == 400
    assert 'page' in response.json['errors']
    assert 'per_page' in response.json['errors']
    
    # Test valid pagination params
    response = test_client.get(
        '/games?page=1&per_page=20',
        headers=headers
    )
    assert response.status_code == 200

def test_validation_with_date_range(test_client, auth_token):
    """Test validation with date range parameters."""
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    # Test invalid date range
    response = test_client.get(
        '/games/history?start_date=2023-12-20&end_date=2023-12-19',  # End before start
        headers=headers
    )
    assert response.status_code == 400
    assert 'end_date' in response.json['errors']
    
    # Test valid date range
    response = test_client.get(
        '/games/history?start_date=2023-12-19&end_date=2023-12-20',
        headers=headers
    )
    assert response.status_code == 200 