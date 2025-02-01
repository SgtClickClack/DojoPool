"""Venue service module."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from ..core.extensions import db
from ..core.models.game import Game
from ..core.models.venue import (
    Venue,
    VenueCheckIn,
    VenueEvent,
    VenueEventParticipant,
    VenueLeaderboard,
)


class VenueService:
    """Service for managing venue operations."""

    def create_venue(self, data: Dict) -> Venue:
        """
        Create a new venue.

        Args:
            data: Venue data including name, location, etc.

        Returns:
            Venue: Created venue
        """
        venue = Venue(
            name=data["name"],
            description=data.get("description"),
            address=data["address"],
            city=data["city"],
            state=data["state"],
            country=data["country"],
            postal_code=data["postal_code"],
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            hours=data.get("hours"),
            amenities=data.get("amenities"),
            tables=data.get("tables", []),
            status="active",
        )

        db.session.add(venue)
        db.session.commit()

        return venue

    def update_venue(self, venue_id: int, data: Dict) -> Optional[Venue]:
        """
        Update venue details.

        Args:
            venue_id: Venue ID
            data: Updated venue data

        Returns:
            Optional[Venue]: Updated venue if found
        """
        venue = Venue.query.get(venue_id)
        if not venue:
            return None

        # Update fields
        for key, value in data.items():
            if hasattr(venue, key):
                setattr(venue, key, value)

        db.session.commit()
        return venue

    def get_venue(self, venue_id: int) -> Optional[Venue]:
        """
        Get venue by ID.

        Args:
            venue_id: Venue ID

        Returns:
            Optional[Venue]: Venue if found
        """
        return Venue.query.get(venue_id)

    def get_venues(
        self, filters: Optional[Dict] = None, limit: int = 10, offset: int = 0
    ) -> List[Venue]:
        """
        Get venues with optional filtering.

        Args:
            filters: Optional filters
            limit: Maximum number of venues to return
            offset: Number of venues to skip

        Returns:
            List[Venue]: List of venues
        """
        query = Venue.query

        if filters:
            if "city" in filters:
                query = query.filter(Venue.city.ilike(f"%{filters['city']}%"))
            if "state" in filters:
                query = query.filter(Venue.state == filters["state"])
            if "status" in filters:
                query = query.filter(Venue.status == filters["status"])

        return query.offset(offset).limit(limit).all()

    def get_venue_stats(self, venue_id: int, days: int = 30) -> Dict:
        """
        Get venue statistics.

        Args:
            venue_id: Venue ID
            days: Number of days to include in stats

        Returns:
            Dict: Venue statistics
        """
        Venue.query.get_or_404(venue_id)
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        # Get recent games
        games = Game.query.filter(Game.venue_id == venue_id, Game.created_at >= cutoff_date).all()

        # Calculate stats
        total_games = len(games)
        completed_games = len([g for g in games if g.status == "completed"])
        cancelled_games = len([g for g in games if g.status == "cancelled"])

        total_players = len(
            {player_id for game in games for player_id in [game.player1_id, game.player2_id]}
        )

        return {
            "total_games": total_games,
            "completed_games": completed_games,
            "cancelled_games": cancelled_games,
            "total_players": total_players,
            "avg_games_per_day": total_games / days if days > 0 else 0,
            "completion_rate": completed_games / total_games if total_games > 0 else 0,
        }

    def get_venue_availability(self, venue_id: int) -> Dict:
        """
        Get venue table availability.

        Args:
            venue_id: Venue ID

        Returns:
            Dict: Table availability information
        """
        venue = Venue.query.get_or_404(venue_id)

        # Get active games
        active_games = Game.query.filter(
            Game.venue_id == venue_id, Game.status.in_(["pending", "in_progress"])
        ).all()

        # Calculate table availability
        total_tables = len(venue.tables)
        occupied_tables = len(active_games)

        return {
            "total_tables": total_tables,
            "available_tables": total_tables - occupied_tables,
            "occupied_tables": occupied_tables,
            "utilization_rate": occupied_tables / total_tables if total_tables > 0 else 0,
        }

    def search_venues(
        self, query: str, location: Optional[Dict] = None, radius: float = 10.0
    ) -> List[Venue]:
        """
        Search venues by name and location.

        Args:
            query: Search query
            location: Optional location coordinates
            radius: Search radius in kilometers

        Returns:
            List[Venue]: List of matching venues
        """
        base_query = Venue.query.filter(
            Venue.name.ilike(f"%{query}%")
            | Venue.description.ilike(f"%{query}%")
            | Venue.city.ilike(f"%{query}%")
        )

        if location:
            # Add location-based filtering if coordinates provided
            lat, lng = location.get("latitude"), location.get("longitude")
            if lat is not None and lng is not None:
                # Note: This is a simplified distance calculation
                # For production, use proper geospatial queries
                base_query = base_query.filter(
                    (Venue.latitude - lat) * (Venue.latitude - lat)
                    + (Venue.longitude - lng) * (Venue.longitude - lng)
                    <= (radius / 111.0) * (radius / 111.0)  # Rough km to degree conversion
                )

        return base_query.all()

    @staticmethod
    def check_in_user(
        venue_id: int,
        user_id: int,
        table_number: Optional[int] = None,
        game_type: Optional[str] = None,
    ) -> VenueCheckIn:
        """Check in a user at a venue.

        Args:
            venue_id: Venue ID
            user_id: User ID
            table_number: Optional table number
            game_type: Optional game type

        Returns:
            VenueCheckIn: Created check-in record
        """
        # Check if user is already checked in
        active_check_in = VenueCheckIn.query.filter_by(user_id=user_id, checked_out_at=None).first()

        if active_check_in:
            raise ValueError("User is already checked in at a venue")

        check_in = VenueCheckIn(
            venue_id=venue_id, user_id=user_id, table_number=table_number, game_type=game_type
        )

        db.session.add(check_in)
        db.session.commit()
        return check_in

    @staticmethod
    def check_out_user(user_id: int) -> Optional[VenueCheckIn]:
        """Check out a user from their current venue.

        Args:
            user_id: User ID

        Returns:
            Optional[VenueCheckIn]: Updated check-in record if found
        """
        check_in = VenueCheckIn.query.filter_by(user_id=user_id, checked_out_at=None).first()

        if check_in:
            check_in.checked_out_at = datetime.utcnow()
            db.session.commit()
            return check_in

        return None

    @staticmethod
    def get_venue_leaderboard(
        venue_id: int, limit: int = 10, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get venue leaderboard.

        Args:
            venue_id: Venue ID
            limit: Maximum number of entries to return
            offset: Number of entries to skip

        Returns:
            List[Dict[str, Any]]: Leaderboard entries with user details
        """
        entries = (
            VenueLeaderboard.query.filter_by(venue_id=venue_id)
            .order_by(VenueLeaderboard.points.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return [entry.to_dict() for entry in entries]

    @staticmethod
    def update_leaderboard(venue_id: int, user_id: int, won: bool, points: int) -> VenueLeaderboard:
        """Update venue leaderboard after a game.

        Args:
            venue_id: Venue ID
            user_id: User ID
            won: Whether the user won
            points: Points earned

        Returns:
            VenueLeaderboard: Updated leaderboard entry
        """
        entry = VenueLeaderboard.query.filter_by(venue_id=venue_id, user_id=user_id).first()

        if not entry:
            entry = VenueLeaderboard(venue_id=venue_id, user_id=user_id)
            db.session.add(entry)

        entry.points += points
        if won:
            entry.wins += 1
            entry.current_streak += 1
            entry.highest_streak = max(entry.highest_streak, entry.current_streak)
        else:
            entry.losses += 1
            entry.current_streak = 0

        entry.last_played = datetime.utcnow()
        db.session.commit()

        return entry

    @staticmethod
    def create_event(venue_id: int, data: Dict[str, Any]) -> VenueEvent:
        """Create a new venue event.

        Args:
            venue_id: Venue ID
            data: Event data

        Returns:
            VenueEvent: Created event
        """
        event = VenueEvent(venue_id=venue_id, **data)
        db.session.add(event)
        db.session.commit()
        return event

    @staticmethod
    def get_venue_events(
        venue_id: int, status: Optional[str] = None, limit: int = 10, offset: int = 0
    ) -> List[VenueEvent]:
        """Get venue events.

        Args:
            venue_id: Venue ID
            status: Optional event status filter
            limit: Maximum number of events to return
            offset: Number of events to skip

        Returns:
            List[VenueEvent]: List of events
        """
        query = VenueEvent.query.filter_by(venue_id=venue_id)

        if status:
            query = query.filter_by(status=status)

        return query.offset(offset).limit(limit).all()

    @staticmethod
    def register_for_event(event_id: int, user_id: int) -> VenueEventParticipant:
        """Register a user for an event.

        Args:
            event_id: Event ID
            user_id: User ID

        Returns:
            VenueEventParticipant: Created participant record
        """
        event = VenueEvent.query.get(event_id)
        if not event:
            raise ValueError("Event not found")

        if event.status != "upcoming":
            raise ValueError("Event registration is closed")

        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            raise ValueError("Registration deadline has passed")

        # Check if user is already registered
        existing = VenueEventParticipant.query.filter_by(event_id=event_id, user_id=user_id).first()

        if existing:
            raise ValueError("User is already registered for this event")

        participant = VenueEventParticipant(event_id=event_id, user_id=user_id)

        db.session.add(participant)
        db.session.commit()
        return participant
