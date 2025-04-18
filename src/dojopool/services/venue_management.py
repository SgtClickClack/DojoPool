from datetime import datetime, timedelta
from typing import Dict, List, Optional

from geoalchemy2 import Geography
from sqlalchemy import func

from src.core.database import db
from dojopool.models.game import Game
from src.models.venue import Venue
from src.models.venue_checkin import VenueCheckin


class VenueManagementService:
    def create_venue(self, data: Dict) -> Venue:
        """Create a new venue."""
        venue = Venue(
            name=data["name"],
            description=data.get("description"),
            address=data["address"],
            city=data["city"],
            state=data["state"],
            country=data["country"],
            postal_code=data["postal_code"],
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            phone=data.get("phone"),
            email=data.get("email"),
            website=data.get("website"),
            hours=data.get("hours"),
            features=data.get("features", []),
            tables=data.get("tables", 0),
            pricing=data.get("pricing"),
            is_active=True,
        )
        venue.save()
        return venue

    def update_venue(self, venue_id: int, data: Dict) -> Optional[Venue]:
        """Update an existing venue."""
        venue = Venue.query.get(venue_id)
        if not venue:
            return None

        for key, value in data.items():
            if hasattr(venue, key):
                setattr(venue, key, value)

        venue.save()
        return venue

    def get_venue(self, venue_id: int) -> Optional[Venue]:
        """Get venue by ID."""
        return Venue.query.get(venue_id)

    def get_venues(self, filters: Dict) -> List[Venue]:
        """Get list of venues with optional filters."""
        query = Venue.query

        if filters.get("city"):
            query = query.filter(Venue.city == filters["city"])
        if filters.get("state"):
            query = query.filter(Venue.state == filters["state"])
        if filters.get("is_active") is not None:
            query = query.filter(Venue.is_active == filters["is_active"])
        if filters.get("min_tables"):
            query = query.filter(Venue.tables >= int(filters["min_tables"]))
        if filters.get("features"):
            features = filters["features"].split(",")
            query = query.filter(Venue.features.contains(features))

        return query.all()

    def get_nearby_venues(
        self, latitude: float, longitude: float, radius: float = 10.0
    ) -> List[Venue]:
        """Get venues within specified radius (km) of coordinates."""
        point = f"POINT({longitude} {latitude})"
        radius_meters = radius * 1000  # Convert km to meters

        return Venue.query.filter(
            func.ST_DWithin(
                func.ST_SetSRID(func.ST_MakePoint(Venue.longitude, Venue.latitude), 4326).cast(
                    Geography
                ),
                func.ST_SetSRID(func.ST_GeomFromText(point), 4326).cast(Geography),
                radius_meters,
            )
        ).all()

    def deactivate_venue(self, venue_id: int) -> bool:
        """Deactivate a venue."""
        venue = self.get_venue(venue_id)
        if not venue:
            return False

        venue.is_active = False
        venue.save()
        return True

    def get_venue_stats(self, venue_id: int) -> Optional[Dict]:
        """Get venue statistics."""
        venue = self.get_venue(venue_id)
        if not venue:
            return None

        total_games = Game.query.filter_by(venue_id=venue_id).count()
        unique_players = (
            db.session.query(func.count(func.distinct(Game.player_id)))
            .filter_by(venue_id=venue_id)
            .scalar()
        )

        # Get average games per day over the last 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_games = Game.query.filter(
            Game.venue_id == venue_id, Game.created_at >= thirty_days_ago
        ).count()
        avg_games_per_day = recent_games / 30

        return {
            "total_games": total_games,
            "unique_players": unique_players,
            "avg_games_per_day": round(avg_games_per_day, 2),
            "rating": venue.rating,
            "total_ratings": venue.total_ratings,
        }

    def update_venue_rating(self, venue_id: int, rating: int) -> bool:
        """Update venue rating."""
        venue = self.get_venue(venue_id)
        if not venue:
            return False

        # Update running average
        total_ratings = venue.total_ratings or 0
        current_rating = venue.rating or 0

        new_total = total_ratings + 1
        new_rating = ((current_rating * total_ratings) + rating) / new_total

        venue.rating = round(new_rating, 2)
        venue.total_ratings = new_total
        venue.save()
        return True

    def check_in_player(self, venue_id: int, player_id: int) -> bool:
        """Record player check-in at venue."""
        venue = self.get_venue(venue_id)
        if not venue:
            return False

        # Record check-in in venue_checkins table
        checkin = VenueCheckin(
            venue_id=venue_id, player_id=player_id, check_in_time=datetime.utcnow()
        )
        checkin.save()
        return True

    def get_venue_occupancy(self, venue_id: int) -> Optional[Dict]:
        """Get current venue occupancy."""
        venue = self.get_venue(venue_id)
        if not venue:
            return None

        # Count active games and checked-in players
        active_games = Game.query.filter(
            Game.venue_id == venue_id, Game.status == "in_progress"
        ).count()

        # Get check-ins from last 3 hours
        three_hours_ago = datetime.utcnow() - timedelta(hours=3)
        checked_in_players = VenueCheckin.query.filter(
            VenueCheckin.venue_id == venue_id, VenueCheckin.check_in_time >= three_hours_ago
        ).count()

        return {
            "active_games": active_games,
            "checked_in_players": checked_in_players,
            "total_tables": venue.tables,
            "available_tables": max(0, venue.tables - active_games),
        }
