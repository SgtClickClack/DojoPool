"""Test tournament module."""

import pytest
from datetime import datetime, timedelta
from src.models.tournament import Tournament
from src.models.user import User
from src.models.venue import Venue

@pytest.fixture
def tournament_data():
    """Create tournament data for testing."""
    return {
        'name': 'Test Tournament',
        'description': 'A test tournament',
        'start_date': datetime.utcnow(),
        'end_date': datetime.utcnow() + timedelta(days=1),
        'max_players': 16,
        'game_type': '8-ball',
        'prize_pool': 1000,
        'entry_fee': 50,
        'status': 'pending'
    }

def test_tournament_creation(db, tournament_data):
    """Test tournament creation."""
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create tournament
    tournament = Tournament(
        name=tournament_data['name'],
        description=tournament_data['description'],
        start_date=tournament_data['start_date'],
        end_date=tournament_data['end_date'],
        max_players=tournament_data['max_players'],
        game_type=tournament_data['game_type'],
        prize_pool=tournament_data['prize_pool'],
        entry_fee=tournament_data['entry_fee'],
        venue=venue
    )
    db.session.add(tournament)
    db.session.commit()
    
    # Test tournament attributes
    assert tournament.name == tournament_data['name']
    assert tournament.description == tournament_data['description']
    assert tournament.max_players == tournament_data['max_players']
    assert tournament.game_type == tournament_data['game_type']
    assert tournament.prize_pool == tournament_data['prize_pool']
    assert tournament.entry_fee == tournament_data['entry_fee']
    assert tournament.status == 'pending'
    assert tournament.venue == venue

def test_tournament_registration(db, tournament_data):
    """Test tournament registration."""
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create tournament
    tournament = Tournament(
        name=tournament_data['name'],
        description=tournament_data['description'],
        start_date=tournament_data['start_date'],
        end_date=tournament_data['end_date'],
        max_players=tournament_data['max_players'],
        game_type=tournament_data['game_type'],
        prize_pool=tournament_data['prize_pool'],
        entry_fee=tournament_data['entry_fee'],
        venue=venue
    )
    db.session.add(tournament)
    
    # Create test users
    users = [
        User(username=f'player{i}', email=f'player{i}@example.com')
        for i in range(5)
    ]
    db.session.add_all(users)
    db.session.commit()
    
    # Test registration
    for user in users:
        tournament.register_player(user)
        assert user in tournament.players
    
    assert len(tournament.players) == 5
    
    # Test registration limit
    tournament.max_players = 4
    with pytest.raises(ValueError):
        tournament.register_player(User(username='extra', email='extra@example.com'))

def test_tournament_state_transitions(db, tournament_data):
    """Test tournament state transitions."""
    # Create test venue
    venue = Venue(name='Test Pool Hall')
    db.session.add(venue)
    
    # Create tournament
    tournament = Tournament(
        name=tournament_data['name'],
        description=tournament_data['description'],
        start_date=tournament_data['start_date'],
        end_date=tournament_data['end_date'],
        max_players=tournament_data['max_players'],
        game_type=tournament_data['game_type'],
        prize_pool=tournament_data['prize_pool'],
        entry_fee=tournament_data['entry_fee'],
        venue=venue
    )
    db.session.add(tournament)
    db.session.commit()
    
    # Test initial state
    assert tournament.status == 'pending'
    
    # Test start tournament
    tournament.start()
    assert tournament.status == 'in_progress'
    
    # Test pause tournament
    tournament.pause()
    assert tournament.status == 'paused'
    
    # Test resume tournament
    tournament.resume()
    assert tournament.status == 'in_progress'
    
    # Test end tournament
    tournament.end()
    assert tournament.status == 'completed' 