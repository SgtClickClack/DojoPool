"""Test suite for validation module."""

import pytest
from .validators import VenueValidator


@pytest.fixture
def valid_venue_data():
    """Return valid venue data for testing."""
    return {
        "name": "The Golden Cue",
        "address": "123 Pool Street",
        "city": "Cue City",
        "state": "Pool State",
        "country": "Poolland",
        "postal_code": "12345",
        "phone": "+1-555-123-4567",
        "email": "contact@goldencue.com",
        "website": "https://goldencue.com",
        "capacity": 100,
        "tables": 10,
        "table_rate": 25.0,
        "rating": 4.5,
        "status": "active",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "photos": ["https://goldencue.com/photo1.jpg"],
        "social_links": {"facebook": "https://facebook.com/goldencue"},
        "featured_image": "https://goldencue.com/featured.jpg",
        "virtual_tour": "https://goldencue.com/tour",
        "hours_data": {
            "monday": {"open": "09:00", "close": "23:00"},
        },
        "amenities_summary": {"parking": True, "food": True},
        "rules": "No food or drinks near tables",
        "notes": "Family-friendly venue",
    }


class TestVenueValidator:
    """Test cases for VenueValidator class."""

    def test_validate_name(self):
        """Test name validation."""
        assert VenueValidator.validate_name("Valid Name")
        assert not VenueValidator.validate_name("")
        assert not VenueValidator.validate_name("x" * 101)

    def test_validate_address(self):
        """Test address validation."""
        assert VenueValidator.validate_address("123 Valid St")
        assert not VenueValidator.validate_address("")
        assert not VenueValidator.validate_address("x" * 256)

    def test_validate_coordinates(self):
        """Test coordinates validation."""
        assert VenueValidator.validate_coordinates(40.7128, -74.0060)
        assert not VenueValidator.validate_coordinates(91, 0)
        assert not VenueValidator.validate_coordinates(0, 181)
        assert VenueValidator.validate_coordinates(None, None)

    def test_validate_phone(self):
        """Test phone validation."""
        assert VenueValidator.validate_phone("+1-555-123-4567")
        assert VenueValidator.validate_phone(None)
        assert not VenueValidator.validate_phone("x" * 21)

    def test_validate_email(self):
        """Test email validation."""
        assert VenueValidator.validate_email("test@example.com")
        assert VenueValidator.validate_email(None)
        assert not VenueValidator.validate_email("invalid-email")
        assert not VenueValidator.validate_email("x" * 95 + "@test.com")

    def test_validate_website(self):
        """Test website validation."""
        assert VenueValidator.validate_website("https://example.com")
        assert VenueValidator.validate_website("http://example.com")
        assert VenueValidator.validate_website(None)
        assert not VenueValidator.validate_website("invalid-url")
        assert not VenueValidator.validate_website("x" * 256)

    def test_validate_capacity(self):
        """Test capacity validation."""
        assert VenueValidator.validate_capacity(100)
        assert VenueValidator.validate_capacity(None)
        assert not VenueValidator.validate_capacity(0)
        assert not VenueValidator.validate_capacity(-1)

    def test_validate_tables(self):
        """Test tables validation."""
        assert VenueValidator.validate_tables(1)
        assert VenueValidator.validate_tables(100)
        assert not VenueValidator.validate_tables(0)
        assert not VenueValidator.validate_tables(-1)

    def test_validate_table_rate(self):
        """Test table rate validation."""
        assert VenueValidator.validate_table_rate(25.0)
        assert VenueValidator.validate_table_rate(0)
        assert VenueValidator.validate_table_rate(None)
        assert not VenueValidator.validate_table_rate(-1)

    def test_validate_rating(self):
        """Test rating validation."""
        assert VenueValidator.validate_rating(4.5)
        assert VenueValidator.validate_rating(None)
        assert not VenueValidator.validate_rating(5.1)
        assert not VenueValidator.validate_rating(-0.1)

    def test_validate_status(self):
        """Test status validation."""
        assert VenueValidator.validate_status("active")
        assert VenueValidator.validate_status("maintenance")
        assert VenueValidator.validate_status("closed")
        assert not VenueValidator.validate_status("invalid")

    def test_validate_photos(self):
        """Test photos validation."""
        assert VenueValidator.validate_photos(["https://example.com/photo.jpg"])
        assert VenueValidator.validate_photos(None)
        assert not VenueValidator.validate_photos(["x" * 256])
        assert not VenueValidator.validate_photos([123])  # Invalid type

    def test_validate_social_links(self):
        """Test social links validation."""
        assert VenueValidator.validate_social_links({"facebook": "https://fb.com/venue"})
        assert VenueValidator.validate_social_links(None)
        assert not VenueValidator.validate_social_links({"facebook": "x" * 256})

    def test_validate_hours_data(self):
        """Test hours data validation."""
        valid_hours = {"monday": {"open": "09:00", "close": "23:00"}}
        assert VenueValidator.validate_hours_data(valid_hours)
        assert VenueValidator.validate_hours_data(None)
        assert not VenueValidator.validate_hours_data({"invalid": "data"})

    def test_validate_complete_venue(self, valid_venue_data):
        """Test complete venue validation."""
        assert VenueValidator.validate(valid_venue_data)

        # Test with invalid data
        invalid_data = valid_venue_data.copy()
        invalid_data["name"] = ""
        assert not VenueValidator.validate(invalid_data)

    def test_metrics_tracking(self, valid_venue_data):
        """Test validation metrics tracking."""
        # Reset metrics before testing
        VenueValidator.reset_metrics()

        # Perform some validations
        VenueValidator.validate_name("Test Venue")  # Valid
        VenueValidator.validate_name("")  # Invalid
        VenueValidator.validate_email("invalid-email")  # Invalid
        VenueValidator.validate_email("valid@email.com")  # Valid

        # Get metrics
        metrics = VenueValidator.get_metrics()

        # Check name metrics
        assert metrics["name"]["total_validations"] == 2
        assert metrics["name"]["failure_count"] == 1
        assert metrics["name"]["success_rate"] == 50.0
        assert metrics["name"]["avg_duration_ms"] > 0

        # Check email metrics
        assert metrics["email"]["total_validations"] == 2
        assert metrics["email"]["failure_count"] == 1
        assert metrics["email"]["success_rate"] == 50.0
        assert metrics["email"]["avg_duration_ms"] > 0

        # Check metadata
        assert "_meta" in metrics
        assert "last_reset" in metrics["_meta"]
        assert metrics["_meta"]["total_fields_validated"] == 2

    def test_metrics_reset(self):
        """Test metrics reset functionality."""
        # Perform some validations
        VenueValidator.validate_name("Test Venue")
        VenueValidator.validate_email("test@example.com")

        # Reset metrics
        VenueValidator.reset_metrics()

        # Get metrics after reset
        metrics = VenueValidator.get_metrics()

        # Verify all counters are reset
        assert len(metrics) == 1  # Only _meta should be present
        assert metrics["_meta"]["total_fields_validated"] == 0

    def test_complete_validation_metrics(self, valid_venue_data):
        """Test metrics for complete venue validation."""
        VenueValidator.reset_metrics()

        # Validate complete venue data
        assert VenueValidator.validate(valid_venue_data)

        # Get metrics
        metrics = VenueValidator.get_metrics()

        # Check complete validation metrics
        assert metrics["complete_validation"]["total_validations"] == 1
        assert metrics["complete_validation"]["failure_count"] == 0
        assert metrics["complete_validation"]["success_rate"] == 100.0
        assert metrics["complete_validation"]["avg_duration_ms"] > 0

        # Validate with invalid data
        invalid_data = valid_venue_data.copy()
        invalid_data["name"] = ""
        assert not VenueValidator.validate(invalid_data)

        # Get updated metrics
        metrics = VenueValidator.get_metrics()

        # Check updated complete validation metrics
        assert metrics["complete_validation"]["total_validations"] == 2
        assert metrics["complete_validation"]["failure_count"] == 1
        assert metrics["complete_validation"]["success_rate"] == 50.0
