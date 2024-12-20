import pytest
from werkzeug.exceptions import (
    NotFound,
    Unauthorized,
    Forbidden,
    BadRequest,
    MethodNotAllowed,
    TooManyRequests
)
from src.api.errors import (
    ValidationError,
    ResourceNotFoundError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError
)

def test_404_handler(client):
    """Test handling of 404 Not Found errors."""
    response = client.get('/api/nonexistent')
    assert response.status_code == 404
    assert response.json['error'] == 'Not Found'
    assert 'message' in response.json

def test_401_handler(client):
    """Test handling of 401 Unauthorized errors."""
    response = client.get('/api/users/profile')  # Protected route without token
    assert response.status_code == 401
    assert response.json['error'] == 'Unauthorized'
    assert 'message' in response.json

def test_403_handler(client, auth_headers):
    """Test handling of 403 Forbidden errors."""
    # Attempt to access admin-only route with non-admin user
    response = client.get('/api/admin/users', headers=auth_headers)
    assert response.status_code == 403
    assert response.json['error'] == 'Forbidden'
    assert 'message' in response.json

def test_400_handler(client, auth_headers):
    """Test handling of 400 Bad Request errors."""
    # Send invalid game data
    response = client.post('/api/games', json={
        'invalid_field': 'value'
    }, headers=auth_headers)
    assert response.status_code == 400
    assert response.json['error'] == 'Bad Request'
    assert 'message' in response.json

def test_405_handler(client):
    """Test handling of 405 Method Not Allowed errors."""
    response = client.put('/api/auth/login')  # PUT not allowed for login
    assert response.status_code == 405
    assert response.json['error'] == 'Method Not Allowed'
    assert 'message' in response.json

def test_429_handler(client, auth_headers):
    """Test handling of 429 Too Many Requests errors."""
    # Make too many requests in succession
    responses = []
    for _ in range(100):
        response = client.get('/api/locations', headers=auth_headers)
        responses.append(response)
    
    rate_limited = next(r for r in responses if r.status_code == 429)
    assert rate_limited.json['error'] == 'Too Many Requests'
    assert 'message' in rate_limited.json
    assert 'retry_after' in rate_limited.json

def test_validation_error_handler(client, auth_headers):
    """Test handling of validation errors."""
    # Send invalid match data
    response = client.post('/api/matches', json={
        'game_type': 'invalid_type',
        'scheduled_time': 'invalid_date'
    }, headers=auth_headers)
    
    assert response.status_code == 400
    assert response.json['error'] == 'Validation Error'
    assert 'errors' in response.json
    assert isinstance(response.json['errors'], dict)

def test_resource_not_found_handler(client, auth_headers):
    """Test handling of resource not found errors."""
    # Try to get nonexistent game
    response = client.get('/api/games/99999', headers=auth_headers)
    assert response.status_code == 404
    assert response.json['error'] == 'Resource Not Found'
    assert 'resource_type' in response.json
    assert response.json['resource_type'] == 'Game'

def test_authentication_error_handler(client):
    """Test handling of authentication errors."""
    # Send invalid token
    response = client.get('/api/users/profile', headers={
        'Authorization': 'Bearer invalid_token'
    })
    assert response.status_code == 401
    assert response.json['error'] == 'Authentication Error'
    assert 'message' in response.json

def test_authorization_error_handler(client, auth_headers):
    """Test handling of authorization errors."""
    # Try to update another user's game
    response = client.patch('/api/games/99999', json={
        'status': 'completed'
    }, headers=auth_headers)
    
    assert response.status_code == 403
    assert response.json['error'] == 'Authorization Error'
    assert 'message' in response.json

def test_rate_limit_error_handler(client, auth_headers):
    """Test handling of rate limit errors."""
    def trigger_rate_limit():
        return client.get('/api/locations', headers=auth_headers)
    
    # Make requests until rate limit is hit
    response = None
    for _ in range(100):
        response = trigger_rate_limit()
        if response.status_code == 429:
            break
    
    assert response.status_code == 429
    assert response.json['error'] == 'Rate Limit Exceeded'
    assert 'retry_after' in response.json
    assert isinstance(response.json['retry_after'], int)

def test_database_error_handler(client, auth_headers, mocker):
    """Test handling of database errors."""
    # Mock database error
    mocker.patch('src.models.Game.query', side_effect=Exception('Database error'))
    
    response = client.get('/api/games', headers=auth_headers)
    assert response.status_code == 500
    assert response.json['error'] == 'Internal Server Error'
    assert 'message' in response.json

def test_malformed_json_handler(client, auth_headers):
    """Test handling of malformed JSON."""
    response = client.post(
        '/api/games',
        data='invalid json',
        content_type='application/json',
        headers=auth_headers
    )
    assert response.status_code == 400
    assert response.json['error'] == 'Malformed JSON'
    assert 'message' in response.json

def test_error_logging(client, auth_headers, caplog):
    """Test error logging functionality."""
    # Trigger an error that should be logged
    response = client.get('/api/games/99999', headers=auth_headers)
    
    # Check if error was logged
    assert any(
        record.levelname == 'ERROR' and 'Resource not found' in record.message
        for record in caplog.records
    )

def test_error_response_format(client):
    """Test consistent error response format across different error types."""
    # Test various error endpoints
    endpoints = [
        '/api/nonexistent',  # 404
        '/api/users/profile',  # 401
        '/api/games/99999',   # 404 with different handler
    ]
    
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert 'error' in response.json
        assert 'message' in response.json
        assert isinstance(response.json['error'], str)
        assert isinstance(response.json['message'], str)

def test_custom_error_handling(client, auth_headers):
    """Test handling of custom application errors."""
    # Test various custom error scenarios
    test_cases = [
        {
            'endpoint': '/api/games/validate',
            'method': 'post',
            'data': {'invalid': 'data'},
            'expected_status': 400,
            'expected_error': 'Validation Error'
        },
        {
            'endpoint': '/api/matches/99999/confirm',
            'method': 'post',
            'data': {},
            'expected_status': 404,
            'expected_error': 'Resource Not Found'
        }
    ]
    
    for case in test_cases:
        method = getattr(client, case['method'])
        response = method(
            case['endpoint'],
            json=case.get('data'),
            headers=auth_headers
        )
        assert response.status_code == case['expected_status']
        assert response.json['error'] == case['expected_error'] 