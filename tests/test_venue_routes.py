"""Tests for venue and QR code route handlers."""

import json
from datetime import datetime
from unittest.mock import Mock, patch

import pytest

from dojopool.venues.venue_manager import PoolTable
from dojopool.core.venue.routes import venue_bp


@pytest.fixture
def app():
    """Create test Flask application."""
    from flask import Flask

    app = Flask(__name__)
    app.config["TESTING"] = True
    app.register_blueprint(venue_bp)
    return app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Create mock authentication headers."""
    return {"Authorization": "Bearer test_token"}


@pytest.fixture
def mock_table():
    """Create mock pool table."""
    table = Mock(spec=PoolTable)
    table.id = "table123"
    return table


@pytest.fixture
def mock_venue():
    """Create mock venue."""
    return {"id": "venue456", "name": "Test Venue"}


@pytest.fixture
def mock_qr_code():
    """Create mock QR code data."""
    return "base64_encoded_qr_code"


@pytest.fixture
def mock_qr_data():
    """Create mock QR code scan data."""
    return json.dumps(
        {
            "table_id": "table123",
            "venue_id": "venue456",
            "timestamp": datetime.utcnow().isoformat(),
            "signature": "test_signature",
        }
    )


def test_generate_table_qr_success(client, auth_headers, mock_table, mock_venue, mock_qr_code):
    """Test successful QR code generation."""
    with (
        patch("dojopool.core.venue.models.venue_manager") as mock_manager,
        patch("dojopool.core.venue.qr.qr_manager") as mock_qr,
    ):
        # Setup mocks
        mock_manager.get_venue.return_value = mock_venue
        mock_manager.tables.get.return_value = mock_table
        mock_qr.generate_table_qr.return_value = mock_qr_code

        # Make request
        response = client.get(
            f'/venues/{mock_venue["id"]}/tables/{mock_table.id}/qr', headers=auth_headers
        )

        # Check response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["qr_code"] == mock_qr_code
        assert data["table_id"] == mock_table.id
        assert data["venue_id"] == mock_venue["id"]


def test_generate_table_qr_invalid_venue(client, auth_headers):
    """Test QR code generation with invalid venue."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.get_venue.return_value = None

        response = client.get("/venues/invalid_venue/tables/table123/qr", headers=auth_headers)

        assert response.status_code == 404
        data = json.loads(response.data)
        assert "error" in data
        assert "Venue not found" in data["error"]


