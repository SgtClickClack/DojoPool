"""Pytest configuration for matchmaking tests."""

from datetime import datetime, timedelta
from unittest.mock import Mock, patch

import pytest

from ...models.game import Game
from ...models.user import User
from ...models.venue import Venue
from ..matchmaker import Matchmaker, QueueEntry
from .test_config import TEST_PREFERENCES, TEST_SCHEDULES, TEST_USERS, TEST_VENUES


@pytest.fixture
def mock_user1():
    """Create a mock user 1 for testing."""
    user = Mock(spec=User)
    user_config = TEST_USERS["user1"]
    user.id = user_config["id"]
    user.rating = user_config["rating"]
    user.play_style = user_config["play_style"]
    user.friends = user_config["friends"]
    user.preferred_venues = user_config["preferred_venues"]
    user.subscription_type = user_config["subscription_type"]
    user.location = user_config["location"]

    # Mock schedule method
    schedule = [Mock(**event) for event in TEST_SCHEDULES["schedule1"]]
    user.get_schedule = Mock(return_value=schedule)

    return user


@pytest.fixture
def mock_user2():
    """Create a mock user 2 for testing."""
    user = Mock(spec=User)
    user_config = TEST_USERS["user2"]
    user.id = user_config["id"]
    user.rating = user_config["rating"]
    user.play_style = user_config["play_style"]
    user.friends = user_config["friends"]
    user.preferred_venues = user_config["preferred_venues"]
    user.subscription_type = user_config["subscription_type"]
    user.location = user_config["location"]

    # Mock schedule method
    schedule = [Mock(**event) for event in TEST_SCHEDULES["schedule2"]]
    user.get_schedule = Mock(return_value=schedule)

    return user


@pytest.fixture
def mock_venue1():
    """Create a mock venue 1 for testing."""
    venue = Mock(spec=Venue)
    venue_config = TEST_VENUES["venue1"]
    venue.id = venue_config["id"]
    venue.name = venue_config["name"]
    venue.location = venue_config["location"]
    venue.tables = venue_config["tables"]
    venue.rating = venue_config["rating"]
    return venue


@pytest.fixture
def mock_venue2():
    """Create a mock venue 2 for testing."""
    venue = Mock(spec=Venue)
    venue_config = TEST_VENUES["venue2"]
    venue.id = venue_config["id"]
    venue.name = venue_config["name"]
    venue.location = venue_config["location"]
    venue.tables = venue_config["tables"]
    venue.rating = venue_config["rating"]
    return venue


@pytest.fixture
def mock_game():
    """Create a mock game for testing."""
    game = Mock(spec=Game)
    game.get_previous_matches = Mock(return_value=[])
    return game


@pytest.fixture
def mock_cache():
    """Create a mock cache for testing."""
    cache = Mock()
    cache.get = Mock(return_value=None)
    cache.incr = Mock(return_value=1)
    cache.expire = Mock()
    cache.ttl = Mock(return_value=300)
    return cache


@pytest.fixture
def matchmaker(mock_cache):
    """Create a matchmaker instance for testing."""
    with patch("src.core.database.cache", mock_cache):
        mm = Matchmaker()
        yield mm


@pytest.fixture
def populated_matchmaker(matchmaker, mock_user1, mock_user2):
    """Create a matchmaker instance with users in queue."""
    entry1 = QueueEntry(
        user=mock_user1, preferences=TEST_PREFERENCES["pref1"], join_time=datetime.now(), priority=1
    )
    entry2 = QueueEntry(
        user=mock_user2,
        preferences=TEST_PREFERENCES["pref2"],
        join_time=datetime.now() - timedelta(minutes=5),
        priority=2,
    )
    matchmaker.queue = [entry1, entry2]
    return matchmaker


@pytest.fixture
def mock_database():
    """Create mock database connections and functions."""
    with patch("src.core.database.execute_query") as mock_execute:
        mock_execute.return_value = []
        yield mock_execute
