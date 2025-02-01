"""
Tests for the incident response system.
"""

from datetime import datetime, timedelta
from unittest.mock import patch

import pytest

from dojopool.core.monitoring import MetricsSnapshot
from dojopool.core.security.incident_response.incident import (
    IncidentSeverity,
    IncidentStatus,
    IncidentType,
)
from dojopool.core.security.incident_response.manager import IncidentManager
from dojopool.core.security.threat_detection.finding import ThreatFinding
from dojopool.core.security.vulnerability_scanner.base import VulnerabilityFinding


@pytest.fixture
def incident_data():
    """Test incident data."""
    return {
        "title": "Test Incident",
        "description": "Test incident description",
        "incident_type": IncidentType.INTRUSION,
        "severity": IncidentSeverity.HIGH,
        "source_ip": "192.168.1.100",
        "affected_systems": ["web-server-1", "db-server-1"],
        "indicators": ["malicious.exe", "suspicious.dll"],
    }


@pytest.fixture
def mock_metrics():
    """Mock metrics snapshot."""
    return MetricsSnapshot(
        timestamp=datetime.now(),
        cpu_usage=50.0,
        memory_usage=75.0,
        disk_usage=60.0,
        network_in=1000,
        network_out=500,
        active_connections=100,
        request_count=1000,
        error_count=5,
        average_response_time=100,
    )


@pytest.fixture
def mock_threat_finding():
    """Mock threat finding."""
    return ThreatFinding(
        timestamp=datetime.now(),
        severity="high",
        title="Test Threat",
        description="Test threat description",
        threat_type="malware",
        source_ip="192.168.1.100",
        affected_systems=["web-server-1"],
        indicators=["malicious.exe"],
        confidence=0.95,
    )


@pytest.fixture
def mock_vulnerability_finding():
    """Mock vulnerability finding."""
    return VulnerabilityFinding(
        timestamp=datetime.now(),
        severity="high",
        title="Test Vulnerability",
        description="Test vulnerability description",
        vulnerability_type="rce",
        affected_component="web-server-1",
        evidence="Test evidence",
        remediation="Test remediation",
        cwe_id="CWE-123",
        cvss_score=8.5,
    )


@pytest.fixture
async def incident_manager(tmp_path):
    """Test incident manager."""
    with patch("dojopool.core.security.incident_response.manager.config") as mock_config:
        mock_config.INCIDENT_STORAGE_DIR = tmp_path / "incidents"
        manager = IncidentManager()
        await manager.start()
        yield manager


@pytest.mark.asyncio
async def test_incident_creation(incident_manager, incident_data, mock_metrics):
    """Test incident creation."""
    with patch.object(incident_manager.metrics_collector, "get_metrics", return_value=mock_metrics):
        incident = await incident_manager.create_incident(**incident_data)

        assert incident.id is not None
        assert incident.title == incident_data["title"]
        assert incident.severity == incident_data["severity"]
        assert incident.status == IncidentStatus.NEW
        assert len(incident.metrics_snapshots) == 1
        assert incident.metrics_snapshots[0] == mock_metrics


@pytest.mark.asyncio
async def test_incident_status_update(incident_manager, incident_data):
    """Test incident status updates."""
    incident = await incident_manager.create_incident(**incident_data)

    # Update status
    updated = await incident_manager.update_incident(
        incident.id, status=IncidentStatus.INVESTIGATING, comment="Started investigation"
    )

    assert updated.status == IncidentStatus.INVESTIGATING
    assert len(updated.actions_taken) == 1
    assert updated.actions_taken[0]["type"] == "status_update"

    # Resolve incident
    resolved = await incident_manager.update_incident(
        incident.id, status=IncidentStatus.RESOLVED, comment="Issue resolved"
    )

    assert resolved.status == IncidentStatus.RESOLVED
    assert resolved.resolved_at is not None
    assert incident.id not in incident_manager.active_incidents
    assert incident.id in incident_manager.resolved_incidents


@pytest.mark.asyncio
async def test_incident_evidence_tracking(incident_manager, incident_data):
    """Test incident evidence tracking."""
    incident = await incident_manager.create_incident(**incident_data)

    # Add evidence
    incident.add_evidence(
        evidence_type="log_file",
        content="Suspicious activity detected",
        metadata={"source": "web-server-1", "timestamp": "2024-02-01T12:00:00Z"},
    )

    assert len(incident.evidence) == 1
    assert incident.evidence[0]["type"] == "log_file"
    assert "Suspicious activity" in incident.evidence[0]["content"]


