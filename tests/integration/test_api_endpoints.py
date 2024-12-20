import pytest
import json
from datetime import datetime, timedelta
from src.core.game.state import GameType, GameStatus
from src.core.game.shot import ShotType, ShotResult

def test_user_registration(client):
    """Test user registration endpoint."""
    data = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "securepass123"
    }
    response = client.post('/api/auth/register', 
                         data=json.dumps(data),
                         content_type='application/json')
    
    assert response.status_code == 201
    assert 'id' in response.json
    assert 'username' in response.json
    assert response.json['username'] == "newuser"

def test_user_login(client, user):
    """Test user login endpoint."""
    data = {
        "email": user.email,
        "password": "password123"
    }
    response = client.post('/api/auth/login',
                         data=json.dumps(data),
                         content_type='application/json')
    
    assert response.status_code == 200
    assert 'access_token' in response.json
    assert 'refresh_token' in response.json

def test_venue_creation(client, admin_headers):
    """Test venue creation endpoint."""
    data = {
        "name": "New Venue",
        "address": "456 New St",
        "city": "New City",
        "state": "NS",
        "zip_code": "54321",
        "phone": "987-654-3210"
    }
    response = client.post('/api/venues',
                         data=json.dumps(data),
                         content_type='application/json',
                         headers=admin_headers)
    
    assert response.status_code == 201
    assert response.json['name'] == "New Venue"
    assert response.json['address'] == "456 New St"

def test_venue_list(client, auth_headers):
    """Test venue listing endpoint."""
    response = client.get('/api/venues',
                        headers=auth_headers)
    
    assert response.status_code == 200
    assert isinstance(response.json, list)

def test_game_creation(client, auth_headers, venue):
    """Test game creation endpoint."""
    data = {
        "venue_id": venue.id,
        "game_type": "8ball",
        "players": []
    }
    response = client.post('/api/games',
                         data=json.dumps(data),
                         content_type='application/json',
                         headers=auth_headers)
    
    assert response.status_code == 201
    assert response.json['venue_id'] == venue.id
    assert response.json['game_type'] == "8ball"
    assert response.json['status'] == "active"

def test_tournament_creation(client, admin_headers, venue):
    """Test tournament creation endpoint."""
    data = {
        "name": "New Tournament",
        "venue_id": venue.id,
        "start_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "end_date": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "max_participants": 32,
        "tournament_type": "single_elimination"
    }
    response = client.post('/api/tournaments',
                         data=json.dumps(data),
                         content_type='application/json',
                         headers=admin_headers)
    
    assert response.status_code == 201
    assert response.json['name'] == "New Tournament"
    assert response.json['venue_id'] == venue.id

def test_tournament_registration(client, auth_headers, tournament):
    """Test tournament registration endpoint."""
    response = client.post(f'/api/tournaments/{tournament.id}/register',
                         headers=auth_headers)
    
    assert response.status_code == 200
    assert 'message' in response.json

def test_game_state_update(client, auth_headers, game):
    """Test game state update endpoint."""
    data = {
        "status": "completed",
        "winner_id": game.created_by_id
    }
    response = client.put(f'/api/games/{game.id}',
                        data=json.dumps(data),
                        content_type='application/json',
                        headers=auth_headers)
    
    assert response.status_code == 200
    assert response.json['status'] == "completed"
    assert response.json['winner_id'] == game.created_by_id

def test_unauthorized_access(client):
    """Test unauthorized access to protected endpoints."""
    response = client.get('/api/venues')
    assert response.status_code == 401

def test_invalid_tournament_dates(client, admin_headers, venue):
    """Test validation of tournament dates."""
    data = {
        "name": "Invalid Tournament",
        "venue_id": venue.id,
        "start_date": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        "end_date": datetime.utcnow().isoformat(),
        "max_participants": 32,
        "tournament_type": "single_elimination"
    }
    response = client.post('/api/tournaments',
                         data=json.dumps(data),
                         content_type='application/json',
                         headers=admin_headers)
    
    assert response.status_code == 400 

