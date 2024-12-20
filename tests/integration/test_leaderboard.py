"""Integration tests for leaderboard functionality."""
import pytest
from datetime import datetime, timedelta
from src.models.leaderboard import Leaderboard
from src.models.match import Match
from src.models.tournament import Tournament
from src.services.leaderboard_service import LeaderboardService

def test_match_score_update(session, user):
    """Test leaderboard update after match completion."""
    # Create initial leaderboard entry
    entry = Leaderboard(
        user_id=user.id,
        type='overall',
        score=0.0,
        games_played=0,
        games_won=0
    )
    session.add(entry)
    session.commit()
    
    # Create and complete a match
    match = Match(
        player1_id=user.id,
        player2_id=user.id + 1,
        status='completed',
        winner_id=user.id,
        score={'player1': 5, 'player2': 3}
    )
    session.add(match)
    session.commit()
    
    # Update leaderboard
    LeaderboardService.update_user_score(user.id, 'overall', 10.0)  # Win score
    
    # Verify leaderboard update
    entry = Leaderboard.query.filter_by(user_id=user.id, type='overall').first()
    assert entry.score == 10.0
    assert entry.games_played == 1
    assert entry.games_won == 1
    
    # Verify user-related fields
    data = entry.to_dict()
    assert data['username'] == user.username
    assert data['avatar_url'] == user.avatar_url

def test_tournament_score_update(session, user):
    """Test leaderboard update after tournament completion."""
    # Create initial leaderboard entry
    entry = Leaderboard(
        user_id=user.id,
        type='tournament',
        score=0.0,
        tournaments_played=0,
        tournaments_won=0
    )
    session.add(entry)
    session.commit()
    
    # Create and complete a tournament
    tournament = Tournament(
        name='Test Tournament',
        organizer_id=user.id + 1,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        status='completed',
        winner_id=user.id
    )
    session.add(tournament)
    session.commit()
    
    # Update leaderboard
    LeaderboardService.update_user_score(user.id, 'tournament', 50.0)  # Tournament win score
    
    # Verify leaderboard update
    entry = Leaderboard.query.filter_by(user_id=user.id, type='tournament').first()
    assert entry.score == 50.0
    assert entry.tournaments_played == 1
    assert entry.tournaments_won == 1

def test_monthly_leaderboard(session, user):
    """Test monthly leaderboard updates."""
    current_month = datetime.utcnow().strftime('%Y-%m')
    
    # Create initial monthly entry
    entry = Leaderboard(
        user_id=user.id,
        type='monthly',
        period=current_month,
        score=0.0
    )
    session.add(entry)
    session.commit()
    
    # Create and complete matches in current month
    for _ in range(3):
        match = Match(
            player1_id=user.id,
            player2_id=user.id + 1,
            status='completed',
            winner_id=user.id,
            score={'player1': 5, 'player2': 3}
        )
        session.add(match)
        session.commit()
        
        # Update monthly leaderboard
        LeaderboardService.update_user_score(user.id, 'monthly', 10.0, current_month)
    
    # Verify monthly leaderboard
    entry = Leaderboard.query.filter_by(
        user_id=user.id,
        type='monthly',
        period=current_month
    ).first()
    assert entry.score == 30.0  # 3 wins * 10 points

def test_multiple_leaderboard_categories(session, user):
    """Test updating multiple leaderboard categories."""
    # Create initial entries
    entries = [
        Leaderboard(user_id=user.id, type='overall', score=0.0),
        Leaderboard(user_id=user.id, type='monthly', period='2024-01', score=0.0),
        Leaderboard(user_id=user.id, type='tournament', score=0.0)
    ]
    session.add_all(entries)
    session.commit()
    
    # Update different categories
    LeaderboardService.update_user_score(user.id, 'overall', 10.0)
    LeaderboardService.update_user_score(user.id, 'monthly', 10.0, '2024-01')
    LeaderboardService.update_user_score(user.id, 'tournament', 50.0)
    
    # Verify all categories
    entries = Leaderboard.query.filter_by(user_id=user.id).all()
    scores = {entry.type: entry.score for entry in entries}
    
    assert scores['overall'] == 10.0
    assert scores['monthly'] == 10.0
    assert scores['tournament'] == 50.0

def test_leaderboard_ranking_order(session, user):
    """Test leaderboard ranking order after multiple updates."""
    # Create users with different scores
    users = [
        {'id': user.id, 'score': 100.0},
        {'id': user.id + 1, 'score': 200.0},
        {'id': user.id + 2, 'score': 150.0}
    ]
    
    # Create leaderboard entries
    for user_data in users:
        entry = Leaderboard(
            user_id=user_data['id'],
            type='overall',
            score=user_data['score']
        )
        session.add(entry)
    session.commit()
    
    # Update rankings
    LeaderboardService.update_rankings('overall')
    
    # Verify ranking order
    entries = Leaderboard.query.filter_by(type='overall').order_by(Leaderboard.rank).all()
    assert len(entries) == 3
    assert entries[0].score == 200.0  # Rank 1
    assert entries[1].score == 150.0  # Rank 2
    assert entries[2].score == 100.0  # Rank 3 