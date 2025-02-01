"""Venue management system for DojoPool."""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set
import uuid


class TableStatus(Enum):
    """Status of a pool table."""

    AVAILABLE = "available"
    IN_USE = "in_use"
    RESERVED = "reserved"
    MAINTENANCE = "maintenance"
    TOURNAMENT = "tournament"


class TableType(Enum):
    """Types of pool tables."""

    STANDARD_8FT = "standard_8ft"
    TOURNAMENT_9FT = "tournament_9ft"
    BAR_7FT = "bar_7ft"
    SNOOKER = "snooker"


class VenueFeature(Enum):
    """Special features of a venue."""

    TOURNAMENTS = "tournaments"
    COACHING = "coaching"
    PRO_SHOP = "pro_shop"
    BAR = "bar"
    FOOD_SERVICE = "food_service"
    PRIVATE_ROOMS = "private_rooms"
    STREAMING = "streaming"
    VIP_AREA = "vip_area"


@dataclass
class PoolTable:
    """Pool table details."""

    table_id: str
    table_number: int
    table_type: TableType
    status: TableStatus
    has_smart_tracking: bool
    last_maintenance: datetime
    current_match_id: Optional[str] = None
    current_players: Set[str] = field(default_factory=set)
    hourly_rate: float = 0.0
    features: Dict[str, bool] = field(
        default_factory=lambda: {
            "auto_scoring": False,
            "shot_tracking": False,
            "replay_system": False,
            "training_mode": False,
        }
    )


@dataclass
class TableReservation:
    """Pool table reservation details."""

    reservation_id: str
    table_id: str
    player_id: str
    start_time: datetime
    end_time: datetime
    status: str = "confirmed"
    additional_players: Set[str] = field(default_factory=set)
    tournament_id: Optional[str] = None


@dataclass
class VenueStats:
    """Venue statistics."""

    total_matches: int = 0
    total_tournaments: int = 0
    total_revenue: float = 0.0
    active_players: int = 0
    tables_in_use: int = 0
    average_wait_time: float = 0.0
    peak_hours: List[int] = field(default_factory=list)
    popular_tables: List[str] = field(default_factory=list)


@dataclass
class Venue:
    """Venue (Dojo) details."""

    venue_id: str
    name: str
    address: str
    owner_id: str
    features: Set[VenueFeature]
    tables: Dict[str, PoolTable]
    operating_hours: Dict[str, tuple[str, str]]
    contact_info: Dict[str, str]
    stats: VenueStats = field(default_factory=VenueStats)
    reservations: Dict[str, TableReservation] = field(default_factory=dict)
    membership_tiers: Dict[str, Dict] = field(default_factory=dict)
    rating: float = 0.0
    reviews: List[Dict] = field(default_factory=list)


