import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from services.predictive_analytics_service import PredictiveAnalyticsService

@pytest.fixture
def predictive_service():
    return PredictiveAnalyticsService()

@pytest.fixture
def sample_performance_history():
    start_date = datetime.now() - timedelta(days=90)
    dates = [start_date + timedelta(days=i) for i in range(90)]
    
    return [
        {
            'date': date.strftime('%Y-%m-%d'),
            'accuracy': 0.7 + np.random.normal(0, 0.1),
            'speed': 50 + np.random.normal(0, 5),
            'stamina': 0.8 + np.random.normal(0, 0.05)
        }
        for date in dates
    ]

@pytest.fixture
def sample_training_history():
    start_date = datetime.now() - timedelta(days=90)
    dates = [start_date + timedelta(days=i) for i in range(90)]
    
    base_skill = 0.5
    skill_progression = [
        base_skill + (i / 90) * 0.3 + np.random.normal(0, 0.05)
        for i in range(90)
    ]
    
    return [
        {
            'date': date.strftime('%Y-%m-%d'),
            'shot_accuracy': skill,
            'positioning': skill * 0.9 + np.random.normal(0, 0.05)
        }
        for date, skill in zip(dates, skill_progression)
    ]

@pytest.fixture
def sample_match_history():
    return [
        {
            'player_id': 'player1',
            'opponent_id': 'player2',
            'winner_id': 'player1',
            'score': 21,
            'date': '2023-01-01'
        },
        {
            'player_id': 'player2',
            'opponent_id': 'player1',
            'winner_id': 'player2',
            'score': 21,
            'date': '2023-01-02'
        },
        {
            'player_id': 'player1',
            'opponent_id': 'player3',
            'winner_id': 'player1',
            'score': 21,
            'date': '2023-01-03'
        }
    ]

@pytest.mark.asyncio
async def test_forecast_player_performance(
    predictive_service,
    sample_performance_history
):
    """Test performance forecasting functionality."""
    result = await predictive_service.forecast_player_performance(
        player_id='test_player',
        performance_history=sample_performance_history,
        target_metrics=['accuracy', 'speed', 'stamina'],
        horizon_days=30
    )
    
    assert 'forecasts' in result
    assert 'confidence_intervals' in result
    
    for metric in ['accuracy', 'speed', 'stamina']:
        assert metric in result['forecasts']
        assert 'dates' in result['forecasts'][metric]
        assert 'values' in result['forecasts'][metric]
        assert len(result['forecasts'][metric]['dates']) == 30
        assert len(result['forecasts'][metric]['values']) == 30
        
        assert metric in result['confidence_intervals']
        assert 'lower' in result['confidence_intervals'][metric]
        assert 'upper' in result['confidence_intervals'][metric]
        assert len(result['confidence_intervals'][metric]['lower']) == 30
        assert len(result['confidence_intervals'][metric]['upper']) == 30

@pytest.mark.asyncio
async def test_predict_skill_progression(
    predictive_service,
    sample_training_history
):
    """Test skill progression prediction functionality."""
    result = await predictive_service.predict_skill_progression(
        player_id='test_player',
        training_history=sample_training_history,
        target_skills=['shot_accuracy', 'positioning'],
        prediction_weeks=12
    )
    
    assert 'progression_predictions' in result
    assert 'milestones' in result
    
    for skill in ['shot_accuracy', 'positioning']:
        assert skill in result['progression_predictions']
        assert 'dates' in result['progression_predictions'][skill]
        assert 'values' in result['progression_predictions'][skill]
        assert len(result['progression_predictions'][skill]['dates']) == 12 * 7
        assert len(result['progression_predictions'][skill]['values']) == 12 * 7
        
        assert skill in result['milestones']
        assert isinstance(result['milestones'][skill], list)
        for milestone in result['milestones'][skill]:
            assert 'level' in milestone
            assert 'estimated_date' in milestone

