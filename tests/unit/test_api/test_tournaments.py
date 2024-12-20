"""Unit tests for tournament API endpoints."""
import pytest
from datetime import datetime, timedelta
from flask import url_for
from src.models import Tournament, User, Venue

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
def other_user(db_session):
    """Create another test user."""
    user = User(
        username='other',
        email='other@example.com'
    )
    user.set_password('password')
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def admin_user(db_session):
    """Create an admin user."""
    user = User(
        username='admin',
        email='admin@example.com',
        is_admin=True
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
def tournament_data(venue):
    """Tournament test data."""
    return {
        'name': 'Test Tournament',
        'description': 'Test Description',
        'venue_id': venue.id,
        'start_date': (datetime.utcnow() + timedelta(days=7)).isoformat(),
        'end_date': (datetime.utcnow() + timedelta(days=8)).isoformat(),
        'registration_deadline': (datetime.utcnow() + timedelta(days=6)).isoformat(),
        'max_participants': 32,
        'entry_fee': 50.0,
        'prize_pool': 1000.0,
        'format': 'single elimination'
    }

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

def test_list_tournaments(client):
    """Test listing tournaments."""
    response = client.get('/api/v1/tournaments')
    assert response.status_code == 200
    data = response.get_json()
    assert 'tournaments' in data

def test_list_tournaments_with_filters(client, tournament):
    """Test listing tournaments with filters."""
    response = client.get('/api/v1/tournaments?status=open')
    assert response.status_code == 200
    data = response.get_json()
    assert 'tournaments' in data

def test_get_tournament(client, tournament):
    """Test getting a tournament."""
    response = client.get(f'/api/v1/tournaments/{tournament.id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['id'] == tournament.id
    assert data['name'] == tournament.name

def test_get_tournament_not_found(client):
    """Test getting a non-existent tournament."""
    response = client.get('/api/v1/tournaments/999')
    assert response.status_code == 404

def test_create_tournament(client, user, tournament_data):
    """Test creating a tournament."""
    client.login(user)  # Helper method to log in user
    response = client.post(
        url_for('tournaments.create_tournament'),
        json=tournament_data
    )
    assert response.status_code == 201
    assert response.json['name'] == tournament_data['name']
    assert response.json['organizer_id'] == user.id

def test_create_tournament_invalid_data(client, user, tournament_data):
    """Test creating tournament with invalid data."""
    client.login(user)
    
    # Test missing required field
    invalid_data = tournament_data.copy()
    del invalid_data['name']
    response = client.post(
        url_for('tournaments.create_tournament'),
        json=invalid_data
    )
    assert response.status_code == 400
    
    # Test invalid dates
    invalid_data = tournament_data.copy()
    invalid_data['start_date'] = 'invalid-date'
    response = client.post(
        url_for('tournaments.create_tournament'),
        json=invalid_data
    )
    assert response.status_code == 400

def test_update_tournament(client, user, tournament):
    """Test updating tournament."""
    client.login(user)
    data = {'name': 'Updated Tournament'}
    response = client.put(
        url_for('tournaments.update_tournament', id=tournament.id),
        json=data
    )
    assert response.status_code == 200
    assert response.json['name'] == 'Updated Tournament'

def test_update_tournament_unauthorized(client, other_user, tournament):
    """Test updating tournament without permission."""
    client.login(other_user)
    data = {'name': 'Updated Tournament'}
    response = client.put(
        url_for('tournaments.update_tournament', id=tournament.id),
        json=data
    )
    assert response.status_code == 403

def test_delete_tournament(client, user, tournament):
    """Test deleting tournament."""
    client.login(user)
    response = client.delete(url_for('tournaments.delete_tournament', id=tournament.id))
    assert response.status_code == 204
    assert Tournament.query.get(tournament.id) is None

def test_delete_tournament_unauthorized(client, other_user, tournament):
    """Test deleting tournament without permission."""
    client.login(other_user)
    response = client.delete(url_for('tournaments.delete_tournament', id=tournament.id))
    assert response.status_code == 403

def test_start_tournament(client, user, tournament):
    """Test starting tournament."""
    client.login(user)
    response = client.post(url_for('tournaments.start_tournament', id=tournament.id))
    assert response.status_code == 200
    assert response.json['status'] == 'active'

def test_complete_tournament(client, user, tournament):
    """Test completing tournament."""
    client.login(user)
    # First start the tournament
    tournament.start()
    response = client.post(url_for('tournaments.complete_tournament', id=tournament.id))
    assert response.status_code == 200
    assert response.json['status'] == 'completed'

def test_cancel_tournament(client, user, tournament):
    """Test cancelling tournament."""
    client.login(user)
    response = client.post(url_for('tournaments.cancel_tournament', id=tournament.id))
    assert response.status_code == 200
    assert response.json['status'] == 'cancelled'

def test_admin_permissions(client, admin_user, tournament):
    """Test admin user permissions."""
    client.login(admin_user)
    
    # Admin can update any tournament
    response = client.put(
        url_for('tournaments.update_tournament', id=tournament.id),
        json={'name': 'Admin Update'}
    )
    assert response.status_code == 200
    
    # Admin can delete any tournament
    response = client.delete(url_for('tournaments.delete_tournament', id=tournament.id))
    assert response.status_code == 204 