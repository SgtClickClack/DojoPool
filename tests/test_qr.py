"""Tests for QR code management system."""

import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from dojopool.core.venue.models import PoolTable
from dojopool.core.venue.qr import QRCodeManager


@pytest.fixture
def qr_manager():
    """Create QR manager instance for testing."""
    return QRCodeManager()


@pytest.fixture
def mock_table():
    """Create mock pool table."""
    table = Mock(spec=PoolTable)
    table.id = "table123"
    return table


@pytest.fixture
def mock_venue_id():
    """Mock venue ID."""
    return "venue456"


@pytest.fixture
def sample_qr_data(qr_manager, mock_table, mock_venue_id):
    """Generate sample QR data."""
    qr_data = qr_manager.qr_data_format.copy()
    qr_data.update(
        {
            "table_id": mock_table.id,
            "venue_id": mock_venue_id,
            "timestamp": datetime.utcnow().isoformat(),
            "signature": qr_manager._generate_signature(mock_table.id, mock_venue_id),
        }
    )
    return json.dumps(qr_data)


def test_qr_manager_initialization(qr_manager):
    """Test QR manager initialization."""
    assert qr_manager.qr_data_format["version"] == 1
    assert qr_manager.qr_data_format["type"] == "dojo_pool_table"
    assert all(
        key in qr_manager.qr_data_format
        for key in ["table_id", "venue_id", "timestamp", "signature"]
    )


@patch("qrcode.QRCode")
def test_generate_table_qr(mock_qrcode, qr_manager, mock_table, mock_venue_id):
    """Test QR code generation."""
    # Mock QR code generation
    mock_qr = Mock()
    mock_qrcode.return_value = mock_qr
    mock_image = Mock()
    mock_qr.make_image.return_value = mock_image

    # Test generation
    result = qr_manager.generate_table_qr(mock_table, mock_venue_id)

    # Verify QR code was created with correct parameters
    mock_qrcode.assert_called_once()
    mock_qr.add_data.assert_called_once()
    mock_qr.make.assert_called_once_with(fit=True)

    # Verify image was generated
    mock_qr.make_image.assert_called_once_with(fill_color="black", back_color="white")

    # Verify result
    assert result is not None
    assert isinstance(result, str)
    assert mock_table.qr_code == result


def test_verify_valid_qr_code(qr_manager, sample_qr_data, mock_table, mock_venue_id):
    """Test verification of valid QR code."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        # Setup mocks
        mock_manager.tables.get.return_value = mock_table
        mock_manager.get_venue.return_value = {"id": mock_venue_id}

        # Verify QR code
        result = qr_manager.verify_qr_code(sample_qr_data)

        # Check result
        assert result["valid"] is True
        assert result["table"] == mock_table
        assert result["venue"]["id"] == mock_venue_id
        assert isinstance(result["timestamp"], datetime)


def test_verify_invalid_format(qr_manager):
    """Test verification with invalid format."""
    invalid_data = json.dumps({"invalid": "data"})
    result = qr_manager.verify_qr_code(invalid_data)
    assert result["valid"] is False
    assert "Invalid QR code format" in result["error"]


def test_verify_invalid_signature(qr_manager, sample_qr_data):
    """Test verification with invalid signature."""
    data = json.loads(sample_qr_data)
    data["signature"] = "invalid"
    result = qr_manager.verify_qr_code(json.dumps(data))
    assert result["valid"] is False
    assert "Invalid signature" in result["error"]


def test_verify_expired_code(qr_manager, sample_qr_data):
    """Test verification of expired QR code."""
    data = json.loads(sample_qr_data)
    expired_time = datetime.utcnow() - timedelta(hours=25)
    data["timestamp"] = expired_time.isoformat()
    data["signature"] = qr_manager._generate_signature(data["table_id"], data["venue_id"])
    result = qr_manager.verify_qr_code(json.dumps(data))
    assert result["valid"] is False
    assert "QR code expired" in result["error"]


def test_verify_nonexistent_table(qr_manager, sample_qr_data):
    """Test verification with nonexistent table."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.tables.get.return_value = None
        result = qr_manager.verify_qr_code(sample_qr_data)
        assert result["valid"] is False
        assert "Table not found" in result["error"]


def test_verify_nonexistent_venue(qr_manager, sample_qr_data, mock_table):
    """Test verification with nonexistent venue."""
    with patch("dojopool.core.venue.models.venue_manager") as mock_manager:
        mock_manager.tables.get.return_value = mock_table
        mock_manager.get_venue.return_value = None
        result = qr_manager.verify_qr_code(sample_qr_data)
        assert result["valid"] is False
        assert "Venue not found" in result["error"]


def test_generate_signature(qr_manager, mock_table, mock_venue_id):
    """Test signature generation."""
    signature = qr_manager._generate_signature(mock_table.id, mock_venue_id)
    assert isinstance(signature, str)
    assert len(signature) > 0


def test_verify_signature(qr_manager, mock_table, mock_venue_id):
    """Test signature verification."""
    data = {
        "table_id": mock_table.id,
        "venue_id": mock_venue_id,
        "signature": qr_manager._generate_signature(mock_table.id, mock_venue_id),
    }
    assert qr_manager._verify_signature(data) is True


def test_add_logo(qr_manager):
    """Test logo addition to QR code."""
    mock_image = Mock()
    result = qr_manager._add_logo(mock_image)
    assert result == mock_image  # For now, as logo addition is not implemented


def test_error_handling_in_generation(qr_manager, mock_table, mock_venue_id):
    """Test error handling during QR generation."""
    with patch("qrcode.QRCode", side_effect=Exception("Test error")):
        result = qr_manager.generate_table_qr(mock_table, mock_venue_id)
        assert result is None


def test_error_handling_in_verification(qr_manager):
    """Test error handling during verification."""
    result = qr_manager.verify_qr_code("invalid json")
    assert result["valid"] is False
    assert "Verification error" in result["error"]
