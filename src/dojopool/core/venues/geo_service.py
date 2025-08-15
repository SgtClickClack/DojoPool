from typing import Dict, List, Optional

from geopy.distance import geodesic

from dojopool.models.venue import Venue


class GeoService:
    def __init__(self):
        self.default_search_radius = 10  # km
        self.area_unlock_threshold = 5  # number of visits needed to unlock an area

    def find_nearby_dojos(
        self, lat: float, lng: float, radius_km: Optional[float] = None
    ) -> List[Dict]:
        """Find dojos within the specified radius of the given coordinates."""
        search_radius = radius_km or self.default_search_radius

        # Get all venues and filter by distance
        venues = Venue.query.all()
        nearby_venues = []

        for venue in venues:
            distance = geodesic((lat, lng), (venue.latitude, venue.longitude)).km
            if distance <= search_radius:
                nearby_venues.append(
                    {
                        "id": venue.id,
                        "name": venue.name,
                        "distance": round(distance, 2),
                        "latitude": venue.latitude,
                        "longitude": venue.longitude,
                        "rating": venue.rating,
                        "is_unlocked": self.is_area_unlocked(venue.id),
                        "visit_count": self.get_visit_count(venue.id),
                    }
                )

        return sorted(nearby_venues, key=lambda x: x["distance"])

    def is_area_unlocked(self, venue_id: int) -> bool:
        """Check if a venue's area is unlocked based on visit history."""
        visit_count = self.get_visit_count(venue_id)
        return visit_count >= self.area_unlock_threshold

    def get_visit_count(self, venue_id: int) -> int:
        """Get the number of visits to a venue."""
        # This would typically query a visits or check-ins table
        # For now, return a placeholder value
        return 0  # TODO: Implement actual visit tracking

    def get_regional_leaderboard(
        self, lat: float, lng: float, radius_km: Optional[float] = None
    ) -> List[Dict]:
        """Get the leaderboard for players in a specific region."""
        # TODO: Implement regional leaderboard
        return []

    def generate_area_challenge(self, venue_id: int) -> Dict:
        """Generate a location-based challenge for a specific venue."""
        venue = Venue.query.get(venue_id)
        if not venue:
            return None

        # TODO: Implement challenge generation logic
        challenge = {
            "venue_id": venue_id,
            "name": f"Master of {venue.name}",
            "description": f"Win 3 games at {venue.name} to prove your mastery!",
            "requirements": {"wins_needed": 3, "time_limit_days": 7},
            "rewards": {"xp": 1000, "title": f"{venue.name} Master"},
        }

        return challenge
