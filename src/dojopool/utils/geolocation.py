"""Geolocation utilities for DojoPool."""

import logging
from typing import Optional, Tuple
import requests

from dojopool.config import GEOCODING_API_KEY

logger = logging.getLogger(__name__)


def geocode_address(address: str) -> Tuple[float, float]:
    """
    Convert address to latitude and longitude coordinates.

    Args:
        address: Full address string

    Returns:
        Tuple of (latitude, longitude)

    Raises:
        ValueError: If geocoding fails
    """
    try:
        # Clean and format address
        formatted_address = address.replace(" ", "+")

        # Call geocoding API
        url = f"https://maps.googleapis.com/maps/api/geocode/json?address={formatted_address}&key={GEOCODING_API_KEY}"
        response = requests.get(url)
        data = response.json()

        if data["status"] != "OK":
            raise ValueError(f"Geocoding failed: {data['status']}")

        # Extract coordinates
        location = data["results"][0]["geometry"]["location"]
        return location["lat"], location["lng"]

    except Exception as e:
        logger.error(f"Error geocoding address: {str(e)}")
        raise ValueError(f"Could not geocode address: {str(e)}")


def get_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two points in kilometers.
    Uses Haversine formula.
    """
    from math import radians, sin, cos, sqrt, atan2

    R = 6371  # Earth's radius in kilometers

    # Convert coordinates to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    # Differences in coordinates
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    # Haversine formula
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance = R * c

    return distance


def find_nearby_venues(latitude: float, longitude: float, radius_km: float = 10.0) -> list:
    """
    Find venues within specified radius of coordinates.

    Args:
        latitude: Center point latitude
        longitude: Center point longitude
        radius_km: Search radius in kilometers

    Returns:
        List of venue objects within radius
    """
    from dojopool.models.venue import Venue

    nearby_venues = []
    all_venues = Venue.get_all()

    for venue in all_venues:
        distance = get_distance(latitude, longitude, venue.latitude, venue.longitude)
        if distance <= radius_km:
            venue.distance = distance  # Add distance to venue object
            nearby_venues.append(venue)

    # Sort by distance
    nearby_venues.sort(key=lambda x: x.distance)
    return nearby_venues


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate geographic coordinates."""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180
