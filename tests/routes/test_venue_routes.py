"""Tests for the venue routes blueprint."""

import pytest
from unittest.mock import patch, MagicMock
from flask import url_for

# Assuming models and app factory are structured as used previously
from dojopool.models.venue import Venue
from dojopool.core.extensions import cache

# TODO: We might need a fixture to create a test venue in the DB

def test_get_venue_detail_success(client, test_venue):
    """Test successfully retrieving venue details."""
    # Assume test_venue is a fixture providing a Venue object with id=1
    url = url_for('venue.get_venue', venue_id=test_venue.id)
    response = client.get(url)
    assert response.status_code == 200
    assert bytes(test_venue.name, 'utf-8') in response.data
    assert bytes(test_venue.address, 'utf-8') in response.data

def test_get_venue_detail_not_found(client):
    """Test retrieving a non-existent venue."""
    url = url_for('venue.get_venue', venue_id=9999)
    response = client.get(url)
    assert response.status_code == 404

@patch('dojopool.routes.venue_routes.Venue.query')
def test_venue_detail_caching(mock_query, client, app):
    """Test that the get_venue route uses the cache."""
    # Configure a mock Venue object
    mock_venue = MagicMock(spec=Venue)
    mock_venue.id = 1
    mock_venue.name = "Test Cache Venue"
    mock_venue.address = "123 Cache St"
    mock_venue.city = "Cacheville"
    mock_venue.latitude = 40.7128
    mock_venue.longitude = -74.0060
    mock_venue.tables = 5
    mock_venue.get_current_games.return_value = []
    mock_venue.get_checked_in_players.return_value = []

    # Configure the mock query object
    mock_get_or_404 = MagicMock(return_value=mock_venue)
    mock_query.get_or_404 = mock_get_or_404

    # Use app context for cache operations
    with app.app_context():
        cache.clear() # Ensure cache is clear before test

        url = url_for('venue.get_venue', venue_id=1)

        # --- First request ---
        print("\nMaking first request...")
        response1 = client.get(url)
        assert response1.status_code == 200
        assert b"Test Cache Venue" in response1.data
        # Check that the mock DB query was called
        print(f"DB call count after first request: {mock_get_or_404.call_count}")
        mock_get_or_404.assert_called_once_with(1)

        # --- Second request ---
        print("\nMaking second request...")
        response2 = client.get(url)
        assert response2.status_code == 200
        assert b"Test Cache Venue" in response2.data
        # Check that the mock DB query was NOT called again (should be cached)
        print(f"DB call count after second request: {mock_get_or_404.call_count}")
        mock_get_or_404.assert_called_once() # Still called only once total

        # --- Request for different ID ---
        print("\nMaking third request (different ID)...")
        # Configure mock query for a different ID
        mock_venue_2 = MagicMock(spec=Venue)
        mock_venue_2.id = 2
        # ... (configure other attributes if needed) ...
        mock_get_or_404.return_value = mock_venue_2
        url_2 = url_for('venue.get_venue', venue_id=2)
        response3 = client.get(url_2)
        assert response3.status_code == 200
        # Check that the DB query was called again for the new ID
        print(f"DB call count after third request: {mock_get_or_404.call_count}")
        assert mock_get_or_404.call_count == 2 # Called again for ID 2

        # Clear cache after test
        cache.clear()

# TODO: Add tests for list_venues, create_venue, edit_venue, check_in, rate_venue, delete_venue
# TODO: Add a fixture for creating a venue in the test database (`test_venue`)
# TODO: Configure fakeredis for tests (likely in conftest.py or app fixture) 