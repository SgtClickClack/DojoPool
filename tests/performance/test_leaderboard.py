"""Performance tests for leaderboard functionality."""
import pytest
import time
from datetime import datetime
from dojopool.models.leaderboard import Leaderboard
from dojopool.services.leaderboard_service import LeaderboardService

def test_leaderboard_query_performance(session, user):
    """Test performance of leaderboard queries."""
    # Create a large number of entries
    entries = []
    for i in range(1000):  # Test with 1000 entries
        entry = Leaderboard(
            user_id=user.id + i,
            type='overall',
            score=float(i),
            rank=1000 - i
        )
        entries.append(entry)
    session.add_all(entries)
    session.commit()
    
    # Test get_leaderboard performance
    start_time = time.time()
    results = LeaderboardService.get_leaderboard('overall', limit=100)
    query_time = time.time() - start_time
    
    assert len(results) == 100  # Verify limit works
    assert query_time < 0.1  # Should complete in under 100ms
    
    # Verify first result has all required fields
    first_result = results[0]
    assert 'username' in first_result
    assert 'avatar_url' in first_result
    assert 'score' in first_result
    assert 'rank' in first_result

def test_ranking_update_performance(session, user):
    """Test performance of ranking updates."""
    # Create a large number of entries
    entries = []
    for i in range(1000):  # Test with 1000 entries
        entry = Leaderboard(
            user_id=user.id + i,
            type='overall',
            score=float(i)
        )
        entries.append(entry)
    session.add_all(entries)
    session.commit()
    
    # Test update_rankings performance
    start_time = time.time()
    LeaderboardService.update_rankings('overall')
    update_time = time.time() - start_time
    
    assert update_time < 1.0  # Should complete in under 1 second

def test_concurrent_score_updates(session, user):
    """Test performance of concurrent score updates."""
    # Create initial entries for multiple users
    entries = []
    for i in range(100):  # Test with 100 users
        entry = Leaderboard(
            user_id=user.id + i,
            type='overall',
            score=0.0
        )
        entries.append(entry)
    session.add_all(entries)
    session.commit()
    
    # Test concurrent score updates
    start_time = time.time()
    for i in range(100):
        LeaderboardService.update_user_score(user.id + i, 'overall', float(i))
    update_time = time.time() - start_time
    
    assert update_time < 2.0  # Should complete in under 2 seconds

def test_monthly_leaderboard_performance(session, user):
    """Test performance of monthly leaderboard operations."""
    # Create entries for multiple months
    entries = []
    for month in range(1, 13):  # Test with 12 months
        period = f'2024-{month:02d}'
        for i in range(100):  # 100 users per month
            entry = Leaderboard(
                user_id=user.id + i,
                type='monthly',
                period=period,
                score=float(i)
            )
            entries.append(entry)
    session.add_all(entries)
    session.commit()
    
    # Test monthly leaderboard query performance
    start_time = time.time()
    for month in range(1, 13):
        period = f'2024-{month:02d}'
        results = LeaderboardService.get_leaderboard('monthly', period=period)
        assert len(results) > 0
    query_time = time.time() - start_time
    
    assert query_time < 1.0  # Should complete in under 1 second

def test_user_rankings_performance(session, user):
    """Test performance of user rankings queries."""
    # Create entries in multiple categories for many users
    entries = []
    categories = ['overall', 'monthly', 'tournament', 'weekly']
    for i in range(100):  # Test with 100 users
        for category in categories:
            entry = Leaderboard(
                user_id=user.id + i,
                type=category,
                score=float(i),
                period='2024-01' if category in ['monthly', 'weekly'] else None
            )
            entries.append(entry)
    session.add_all(entries)
    session.commit()
    
    # Test get_user_rankings performance
    start_time = time.time()
    for i in range(100):
        rankings = LeaderboardService.get_user_rankings(user.id + i)
        assert len(rankings) > 0
    query_time = time.time() - start_time
    
    assert query_time < 1.0  # Should complete in under 1 second 