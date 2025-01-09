import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app
from services.predictive_analytics_service import PredictiveAnalyticsService
from utils.auth import get_current_user

client = TestClient(app)

@pytest.fixture
def mock_current_user():
    return {
        'id': 'test_user_id',
        'username': 'test_user',
        'email': 'test@example.com'
    }

@pytest.fixture
def mock_performance_history():
    start_date = datetime.now() - timedelta(days=90)
    return [
        {
            'date': (start_date + timedelta(days=i)).strftime('%Y-%m-%d'),
            'metric_value': 0.7 + (i / 90) * 0.2,
            'metric_type': 'accuracy'
        }
        for i in range(90)
    ]

@pytest.fixture
def mock_training_history():
    start_date = datetime.now() - timedelta(days=90)
    return [
        {
            'date': (start_date + timedelta(days=i)).strftime('%Y-%m-%d'),
            'skill_value': 0.5 + (i / 90) * 0.3,
            'skill_type': 'shot_accuracy'
        }
        for i in range(90)
    ]

@pytest.fixture
def mock_match_history():
    return [
        {
            'player_id': 'test_user_id',
            'opponent_id': 'opponent_1',
            'winner_id': 'test_user_id',
            'score': 21,
            'date': '2023-01-01'
        },
        {
            'player_id': 'opponent_1',
            'opponent_id': 'test_user_id',
            'winner_id': 'opponent_1',
            'score': 21,
            'date': '2023-01-02'
        }
    ]

def test_forecast_performance(
    mock_current_user,
    mock_performance_history,
    monkeypatch
):
    """Test performance forecast endpoint."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    response = client.post(
        '/api/predictive/performance/forecast',
        json=mock_performance_history,
        params={
            'target_metrics': ['accuracy'],
            'horizon_days': 30
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'data' in data
    assert 'forecasts' in data['data']
    assert 'confidence_intervals' in data['data']

def test_predict_progression(
    mock_current_user,
    mock_training_history,
    monkeypatch
):
    """Test skill progression prediction endpoint."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    response = client.post(
        '/api/predictive/skills/progression',
        json=mock_training_history,
        params={
            'target_skills': ['shot_accuracy'],
            'prediction_weeks': 12
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'data' in data
    assert 'progression_predictions' in data['data']
    assert 'milestones' in data['data']

def test_predict_matchup(
    mock_current_user,
    mock_match_history,
    monkeypatch
):
    """Test matchup prediction endpoint."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    response = client.post(
        '/api/predictive/matchups/predict',
        json=mock_match_history,
        params={'opponent_id': 'opponent_1'}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'data' in data
    assert 'win_probability' in data['data']
    assert 'score_predictions' in data['data']
    assert 'player_stats' in data['data']
    assert 'opponent_stats' in data['data']

def test_get_model_metrics(mock_current_user, monkeypatch):
    """Test model metrics endpoint."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    response = client.get('/api/predictive/models/metrics')
    
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'data' in data
    assert 'metrics' in data['data']
    
    metrics = data['data']['metrics']
    assert 'performance_forecast' in metrics
    assert 'skill_progression' in metrics
    assert 'matchup_prediction' in metrics

def test_rate_limiting(mock_current_user, monkeypatch):
    """Test rate limiting on endpoints."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    # Make multiple requests to trigger rate limiting
    for _ in range(60):
        response = client.get('/api/predictive/models/metrics')
    
    assert response.status_code == 429
    data = response.json()
    assert 'detail' in data

def test_invalid_input_handling(mock_current_user, monkeypatch):
    """Test handling of invalid input data."""
    async def mock_get_current_user():
        return mock_current_user
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    # Test with invalid performance history
    response = client.post(
        '/api/predictive/performance/forecast',
        json=[{'invalid': 'data'}],
        params={
            'target_metrics': ['accuracy'],
            'horizon_days': 30
        }
    )
    assert response.status_code == 422
    
    # Test with invalid training history
    response = client.post(
        '/api/predictive/skills/progression',
        json=[{'invalid': 'data'}],
        params={
            'target_skills': ['shot_accuracy'],
            'prediction_weeks': 12
        }
    )
    assert response.status_code == 422
    
    # Test with invalid match history
    response = client.post(
        '/api/predictive/matchups/predict',
        json=[{'invalid': 'data'}],
        params={'opponent_id': 'opponent_1'}
    )
    assert response.status_code == 422

def test_authentication_required(monkeypatch):
    """Test that endpoints require authentication."""
    async def mock_get_current_user():
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    monkeypatch.setattr(
        'routes.api.predictive_analytics.get_current_user',
        mock_get_current_user
    )
    
    endpoints = [
        ('/api/predictive/performance/forecast', 'POST'),
        ('/api/predictive/skills/progression', 'POST'),
        ('/api/predictive/matchups/predict', 'POST'),
        ('/api/predictive/models/metrics', 'GET')
    ]
    
    for endpoint, method in endpoints:
        if method == 'GET':
            response = client.get(endpoint)
        else:
            response = client.post(endpoint, json=[])
        
        assert response.status_code == 401
        data = response.json()
        assert 'detail' in data 