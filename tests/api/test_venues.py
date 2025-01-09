"""Tests for venue API endpoints."""
import pytest
from dojopool.models import Venue
from dojopool.core.db import db

def test_create_venue(client, auth_headers):
    """Test venue creation."""
    venue_data = {
        "name": "Test Venue",
        "address": "123 Test St",
        "city": "Test City",
        "state": "TS",
        "zip_code": "12345",
        "phone": "123-456-7890",
        "email": "test@venue.com",
        "description": "A test venue"
    }
    
    response = client.post(
        "/api/venues",
        json=venue_data,
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json["name"] == venue_data["name"]
    
    # Verify venue was created in database
    venue = Venue.query.filter_by(name=venue_data["name"]).first()
    assert venue is not None
    assert venue.address == venue_data["address"]

def test_get_venue(client):
    """Test getting venue details."""
    # Create test venue
    venue = Venue(
        name="Test Venue",
        address="123 Test St",
        city="Test City",
        state="TS",
        zip_code="12345",
        phone="123-456-7890",
        email="test@venue.com",
        description="A test venue"
    )
    db.session.add(venue)
    db.session.commit()
    
    response = client.get(f"/api/venues/{venue.id}")
    assert response.status_code == 200
    assert response.json["name"] == venue.name
    assert response.json["address"] == venue.address

def test_update_venue(client, auth_headers):
    """Test updating venue details."""
    # Create test venue
    venue = Venue(
        name="Test Venue",
        address="123 Test St",
        city="Test City",
        state="TS",
        zip_code="12345",
        phone="123-456-7890",
        email="test@venue.com",
        description="A test venue"
    )
    db.session.add(venue)
    db.session.commit()
    
    update_data = {
        "name": "Updated Venue",
        "address": "456 Update St"
    }
    
    response = client.put(
        f"/api/venues/{venue.id}",
        json=update_data,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json["name"] == update_data["name"]
    assert response.json["address"] == update_data["address"]
    
    # Verify venue was updated in database
    venue = Venue.query.get(venue.id)
    assert venue.name == update_data["name"]
    assert venue.address == update_data["address"]

def test_delete_venue(client, auth_headers):
    """Test deleting a venue."""
    # Create test venue
    venue = Venue(
        name="Test Venue",
        address="123 Test St",
        city="Test City",
        state="TS",
        zip_code="12345",
        phone="123-456-7890",
        email="test@venue.com",
        description="A test venue"
    )
    db.session.add(venue)
    db.session.commit()
    
    response = client.delete(
        f"/api/venues/{venue.id}",
        headers=auth_headers
    )
    assert response.status_code == 204
    
    # Verify venue was deleted from database
    venue = Venue.query.get(venue.id)
    assert venue is None