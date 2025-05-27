import logging
from typing import Dict, List, Optional, Tuple

import googlemaps
from core.models import db
from sqlalchemy import func

from dojopool.venues.venue_manager import PoolTable
from dojopool.core.models.venue import Venue

logger = logging.getLogger(__name__)


class VenueService:
    """Service for managing venues and Google Maps integration."""

    def __init__(self, google_maps_key: str):
        self.gmaps = googlemaps.Client(key=google_maps_key)

    def create_venue(self, venue_data: Dict) -> Optional[Venue]:
        """Create a new venue with Google Maps validation."""
        try:
            # Validate and geocode address
            address = f"{venue_data['address']}, {venue_data['city']}, {venue_data.get('state', '')}, {venue_data['country']}"
            geocode_result = self.gmaps.geocode(address)

            if not geocode_result:
                logger.error(f"Could not geocode address: {address}")
                return None

            location = geocode_result[0]["geometry"]["location"]
            venue_data["latitude"] = location["lat"]
            venue_data["longitude"] = location["lng"]

            # Create venue
            venue = Venue(**venue_data)
            db.session.add(venue)
            db.session.commit()

            return venue

        except Exception as e:
            logger.error(f"Failed to create venue: {str(e)}")
            db.session.rollback()
            return None

    def update_venue(self, venue_id: int, venue_data: Dict) -> Optional[Venue]:
        """Update an existing venue."""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return None

            # If address changed, update coordinates
            if any(
                venue_data.get(field) != getattr(venue, field)
                for field in ["address", "city", "state", "country"]
            ):
                address = (
                    f"{venue_data.get('address', venue.address)}, "
                    f"{venue_data.get('city', venue.city)}, "
                    f"{venue_data.get('state', venue.state)}, "
                    f"{venue_data.get('country', venue.country)}"
                )
                geocode_result = self.gmaps.geocode(address)

                if geocode_result:
                    location = geocode_result[0]["geometry"]["location"]
                    venue_data["latitude"] = location["lat"]
                    venue_data["longitude"] = location["lng"]

            # Update venue fields
            for key, value in venue_data.items():
                if hasattr(venue, key):
                    setattr(venue, key, value)

            db.session.commit()
            return venue

        except Exception as e:
            logger.error(f"Failed to update venue: {str(e)}")
            db.session.rollback()
            return None

    def get_nearby_venues(
        self, latitude: float, longitude: float, radius_km: float = 10.0, filters: Dict = None
    ) -> List[Dict]:
        """Get venues within a radius of a location."""
        try:
            # Convert km to degrees (approximate)
            radius_deg = radius_km / 111.0  # 1 degree ≈ 111 km

            # Base query with distance calculation
            query = db.session.query(
                Venue,
                func.sqrt(
                    func.pow(Venue.latitude - latitude, 2)
                    + func.pow(Venue.longitude - longitude, 2)
                ).label("distance"),
            ).filter(
                func.sqrt(
                    func.pow(Venue.latitude - latitude, 2)
                    + func.pow(Venue.longitude - longitude, 2)
                )
                <= radius_deg
            )

            # Apply filters
            if filters:
                if filters.get("has_parking"):
                    query = query.filter(Venue.has_parking is True)
                if filters.get("is_accessible"):
                    query = query.filter(Venue.is_accessible is True)
                if filters.get("has_food"):
                    query = query.filter(Venue.has_food_service is True)
                if filters.get("has_bar"):
                    query = query.filter(Venue.has_bar is True)
                if filters.get("min_rating"):
                    query = query.having(func.avg(VenueRating.rating) >= filters["min_rating"])

            # Order by distance
            query = query.order_by("distance")

            # Execute query and format results
            results = []
            for venue, distance in query.all():
                venue_dict = venue.to_dict()
                venue_dict["distance_km"] = distance * 111.0
                results.append(venue_dict)

            return results

        except Exception as e:
            logger.error(f"Failed to get nearby venues: {str(e)}")
            return []

    def get_directions(
        self, origin: Tuple[float, float], venue_id: int, mode: str = "driving"
    ) -> Optional[Dict]:
        """Get directions to a venue."""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return None

            # Get directions from Google Maps
            directions = self.gmaps.directions(
                origin=f"{origin[0]},{origin[1]}",
                destination=f"{venue.latitude},{venue.longitude}",
                mode=mode,
            )

            if not directions:
                return None

            # Format response
            route = directions[0]
            return {
                "distance": route["legs"][0]["distance"]["text"],
                "duration": route["legs"][0]["duration"]["text"],
                "steps": [
                    {
                        "instruction": step["html_instructions"],
                        "distance": step["distance"]["text"],
                        "duration": step["duration"]["text"],
                    }
                    for step in route["legs"][0]["steps"]
                ],
                "polyline": route["overview_polyline"]["points"],
            }

        except Exception as e:
            logger.error(f"Failed to get directions: {str(e)}")
            return None

    def add_table(self, venue_id: int, table_data: Dict) -> Optional[PoolTable]:
        """Add a new pool table to a venue."""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return None

            table = PoolTable(venue_id=venue_id, **table_data)
            db.session.add(table)
            db.session.commit()
            return table

        except Exception as e:
            logger.error(f"Failed to add table: {str(e)}")
            db.session.rollback()
            return None

    def update_table_status(
        self,
        table_id: int,
        is_occupied: bool = None,
        needs_maintenance: bool = None,
        current_game_id: int = None,
    ) -> Optional[PoolTable]:
        """Update a pool table's status."""
        try:
            table = PoolTable.query.get(table_id)
            if not table:
                return None

            if is_occupied is not None:
                table.is_occupied = is_occupied
            if needs_maintenance is not None:
                table.needs_maintenance = needs_maintenance
            if current_game_id is not None:
                table.current_game_id = current_game_id

            db.session.commit()
            return table

        except Exception as e:
            logger.error(f"Failed to update table status: {str(e)}")
            db.session.rollback()
            return None

    def add_rating(
        self, venue_id: int, user_id: int, rating: int, review: str = None
    ) -> Optional[VenueRating]:
        """Add or update a venue rating."""
        try:
            # Check for existing rating
            existing_rating = VenueRating.query.filter_by(
                venue_id=venue_id, user_id=user_id
            ).first()

            if existing_rating:
                existing_rating.rating = rating
                if review:
                    existing_rating.review = review
                rating_obj = existing_rating
            else:
                rating_obj = VenueRating(
                    venue_id=venue_id, user_id=user_id, rating=rating, review=review
                )
                db.session.add(rating_obj)

            db.session.commit()
            return rating_obj

        except Exception as e:
            logger.error(f"Failed to add rating: {str(e)}")
            db.session.rollback()
            return None

    def get_venue_stats(self, venue_id: int) -> Optional[Dict]:
        """Get venue statistics."""
        try:
            venue = Venue.query.get(venue_id)
            if not venue:
                return None

            # Get table statistics
            total_tables = len(venue.tables)
            occupied_tables = sum(1 for table in venue.tables if table.is_occupied)
            maintenance_needed = sum(1 for table in venue.tables if table.needs_maintenance)

            # Get rating statistics
            ratings = [r.rating for r in venue.ratings]
            avg_rating = sum(ratings) / len(ratings) if ratings else None
            rating_distribution = {i: ratings.count(i) for i in range(1, 6)} if ratings else None

            return {
                "tables": {
                    "total": total_tables,
                    "occupied": occupied_tables,
                    "available": total_tables - occupied_tables,
                    "maintenance_needed": maintenance_needed,
                },
                "ratings": {
                    "average": avg_rating,
                    "total_reviews": len(ratings),
                    "distribution": rating_distribution,
                },
            }

        except Exception as e:
            logger.error(f"Failed to get venue stats: {str(e)}")
            return None
