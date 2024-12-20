import pytest
import json
from datetime import datetime, timedelta
from src.models import User, Game, Match, Location

def test_user_registration(client):
    """Test user registration endpoint."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'securepass123'
    })
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'id' in data
    assert data['username'] == 'newuser'
    assert data['email'] == 'newuser@example.com'
    assert 'verification_email_sent' in data

def test_user_login(client, sample_user):
    """Test user login endpoint."""
    response = client.post('/api/auth/login', json={
        'email': sample_user.email,
        'password': 'samplepass123'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert data['user']['id'] == sample_user.id

def test_game_creation(client, auth_headers):
    """Test game creation endpoint."""
    response = client.post('/api/games', json={
        'game_type': 'eight_ball',
        'is_ranked': True
    }, headers=auth_headers)
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['game_type'] == 'eight_ball'
    assert data['is_ranked'] is True
    assert data['status'] == 'pending'

def test_match_scheduling(client, auth_headers, sample_location):
    """Test match scheduling endpoint."""
    tomorrow = (datetime.now() + timedelta(days=1)).isoformat()
    
    response = client.post('/api/matches', json={
        'game_type': 'eight_ball',
        'location_id': sample_location.id,
        'scheduled_time': tomorrow,
        'opponent_id': 2  # Assuming opponent exists
    }, headers=auth_headers)
    
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['game_type'] == 'eight_ball'
    assert data['location']['id'] == sample_location.id
    assert data['status'] == 'scheduled'

def test_location_listing(client):
    """Test location listing endpoint."""
    response = client.get('/api/locations')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert all('id' in loc for loc in data)
    assert all('name' in loc for loc in data)

def test_location_search(client, sample_location):
    """Test location search endpoint."""
    response = client.get('/api/locations/search', query_string={
        'city': sample_location.city
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]['city'] == sample_location.city

def test_game_status_update(client, auth_headers, sample_game):
    """Test game status update endpoint."""
    response = client.patch(f'/api/games/{sample_game.id}', json={
        'status': 'completed',
        'winner_id': sample_game.player1_id,
        'player1_score': 7,
        'player2_score': 5
    }, headers=auth_headers)
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'completed'
    assert data['winner_id'] == sample_game.player1_id
    assert data['player1_score'] == 7
    assert data['player2_score'] == 5

def test_match_confirmation(client, auth_headers, sample_match):
    """Test match confirmation endpoint."""
    response = client.post(
        f'/api/matches/{sample_match.id}/confirm',
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['player1_confirmed'] is True

def test_match_cancellation(client, auth_headers, sample_match):
    """Test match cancellation endpoint."""
    response = client.post(
        f'/api/matches/{sample_match.id}/cancel',
        json={'reason': 'Schedule conflict'},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'cancelled'
    assert data['cancellation_reason'] == 'Schedule conflict'

def test_user_profile(client, auth_headers, sample_user):
    """Test user profile endpoint."""
    response = client.get('/api/users/profile', headers=auth_headers)
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == sample_user.id
    assert data['username'] == sample_user.username
    assert data['email'] == sample_user.email

def test_user_stats(client, auth_headers, sample_user, completed_game):
    """Test user statistics endpoint."""
    response = client.get('/api/users/stats', headers=auth_headers)
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'total_games' in data
    assert 'wins' in data
    assert 'losses' in data
    assert 'win_rate' in data

def test_error_handling(client, auth_headers):
    """Test API error handling."""
    # Test 404
    response = client.get('/api/nonexistent', headers=auth_headers)
    assert response.status_code == 404
    
    # Test 400
    response = client.post('/api/games', json={
        'invalid_field': 'value'
    }, headers=auth_headers)
    assert response.status_code == 400
    
    # Test 401
    response = client.get('/api/users/profile')
    assert response.status_code == 401

def test_rate_limiting(client, auth_headers):
    """Test API rate limiting."""
    # Make multiple requests in quick succession
    responses = []
    for _ in range(100):
        response = client.get('/api/locations', headers=auth_headers)
        responses.append(response)
    
    # Check if rate limiting was applied
    assert any(r.status_code == 429 for r in responses)

def test_pagination(client):
    """Test API pagination."""
    response = client.get('/api/locations', query_string={
        'page': 1,
        'per_page': 10
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'items' in data
    assert 'total' in data
    assert 'page' in data
    assert 'pages' in data
    assert len(data['items']) <= 10

def test_filtering_and_sorting(client, sample_game):
    """Test API filtering and sorting."""
    response = client.get('/api/games', query_string={
        'game_type': 'eight_ball',
        'status': 'in_progress',
        'sort': '-created_at'
    })
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert all(game['game_type'] == 'eight_ball' for game in data)
    assert all(game['status'] == 'in_progress' for game in data)
    
    # Verify sorting
    dates = [game['created_at'] for game in data]
    assert dates == sorted(dates, reverse=True) 