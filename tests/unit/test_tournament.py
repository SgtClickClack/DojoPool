"""Test tournament functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.tournament import tournament_service
from dojopool.models import User, Game, Match, Tournament

def test_tournament_creation():
    """Test tournament creation."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=32,
        game_type="eight_ball"
    )
    
    assert tournament.name == "Test Tournament"
    assert tournament.max_participants == 32
    assert tournament.game_type == "eight_ball"

def test_tournament_registration():
    """Test tournament registration."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=32,
        game_type="eight_ball"
    )
    
    user = User(username="test_user", email="test@example.com")
    registration = tournament_service.register_participant(tournament.id, user.id)
    
    assert registration.tournament_id == tournament.id
    assert registration.user_id == user.id
    assert registration.status == "registered"

def test_tournament_bracket():
    """Test tournament bracket generation."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=8,
        game_type="eight_ball"
    )
    
    # Register 8 participants
    users = [
        User(username=f"user{i}", email=f"user{i}@example.com")
        for i in range(8)
    ]
    for user in users:
        tournament_service.register_participant(tournament.id, user.id)
    
    bracket = tournament_service.generate_bracket(tournament.id)
    assert len(bracket.rounds) == 3  # 8 players = 3 rounds
    assert len(bracket.rounds[0].matches) == 4  # First round has 4 matches

def test_tournament_match_updates():
    """Test tournament match updates."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        max_participants=4,
        game_type="eight_ball"
    )
    
    # Register players and generate bracket
    users = [
        User(username=f"user{i}", email=f"user{i}@example.com")
        for i in range(4)
    ]
    for user in users:
        tournament_service.register_participant(tournament.id, user.id)
    
    bracket = tournament_service.generate_bracket(tournament.id)
    match = bracket.rounds[0].matches[0]
    
    # Update match result
    result = tournament_service.update_match_result(
        tournament_id=tournament.id,
        match_id=match.id,
        winner_id=users[0].id,
        score="2-0"
    )
    
    assert result.winner_id == users[0].id
    assert result.score == "2-0"
    assert result.status == "completed"

def test_tournament_standings():
    """Test tournament standings."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        max_participants=4,
        game_type="eight_ball"
    )
    
    # Register players and complete matches
    users = [
        User(username=f"user{i}", email=f"user{i}@example.com")
        for i in range(4)
    ]
    for user in users:
        tournament_service.register_participant(tournament.id, user.id)
    
    bracket = tournament_service.generate_bracket(tournament.id)
    
    # Complete all matches
    for round in bracket.rounds:
        for match in round.matches:
            tournament_service.update_match_result(
                tournament_id=tournament.id,
                match_id=match.id,
                winner_id=match.player1_id,
                score="2-0"
            )
    
    standings = tournament_service.get_standings(tournament.id)
    assert len(standings) == 4
    assert standings[0].position == 1
    assert standings[0].user_id == bracket.rounds[-1].matches[0].winner_id

def test_tournament_schedule():
    """Test tournament scheduling."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=8,
        game_type="eight_ball"
    )
    
    schedule = tournament_service.generate_schedule(tournament.id)
    assert len(schedule.rounds) == 3
    assert all(round.start_time for round in schedule.rounds)
    assert all(round.end_time for round in schedule.rounds)

def test_tournament_statistics():
    """Test tournament statistics."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=1),
        max_participants=8,
        game_type="eight_ball"
    )
    
    stats = tournament_service.get_statistics(tournament.id)
    assert "total_matches" in stats
    assert "completed_matches" in stats
    assert "average_match_duration" in stats
    assert "participant_count" in stats

def test_tournament_validation():
    """Test tournament validation."""
    # Test invalid dates
    with pytest.raises(ValueError):
        tournament_service.create_tournament(
            name="Invalid Tournament",
            start_date=datetime.utcnow() - timedelta(days=1),  # Past date
            end_date=datetime.utcnow(),
            max_participants=8,
            game_type="eight_ball"
        )
    
    # Test invalid participant count
    with pytest.raises(ValueError):
        tournament_service.create_tournament(
            name="Invalid Tournament",
            start_date=datetime.utcnow() + timedelta(days=7),
            end_date=datetime.utcnow() + timedelta(days=8),
            max_participants=3,  # Not a power of 2
            game_type="eight_ball"
        )

def test_tournament_notifications():
    """Test tournament notifications."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=8,
        game_type="eight_ball"
    )
    
    user = User(username="test_user", email="test@example.com")
    tournament_service.register_participant(tournament.id, user.id)
    
    notifications = tournament_service.get_participant_notifications(
        tournament_id=tournament.id,
        user_id=user.id
    )
    
    assert len(notifications) > 0
    assert all(n.user_id == user.id for n in notifications)

def test_tournament_prizes():
    """Test tournament prize management."""
    tournament = tournament_service.create_tournament(
        name="Test Tournament",
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        max_participants=8,
        game_type="eight_ball"
    )
    
    prizes = tournament_service.set_prizes(
        tournament_id=tournament.id,
        prize_structure={
            1: 1000,  # First place
            2: 500,   # Second place
            3: 250    # Third place
        }
    )
    
    assert prizes[1] == 1000
    assert prizes[2] == 500
    assert prizes[3] == 250 