@pytest.mark.asyncio
async def test_incident_finding_integration(
    incident_manager, incident_data, mock_threat_finding, mock_vulnerability_finding
):
    """Test integration with threat and vulnerability findings."""
    incident = await incident_manager.create_incident(**incident_data)

    # Add findings
    incident.add_threat_finding(mock_threat_finding)
    incident.add_vulnerability_finding(mock_vulnerability_finding)

    assert len(incident.threat_findings) == 1
    assert len(incident.vulnerability_findings) == 1
    assert incident.threat_findings[0].title == "Test Threat"
    assert incident.vulnerability_findings[0].title == "Test Vulnerability"


@pytest.mark.asyncio
async def test_incident_monitoring(
    incident_manager, incident_data, mock_metrics, mock_threat_finding
):
    """Test incident monitoring."""
    with (
        patch.object(incident_manager.metrics_collector, "get_metrics", return_value=mock_metrics),
        patch.object(
            incident_manager.threat_detector, "detect_threats", return_value=[mock_threat_finding]
        ),
    ):

        incident = await incident_manager.create_incident(**incident_data)

        # Run one monitoring cycle
        await incident_manager._monitor_incidents()

        # Check metrics and findings were added
        assert len(incident.metrics_snapshots) >= 1
        assert len(incident.threat_findings) == 1


@pytest.mark.asyncio
async def test_incident_notifications(incident_manager, incident_data):
    """Test incident notifications."""
    # Mock email sending
    with (
        patch("aiosmtplib.send") as mock_email,
        patch.object(incident_manager, "_send_slack_notification") as mock_slack,
    ):

        await incident_manager.create_incident(**incident_data)

        assert mock_email.called
        assert mock_slack.called


@pytest.mark.asyncio
async def test_incident_archiving(incident_manager, incident_data):
    """Test incident archiving."""
    # Create and resolve incident
    incident = await incident_manager.create_incident(**incident_data)
    await incident_manager.update_incident(
        incident.id, status=IncidentStatus.RESOLVED, comment="Resolved for archiving test"
    )

    # Modify resolved_at to be old enough for archiving
    incident.resolved_at = datetime.now() - timedelta(days=91)
    await incident_manager._save_incident(incident)

    # Run cleanup
    await incident_manager._cleanup_old_incidents()

    # Check incident was archived
    archive_path = incident_manager.storage_dir / "archive" / f"{incident.id}.json"
    assert archive_path.exists()
    assert incident.id not in incident_manager.resolved_incidents


@pytest.mark.asyncio
async def test_incident_statistics(incident_manager, incident_data):
    """Test incident statistics tracking."""
    # Create incidents with different severities
    await incident_manager.create_incident(**incident_data)  # HIGH

    low_incident = dict(incident_data)
    low_incident["severity"] = IncidentSeverity.LOW
    await incident_manager.create_incident(**low_incident)

    stats = await incident_manager.get_statistics()

    assert stats["total_incidents"] == 2
    assert stats["active_incidents"] == 2
    assert stats["severity_counts"]["high"] == 1
    assert stats["severity_counts"]["low"] == 1


@pytest.mark.asyncio
async def test_incident_persistence(incident_manager, incident_data, tmp_path):
    """Test incident persistence and loading."""
    # Create incident
    incident = await incident_manager.create_incident(**incident_data)

    # Stop and create new manager
    new_manager = IncidentManager()
    await new_manager.start()

    # Check incident was loaded
    loaded_incident = await new_manager.get_incident(incident.id)
    assert loaded_incident is not None
    assert loaded_incident.title == incident_data["title"]
    assert loaded_incident.severity == incident_data["severity"]


@pytest.mark.asyncio
async def test_automated_response_actions(
    incident_manager, incident_data, mock_vulnerability_finding
):
    """Test automated response actions."""
    with patch.object(
        incident_manager.scanner_manager, "scan_targets", return_value=[mock_vulnerability_finding]
    ):

        incident = await incident_manager.create_incident(**incident_data)

        # Check automated actions were taken
        assert len(incident.vulnerability_findings) == 1
        assert len(incident.actions_taken) >= 1
        assert any(action["type"] == "automated_response" for action in incident.actions_taken)


@pytest.mark.asyncio
async def test_incident_filtering(incident_manager, incident_data):
    """Test incident filtering capabilities."""
    # Create incidents with different types
    await incident_manager.create_incident(**incident_data)  # INTRUSION

    malware_incident = dict(incident_data)
    malware_incident["incident_type"] = IncidentType.MALWARE
    await incident_manager.create_incident(**malware_incident)

    # Test filtering by type
    intrusion_incidents = await incident_manager.get_active_incidents(
        incident_type=IncidentType.INTRUSION
    )
    assert len(intrusion_incidents) == 1
    assert intrusion_incidents[0].incident_type == IncidentType.INTRUSION

    # Test filtering by severity
    high_incidents = await incident_manager.get_active_incidents(severity=IncidentSeverity.HIGH)
    assert len(high_incidents) == 2  # Both incidents are HIGH severity
