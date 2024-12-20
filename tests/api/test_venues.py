"""Tests for venue API endpoints."""

import pytest
from flask import url_for
from datetime import datetime
from src.core.models import Venue
from src.core.extensions import db
from tests.factories import UserFactory, VenueFactory
from tests.helpers.auth import login_user_and_get_token, get_auth_headers

def test_list_venues(client, venues):
    """Test listing all active venues."""
    response = client.get('/venues/')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert len(json_data['data']['venues']) == len(venues)
    assert json_data['data']['total_count'] == len(venues)
    
    # Verify venue data
    for venue_data in json_data['data']['venues']:
        assert 'id' in venue_data
        assert 'name' in venue_data
        assert 'address' in venue_data
        assert 'owner_id' in venue_data

def test_get_venue(client, venue):
    """Test getting a specific venue."""
    response = client.get(f'/venues/{venue.id}')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['venue']['id'] == venue.id
    assert json_data['data']['venue']['name'] == venue.name
    assert json_data['data']['venue']['address'] == venue.address

def test_get_venue_not_found(client):
    """Test getting a non-existent venue."""
    response = client.get('/venues/999')
    assert response.status_code == 404

def test_create_venue_as_admin(client, admin_user, admin_auth_headers):
    """Test creating a new venue as admin."""
    data = {
        'name': 'New Test Venue',
        'address': '123 Test St',
        'latitude': 37.7749,
        'longitude': -122.4194,
        'description': 'A test venue',
        'opening_hours': {'mon-fri': '9:00-17:00'},
        'contact_info': {'phone': '555-0123', 'email': 'test@venue.com'}
    }
    
    response = client.post(
        '/venues/',
        json=data,
        headers=admin_auth_headers
    )
    assert response.status_code == 201
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['venue']['name'] == data['name']
    assert json_data['data']['venue']['address'] == data['address']

def test_create_venue_as_non_admin(client, user, auth_headers):
    """Test creating a venue as non-admin user."""
    data = {
        'name': 'New Test Venue',
        'address': '123 Test St'
    }
    
    response = client.post(
        '/venues/',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == 403

def test_create_venue_missing_fields(client, admin_user, admin_auth_headers):
    """Test creating a venue with missing required fields."""
    data = {'name': 'Incomplete Venue'}  # Missing address
    
    response = client.post(
        '/venues/',
        json=data,
        headers=admin_auth_headers
    )
    assert response.status_code == 400
    
    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'missing required fields' in json_data['message'].lower()

def test_update_venue_as_owner(client, venue, user, auth_headers):
    """Test updating a venue as the owner."""
    data = {
        'name': 'Updated Venue Name',
        'description': 'Updated description'
    }
    
    response = client.put(
        f'/venues/{venue.id}',
        json=data,
        headers=auth_headers
    )
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['venue']['name'] == data['name']
    assert json_data['data']['venue']['description'] == data['description']

def test_update_venue_as_non_owner(client, venue):
    """Test updating a venue as non-owner."""
    # Create a different user
    other_user = UserFactory(username='other_user')
    token = login_user_and_get_token(client, other_user)
    headers = get_auth_headers(token)
    
    data = {'name': 'Unauthorized Update'}
    
    response = client.put(
        f'/venues/{venue.id}',
        json=data,
        headers=headers
    )
    assert response.status_code == 403

def test_delete_venue_as_admin(client, venue, admin_user, admin_auth_headers):
    """Test soft deleting a venue as admin."""
    response = client.delete(
        f'/venues/{venue.id}',
        headers=admin_auth_headers
    )
    assert response.status_code == 200
    
    # Verify venue is marked as inactive
    venue_obj = Venue.query.get(venue.id)
    assert not venue_obj.is_active

def test_delete_venue_as_non_admin(client, venue, user, auth_headers):
    """Test deleting a venue as non-admin user."""
    response = client.delete(
        f'/venues/{venue.id}',
        headers=auth_headers
    )
    assert response.status_code == 403

def test_get_venue_games(client, venue, games):
    """Test getting all games at a venue."""
    response = client.get(f'/venues/{venue.id}/games')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert len(json_data['data']['games']) == len(games)

def test_get_venue_tournaments(client, venue, tournaments):
    """Test getting all tournaments at a venue."""
    response = client.get(f'/venues/{venue.id}/tournaments')
    assert response.status_code == 200
    
    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert len(json_data['data']['tournaments']) == len(tournaments)

def test_list_venues_pagination(client, venues):
    """Test venue listing with pagination."""
    # Test with limit
    response = client.get('/venues/?limit=2')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == 2
    assert json_data['data']['total_count'] == len(venues)
    assert json_data['data']['per_page'] == 2
    
    # Test with offset
    response = client.get('/venues/?offset=1')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == len(venues) - 1
    assert json_data['data']['total_count'] == len(venues)
    assert json_data['data']['offset'] == 1

def test_list_venues_filtering(client, venues, session):
    """Test venue listing with filters."""
    # Test filtering by name
    venue_name = venues[0].name
    response = client.get(f'/venues/?name={venue_name}')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == 1
    assert json_data['data']['venues'][0]['name'] == venue_name
    assert json_data['data']['total_count'] == 1
    
    # Test filtering by active status
    # First verify all venues are returned when active=true (default)
    response = client.get('/venues/')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == len(venues)
    
    # Now set one venue to inactive and verify it's saved
    session.query(type(venues[0])).filter_by(id=venues[0].id).update({'is_active': False})
    session.commit()
    
    # Verify only active venues are returned when active=true
    response = client.get('/venues/?active=true')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == len(venues) - 1
    assert json_data['data']['total_count'] == len(venues) - 1
    
    # Verify inactive venues are returned when active=false
    response = client.get('/venues/?active=false')
    json_data = response.get_json()
    assert len(json_data['data']['venues']) == 1
    assert json_data['data']['total_count'] == 1
    assert json_data['data']['venues'][0]['id'] == venues[0].id