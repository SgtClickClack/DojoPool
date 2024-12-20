"""Tests for leaderboard functionality."""
import pytest
from datetime import datetime
from src.models.leaderboard import Leaderboard
from src.services.leaderboard_service import LeaderboardService
from src.models.user import User
from tests.utils import cleanup_after_test

@pytest.fixture
def leaderboard_entry(test_data_builder, test_user):
    """Create a test leaderboard entry."""
    return test_data_builder.create_leaderboard_entry(test_user)

@cleanup_after_test
def test_leaderboard_creation(test_data_builder, test_user):
    """Test creating a leaderboard entry."""
    entry = test_data_builder.create_leaderboard_entry(test_user, score=100.0)
    
    assert entry.id is not None
    assert entry.user_id == test_user.id
    assert entry.type == 'overall'
    assert entry.score == 100.0

@cleanup_after_test
def test_leaderboard_win_rate(leaderboard_entry):
    """Test win rate calculation."""
    assert leaderboard_entry.win_rate == 70.0  # 7 wins out of 10 games = 70%

@cleanup_after_test
def test_leaderboard_to_dict(leaderboard_entry):
    """Test converting leaderboard entry to dictionary."""
    data = leaderboard_entry.to_dict()
    
    assert data['user_id'] == leaderboard_entry.user_id
    assert data['username'] == leaderboard_entry.user.username
    assert data['avatar_url'] == leaderboard_entry.user.avatar_url
    assert data['type'] == 'overall'
    assert data['rank'] == 1
    assert data['score'] == 100.0
    assert data['games_played'] == 10
    assert data['games_won'] == 7
    assert data['tournaments_played'] == 2
    assert data['tournaments_won'] == 1
    assert data['win_rate'] == 70.0

@cleanup_after_test
def test_get_leaderboard(test_data_builder, test_user):
    """Test getting leaderboard entries."""
    # Create multiple entries
    test_data_builder.create_leaderboard_entry(test_user, type='overall', score=100.0)
    test_data_builder.create_leaderboard_entry(test_user, type='monthly', score=50.0)
    
    # Test getting overall leaderboard
    overall = LeaderboardService.get_leaderboard('overall')
    assert len(overall) == 1
    assert overall[0]['type'] == 'overall'
    assert overall[0]['score'] == 100.0
    
    # Test getting monthly leaderboard
    monthly = LeaderboardService.get_leaderboard('monthly')
    assert len(monthly) == 1
    assert monthly[0]['type'] == 'monthly'
    assert monthly[0]['score'] == 50.0

@cleanup_after_test
def test_update_user_score(db_session, test_user):
    """Test updating a user's score."""
    # Create initial entry
    LeaderboardService.update_user_score(test_user.id, 'overall', 50.0)
    
    # Verify entry was created
    entry = Leaderboard.query.filter_by(user_id=test_user.id, type='overall').first()
    assert entry is not None
    assert entry.score == 50.0
    
    # Update score
    LeaderboardService.update_user_score(test_user.id, 'overall', 25.0)
    
    # Verify score was updated
    entry = Leaderboard.query.filter_by(user_id=test_user.id, type='overall').first()
    assert entry.score == 75.0  # 50.0 + 25.0

@cleanup_after_test
def test_update_rankings(test_data_builder):
    """Test updating rankings."""
    # Create test users with different scores
    user1 = test_data_builder.create_user('user1', 'user1@example.com')
    user2 = test_data_builder.create_user('user2', 'user2@example.com')
    user3 = test_data_builder.create_user('user3', 'user3@example.com')
    
    # Create entries with different scores
    test_data_builder.create_leaderboard_entry(user1, score=100.0)
    test_data_builder.create_leaderboard_entry(user2, score=200.0)
    test_data_builder.create_leaderboard_entry(user3, score=150.0)
    
    # Update rankings
    LeaderboardService.update_rankings('overall')
    
    # Verify rankings
    entries = Leaderboard.query.filter_by(type='overall').order_by(Leaderboard.score.desc()).all()
    assert entries[0].rank == 1
    assert entries[0].score == 200.0
    assert entries[1].rank == 2
    assert entries[1].score == 150.0
    assert entries[2].rank == 3
    assert entries[2].score == 100.0

@cleanup_after_test
def test_get_user_rankings(test_data_builder, test_user):
    """Test getting all rankings for a user."""
    # Create multiple entries for the user
    test_data_builder.create_leaderboard_entry(test_user, type='overall', score=100.0)
    test_data_builder.create_leaderboard_entry(test_user, type='monthly', score=50.0)
    
    # Get user rankings
    rankings = LeaderboardService.get_user_rankings(test_user.id)
    
    # Verify rankings
    assert 'overall' in rankings
    assert rankings['overall']['rank'] == 1
    assert rankings['overall']['score'] == 100.0
    
    assert 'monthly' in rankings
    assert rankings['monthly']['rank'] == 1
    assert rankings['monthly']['score'] == 50.0 