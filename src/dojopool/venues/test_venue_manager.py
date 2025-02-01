"""Tests for venue management system."""

import pytest
from datetime import datetime, timedelta
from typing import Set
from .venue_manager import (
    VenueManager,
    Venue,
    PoolTable,
    TableType,
    TableStatus,
    VenueFeature,
    TableReservation,
)


@pytest.fixture
def venue_manager() -> VenueManager:
    """Create a venue manager for testing."""
    return VenueManager()


@pytest.fixture
def test_venue(venue_manager: VenueManager) -> Venue:
    """Create a test venue."""
    features = {VenueFeature.TOURNAMENTS, VenueFeature.BAR}
    operating_hours = {
        "monday": ("09:00", "23:00"),
        "tuesday": ("09:00", "23:00"),
        "wednesday": ("09:00", "23:00"),
        "thursday": ("09:00", "23:00"),
        "friday": ("09:00", "00:00"),
        "saturday": ("10:00", "00:00"),
        "sunday": ("10:00", "22:00"),
    }
    contact_info = {
        "phone": "123-456-7890",
        "email": "test@dojo.com",
        "website": "www.testdojo.com",
    }

    return venue_manager.register_venue(
        name="Test Dojo",
        address="123 Pool St",
        owner_id="test_owner",
        features=features,
        operating_hours=operating_hours,
        contact_info=contact_info,
    )


@pytest.fixture
def test_table(venue_manager: VenueManager, test_venue: Venue) -> PoolTable:
    """Create a test table."""
    return venue_manager.add_table(
        venue_id=test_venue.venue_id,
        table_number=1,
        table_type=TableType.STANDARD_8FT,
        has_smart_tracking=True,
        hourly_rate=30.0,
        features={
            "auto_scoring": True,
            "shot_tracking": True,
            "replay_system": False,
            "training_mode": True,
        },
    )


class TestVenueManagement:
    """Test venue management functionality."""

    def test_register_venue(self, venue_manager: VenueManager) -> None:
        """Test venue registration."""
        features = {VenueFeature.TOURNAMENTS, VenueFeature.BAR}
        operating_hours = {"monday": ("09:00", "23:00")}
        contact_info = {"phone": "123-456-7890"}

        venue = venue_manager.register_venue(
            name="New Dojo",
            address="456 Cue Ave",
            owner_id="owner1",
            features=features,
            operating_hours=operating_hours,
            contact_info=contact_info,
        )

        assert venue.name == "New Dojo"
        assert venue.address == "456 Cue Ave"
        assert venue.owner_id == "owner1"
        assert venue.features == features
        assert venue.operating_hours == operating_hours
        assert venue.contact_info == contact_info
        assert not venue.tables
        assert venue.rating == 0.0
        assert not venue.reviews

    def test_add_table(self, venue_manager: VenueManager, test_venue: Venue) -> None:
        """Test adding tables to venue."""
        table = venue_manager.add_table(
            venue_id=test_venue.venue_id,
            table_number=1,
            table_type=TableType.TOURNAMENT_9FT,
            has_smart_tracking=True,
            hourly_rate=40.0,
            features={"auto_scoring": True},
        )

        assert table is not None
        assert table.table_number == 1
        assert table.table_type == TableType.TOURNAMENT_9FT
        assert table.status == TableStatus.AVAILABLE
        assert table.has_smart_tracking
        assert table.hourly_rate == 40.0
        assert table.features["auto_scoring"]

        # Verify table added to venue
        venue = venue_manager.get_venue(test_venue.venue_id)
        assert table.table_id in venue.tables
        assert venue.tables[table.table_id] == table

    def test_update_table_status(
        self, venue_manager: VenueManager, test_venue: Venue, test_table: PoolTable
    ) -> None:
        """Test updating table status."""
        # Update to in-use
        success = venue_manager.update_table_status(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            status=TableStatus.IN_USE,
            match_id="match1",
            players={"player1", "player2"},
        )

        assert success
        table = venue_manager.get_table(test_venue.venue_id, test_table.table_id)
        assert table.status == TableStatus.IN_USE
        assert table.current_match_id == "match1"
        assert table.current_players == {"player1", "player2"}

        # Verify venue stats update
        venue = venue_manager.get_venue(test_venue.venue_id)
        assert venue.stats.tables_in_use == 1