@pytest.mark.asyncio
async def test_predict_matchup_outcomes(
    predictive_service,
    sample_match_history
):
    """Test matchup prediction functionality."""
    result = await predictive_service.predict_matchup_outcomes(
        player_id='player1',
        opponent_id='player2',
        match_history=sample_match_history
    )
    
    assert 'win_probability' in result
    assert 'score_predictions' in result
    assert 'player_stats' in result
    assert 'opponent_stats' in result
    
    assert isinstance(result['win_probability'], float)
    assert 0 <= result['win_probability'] <= 1
    
    assert 'player' in result['score_predictions']
    assert 'opponent' in result['score_predictions']
    assert 'low' in result['score_predictions']['player']
    assert 'high' in result['score_predictions']['player']
    assert 'low' in result['score_predictions']['opponent']
    assert 'high' in result['score_predictions']['opponent']
    
    for stats in [result['player_stats'], result['opponent_stats']]:
        assert 'matches_played' in stats
        assert 'wins' in stats
        assert 'avg_score' in stats
        assert 'avg_opponent_score' in stats

def test_create_time_features(predictive_service):
    """Test time feature creation."""
    dates = pd.date_range(start='2023-01-01', periods=10, freq='D')
    df = pd.DataFrame({'date': dates})
    
    features = predictive_service._create_time_features(df)
    
    assert isinstance(features, np.ndarray)
    assert features.shape[0] == 10
    assert features.shape[1] == 8  # Number of time features

def test_create_progression_features(predictive_service):
    """Test progression feature creation."""
    dates = pd.date_range(start='2023-01-01', periods=10, freq='D')
    df = pd.DataFrame({
        'date': dates,
        'skill': np.linspace(0.5, 0.8, 10)
    })
    
    features = predictive_service._create_progression_features(df, 'skill')
    
    assert isinstance(features, np.ndarray)
    assert features.shape[0] == 10
    assert features.shape[1] == 5  # days_training + 4 rolling statistics

def test_calculate_player_stats(predictive_service, sample_match_history):
    """Test player statistics calculation."""
    df = pd.DataFrame(sample_match_history)
    stats = predictive_service._calculate_player_stats(df, 'player1')
    
    assert isinstance(stats, dict)
    assert 'matches_played' in stats
    assert 'wins' in stats
    assert 'avg_score' in stats
    assert 'avg_opponent_score' in stats
    
    assert stats['matches_played'] == 2  # player1 appears in 2 matches
    assert stats['wins'] == 2  # player1 wins 2 matches

def test_predict_win_probability(predictive_service):
    """Test win probability prediction."""
    features = np.array([
        [0.8, 0.6, 20, 15, 12, 18]  # win_rate, opp_win_rate, score, opp_score, def, opp_def
    ])
    
    prob = predictive_service._predict_win_probability(features)
    
    assert isinstance(prob, float)
    assert 0 <= prob <= 1

def test_predict_score_ranges(predictive_service):
    """Test score range prediction."""
    features = np.array([
        [0.8, 0.6, 20, 15, 12, 18]
    ])
    
    player_stats = {
        'matches_played': 10,
        'wins': 8,
        'avg_score': 20,
        'avg_opponent_score': 12
    }
    
    opponent_stats = {
        'matches_played': 10,
        'wins': 6,
        'avg_score': 15,
        'avg_opponent_score': 18
    }
    
    ranges = predictive_service._predict_score_ranges(
        features,
        player_stats,
        opponent_stats
    )
    
    assert isinstance(ranges, dict)
    assert 'player' in ranges
    assert 'opponent' in ranges
    assert 'low' in ranges['player']
    assert 'high' in ranges['player']
    assert 'low' in ranges['opponent']
    assert 'high' in ranges['opponent']
    
    assert ranges['player']['low'] >= 0
    assert ranges['player']['high'] > ranges['player']['low']
    assert ranges['opponent']['low'] >= 0
    assert ranges['opponent']['high'] > ranges['opponent']['low'] 