class VenueManager:
    """Manages pool venues (Dojos) in the system."""

    def __init__(self) -> None:
        """Initialize the venue manager."""
        self._venues: Dict[str, Venue] = {}
        self._player_venues: Dict[str, Set[str]] = {}  # player_id -> venue_ids
        self._table_history: Dict[str, List[Dict]] = {}  # table_id -> match history

    def register_venue(
        self,
        name: str,
        address: str,
        owner_id: str,
        features: Set[VenueFeature],
        operating_hours: Dict[str, tuple[str, str]],
        contact_info: Dict[str, str],
    ) -> Venue:
        """Register a new venue."""
        venue_id = str(uuid.uuid4())
        venue = Venue(
            venue_id=venue_id,
            name=name,
            address=address,
            owner_id=owner_id,
            features=features,
            tables={},
            operating_hours=operating_hours,
            contact_info=contact_info,
        )
        self._venues[venue_id] = venue
        return venue

    def add_table(
        self,
        venue_id: str,
        table_number: int,
        table_type: TableType,
        has_smart_tracking: bool,
        hourly_rate: float,
        features: Dict[str, bool],
    ) -> Optional[PoolTable]:
        """Add a new table to a venue."""
        venue = self._venues.get(venue_id)
        if not venue:
            return None

        table_id = str(uuid.uuid4())
        table = PoolTable(
            table_id=table_id,
            table_number=table_number,
            table_type=table_type,
            status=TableStatus.AVAILABLE,
            has_smart_tracking=has_smart_tracking,
            last_maintenance=datetime.now(),
            hourly_rate=hourly_rate,
            features=features,
        )

        venue.tables[table_id] = table
        self._table_history[table_id] = []
        return table

    def get_venue(self, venue_id: str) -> Optional[Venue]:
        """Get venue by ID."""
        return self._venues.get(venue_id)

    def get_table(self, venue_id: str, table_id: str) -> Optional[PoolTable]:
        """Get table from a venue."""
        venue = self._venues.get(venue_id)
        if not venue:
            return None
        return venue.tables.get(table_id)

    def update_table_status(
        self,
        venue_id: str,
        table_id: str,
        status: TableStatus,
        match_id: Optional[str] = None,
        players: Optional[Set[str]] = None,
    ) -> bool:
        """Update table status."""
        table = self.get_table(venue_id, table_id)
        if not table:
            return False

        table.status = status
        table.current_match_id = match_id
        if players:
            table.current_players = players

        # Update venue stats
        venue = self._venues[venue_id]
        venue.stats.tables_in_use = sum(
            1
            for t in venue.tables.values()
            if t.status in [TableStatus.IN_USE, TableStatus.TOURNAMENT]
        )

        return True

    def create_reservation(
        self,
        venue_id: str,
        table_id: str,
        player_id: str,
        start_time: datetime,
        end_time: datetime,
        additional_players: Optional[Set[str]] = None,
        tournament_id: Optional[str] = None,
    ) -> Optional[TableReservation]:
        """Create a table reservation."""
        venue = self._venues.get(venue_id)
        if not venue:
            return None

        table = venue.tables.get(table_id)
        if not table:
            return None

        # Check for conflicts
        for reservation in venue.reservations.values():
            if reservation.table_id == table_id:
                if start_time < reservation.end_time and end_time > reservation.start_time:
                    return None

        reservation_id = str(uuid.uuid4())
        reservation = TableReservation(
            reservation_id=reservation_id,
            table_id=table_id,
            player_id=player_id,
            start_time=start_time,
            end_time=end_time,
            additional_players=additional_players or set(),
            tournament_id=tournament_id,
        )

        venue.reservations[reservation_id] = reservation
        table.status = TableStatus.RESERVED

        return reservation

    def cancel_reservation(self, venue_id: str, reservation_id: str) -> bool:
        """Cancel a table reservation."""
        venue = self._venues.get(venue_id)
        if not venue:
            return False

        reservation = venue.reservations.get(reservation_id)
        if not reservation:
            return False

        table = venue.tables.get(reservation.table_id)
        if table and table.status == TableStatus.RESERVED:
            table.status = TableStatus.AVAILABLE

        del venue.reservations[reservation_id]
        return True

    def record_match(
        self,
        venue_id: str,
        table_id: str,
        match_id: str,
        players: Set[str],
        duration: timedelta,
        winner_id: Optional[str] = None,
    ) -> bool:
        """Record a completed match."""
        venue = self._venues.get(venue_id)
        if not venue or table_id not in venue.tables:
            return False

        # Update table history
        match_record = {
            "match_id": match_id,
            "players": list(players),
            "start_time": datetime.now() - duration,
            "end_time": datetime.now(),
            "duration": duration.total_seconds(),
            "winner_id": winner_id,
        }
        self._table_history[table_id].append(match_record)

        # Update venue stats
        venue.stats.total_matches += 1
        venue.stats.total_revenue += venue.tables[table_id].hourly_rate * (
            duration.total_seconds() / 3600
        )

        # Update player-venue relationship
        for player_id in players:
            if player_id not in self._player_venues:
                self._player_venues[player_id] = set()
            self._player_venues[player_id].add(venue_id)

        return True

    def get_available_tables(
        self,
        venue_id: str,
        start_time: Optional[datetime] = None,
        table_type: Optional[TableType] = None,
    ) -> List[PoolTable]:
        """Get available tables at a venue."""
        venue = self._venues.get(venue_id)
        if not venue:
            return []

        available_tables = []
        start_time = start_time or datetime.now()

        for table in venue.tables.values():
            if table_type and table.table_type != table_type:
                continue

            # Check current status
            if table.status != TableStatus.AVAILABLE:
                continue

            # Check future reservations
            has_conflict = False
            for reservation in venue.reservations.values():
                if reservation.table_id == table.table_id and start_time < reservation.end_time:
                    has_conflict = True
                    break

            if not has_conflict:
                available_tables.append(table)

        return available_tables

    def get_venue_stats(self, venue_id: str, timeframe: str = "daily") -> Optional[VenueStats]:
        """Get venue statistics."""
        venue = self._venues.get(venue_id)
        if not venue:
            return None

        # TODO: Implement timeframe-based stats calculation
        return venue.stats

    def get_player_history(self, player_id: str) -> List[Dict]:
        """Get player's match history across venues."""
        history = []
        player_venues = self._player_venues.get(player_id, set())

        for venue_id in player_venues:
            venue = self._venues[venue_id]
            for table_id, matches in self._table_history.items():
                if table_id in venue.tables:
                    for match in matches:
                        if player_id in match["players"]:
                            match_info = match.copy()
                            match_info.update(
                                {
                                    "venue_id": venue_id,
                                    "venue_name": venue.name,
                                    "table_id": table_id,
                                    "table_number": venue.tables[table_id].table_number,
                                }
                            )
                            history.append(match_info)

        return sorted(history, key=lambda x: x["end_time"], reverse=True)

    def get_popular_venues(
        self, limit: int = 10, feature: Optional[VenueFeature] = None
    ) -> List[Venue]:
        """Get most popular venues."""
        venues = list(self._venues.values())

        if feature:
            venues = [v for v in venues if feature in v.features]

        return sorted(
            venues, key=lambda v: (v.stats.total_matches, v.rating, len(v.tables)), reverse=True
        )[:limit]