class TestReservations:
    """Test reservation functionality."""

    def test_create_reservation(
        self, venue_manager: VenueManager, test_venue: Venue, test_table: PoolTable
    ) -> None:
        """Test creating table reservations."""
        start_time = datetime.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        reservation = venue_manager.create_reservation(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            player_id="player1",
            start_time=start_time,
            end_time=end_time,
            additional_players={"player2", "player3"},
        )

        assert reservation is not None
        assert reservation.table_id == test_table.table_id
        assert reservation.player_id == "player1"
        assert reservation.start_time == start_time
        assert reservation.end_time == end_time
        assert reservation.additional_players == {"player2", "player3"}

        # Verify table status
        table = venue_manager.get_table(test_venue.venue_id, test_table.table_id)
        assert table.status == TableStatus.RESERVED

    def test_reservation_conflict(
        self, venue_manager: VenueManager, test_venue: Venue, test_table: PoolTable
    ) -> None:
        """Test handling reservation conflicts."""
        # Create first reservation
        start_time = datetime.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        venue_manager.create_reservation(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            player_id="player1",
            start_time=start_time,
            end_time=end_time,
        )

        # Try to create overlapping reservation
        conflict_start = start_time + timedelta(minutes=30)
        conflict_end = end_time + timedelta(minutes=30)

        reservation = venue_manager.create_reservation(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            player_id="player2",
            start_time=conflict_start,
            end_time=conflict_end,
        )

        assert reservation is None

    def test_cancel_reservation(
        self, venue_manager: VenueManager, test_venue: Venue, test_table: PoolTable
    ) -> None:
        """Test canceling reservations."""
        # Create reservation
        start_time = datetime.now() + timedelta(hours=1)
        end_time = start_time + timedelta(hours=2)

        reservation = venue_manager.create_reservation(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            player_id="player1",
            start_time=start_time,
            end_time=end_time,
        )

        # Cancel reservation
        success = venue_manager.cancel_reservation(test_venue.venue_id, reservation.reservation_id)

        assert success

        # Verify table status
        table = venue_manager.get_table(test_venue.venue_id, test_table.table_id)
        assert table.status == TableStatus.AVAILABLE

        # Verify reservation removed
        venue = venue_manager.get_venue(test_venue.venue_id)
        assert reservation.reservation_id not in venue.reservations


class TestMatchRecording:
    """Test match recording functionality."""

    def test_record_match(
        self, venue_manager: VenueManager, test_venue: Venue, test_table: PoolTable
    ) -> None:
        """Test recording completed matches."""
        players: Set[str] = {"player1", "player2"}
        duration = timedelta(hours=1, minutes=30)

        success = venue_manager.record_match(
            venue_id=test_venue.venue_id,
            table_id=test_table.table_id,
            match_id="match1",
            players=players,
            duration=duration,
            winner_id="player1",
        )

        assert success

        # Verify venue stats
        venue = venue_manager.get_venue(test_venue.venue_id)
        assert venue.stats.total_matches == 1
        assert venue.stats.total_revenue == test_table.hourly_rate * 1.5

        # Verify player history
        history = venue_manager.get_player_history("player1")
        assert len(history) == 1
        assert history[0]["match_id"] == "match1"
        assert history[0]["winner_id"] == "player1"
        assert history[0]["duration"] == duration.total_seconds()
        assert "player1" in history[0]["players"]
        assert "player2" in history[0]["players"]


class TestVenueQueries:
    """Test venue query functionality."""

    def test_get_available_tables(self, venue_manager: VenueManager, test_venue: Venue) -> None:
        """Test querying available tables."""
        # Add multiple tables
        table1 = venue_manager.add_table(
            venue_id=test_venue.venue_id,
            table_number=1,
            table_type=TableType.STANDARD_8FT,
            has_smart_tracking=True,
            hourly_rate=30.0,
            features={},
        )

        table2 = venue_manager.add_table(
            venue_id=test_venue.venue_id,
            table_number=2,
            table_type=TableType.TOURNAMENT_9FT,
            has_smart_tracking=True,
            hourly_rate=40.0,
            features={},
        )

        # Set table1 as in use
        venue_manager.update_table_status(test_venue.venue_id, table1.table_id, TableStatus.IN_USE)

        # Query available tables
        available = venue_manager.get_available_tables(test_venue.venue_id)
        assert len(available) == 1
        assert available[0].table_id == table2.table_id

        # Query by table type
        available = venue_manager.get_available_tables(
            test_venue.venue_id, table_type=TableType.TOURNAMENT_9FT
        )
        assert len(available) == 1
        assert available[0].table_type == TableType.TOURNAMENT_9FT

    def test_get_popular_venues(self, venue_manager: VenueManager) -> None:
        """Test querying popular venues."""
        # Create multiple venues
        venue1 = venue_manager.register_venue(
            name="Busy Dojo",
            address="123 Main St",
            owner_id="owner1",
            features={VenueFeature.TOURNAMENTS},
            operating_hours={},
            contact_info={},
        )

        venue2 = venue_manager.register_venue(
            name="Quiet Dojo",
            address="456 Side St",
            owner_id="owner2",
            features={VenueFeature.BAR},
            operating_hours={},
            contact_info={},
        )

        # Add activity to venue1
        table = venue_manager.add_table(
            venue_id=venue1.venue_id,
            table_number=1,
            table_type=TableType.STANDARD_8FT,
            has_smart_tracking=True,
            hourly_rate=30.0,
            features={},
        )

        venue_manager.record_match(
            venue_id=venue1.venue_id,
            table_id=table.table_id,
            match_id="match1",
            players={"player1", "player2"},
            duration=timedelta(hours=1),
        )

        # Query popular venues
        popular = venue_manager.get_popular_venues(limit=2)
        assert len(popular) == 2
        assert popular[0].venue_id == venue1.venue_id  # More matches
        assert popular[1].venue_id == venue2.venue_id

        # Query by feature
        tournament_venues = venue_manager.get_popular_venues(feature=VenueFeature.TOURNAMENTS)
        assert len(tournament_venues) == 1
        assert tournament_venues[0].venue_id == venue1.venue_id
