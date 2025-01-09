"""Tests for leaderboard integration functionality."""
import pytest
from dojopool.models import Leaderboard, Match, Tournament, User
from dojopool.services.leaderboard import LeaderboardService
from dojopool.core.db import db

def test_leaderboard_update():
    """Test leaderboard update functionality."""
    # Create test users
    player1 = User(username="player1", email="player1@test.com")
    player2 = User(username="player2", email="player2@test.com")
    db.session.add_all([player1, player2])
    db.session.commit()
    
    # Create match
    match = Match(
        player1_id=player1.id,
        player2_id=player2.id,
        winner_id=player1.id,
        score="8-5"
    )
    db.session.add(match)
    db.session.commit()
    
    # Update leaderboard
    leaderboard_service = LeaderboardService()
    leaderboard_service.update_leaderboard(match)
    
    # Check leaderboard entries
    entries = Leaderboard.query.all()
    assert len(entries) == 2
    
    player1_entry = next(e for e in entries if e.user_id == player1.id)
    player2_entry = next(e for e in entries if e.user_id == player2.id)
    
    assert player1_entry.wins == 1
    assert player1_entry.losses == 0
    assert player2_entry.wins == 0
    assert player2_entry.losses == 1

def test_tournament_leaderboard():
    """Test tournament leaderboard functionality."""
    # Create test users
    player1 = User(username="player1", email="player1@test.com")
    player2 = User(username="player2", email="player2@test.com")
    player3 = User(username="player3", email="player3@test.com")
    player4 = User(username="player4", email="player4@test.com")
    db.session.add_all([player1, player2, player3, player4])
    db.session.commit()
    
    # Create tournament
    tournament = Tournament(name="Test Tournament")
    db.session.add(tournament)
    db.session.commit()
    
    # Create tournament matches
    match1 = Match(
        player1_id=player1.id,
        player2_id=player2.id,
        winner_id=player1.id,
        score="8-3",
        tournament_id=tournament.id
    )
    match2 = Match(
        player1_id=player3.id,
        player2_id=player4.id,
        winner_id=player3.id,
        score="8-4",
        tournament_id=tournament.id
    )
    match3 = Match(
        player1_id=player1.id,
        player2_id=player3.id,
        winner_id=player1.id,
        score="8-7",
        tournament_id=tournament.id
    )
    db.session.add_all([match1, match2, match3])
    db.session.commit()
    
    # Update tournament leaderboard
    leaderboard_service = LeaderboardService()
    leaderboard_service.update_tournament_leaderboard(tournament)
    
    # Check leaderboard entries
    entries = Leaderboard.query.filter_by(tournament_id=tournament.id).all()
    assert len(entries) == 4
    
    player1_entry = next(e for e in entries if e.user_id == player1.id)
    player2_entry = next(e for e in entries if e.user_id == player2.id)
    player3_entry = next(e for e in entries if e.user_id == player3.id)
    player4_entry = next(e for e in entries if e.user_id == player4.id)
    
    assert player1_entry.wins == 2
    assert player3_entry.wins == 1
    assert player2_entry.wins == 0
    assert player4_entry.wins == 0

def test_leaderboard_stats():
    """Test leaderboard statistics functionality."""
    # Create test users
    player1 = User(username="player1", email="player1@test.com")
    player2 = User(username="player2", email="player2@test.com")
    db.session.add_all([player1, player2])
    db.session.commit()
    
    # Create matches
    match1 = Match(
        player1_id=player1.id,
        player2_id=player2.id,
        winner_id=player1.id,
        score="8-4"
    )
    match2 = Match(
        player1_id=player2.id,
        player2_id=player1.id,
        winner_id=player2.id,
        score="8-6"
    )
    match3 = Match(
        player1_id=player1.id,
        player2_id=player2.id,
        winner_id=player1.id,
        score="8-7"
    )
    db.session.add_all([match1, match2, match3])
    db.session.commit()
    
    # Update leaderboard
    leaderboard_service = LeaderboardService()
    for match in [match1, match2, match3]:
        leaderboard_service.update_leaderboard(match)
    
    # Check leaderboard statistics
    player1_stats = leaderboard_service.get_player_stats(player1.id)
    player2_stats = leaderboard_service.get_player_stats(player2.id)
    
    assert player1_stats["wins"] == 2
    assert player1_stats["losses"] == 1
    assert player1_stats["win_rate"] == 0.67
    
    assert player2_stats["wins"] == 1
    assert player2_stats["losses"] == 2
    assert player2_stats["win_rate"] == 0.33 