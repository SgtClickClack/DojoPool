"""Tests for narrative generator functionality."""
import pytest
from dojopool.narrative.generator import NarrativeGenerator
from dojopool.models import Match, User, Tournament
from dojopool.core.db import db

def test_match_narrative():
    """Test match narrative generation."""
    # Create users
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
    
    # Generate narrative
    generator = NarrativeGenerator()
    narrative = generator.generate_match_narrative(match)
    
    # Check narrative
    assert narrative is not None
    assert player1.username in narrative
    assert player2.username in narrative
    assert "8-5" in narrative

def test_tournament_narrative():
    """Test tournament narrative generation."""
    # Create users
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
    
    # Create matches
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
    
    # Generate narrative
    generator = NarrativeGenerator()
    narrative = generator.generate_tournament_narrative(tournament)
    
    # Check narrative
    assert narrative is not None
    assert tournament.name in narrative
    assert player1.username in narrative
    assert player2.username in narrative
    assert player3.username in narrative
    assert player4.username in narrative
    assert "8-7" in narrative

def test_player_narrative():
    """Test player narrative generation."""
    # Create users
    player = User(username="player1", email="player1@test.com")
    opponent1 = User(username="opponent1", email="opponent1@test.com")
    opponent2 = User(username="opponent2", email="opponent2@test.com")
    db.session.add_all([player, opponent1, opponent2])
    db.session.commit()
    
    # Create matches
    match1 = Match(
        player1_id=player.id,
        player2_id=opponent1.id,
        winner_id=player.id,
        score="8-4"
    )
    match2 = Match(
        player1_id=opponent2.id,
        player2_id=player.id,
        winner_id=opponent2.id,
        score="8-6"
    )
    db.session.add_all([match1, match2])
    db.session.commit()
    
    # Generate narrative
    generator = NarrativeGenerator()
    narrative = generator.generate_player_narrative(player)
    
    # Check narrative
    assert narrative is not None
    assert player.username in narrative
    assert opponent1.username in narrative
    assert opponent2.username in narrative
    assert "8-4" in narrative
    assert "8-6" in narrative