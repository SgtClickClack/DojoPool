"""Tests for ranking system functionality."""
import pytest
from dojopool.ranking.ranking_system import RankingSystem
from dojopool.models import User, Match, Tournament
from dojopool.core.db import db

def test_ranking_calculation():
    """Test ranking calculation."""
    # Create users
    user1 = User(username="player1", email="player1@test.com")
    user2 = User(username="player2", email="player2@test.com")
    db.session.add_all([user1, user2])
    db.session.commit()
    
    # Create match
    match = Match(
        player1_id=user1.id,
        player2_id=user2.id,
        winner_id=user1.id,
        score="8-5"
    )
    db.session.add(match)
    db.session.commit()
    
    # Calculate rankings
    ranking_system = RankingSystem()
    rankings = ranking_system.calculate_rankings([match])
    
    # Check rankings
    assert rankings[user1.id] > rankings[user2.id]

def test_tournament_ranking():
    """Test tournament ranking calculation."""
    # Create users
    user1 = User(username="player1", email="player1@test.com")
    user2 = User(username="player2", email="player2@test.com")
    user3 = User(username="player3", email="player3@test.com")
    user4 = User(username="player4", email="player4@test.com")
    db.session.add_all([user1, user2, user3, user4])
    db.session.commit()
    
    # Create tournament
    tournament = Tournament(name="Test Tournament")
    db.session.add(tournament)
    db.session.commit()
    
    # Create matches
    match1 = Match(
        player1_id=user1.id,
        player2_id=user2.id,
        winner_id=user1.id,
        score="8-3",
        tournament_id=tournament.id
    )
    match2 = Match(
        player1_id=user3.id,
        player2_id=user4.id,
        winner_id=user3.id,
        score="8-4",
        tournament_id=tournament.id
    )
    match3 = Match(
        player1_id=user1.id,
        player2_id=user3.id,
        winner_id=user1.id,
        score="8-7",
        tournament_id=tournament.id
    )
    db.session.add_all([match1, match2, match3])
    db.session.commit()
    
    # Calculate tournament rankings
    ranking_system = RankingSystem()
    rankings = ranking_system.calculate_tournament_rankings(tournament)
    
    # Check rankings
    assert rankings[user1.id] > rankings[user2.id]
    assert rankings[user1.id] > rankings[user3.id]
    assert rankings[user3.id] > rankings[user4.id]

def test_ranking_history():
    """Test ranking history tracking."""
    # Create users
    user1 = User(username="player1", email="player1@test.com")
    user2 = User(username="player2", email="player2@test.com")
    db.session.add_all([user1, user2])
    db.session.commit()
    
    # Create matches over time
    match1 = Match(
        player1_id=user1.id,
        player2_id=user2.id,
        winner_id=user1.id,
        score="8-5"
    )
    db.session.add(match1)
    db.session.commit()
    
    # Calculate initial rankings
    ranking_system = RankingSystem()
    initial_rankings = ranking_system.calculate_rankings([match1])
    
    # Create another match
    match2 = Match(
        player1_id=user2.id,
        player2_id=user1.id,
        winner_id=user2.id,
        score="8-6"
    )
    db.session.add(match2)
    db.session.commit()
    
    # Calculate updated rankings
    updated_rankings = ranking_system.calculate_rankings([match1, match2])
    
    # Check ranking changes
    assert initial_rankings[user1.id] > initial_rankings[user2.id]
    assert abs(updated_rankings[user1.id] - updated_rankings[user2.id]) < abs(initial_rankings[user1.id] - initial_rankings[user2.id])