def test_generate_table_qr_invalid_table(client, auth_headers, mock_venue):
    """Test QR code generation with invalid table."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.get_venue.return_value = mock_venue
        mock_manager.tables.get.return_value = None

        response = client.get(
            f'/venues/{mock_venue["id"]}/tables/invalid_table/qr', headers=auth_headers
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert "error" in data
        assert "Table not found" in data["error"]


def test_verify_qr_code_success(client, auth_headers, mock_table, mock_venue, mock_qr_data):
    """Test successful QR code verification."""
    with patch("dojopool.core.venue.qr.qr_manager") as mock_qr:
        # Setup mock verification result
        mock_qr.verify_qr_code.return_value = {
            "valid": True,
            "table": mock_table,
            "venue": mock_venue,
            "timestamp": datetime.utcnow(),
        }

        # Make request
        response = client.post("/qr/verify", headers=auth_headers, json={"qr_data": mock_qr_data})

        # Check response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["valid"] is True
        assert data["table_id"] == mock_table.id
        assert data["venue_id"] == mock_venue["id"]
        assert "timestamp" in data


def test_verify_qr_code_invalid_data(client, auth_headers):
    """Test QR code verification with invalid data."""
    response = client.post("/qr/verify", headers=auth_headers, json={})

    assert response.status_code == 400
    data = json.loads(response.data)
    assert "error" in data
    assert "Missing QR code data" in data["error"]


def test_verify_qr_code_verification_failed(client, auth_headers, mock_qr_data):
    """Test QR code verification failure."""
    with patch("dojopool.core.venue.qr.qr_manager") as mock_qr:
        mock_qr.verify_qr_code.return_value = {"valid": False, "error": "Invalid signature"}

        response = client.post("/qr/verify", headers=auth_headers, json={"qr_data": mock_qr_data})

        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["valid"] is False
        assert "error" in data
        assert "Invalid signature" in data["error"]


def test_refresh_table_qr_success(client, auth_headers, mock_table, mock_venue, mock_qr_code):
    """Test successful QR code refresh."""
    with (
        patch("dojopool.core.venue.models.venue_manager") as mock_manager,
        patch("dojopool.core.venue.qr.qr_manager") as mock_qr,
    ):
        # Setup mocks
        mock_manager.get_venue.return_value = mock_venue
        mock_manager.tables.get.return_value = mock_table
        mock_qr.generate_table_qr.return_value = mock_qr_code

        # Make request
        response = client.post(
            f'/venues/{mock_venue["id"]}/tables/{mock_table.id}/qr/refresh', headers=auth_headers
        )

        # Check response
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["qr_code"] == mock_qr_code
        assert data["table_id"] == mock_table.id
        assert data["venue_id"] == mock_venue["id"]


def test_refresh_table_qr_invalid_venue(client, auth_headers):
    """Test QR code refresh with invalid venue."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.get_venue.return_value = None

        response = client.post(
            "/venues/invalid_venue/tables/table123/qr/refresh", headers=auth_headers
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert "error" in data
        assert "Venue not found" in data["error"]


def test_refresh_table_qr_invalid_table(client, auth_headers, mock_venue):
    """Test QR code refresh with invalid table."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.get_venue.return_value = mock_venue
        mock_manager.tables.get.return_value = None

        response = client.post(
            f'/venues/{mock_venue["id"]}/tables/invalid_table/qr/refresh', headers=auth_headers
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert "error" in data
        assert "Table not found" in data["error"]


def test_refresh_table_qr_generation_failed(client, auth_headers, mock_table, mock_venue):
    """Test QR code refresh with generation failure."""
    with (
        patch("dojopool.core.venue.models.venue_manager") as mock_manager,
        patch("dojopool.core.venue.qr.qr_manager") as mock_qr,
    ):
        # Setup mocks
        mock_manager.get_venue.return_value = mock_venue
        mock_manager.tables.get.return_value = mock_table
        mock_qr.generate_table_qr.return_value = None

        # Make request
        response = client.post(
            f'/venues/{mock_venue["id"]}/tables/{mock_table.id}/qr/refresh', headers=auth_headers
        )

        # Check response
        assert response.status_code == 500
        data = json.loads(response.data)
        assert "error" in data
        assert "Failed to refresh QR code" in data["error"]


def minimal_checkin_app():
    from flask import Flask
    from dojopool.routes import venue_routes
    app = Flask(__name__)
    app.config["TESTING"] = True
    # Register only the check-in route
    app.add_url_rule(
        "/venues/<int:venue_id>/check-in",
        view_func=venue_routes.check_in,
        methods=["POST"],
    )
    return app


def test_venue_check_in_valid():
    """Test successful check-in with valid QR and geolocation."""
    from flask.testing import FlaskClient
    app = minimal_checkin_app()
    client = app.test_client()
    venue_id = 1
    payload = {
        "qrCode": f"venue-{venue_id}",
        "latitude": 40.7128,
        "longitude": -74.0060,
    }
    with app.app_context():
        with patch("dojopool.routes.venue_routes.Venue") as MockVenue:
            MockVenue.__name__ = "MockVenue"
            with patch("dojopool.routes.venue_routes.VenueCheckIn") as MockCheckIn:
                MockCheckIn.__name__ = "MockCheckIn"
                mock_user = Mock()
                mock_user.id = 123
                mock_user.is_authenticated = True
                mock_user.__name__ = "MockUser"
                with patch("flask_login.utils._get_user", return_value=mock_user):
                    mock_venue = MockVenue.query.get_or_404.return_value
                    mock_venue.latitude = 40.7128
                    mock_venue.longitude = -74.0060
                    MockCheckIn.query.filter_by.return_value.first.return_value = None
                    response = client.post(f"/venues/{venue_id}/check-in", json=payload)
                    if response.status_code != 200:
                        print("Response data:", response.data)
                    assert response.status_code == 200
                    data = json.loads(response.data)
                    assert "success" in data or "message" in data


def test_venue_check_in_invalid_qr():
    """Test check-in with invalid QR code."""
    from flask.testing import FlaskClient
    app = minimal_checkin_app()
    client = app.test_client()
    venue_id = 1
    payload = {
        "qrCode": "wrong-qr",
        "latitude": 40.7128,
        "longitude": -74.0060,
    }
    with app.app_context():
        with patch("dojopool.routes.venue_routes.Venue") as MockVenue:
            mock_user = Mock()
            mock_user.id = 123
            mock_user.is_authenticated = True
            mock_user.__name__ = "MockUser"
            with patch("flask_login.utils._get_user", return_value=mock_user):
                MockVenue.query.get_or_404.return_value.latitude = 40.7128
                MockVenue.query.get_or_404.return_value.longitude = 40.7128
                response = client.post(f"/venues/{venue_id}/check-in", json=payload)
                assert response.status_code == 400
                data = json.loads(response.data)
                assert "Invalid QR code" in data.get("error", "")


def test_venue_check_in_out_of_bounds():
    """Test check-in with geolocation outside allowed range."""
    from flask.testing import FlaskClient
    app = minimal_checkin_app()
    client = app.test_client()
    venue_id = 1
    payload = {
        "qrCode": f"venue-{venue_id}",
        "latitude": 41.0,  # Far from venue
        "longitude": -75.0,
    }
    with app.app_context():
        with patch("dojopool.routes.venue_routes.Venue") as MockVenue:
            mock_user = Mock()
            mock_user.id = 123
            mock_user.is_authenticated = True
            mock_user.__name__ = "MockUser"
            with patch("flask_login.utils._get_user", return_value=mock_user):
                mock_venue = MockVenue.query.get_or_404.return_value
                mock_venue.latitude = 40.7128
                mock_venue.longitude = -74.0060
                response = client.post(f"/venues/{venue_id}/check-in", json=payload)
                assert response.status_code == 400
                data = json.loads(response.data)
                assert "within 50 meters" in data.get("error", "")


def test_venue_check_in_already_checked_in():
    """Test check-in when user is already checked in."""
    from flask.testing import FlaskClient
    app = minimal_checkin_app()
    client = app.test_client()
    venue_id = 1
    payload = {
        "qrCode": f"venue-{venue_id}",
        "latitude": 40.7128,
        "longitude": -74.0060,
    }
    with app.app_context():
        with patch("dojopool.routes.venue_routes.Venue") as MockVenue:
            with patch("dojopool.routes.venue_routes.VenueCheckIn") as MockCheckIn:
                MockCheckIn.__name__ = "MockCheckIn"
                mock_user = Mock()
                mock_user.id = 123
                mock_user.is_authenticated = True
                mock_user.__name__ = "MockUser"
                with patch("flask_login.utils._get_user", return_value=mock_user):
                    mock_venue = MockVenue.query.get_or_404.return_value
                    mock_venue.latitude = 40.7128
                    mock_venue.longitude = -74.0060
                    MockCheckIn.query.filter_by.return_value.first.return_value = True
                    response = client.post(f"/venues/{venue_id}/check-in", json=payload)
                    assert response.status_code == 400
                    data = json.loads(response.data)
                    assert "already checked in" in data.get("error", "")
