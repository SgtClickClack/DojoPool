import pytest
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from src.core.game.state import GameType, GameStatus
from src.core.game.shot import ShotType, ShotResult

def measure_response_time(client, method, url, **kwargs):
    """Measure response time for an API request."""
    start_time = time.time()
    response = getattr(client, method)(url, **kwargs)
    end_time = time.time()
    return end_time - start_time, response

def test_venue_list_performance(client, auth_headers):
    """Test performance of venue listing endpoint."""
    response_times = []
    
    # Make multiple requests and measure response times
    for _ in range(10):
        duration, response = measure_response_time(
            client, 'get', '/api/venues',
            headers=auth_headers
        )
        assert response.status_code == 200
        response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    p95_response_time = statistics.quantiles(response_times, n=20)[18]  # 95th percentile
    
    # Assert performance requirements
    assert avg_response_time < 0.5  # Average response time should be under 500ms
    assert p95_response_time < 1.0  # 95th percentile should be under 1 second

def test_game_creation_performance(client, auth_headers, venue):
    """Test performance of game creation endpoint."""
    response_times = []
    
    data = {
        "venue_id": venue.id,
        "game_type": "8ball",
        "players": []
    }
    
    # Make multiple requests and measure response times
    for _ in range(5):
        duration, response = measure_response_time(
            client, 'post', '/api/games',
            json=data,
            headers=auth_headers
        )
        assert response.status_code == 201
        response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    max_response_time = max(response_times)
    
    # Assert performance requirements
    assert avg_response_time < 1.0  # Average response time should be under 1 second
    assert max_response_time < 2.0  # Maximum response time should be under 2 seconds

def test_concurrent_requests(client, auth_headers):
    """Test API performance under concurrent load."""
    def make_request():
        return measure_response_time(
            client, 'get', '/api/venues',
            headers=auth_headers
        )
    
    response_times = []
    max_workers = 10
    num_requests = 20
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_request = {
            executor.submit(make_request): i 
            for i in range(num_requests)
        }
        
        for future in as_completed(future_to_request):
            duration, response = future.result()
            assert response.status_code == 200
            response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    p95_response_time = statistics.quantiles(response_times, n=20)[18]
    
    # Assert performance under load
    assert avg_response_time < 1.0  # Average response time under load
    assert p95_response_time < 2.0  # 95th percentile under load

def test_database_query_performance(client, auth_headers, session):
    """Test database query performance."""
    from src.core.models import Venue
    from sqlalchemy import func
    import time
    
    # Measure time for complex database query
    start_time = time.time()
    result = session.query(
        Venue,
        func.count(Venue.tournaments).label('tournament_count')
    ).join(
        Venue.tournaments
    ).group_by(
        Venue
    ).all()
    query_time = time.time() - start_time
    
    # Assert query performance
    assert query_time < 0.5  # Complex query should complete under 500ms

def test_api_response_size(client, auth_headers):
    """Test API response payload sizes."""
    response = client.get('/api/venues', headers=auth_headers)
    response_size = len(response.get_data())
    
    # Assert response size limits
    assert response_size < 1024 * 1024  # Response should be under 1MB

def test_authentication_performance(client):
    """Test authentication endpoint performance."""
    response_times = []
    
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    
    # Make multiple authentication requests
    for _ in range(5):
        duration, response = measure_response_time(
            client, 'post', '/api/auth/login',
            json=data
        )
        response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    
    # Assert authentication performance
    assert avg_response_time < 0.5  # Auth should complete under 500ms 

def test_game_state_performance(client, auth_headers, venue):
    """Test game state system performance."""
    response_times = []
    
    # Create multiple games and measure response times
    for _ in range(10):
        data = {
            "venue_id": venue.id,
            "game_type": GameType.EIGHT_BALL.value,
            "table_number": 1
        }
        duration, response = measure_response_time(
            client, 'post', '/api/games/state',
            json=data,
            headers=auth_headers
        )
        assert response.status_code == 201
        response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    p95_response_time = statistics.quantiles(response_times, n=20)[18]
    
    # Assert performance requirements
    assert avg_response_time < 0.5  # Average response time should be under 500ms
    assert p95_response_time < 1.0  # 95th percentile should be under 1 second

def test_shot_tracking_performance(client, auth_headers, venue):
    """Test shot tracking system performance."""
    # Create a game first
    game_data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    game_response = client.post('/api/games/state',
                              json=game_data,
                              headers=auth_headers)
    
    game_id = game_response.json['id']
    client.post(f'/api/games/{game_id}/start', headers=auth_headers)
    
    response_times = []
    
    # Record multiple shots and measure response times
    for _ in range(20):
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
        duration, response = measure_response_time(
            client, 'post', f'/api/games/{game_id}/shots',
            json=shot_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        response_times.append(duration)
    
    avg_response_time = statistics.mean(response_times)
    max_response_time = max(response_times)
    
    # Assert performance requirements
    assert avg_response_time < 0.3  # Average response time should be under 300ms
    assert max_response_time < 1.0  # Maximum response time should be under 1 second

def test_concurrent_game_operations(client, auth_headers, venue):
    """Test game system performance under concurrent load."""
    def create_and_play_game():
        # Create game
        game_data = {
            "venue_id": venue.id,
            "game_type": GameType.EIGHT_BALL.value,
            "table_number": 1
        }
        game_response = client.post('/api/games/state',
                                  json=game_data,
                                  headers=auth_headers)
        
        game_id = game_response.json['id']
        
        # Start game
        client.post(f'/api/games/{game_id}/start',
                   headers=auth_headers)
        
        # Record some shots
        for _ in range(5):
            shot_data = {
                "shot_type": ShotType.POWER.value,
                "result": ShotResult.MADE.value,
                "difficulty": 0.8
            }
            client.post(f'/api/games/{game_id}/shots',
                       json=shot_data,
                       headers=auth_headers)
        
        # End game
        end_data = {"winner_id": auth_headers['user_id']}
        return client.post(f'/api/games/{game_id}/end',
                         json=end_data,
                         headers=auth_headers)
    
    start_time = time.time()
    max_workers = 5
    num_games = 10
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(create_and_play_game) 
                  for _ in range(num_games)]
        
        for future in as_completed(futures):
            response = future.result()
            assert response.status_code == 200
            assert response.json['status'] == GameStatus.COMPLETED.value
    
    total_time = time.time() - start_time
    
    # Assert performance under load
    assert total_time < num_games  # Should process all games in less than 1 second per game

def test_game_events_query_performance(client, auth_headers, venue):
    """Test game events query performance with large number of events."""
    # Create a game with many events
    game_data = {
        "venue_id": venue.id,
        "game_type": GameType.EIGHT_BALL.value,
        "table_number": 1
    }
    game_response = client.post('/api/games/state',
                              json=game_data,
                              headers=auth_headers)
    
    game_id = game_response.json['id']
    client.post(f'/api/games/{game_id}/start', headers=auth_headers)
    
    # Generate many events
    for _ in range(50):
        shot_data = {
            "shot_type": ShotType.POWER.value,
            "result": ShotResult.MADE.value
        }
        client.post(f'/api/games/{game_id}/shots',
                   json=shot_data,
                   headers=auth_headers)
    
    # Measure time to query events
    duration, response = measure_response_time(
        client, 'get', f'/api/games/{game_id}/events',
        headers=auth_headers
    )
    
    assert response.status_code == 200
    assert len(response.json) >= 50  # Should have at least 50 events
    assert duration < 1.0  # Should retrieve events in under 1 second