def test_game_state_creation(client, auth_headers, venue):
    """Test game state creation endpoint."""
    data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    response = client.post('/api/games/state',
                         data=json.dumps(data),
                         content_type='application/json',
                         headers=auth_headers)
    
    assert response.status_code == 201
    assert response.json['venue_id'] == venue.id
    assert response.json['game_type'] == GameType.EIGHT_BALL.value
    assert response.json['status'] == GameStatus.PENDING.value

def test_game_state_transitions_api(client, auth_headers, venue):
    """Test game state transition endpoints."""
    # Create a game first
    data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    game_response = client.post('/api/games/state',
                              data=json.dumps(data),
                              content_type='application/json',
                              headers=auth_headers)
    
    game_id = game_response.json['id']
    
    # Start game
    start_response = client.post(f'/api/games/{game_id}/start',
                               headers=auth_headers)
    assert start_response.status_code == 200
    assert start_response.json['status'] == GameStatus.ACTIVE.value
    
    # Pause game
    pause_response = client.post(f'/api/games/{game_id}/pause',
                               headers=auth_headers)
    assert pause_response.status_code == 200
    assert pause_response.json['status'] == GameStatus.PAUSED.value
    
    # Resume game
    resume_response = client.post(f'/api/games/{game_id}/resume',
                                headers=auth_headers)
    assert resume_response.status_code == 200
    assert resume_response.json['status'] == GameStatus.ACTIVE.value
    
    # End game
    end_data = {"winner_id": auth_headers['user_id']}
    end_response = client.post(f'/api/games/{game_id}/end',
                             data=json.dumps(end_data),
                             content_type='application/json',
                             headers=auth_headers)
    assert end_response.status_code == 200
    assert end_response.json['status'] == GameStatus.COMPLETED.value

def test_shot_tracking_api(client, auth_headers, venue):
    """Test shot tracking endpoints."""
    # Create a game first
    game_data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    game_response = client.post('/api/games/state',
                              data=json.dumps(game_data),
                              content_type='application/json',
                              headers=auth_headers)
    
    game_id = game_response.json['id']
    
    # Start the game
    client.post(f'/api/games/{game_id}/start', headers=auth_headers)
    
    # Record a shot
    shot_data = {
        "shot_type": ShotType.POWER.value,
        "result": ShotResult.MADE.value,
        "difficulty": 0.8,
        "speed": 15.5,
        "angle": 45.0,
        "position_data": {
            "cue_ball": {"x": 100, "y": 200},
            "target_ball": {"x": 300, "y": 400}
        }
    }
    shot_response = client.post(f'/api/games/{game_id}/shots',
                              data=json.dumps(shot_data),
                              content_type='application/json',
                              headers=auth_headers)
    
    assert shot_response.status_code == 201
    assert shot_response.json['shot_type'] == ShotType.POWER.value
    assert shot_response.json['result'] == ShotResult.MADE.value
    
    # Get shot statistics
    stats_response = client.get(f'/api/players/{auth_headers["user_id"]}/shot-stats',
                              headers=auth_headers)
    
    assert stats_response.status_code == 200
    assert stats_response.json['total_shots'] > 0
    assert 'success_rate' in stats_response.json

def test_game_events_api(client, auth_headers, venue):
    """Test game events endpoints."""
    # Create a game first
    game_data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    game_response = client.post('/api/games/state',
                              data=json.dumps(game_data),
                              content_type='application/json',
                              headers=auth_headers)
    
    game_id = game_response.json['id']
    
    # Get game events
    events_response = client.get(f'/api/games/{game_id}/events',
                               headers=auth_headers)
    
    assert events_response.status_code == 200
    assert isinstance(events_response.json, list)
    
    # Events should be automatically created for game state changes
    start_response = client.post(f'/api/games/{game_id}/start',
                               headers=auth_headers)
    
    events_after_start = client.get(f'/api/games/{game_id}/events',
                                  headers=auth_headers)
    
    assert len(events_after_start.json) > len(events_response.json)
    assert any(event['event_type'] == 'game_started' 
              for event in events_after_start.json)