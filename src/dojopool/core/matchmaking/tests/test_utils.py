"""Tests for the matchmaking utilities module."""

import unittest
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from ..utils import (
    calculate_time_overlap,
    find_common_venues,
    calculate_distance,
    get_mutual_friends,
    check_scheduling_conflicts,
    validate_preferences,
    format_wait_time,
    check_rate_limit
)
from ...models.user import User
from ...models.venue import Venue
from ...config.matchmaking import (
    TIME_SETTINGS,
    LOCATION_SETTINGS,
    SOCIAL_SETTINGS
)
from .test_config import (
    TEST_USERS,
    TEST_VENUES,
    TEST_PREFERENCES,
    TEST_SCHEDULES,
    TEST_DISTANCES,
    TEST_RATE_LIMITS
)

@pytest.mark.unit
@pytest.mark.utils
class TestMatchmakingUtils(unittest.TestCase):
    """Test cases for matchmaking utility functions."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock users
        self.user1 = Mock(spec=User)
        user1_config = TEST_USERS['user1']
        self.user1.id = user1_config['id']
        self.user1.friends = user1_config['friends']
        self.user1.preferred_venues = user1_config['preferred_venues']
        self.user1.location = user1_config['location']
        
        self.user2 = Mock(spec=User)
        user2_config = TEST_USERS['user2']
        self.user2.id = user2_config['id']
        self.user2.friends = user2_config['friends']
        self.user2.preferred_venues = user2_config['preferred_venues']
        self.user2.location = user2_config['location']
        
        # Create mock venues
        self.venue1 = Mock(spec=Venue)
        venue1_config = TEST_VENUES['venue1']
        self.venue1.id = venue1_config['id']
        self.venue1.location = venue1_config['location']
        
        self.venue2 = Mock(spec=Venue)
        venue2_config = TEST_VENUES['venue2']
        self.venue2.id = venue2_config['id']
        self.venue2.location = venue2_config['location']

    @pytest.mark.unit
    def test_calculate_time_overlap(self):
        """Test time overlap calculation."""
        times1 = TEST_PREFERENCES['pref1']['available_times']
        times2 = TEST_PREFERENCES['pref2']['available_times']
        
        overlap = calculate_time_overlap(times1, times2)
        self.assertEqual(len(overlap), 1)
        self.assertIn(times1[1], overlap)  # Second hour overlaps
        
        # Test no overlap
        times2 = [
            datetime.now() + timedelta(hours=5),
            datetime.now() + timedelta(hours=6)
        ]
        overlap = calculate_time_overlap(times1, times2)
        self.assertEqual(len(overlap), 0)

    @pytest.mark.unit
    def test_find_common_venues(self):
        """Test finding common venues."""
        common = find_common_venues(self.user1, self.user2)
        self.assertEqual(len(common), 2)
        self.assertEqual(set(v.id for v in common), {2, 3})
        
        # Test with distance filter
        common = find_common_venues(self.user1, self.user2, max_distance=TEST_DISTANCES['nearby'])
        self.assertEqual(len(common), 2)
        
        # Test with no common venues
        self.user2.preferred_venues = [4, 5]
        common = find_common_venues(self.user1, self.user2)
        self.assertEqual(len(common), 0)

    @pytest.mark.unit
    def test_calculate_distance(self):
        """Test distance calculation."""
        # Test same point
        point = TEST_USERS['user1']['location']
        distance = calculate_distance(point, point)
        self.assertEqual(distance, 0)
        
        # Test known distance
        # NYC to Philadelphia (~150km)
        nyc = TEST_USERS['user1']['location']
        philly = (39.9526, -75.1652)
        distance = calculate_distance(nyc, philly)
        self.assertAlmostEqual(distance, 130.0, delta=1.0)

    @pytest.mark.unit
    def test_get_mutual_friends(self):
        """Test getting mutual friends."""
        mutual = get_mutual_friends(self.user1, self.user2)
        self.assertEqual(mutual, {4})
        
        # Test no mutual friends
        self.user2.friends = [6, 7]
        mutual = get_mutual_friends(self.user1, self.user2)
        self.assertEqual(len(mutual), 0)

    @pytest.mark.unit
    def test_check_scheduling_conflicts(self):
        """Test scheduling conflict checks."""
        now = datetime.now()
        start_time = now + timedelta(hours=1)
        
        # Mock schedule methods
        schedule1 = [Mock(**event) for event in TEST_SCHEDULES['schedule1']]
        schedule2 = [Mock(**event) for event in TEST_SCHEDULES['schedule2']]
        
        self.user1.get_schedule = Mock(return_value=schedule1)
        self.user2.get_schedule = Mock(return_value=schedule2)
        
        # Test with conflict
        has_conflict = check_scheduling_conflicts(
            self.user1,
            self.user2,
            start_time
        )
        self.assertTrue(has_conflict)
        
        # Test without conflict
        start_time = now + timedelta(hours=3)
        has_conflict = check_scheduling_conflicts(
            self.user1,
            self.user2,
            start_time
        )
        self.assertFalse(has_conflict)

    @pytest.mark.unit
    def test_validate_preferences(self):
        """Test preferences validation."""
        # Valid preferences
        preferences = TEST_PREFERENCES['pref1']
        self.assertTrue(validate_preferences(preferences))
        
        # Missing required field
        preferences = {'game_type': 'eight_ball'}
        self.assertFalse(validate_preferences(preferences))
        
        # Invalid game type
        preferences = {
            'game_type': 123,
            'available_times': []
        }
        self.assertFalse(validate_preferences(preferences))
        
        # Invalid available times
        preferences = {
            'game_type': 'eight_ball',
            'available_times': ['not a datetime']
        }
        self.assertFalse(validate_preferences(preferences))

    @pytest.mark.unit
    def test_format_wait_time(self):
        """Test wait time formatting."""
        # Test seconds
        self.assertEqual(format_wait_time(30), "30 seconds")
        
        # Test minutes
        self.assertEqual(format_wait_time(90), "1 minutes")
        self.assertEqual(format_wait_time(120), "2 minutes")
        
        # Test hours
        self.assertEqual(format_wait_time(3600), "1 hours")
        self.assertEqual(format_wait_time(3660), "1 hours 1 minutes")
        self.assertEqual(format_wait_time(7200), "2 hours")

    @pytest.mark.unit
    @patch('src.core.database.cache')
    def test_check_rate_limit(self, mock_cache):
        """Test rate limit checking."""
        # Test first attempt
        mock_cache.get.return_value = None
        mock_cache.ttl.return_value = TEST_RATE_LIMITS['retry_after']
        
        exceeded, retry_after = check_rate_limit(
            self.user1,
            'matchmaking',
            window=TEST_RATE_LIMITS['window']
        )
        self.assertFalse(exceeded)
        self.assertIsNone(retry_after)
        
        # Test rate limit exceeded
        mock_cache.get.return_value = TEST_RATE_LIMITS['max_attempts']
        exceeded, retry_after = check_rate_limit(
            self.user1,
            'matchmaking',
            window=TEST_RATE_LIMITS['window']
        )
        self.assertTrue(exceeded)
        self.assertEqual(retry_after, TEST_RATE_LIMITS['retry_after'])

if __name__ == '__main__':
    unittest.main()
