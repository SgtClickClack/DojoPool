"""Tests for leaderboard API endpoints."""
import pytest
from src.models.leaderboard import Leaderboard

def test_get_leaderboard(client, session, user):
    """Test getting leaderboard entries through API."""
    # Create test entries
    entries = [
        Leaderboard(user_id=user.id, type='overall', rank=1, score=100.0),
        Leaderboard(user_id=user.id, type='monthly', period='2024-01', rank=2, score=50.0)
    ]
    session.add_all(entries)
    session.commit()
    
    # Test getting overall leaderboard
    response = client.get('/api/leaderboard?category=overall')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['type'] == 'overall'
    assert data[0]['score'] == 100.0
    assert data[0]['username'] == user.username
    assert data[0]['avatar_url'] == user.avatar_url
    
    # Test getting monthly leaderboard
    response = client.get('/api/leaderboard?category=monthly&period=2024-01')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]['type'] == 'monthly'
    assert data[0]['period'] == '2024-01'
    assert data[0]['score'] == 50.0
    assert data[0]['username'] == user.username
    assert data[0]['avatar_url'] == user.avatar_url

def test_get_user_rankings(client, session, user):
    """Test getting user rankings through API."""
    # Create test entries
    entries = [
        Leaderboard(user_id=user.id, type='overall', rank=1, score=100.0),
        Leaderboard(user_id=user.id, type='monthly', period='2024-01', rank=2, score=50.0)
    ]
    session.add_all(entries)
    session.commit()
    
    # Test getting user rankings
    response = client.get(f'/api/leaderboard/user/{user.id}')
    assert response.status_code == 200
    data = response.get_json()
    
    assert 'overall' in data
    assert data['overall']['rank'] == 1
    assert data['overall']['score'] == 100.0
    
    assert 'monthly' in data
    assert data['monthly']['rank'] == 2
    assert data['monthly']['score'] == 50.0
    assert data['monthly']['period'] == '2024-01'

def test_update_score(client, session, user):
    """Test updating user score through API."""
    # Test creating new entry
    response = client.post('/api/leaderboard/update', json={
        'user_id': user.id,
        'category': 'overall',
        'score_change': 50.0
    })
    assert response.status_code == 200
    
    # Verify entry was created
    entry = Leaderboard.query.filter_by(user_id=user.id, type='overall').first()
    assert entry is not None
    assert entry.score == 50.0
    
    # Test updating existing entry
    response = client.post('/api/leaderboard/update', json={
        'user_id': user.id,
        'category': 'overall',
        'score_change': 25.0
    })
    assert response.status_code == 200
    
    # Verify score was updated
    entry = Leaderboard.query.filter_by(user_id=user.id, type='overall').first()
    assert entry.score == 75.0  # 50.0 + 25.0

def test_refresh_rankings(client, session, user):
    """Test refreshing rankings through API."""
    # Create test entries
    entries = [
        Leaderboard(user_id=user.id, type='overall', score=100.0),
        Leaderboard(user_id=user.id + 1, type='overall', score=200.0),
        Leaderboard(user_id=user.id + 2, type='overall', score=150.0)
    ]
    session.add_all(entries)
    session.commit()
    
    # Test refreshing rankings
    response = client.post('/api/leaderboard/refresh', json={
        'category': 'overall'
    })
    assert response.status_code == 200
    
    # Verify rankings were updated
    entries = Leaderboard.query.filter_by(type='overall').order_by(Leaderboard.score.desc()).all()
    assert entries[0].rank == 1
    assert entries[0].score == 200.0
    assert entries[1].rank == 2
    assert entries[1].score == 150.0
    assert entries[2].rank == 3
    assert entries[2].score == 100.0

def test_missing_required_fields(client):
    """Test error handling for missing required fields."""
    # Test missing user_id
    response = client.post('/api/leaderboard/update', json={
        'category': 'overall',
        'score_change': 50.0
    })
    assert response.status_code == 400
    
    # Test missing score_change
    response = client.post('/api/leaderboard/update', json={
        'user_id': 1,
        'category': 'overall'
    })
    assert response.status_code == 400 