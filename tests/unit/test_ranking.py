"""Test ranking functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.ranking import ranking_service
from dojopool.models import User, Game, Match

def test_ranking_calculation():
    """Test ranking calculation."""
    user = User(username="test_user", email="test@example.com")
    ranking = ranking_service.calculate_ranking(user.id)
    
    assert ranking.score >= 0
    assert ranking.rank > 0
    assert ranking.last_updated is not None

def test_ranking_update():
    """Test ranking update after game."""
    user = User(username="test_user", email="test@example.com")
    initial_ranking = ranking_service.calculate_ranking(user.id)
    
    # Simulate game win
    game = Game(
        player1_id=user.id,
        player2_id=2,
        winner_id=user.id,
        game_type="eight_ball"
    )
    
    updated_ranking = ranking_service.update_ranking(user.id, game)
    assert updated_ranking.score > initial_ranking.score

def test_ranking_history():
    """Test ranking history retrieval."""
    user = User(username="test_user", email="test@example.com")
    
    # Create multiple ranking entries
    for i in range(5):
        game = Game(
            player1_id=user.id,
            player2_id=2,
            winner_id=user.id if i % 2 == 0 else 2,
            game_type="eight_ball"
        )
        ranking_service.update_ranking(user.id, game)
    
    history = ranking_service.get_ranking_history(user.id)
    assert len(history) == 5
    assert all(h.user_id == user.id for h in history)

def test_ranking_leaderboard():
    """Test leaderboard generation."""
    leaderboard = ranking_service.generate_leaderboard(
        game_type="eight_ball",
        time_period="weekly"
    )
    
    assert len(leaderboard) > 0
    assert all(p.rank > 0 for p in leaderboard)
    assert leaderboard[0].rank == 1

def test_ranking_decay():
    """Test ranking decay over time."""
    user = User(username="test_user", email="test@example.com")
    initial_ranking = ranking_service.calculate_ranking(user.id)
    
    # Simulate time passage
    ranking_service.apply_ranking_decay(
        user_id=user.id,
        days_inactive=30
    )
    
    decayed_ranking = ranking_service.calculate_ranking(user.id)
    assert decayed_ranking.score < initial_ranking.score

def test_ranking_categories():
    """Test different ranking categories."""
    user = User(username="test_user", email="test@example.com")
    
    categories = ["eight_ball", "nine_ball", "snooker"]
    rankings = {}
    
    for category in categories:
        rankings[category] = ranking_service.calculate_ranking(
            user_id=user.id,
            game_type=category
        )
    
    assert len(rankings) == len(categories)
    assert all(r.score >= 0 for r in rankings.values())

def test_ranking_matchmaking():
    """Test matchmaking based on rankings."""
    user = User(username="test_user", email="test@example.com")
    user_ranking = ranking_service.calculate_ranking(user.id)
    
    matches = ranking_service.find_suitable_matches(
        user_id=user.id,
        game_type="eight_ball",
        ranking_range=100
    )
    
    assert len(matches) > 0
    assert all(abs(m.ranking - user_ranking.score) <= 100 for m in matches)

def test_ranking_achievements():
    """Test ranking-based achievements."""
    user = User(username="test_user", email="test@example.com")
    achievements = ranking_service.check_ranking_achievements(user.id)
    
    assert isinstance(achievements, list)
    assert all(a.user_id == user.id for a in achievements)
    assert all(hasattr(a, "title") for a in achievements)

def test_ranking_statistics():
    """Test ranking statistics."""
    user = User(username="test_user", email="test@example.com")
    stats = ranking_service.get_ranking_statistics(user.id)
    
    assert "highest_rank" in stats
    assert "lowest_rank" in stats
    assert "average_rank" in stats
    assert "rank_volatility" in stats

def test_ranking_progression():
    """Test ranking progression tracking."""
    user = User(username="test_user", email="test@example.com")
    progression = ranking_service.track_ranking_progression(
        user_id=user.id,
        start_date=datetime.utcnow() - timedelta(days=30),
        end_date=datetime.utcnow()
    )
    
    assert len(progression) > 0
    assert all(p.user_id == user.id for p in progression)
    assert all(hasattr(p, "timestamp") for p in progression) 