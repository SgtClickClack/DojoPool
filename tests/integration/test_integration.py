import pytest
from datetime import datetime, timedelta
from src.models import User, Game, Match, Location
from src.email.service import EmailService
from src.auth.utils import generate_token

def test_complete_user_flow(client, db_session):
    """Test complete user registration, verification, and login flow."""
    # Register new user
    response = client.post('/auth/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'securepass123'
    })
    assert response.status_code == 201
    user_id = response.json['id']
    
    # Verify email
    user = User.query.get(user_id)
    token = generate_token({'user_id': user_id})
    response = client.get(f'/auth/verify-email/{token}')
    assert response.status_code == 200
    
    # Login
    response = client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'securepass123'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_game_match_flow(client, auth_headers, db_session, sample_user, sample_location):
    """Test complete game and match flow."""
    # Create opponent
    opponent = User(
        username='opponent',
        email='opponent@example.com',
        password='password123',
        is_verified=True
    )
    db_session.add(opponent)
    db_session.commit()
    
    # Schedule match
    response = client.post('/api/matches', json={
        'game_type': 'eight_ball',
        'opponent_id': opponent.id,
        'location_id': sample_location.id,
        'scheduled_time': (datetime.now() + timedelta(days=1)).isoformat()
    }, headers=auth_headers)
    assert response.status_code == 201
    match_id = response.json['id']
    
    # Confirm match
    response = client.post(
        f'/api/matches/{match_id}/confirm',
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Start game
    response = client.post(f'/api/matches/{match_id}/start', headers=auth_headers)
    assert response.status_code == 200
    game_id = response.json['game_id']
    
    # Update game score
    response = client.patch(f'/api/games/{game_id}', json={
        'player1_score': 7,
        'player2_score': 5
    }, headers=auth_headers)
    assert response.status_code == 200
    
    # Complete game
    response = client.post(f'/api/games/{game_id}/complete', json={
        'winner_id': sample_user.id
    }, headers=auth_headers)
    assert response.status_code == 200

def test_location_management_flow(client, auth_headers, db_session):
    """Test complete location management flow."""
    # Create location
    response = client.post('/api/locations', json={
        'name': 'New Pool Hall',
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'postal_code': '12345',
        'operating_hours': {
            'monday': '9:00-22:00',
            'tuesday': '9:00-22:00'
        }
    }, headers=auth_headers)
    assert response.status_code == 201
    location_id = response.json['id']
    
    # Update location
    response = client.patch(f'/api/locations/{location_id}', json={
        'name': 'Updated Pool Hall'
    }, headers=auth_headers)
    assert response.status_code == 200
    
    # Search locations
    response = client.get('/api/locations/search?q=Updated', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json) > 0
    
    # Check availability
    response = client.get(
        f'/api/locations/{location_id}/availability?date=2024-01-01',
        headers=auth_headers
    )
    assert response.status_code == 200

def test_user_stats_flow(client, auth_headers, db_session, sample_user):
    """Test user statistics and ranking flow."""
    # Play multiple games
    for i in range(5):
        game = Game(
            game_type='eight_ball',
            player1=sample_user,
            player2_id=i+2,  # Different opponents
            status='completed',
            winner_id=sample_user.id if i % 2 == 0 else i+2
        )
        db_session.add(game)
    db_session.commit()
    
    # Check stats
    response = client.get('/api/users/stats', headers=auth_headers)
    assert response.status_code == 200
    assert response.json['total_games'] == 5
    assert response.json['wins'] == 3  # Won 3 out of 5
    
    # Check ranking
    response = client.get('/api/rankings', headers=auth_headers)
    assert response.status_code == 200
    assert any(r['user_id'] == sample_user.id for r in response.json)

def test_notification_flow(client, auth_headers, db_session, sample_match):
    """Test notification system flow."""
    # Subscribe to notifications
    response = client.post('/api/notifications/subscribe', json={
        'endpoint': 'https://example.com/push',
        'keys': {'p256dh': 'key', 'auth': 'auth'}
    }, headers=auth_headers)
    assert response.status_code == 200
    
    # Trigger match reminder
    response = client.post(
        f'/api/matches/{sample_match.id}/remind',
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Check notifications
    response = client.get('/api/notifications', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json) > 0

def test_search_and_filter_flow(client, auth_headers, db_session, large_dataset):
    """Test search and filter functionality flow."""
    # Search users
    response = client.get('/api/users/search?q=user', headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json) > 0
    
    # Filter games
    response = client.get(
        '/api/games?game_type=eight_ball&status=completed',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert all(g['game_type'] == 'eight_ball' for g in response.json)
    
    # Filter matches
    response = client.get(
        '/api/matches?status=scheduled',
        headers=auth_headers
    )
    assert response.status_code == 200
    assert all(m['status'] == 'scheduled' for m in response.json)

def test_error_handling_flow(client, auth_headers):
    """Test error handling flow across multiple operations."""
    # Invalid game ID
    response = client.get('/api/games/99999', headers=auth_headers)
    assert response.status_code == 404
    
    # Invalid match data
    response = client.post('/api/matches', json={
        'invalid': 'data'
    }, headers=auth_headers)
    assert response.status_code == 400
    
    # Unauthorized access
    response = client.get('/api/admin/users')
    assert response.status_code == 401
    
    # Rate limiting
    for _ in range(200):
        response = client.get('/api/locations', headers=auth_headers)
        if response.status_code == 429:
            break
    assert response.status_code == 429

def test_data_consistency_flow(client, auth_headers, db_session, sample_user):
    """Test data consistency across multiple operations."""
    # Create match and game
    match_response = client.post('/api/matches', json={
        'game_type': 'eight_ball',
        'opponent_id': 2,
        'location_id': 1,
        'scheduled_time': (datetime.now() + timedelta(days=1)).isoformat()
    }, headers=auth_headers)
    assert match_response.status_code == 201
    match_id = match_response.json['id']
    
    # Start game
    game_response = client.post(
        f'/api/matches/{match_id}/start',
        headers=auth_headers
    )
    assert game_response.status_code == 200
    game_id = game_response.json['game_id']
    
    # Verify consistency
    match = Match.query.get(match_id)
    game = Game.query.get(game_id)
    assert match.game_id == game.id
    assert game.player1_id == match.player1_id
    assert game.player2_id == match.player2_id

def test_concurrent_operations_flow(client, auth_headers, db_session):
    """Test handling of concurrent operations."""
    import threading
    
    def create_game():
        client.post('/api/games', json={
            'game_type': 'eight_ball',
            'opponent_id': 2
        }, headers=auth_headers)
    
    # Create multiple games concurrently
    threads = []
    for _ in range(10):
        thread = threading.Thread(target=create_game)
        threads.append(thread)
        thread.start()
    
    for thread in threads:
        thread.join()
    
    # Verify all games were created correctly
    games = Game.query.all()
    assert len(games) == 10
    assert len(set(g.id for g in games)) == 10  # No duplicate IDs

def test_cleanup_flow(client, auth_headers, db_session):
    """Test cleanup operations and data integrity."""
    # Create test data
    match = Match(
        game_type='eight_ball',
        player1_id=1,
        player2_id=2,
        location_id=1,
        scheduled_time=datetime.now() - timedelta(days=1),
        status='scheduled'
    )
    db_session.add(match)
    db_session.commit()
    
    # Cancel expired match
    response = client.post(
        f'/api/matches/{match.id}/cancel',
        json={'reason': 'Expired'},
        headers=auth_headers
    )
    assert response.status_code == 200
    
    # Verify cleanup
    match = Match.query.get(match.id)
    assert match.status == 'cancelled'
    assert match.cancellation_reason == 'Expired' 