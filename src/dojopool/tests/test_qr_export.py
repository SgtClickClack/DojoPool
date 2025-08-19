import json
from unittest.mock import patch

import pandas as pd
import pytest

from dojopool.core.venue.qr_export import QRExportManager


@pytest.fixture
def mock_stats():
    """Create mock statistics for testing."""
    return {
        "total_scans": 100,
        "successful_scans": 80,
        "failed_scans": 20,
        "success_rate": 0.8,
        "avg_scan_duration": 2.5,
        "daily_stats": {"2024-01-01": 30, "2024-01-02": 35, "2024-01-03": 35},
        "hourly_stats": {"9": 20, "10": 25, "11": 30, "12": 25},
        "error_types": {"expired": 10, "invalid_signature": 5, "malformed": 5},
    }


@pytest.fixture
def mock_error_report():
    """Create mock error report for testing."""
    return {
        "total_errors": 3,
        "errors": [
            {
                "timestamp": "2024-01-01T10:00:00",
                "error_type": "expired",
                "table_id": "table1",
                "venue_id": "venue1",
                "user_id": "user1",
            },
            {
                "timestamp": "2024-01-01T11:00:00",
                "error_type": "invalid_signature",
                "table_id": "table1",
                "venue_id": "venue1",
                "user_id": "user2",
            },
            {
                "timestamp": "2024-01-01T12:00:00",
                "error_type": "malformed",
                "table_id": "table2",
                "venue_id": "venue1",
                "user_id": None,
            },
        ],
    }


@pytest.fixture
def export_manager():
    """Create a test instance of QRExportManager."""
    return QRExportManager()


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_csv_export_basic(mock_qr_stats, export_manager, mock_stats):
    """Test basic CSV export functionality."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats

    # Export to CSV
    csv_data = export_manager.export_stats_csv(venue_id="test_venue")
    assert csv_data is not None

    # Verify CSV content
    lines = csv_data.strip().split("\n")
    assert lines[0] == "Summary Statistics"
    assert "Total Scans,100" in lines
    assert "Successful Scans,80" in lines
    assert "Failed Scans,20" in lines

    # Verify sections
    assert "Daily Statistics" in csv_data
    assert "Hourly Distribution" in csv_data
    assert "Error Types" in csv_data


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_csv_export_with_errors(mock_qr_stats, export_manager, mock_stats, mock_error_report):
    """Test CSV export with error details."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats
    mock_qr_stats.get_error_report.return_value = mock_error_report

    # Export to CSV with errors
    csv_data = export_manager.export_stats_csv(venue_id="test_venue", include_errors=True)
    assert csv_data is not None

    # Verify error report section
    assert "Detailed Error Report" in csv_data
    assert "expired,table1,venue1,user1" in csv_data.replace(" ", "")
    assert "malformed,table2,venue1,N/A" in csv_data.replace(" ", "")


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_excel_export_basic(mock_qr_stats, export_manager, mock_stats):
    """Test basic Excel export functionality."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats

    # Export to Excel
    excel_data = export_manager.export_stats_excel(venue_id="test_venue")
    assert excel_data is not None

    # Read Excel file
    df_dict = pd.read_excel(excel_data, sheet_name=None)

    # Verify sheets
    assert "Summary" in df_dict
    assert "Daily Stats" in df_dict
    assert "Hourly Stats" in df_dict
    assert "Error Types" in df_dict

    # Verify summary data
    summary_df = df_dict["Summary"]
    assert summary_df["Value"].iloc[0] == 100  # Total Scans
    assert summary_df["Value"].iloc[1] == 80  # Successful Scans


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_excel_export_with_errors(mock_qr_stats, export_manager, mock_stats, mock_error_report):
    """Test Excel export with error details."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats
    mock_qr_stats.get_error_report.return_value = mock_error_report

    # Export to Excel with errors
    excel_data = export_manager.export_stats_excel(venue_id="test_venue", include_errors=True)
    assert excel_data is not None

    # Read Excel file
    df_dict = pd.read_excel(excel_data, sheet_name=None)

    # Verify error details sheet
    assert "Error Details" in df_dict
    error_df = df_dict["Error Details"]
    assert len(error_df) == 3
    assert "expired" in error_df["error_type"].values
    assert "N/A" in error_df["user_id"].values


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_json_export_basic(mock_qr_stats, export_manager, mock_stats):
    """Test basic JSON export functionality."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats

    # Export to JSON
    json_data = export_manager.export_stats_json(venue_id="test_venue")
    assert json_data is not None

    # Parse JSON
    data = json.loads(json_data)

    # Verify structure
    assert "generated_at" in data
    assert "stats" in data
    assert data["stats"]["total_scans"] == 100
    assert data["stats"]["successful_scans"] == 80
    assert len(data["stats"]["daily_stats"]) == 3
    assert len(data["stats"]["hourly_stats"]) == 4


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_json_export_with_errors(mock_qr_stats, export_manager, mock_stats, mock_error_report):
    """Test JSON export with error details."""
    mock_qr_stats.get_venue_stats.return_value = mock_stats
    mock_qr_stats.get_error_report.return_value = mock_error_report

    # Export to JSON with errors
    json_data = export_manager.export_stats_json(venue_id="test_venue", include_errors=True)
    assert json_data is not None

    # Parse JSON
    data = json.loads(json_data)

    # Verify error report
    assert "error_report" in data
    assert data["error_report"]["total_errors"] == 3
    assert len(data["error_report"]["errors"]) == 3


def test_export_invalid_venue(export_manager):
    """Test export with invalid venue ID."""
    # Test CSV export
    csv_data = export_manager.export_stats_csv(venue_id="invalid_venue")
    assert csv_data is None

    # Test Excel export
    excel_data = export_manager.export_stats_excel(venue_id="invalid_venue")
    assert excel_data is None

    # Test JSON export
    json_data = export_manager.export_stats_json(venue_id="invalid_venue")
    assert json_data is None


@patch("dojopool.core.venue.qr_stats.qr_stats")
def test_export_empty_stats(mock_qr_stats, export_manager):
    """Test export with empty statistics."""
    mock_qr_stats.get_venue_stats.return_value = {
        "total_scans": 0,
        "successful_scans": 0,
        "failed_scans": 0,
        "success_rate": 0,
        "avg_scan_duration": 0,
        "daily_stats": {},
        "hourly_stats": {},
        "error_types": {},
    }

    # Test CSV export
    csv_data = export_manager.export_stats_csv(venue_id="test_venue")
    assert csv_data is not None
    assert "Total Scans,0" in csv_data

    # Test Excel export
    excel_data = export_manager.export_stats_excel(venue_id="test_venue")
    assert excel_data is not None

    # Test JSON export
    json_data = export_manager.export_stats_json(venue_id="test_venue")
    assert json_data is not None
    data = json.loads(json_data)
    assert data["stats"]["total_scans"] == 0
