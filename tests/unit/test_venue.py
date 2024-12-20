"""Test venue module."""

import pytest
from src.models.venue import Venue
from src.models.user import User

@pytest.fixture
def venue_data():
    """Create venue data for testing."""
    return {
        'name': 'Test Pool Hall',
        'description': 'A test pool hall',
        'address': '123 Test St',
        'city': 'Test City',
        'state': 'TS',
        'zip_code': '12345',
        'phone': '555-1234',
        'email': 'test@poolhall.com',
        'website': 'http://testpoolhall.com',
        'hours': '9:00 AM - 2:00 AM',
        'tables': 10,
        'table_rate': 15.0
    }

def test_venue_creation(db, venue_data):
    """Test venue creation."""
    venue = Venue(**venue_data)
    db.session.add(venue)
    db.session.commit()
    
    # Test venue attributes
    assert venue.name == venue_data['name']
    assert venue.description == venue_data['description']
    assert venue.address == venue_data['address']
    assert venue.city == venue_data['city']
    assert venue.state == venue_data['state']
    assert venue.zip_code == venue_data['zip_code']
    assert venue.phone == venue_data['phone']
    assert venue.email == venue_data['email']
    assert venue.website == venue_data['website']
    assert venue.hours == venue_data['hours']
    assert venue.tables == venue_data['tables']
    assert venue.table_rate == venue_data['table_rate']

def test_venue_update(db, venue_data):
    """Test venue update."""
    venue = Venue(**venue_data)
    db.session.add(venue)
    db.session.commit()
    
    # Update venue
    venue.name = 'Updated Pool Hall'
    venue.description = 'Updated description'
    venue.tables = 15
    venue.table_rate = 20.0
    db.session.commit()
    
    # Test updated attributes
    assert venue.name == 'Updated Pool Hall'
    assert venue.description == 'Updated description'
    assert venue.tables == 15
    assert venue.table_rate == 20.0

def test_venue_validation(db, venue_data):
    """Test venue validation."""
    # Test required fields
    required_fields = ['name', 'address', 'city', 'state', 'zip_code']
    for field in required_fields:
        data = venue_data.copy()
        data[field] = None
        with pytest.raises(ValueError):
            venue = Venue(**data)
            db.session.add(venue)
            db.session.commit()
    
    # Test invalid email
    data = venue_data.copy()
    data['email'] = 'invalid-email'
    with pytest.raises(ValueError):
        venue = Venue(**data)
        db.session.add(venue)
        db.session.commit()
    
    # Test invalid website
    data = venue_data.copy()
    data['website'] = 'invalid-website'
    with pytest.raises(ValueError):
        venue = Venue(**data)
        db.session.add(venue)
        db.session.commit()
    
    # Test invalid phone
    data = venue_data.copy()
    data['phone'] = '123'
    with pytest.raises(ValueError):
        venue = Venue(**data)
        db.session.add(venue)
        db.session.commit()

def test_venue_search(db, venue_data):
    """Test venue search."""
    # Create multiple venues
    venues = [
        Venue(
            name=f'Pool Hall {i}',
            description=venue_data['description'],
            address=f'{i} Test St',
            city=venue_data['city'],
            state=venue_data['state'],
            zip_code=venue_data['zip_code'],
            phone=venue_data['phone'],
            email=venue_data['email'],
            website=venue_data['website'],
            hours=venue_data['hours'],
            tables=venue_data['tables'],
            table_rate=venue_data['table_rate']
        )
        for i in range(5)
    ]
    db.session.add_all(venues)
    db.session.commit()
    
    # Test search by name
    results = Venue.search('Pool Hall')
    assert len(results) == 5
    
    # Test search by city
    results = Venue.search(venue_data['city'])
    assert len(results) == 5
    
    # Test search by state
    results = Venue.search(venue_data['state'])
    assert len(results) == 5
    
    # Test search with no results
    results = Venue.search('Nonexistent')
    assert len(results) == 0 