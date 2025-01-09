"""Test venue module."""

import pytest
from datetime import datetime, timedelta
from dojopool.services.venue_service import VenueService
from dojopool.models.venue import Venue, VenueTable, VenueEvent
from dojopool.models.user import User
from dojopool.extensions import db
from dojopool.exceptions import VenueError

@pytest.fixture
def venue_service():
    return VenueService()

@pytest.fixture
def sample_venue():
    return Venue(
        name="Downtown Pool Hall",
        address="123 Main St",
        contact_info="555-0123",
        operating_hours="10:00-22:00",
        status="active"
    )

@pytest.fixture
def sample_table(sample_venue):
    return VenueTable(
        venue=sample_venue,
        table_number=1,
        table_type="8ft",
        status="available"
    )

class TestVenue:
    def test_venue_creation(self, venue_service):
        """Test venue creation and validation"""
        # Create venue
        venue = venue_service.create_venue(
            name="Uptown Billiards",
            address="456 Oak St",
            contact_info="555-0456",
            operating_hours="11:00-23:00",
            features=["tournaments", "bar", "food"]
        )
        
        assert venue.name == "Uptown Billiards"
        assert venue.status == "active"
        assert "tournaments" in venue.features
        
        # Test duplicate venue
        with pytest.raises(VenueError):
            venue_service.create_venue(
                name="Uptown Billiards",
                address="456 Oak St"
            )

    def test_table_management(self, venue_service, sample_venue):
        """Test table management functionality"""
        # Add table
        table = venue_service.add_table(
            venue_id=sample_venue.id,
            table_type="9ft",
            table_number=2,
            features=["tournament_ready", "heated"]
        )
        
        assert table.venue_id == sample_venue.id
        assert table.table_type == "9ft"
        assert table.status == "available"
        
        # Update table status
        updated = venue_service.update_table_status(
            table_id=table.id,
            status="occupied",
            current_game_id=1
        )
        assert updated.status == "occupied"
        assert updated.current_game_id == 1

    def test_venue_scheduling(self, venue_service, sample_venue):
        """Test venue scheduling system"""
        # Create event
        event = venue_service.create_event(
            venue_id=sample_venue.id,
            event_type="tournament",
            name="Winter Championship",
            start_time=datetime.utcnow() + timedelta(days=1),
            end_time=datetime.utcnow() + timedelta(days=1, hours=6)
        )
        
        assert event.venue_id == sample_venue.id
        assert event.status == "scheduled"
        
        # Check availability
        availability = venue_service.check_venue_availability(
            venue_id=sample_venue.id,
            date=datetime.utcnow() + timedelta(days=1)
        )
        assert availability["has_events"] is True
        assert availability["available_tables"] > 0

    def test_venue_operations(self, venue_service, sample_venue):
        """Test venue operations management"""
        # Update operating hours
        updated = venue_service.update_operating_hours(
            venue_id=sample_venue.id,
            operating_hours="09:00-23:00",
            special_hours={
                "Sunday": "10:00-20:00",
                "holidays": "12:00-18:00"
            }
        )
        
        assert updated.operating_hours == "09:00-23:00"
        assert "Sunday" in updated.special_hours
        
        # Test venue closure
        closure = venue_service.schedule_closure(
            venue_id=sample_venue.id,
            start_date=datetime.utcnow() + timedelta(days=7),
            end_date=datetime.utcnow() + timedelta(days=8),
            reason="maintenance"
        )
        assert closure["status"] == "scheduled"
        assert closure["reason"] == "maintenance"

    def test_venue_analytics(self, venue_service, sample_venue):
        """Test venue analytics"""
        # Generate analytics
        analytics = venue_service.generate_venue_analytics(
            venue_id=sample_venue.id,
            start_date=datetime.utcnow() - timedelta(days=30),
            end_date=datetime.utcnow()
        )
        
        assert "total_games" in analytics
        assert "revenue" in analytics
        assert "peak_hours" in analytics
        assert "table_utilization" in analytics
        
        # Test detailed metrics
        metrics = venue_service.get_detailed_metrics(
            venue_id=sample_venue.id,
            metric_type="utilization"
        )
        assert "average_session_duration" in metrics
        assert "popular_tables" in metrics

    def test_maintenance_tracking(self, venue_service, sample_venue, sample_table):
        """Test maintenance tracking system"""
        # Report maintenance issue
        issue = venue_service.report_maintenance_issue(
            table_id=sample_table.id,
            issue_type="equipment",
            description="Torn felt on corner pocket",
            priority="high"
        )
        
        assert issue.status == "reported"
        assert issue.priority == "high"
        
        # Update maintenance status
        updated = venue_service.update_maintenance_status(
            issue_id=issue.id,
            status="in_progress",
            notes="Replacement felt ordered"
        )
        assert updated.status == "in_progress"
        assert "Replacement felt ordered" in updated.notes

    def test_reservation_system(self, venue_service, sample_venue, sample_table):
        """Test table reservation system"""
        # Create reservation
        reservation = venue_service.create_reservation(
            venue_id=sample_venue.id,
            table_id=sample_table.id,
            user_id=1,
            start_time=datetime.utcnow() + timedelta(hours=2),
            duration_minutes=60
        )
        
        assert reservation.status == "confirmed"
        assert reservation.table_id == sample_table.id
        
        # Check conflicts
        conflicts = venue_service.check_reservation_conflicts(
            venue_id=sample_venue.id,
            table_id=sample_table.id,
            start_time=datetime.utcnow() + timedelta(hours=2),
            duration_minutes=60
        )
        assert conflicts["has_conflicts"] is True
        assert len(conflicts["conflicting_reservations"]) > 0

    def test_staff_management(self, venue_service, sample_venue):
        """Test venue staff management"""
        # Add staff member
        staff = venue_service.add_staff_member(
            venue_id=sample_venue.id,
            user_id=1,
            role="manager",
            permissions=["manage_tables", "view_analytics"]
        )
        
        assert staff.venue_id == sample_venue.id
        assert staff.role == "manager"
        assert "manage_tables" in staff.permissions
        
        # Update staff permissions
        updated = venue_service.update_staff_permissions(
            staff_id=staff.id,
            permissions=["manage_tables", "view_analytics", "manage_events"]
        )
        assert "manage_events" in updated.permissions

    def test_venue_reporting(self, venue_service, sample_venue):
        """Test venue reporting system"""
        # Generate reports
        report = venue_service.generate_venue_report(
            venue_id=sample_venue.id,
            report_type="operations",
            time_period="monthly"
        )
        
        assert "revenue_summary" in report
        assert "attendance_data" in report
        assert "maintenance_log" in report
        
        # Export report
        export = venue_service.export_venue_data(
            venue_id=sample_venue.id,
            data_type="analytics",
            format="csv"
        )
        assert export["success"] is True
        assert "file_url" in export

    def test_error_handling(self, venue_service, sample_venue):
        """Test venue error handling"""
        # Test invalid operating hours
        with pytest.raises(VenueError):
            venue_service.update_operating_hours(
                venue_id=sample_venue.id,
                operating_hours="invalid_hours"
            )
        
        # Test invalid table number
        with pytest.raises(VenueError):
            venue_service.add_table(
                venue_id=sample_venue.id,
                table_number=-1,
                table_type="8ft"
            ) 