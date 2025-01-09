import pytest
from dojopool.models.location import Location

def test_location_creation(db_session):
    """Test basic location creation."""
    location = Location(
        name="Downtown Pool Hall",
        address="123 Main St",
        city="San Francisco",
        state="CA",
        postal_code="94105",
        country="USA",
        phone="+1-415-555-0123",
        email="contact@downtownpool.com",
        website="https://downtownpool.com"
    )
    db_session.add(location)
    db_session.commit()

    assert location.id is not None
    assert location.name == "Downtown Pool Hall"
    assert location.address == "123 Main St"
    assert location.city == "San Francisco"
    assert location.state == "CA"
    assert location.postal_code == "94105"
    assert location.country == "USA"
    assert location.phone == "+1-415-555-0123"
    assert location.email == "contact@downtownpool.com"
    assert location.website == "https://downtownpool.com"

def test_location_validation(db_session):
    """Test location validation rules."""
    # Test required fields
    with pytest.raises(ValueError):
        Location(
            address="123 Main St",
            city="San Francisco"
        )

    # Test invalid email
    with pytest.raises(ValueError):
        Location(
            name="Test Location",
            address="123 Main St",
            city="San Francisco",
            email="invalid-email"
        )

    # Test invalid website
    with pytest.raises(ValueError):
        Location(
            name="Test Location",
            address="123 Main St",
            city="San Francisco",
            website="invalid-url"
        )

def test_location_operating_hours(db_session):
    """Test location operating hours."""
    location = Location(
        name="Downtown Pool Hall",
        address="123 Main St",
        city="San Francisco"
    )
    
    operating_hours = {
        "monday": "9:00-22:00",
        "tuesday": "9:00-22:00",
        "wednesday": "9:00-22:00",
        "thursday": "9:00-23:00",
        "friday": "9:00-00:00",
        "saturday": "10:00-00:00",
        "sunday": "10:00-22:00"
    }
    
    location.operating_hours = operating_hours
    db_session.add(location)
    db_session.commit()

    assert location.operating_hours == operating_hours
    assert location.is_open("monday", "10:00")
    assert not location.is_open("monday", "23:00")
    assert location.is_open("friday", "23:30")

def test_location_amenities(db_session):
    """Test location amenities management."""
    location = Location(
        name="Downtown Pool Hall",
        address="123 Main St",
        city="San Francisco"
    )
    
    amenities = {
        "tables": 12,
        "has_bar": True,
        "has_restaurant": True,
        "parking_available": True,
        "wheelchair_accessible": True,
        "table_types": ["pool", "snooker", "billiards"]
    }
    
    location.amenities = amenities
    db_session.add(location)
    db_session.commit()

    assert location.amenities == amenities
    assert location.amenities["tables"] == 12
    assert location.amenities["has_bar"] is True
    assert "pool" in location.amenities["table_types"]

def test_location_search(db_session):
    """Test location search functionality."""
    # Create test locations
    locations = [
        Location(
            name="Downtown Pool Hall",
            address="123 Main St",
            city="San Francisco",
            state="CA"
        ),
        Location(
            name="Uptown Billiards",
            address="456 Market St",
            city="San Francisco",
            state="CA"
        ),
        Location(
            name="Suburb Pool Club",
            address="789 Oak Rd",
            city="Oakland",
            state="CA"
        )
    ]
    
    for location in locations:
        db_session.add(location)
    db_session.commit()

    # Test search by city
    sf_locations = Location.search(db_session, city="San Francisco")
    assert len(sf_locations) == 2
    assert all(loc.city == "San Francisco" for loc in sf_locations)

    # Test search by name
    pool_locations = Location.search(db_session, name_contains="Pool")
    assert len(pool_locations) == 2
    assert all("Pool" in loc.name for loc in pool_locations)

def test_location_serialization(db_session):
    """Test location serialization to dict."""
    location = Location(
        name="Downtown Pool Hall",
        address="123 Main St",
        city="San Francisco",
        state="CA",
        postal_code="94105",
        country="USA",
        phone="+1-415-555-0123",
        email="contact@downtownpool.com",
        website="https://downtownpool.com",
        operating_hours={
            "monday": "9:00-22:00",
            "tuesday": "9:00-22:00"
        },
        amenities={
            "tables": 12,
            "has_bar": True
        }
    )
    db_session.add(location)
    db_session.commit()

    location_dict = location.to_dict()
    
    assert location_dict["id"] == location.id
    assert location_dict["name"] == "Downtown Pool Hall"
    assert location_dict["address"] == "123 Main St"
    assert location_dict["city"] == "San Francisco"
    assert location_dict["operating_hours"]["monday"] == "9:00-22:00"
    assert location_dict["amenities"]["tables"] == 12

def test_location_availability(db_session):
    """Test location availability checking."""
    location = Location(
        name="Downtown Pool Hall",
        address="123 Main St",
        city="San Francisco",
        operating_hours={
            "monday": "9:00-22:00",
            "tuesday": "9:00-22:00"
        }
    )
    db_session.add(location)
    db_session.commit()

    # Test table availability
    assert location.check_availability("monday", "10:00", tables_needed=1)
    assert not location.check_availability("monday", "23:00", tables_needed=1)
    
    # Test capacity limits
    location.amenities = {"tables": 5}
    assert location.check_availability("monday", "10:00", tables_needed=5)
    assert not location.check_availability("monday", "10:00", tables_needed=6) 