"""Matchmaking utilities module.

This module provides helper functions for matchmaking operations.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set, Tuple

from ...models.user import User
from ...models.venue import Venue
from ..config.matchmaking import LOCATION_SETTINGS, TIME_SETTINGS


def calculate_time_overlap(times1: List[datetime], times2: List[datetime]) -> List[datetime]:
    overlapping = []
    for time1 in times1:
        if time1 in times2:
            overlapping.append(time1)
    return overlapping


def find_common_venues(
    user1: User, user2: User, max_distance: Optional[float] = None
) -> List[Venue]:
    venues1 = set(user1.preferred_venues)
    venues2 = set(user2.preferred_venues)
    common = venues1 & venues2

    if max_distance is None:
        max_distance = LOCATION_SETTINGS["max_distance"]

    if hasattr(user1, "location") and hasattr(user2, "location"):
        filtered = []
        for venue in common:
            if (
                calculate_distance(user1.location, venue.location) <= max_distance
                and calculate_distance(user2.location, venue.location) <= max_distance
            ):
                filtered.append(venue)
        return filtered

    return list(common)


def calculate_distance(point1: Tuple[float, float], point2: Tuple[float, float]) -> float:
    from math import atan2, cos, radians, sin, sqrt

    R = 6371.0

    lat1, lon1 = map(radians, point1)
    lat2, lon2 = map(radians, point2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c


def get_mutual_friends(user1: User, user2: User) -> Set[int]:
    return set(user1.friends) & set(user2.friends)


def check_scheduling_conflicts(user1: User, user2: User, start_time: datetime) -> bool:
    schedule1 = user1.get_schedule()
    schedule2 = user2.get_schedule()

    end_time = start_time + timedelta(minutes=TIME_SETTINGS["default_game_duration"])

    for event in schedule1 + schedule2:
        if start_time < event["end_time"] and end_time > event["start_time"]:
            return True

    return False


def validate_preferences(preferences: Dict) -> bool:
    required_fields = {"game_type", "available_times"}

    if not all(field in preferences for field in required_fields):
        return False

    if not isinstance(preferences["game_type"], str):
        return False

    if not isinstance(preferences["available_times"], list):
        return False

    for time in preferences["available_times"]:
        if not isinstance(time, datetime):
            return False

    return True


def format_wait_time(seconds: int) -> str:
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    remaining_seconds = seconds % 60

    parts = []
    if hours > 0:
        parts.append(f"{hours} hours")
    if minutes > 0:
        parts.append(f"{minutes} minutes")
    if remaining_seconds > 0 and not parts:
        parts.append(f"{remaining_seconds} seconds")

    return " ".join(parts) or "0 seconds"


def check_rate_limit(
    user: User, action: str, window: int = TIME_SETTINGS["rate_limit_window"]
) -> Tuple[bool, Optional[int]]:
    from ..database import cache

    key = f"rate_limit:{action}:{user.id}"
    attempts = cache.get(key) or 0

    if attempts >= TIME_SETTINGS["max_attempts"]:
        retry_after = cache.ttl(key)
        return True, retry_after

    cache.incr(key)
    if attempts == 0:
        cache.expire(key, window)

    return False, None
