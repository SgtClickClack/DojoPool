"""Unit tests for Tournament model."""
import pytest
from datetime import datetime, timedelta
from dojopool.models import Tournament, User, Venue

@pytest.fixture
def user(db_session):
    """Create a test user."""
    user = User(
        username='organizer',
        email='organizer@example.com'
    )
    user.set_password('password')
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def venue(db_session, user):
    """Create a test venue."""
    venue = Venue(
        name='Test Venue',
        address='123 Test St',
        city='Test City',
        state='Test State',
        country='Test Country',
        postal_code='12345',
        owner_id=user.id
    )
    db_session.add(venue)
    db_session.commit()
    return venue

@pytest.fixture
def tournament(db_session, user, venue):
    """Create a test tournament."""
    tournament = Tournament(
        name='Test Tournament',
        description='Test Description',
        venue_id=venue.id,
        organizer_id=user.id,
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=8),
        registration_deadline=datetime.utcnow() + timedelta(days=6),
        max_participants=32,
        entry_fee=50.0,
        prize_pool=1000.0,
        format='single elimination'
    )
    db_session.add(tournament)
    db_session.commit()
    return tournament

def test_create_tournament(tournament):
    """Test tournament creation."""
    assert tournament.name == 'Test Tournament'
    assert tournament.status == 'upcoming'
    assert tournament.format == 'single elimination'
    assert tournament.max_participants == 32
    assert tournament.entry_fee == 50.0
    assert tournament.prize_pool == 1000.0

def test_tournament_relationships(tournament, user, venue):
    """Test tournament relationships."""
    assert tournament.organizer == user
    assert tournament.venue == venue
    assert tournament in user.organized_tournaments
    assert tournament in venue.tournaments

def test_tournament_to_dict(tournament):
    """Test converting tournament to dictionary."""
    data = tournament.to_dict()
    assert data['name'] == tournament.name
    assert data['venue_id'] == tournament.venue_id
    assert data['organizer_id'] == tournament.organizer_id
    assert data['status'] == 'upcoming'
    assert data['format'] == 'single elimination'

def test_tournament_from_dict(db_session, user, venue):
    """Test creating tournament from dictionary."""
    data = {
        'name': 'New Tournament',
        'description': 'New Description',
        'venue_id': venue.id,
        'organizer_id': user.id,
        'start_date': datetime.utcnow() + timedelta(days=7),
        'end_date': datetime.utcnow() + timedelta(days=8),
        'registration_deadline': datetime.utcnow() + timedelta(days=6),
        'max_participants': 16,
        'entry_fee': 25.0,
        'prize_pool': 500.0,
        'format': 'double elimination'
    }
    tournament = Tournament.from_dict(data)
    db_session.add(tournament)
    db_session.commit()
    
    assert tournament.name == 'New Tournament'
    assert tournament.format == 'double elimination'
    assert tournament.max_participants == 16

def test_tournament_start(tournament):
    """Test starting a tournament."""
    tournament.start()
    assert tournament.status == 'active'
    
    # Test invalid state transition
    with pytest.raises(ValueError):
        tournament.start()

def test_tournament_complete(tournament):
    """Test completing a tournament."""
    tournament.start()
    tournament.complete()
    assert tournament.status == 'completed'
    
    # Test invalid state transition
    with pytest.raises(ValueError):
        tournament.complete()

def test_tournament_cancel(tournament):
    """Test cancelling a tournament."""
    tournament.cancel()
    assert tournament.status == 'cancelled'
    
    # Test invalid state transition
    with pytest.raises(ValueError):
        tournament.cancel()

def test_tournament_update_stats(tournament):
    """Test updating tournament statistics."""
    stats = {
        'participants': 16,
        'matches_played': 15,
        'total_games': 45
    }
    tournament.update_stats(stats)
    assert tournament.stats == stats
    
    # Test updating existing stats
    new_stats = {'winner': 'Player 1'}
    tournament.update_stats(new_stats)
    assert tournament.stats['winner'] == 'Player 1'
    assert tournament.stats['participants'] == 16

def test_tournament_registration_open(tournament):
    """Test tournament registration status."""
    assert tournament.is_registration_open()
    
    # Test closed registration after deadline
    tournament.registration_deadline = datetime.utcnow() - timedelta(days=1)
    assert not tournament.is_registration_open()
    
    # Test closed registration when tournament is active
    tournament.registration_deadline = datetime.utcnow() + timedelta(days=1)
    tournament.start()
    assert not tournament.is_registration_open()
    
    # Test closed registration when at max participants
    tournament.status = 'upcoming'
    tournament.max_participants = 0
    assert not tournament.is_registration_open() 