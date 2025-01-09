"""Tests for the matchmaker module."""

import unittest
import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from ..matchmaker import Matchmaker
from ..exceptions import (
    QueueFullError,
    PlayerNotFoundError,
    InvalidPreferencesError,
    MatchmakingTimeoutError
)
from ...models.user import User
from ...models.game import Game
from ...models.venue import Venue
from ...config.matchmaking import (
    MATCHMAKING_WEIGHTS,
    QUEUE_SETTINGS,
    TIME_SETTINGS
)
from .test_config import (
    TEST_USERS,
    TEST_PREFERENCES,
    TEST_COMPATIBILITY,
    TEST_QUEUE
)

@pytest.mark.unit
@pytest.mark.matchmaker
class TestMatchmaker(unittest.TestCase):
    """Test cases for the Matchmaker class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.matchmaker = Matchmaker()
        
        # Create mock users
        self.user1 = Mock(spec=User)
        user1_config = TEST_USERS['user1']
        self.user1.id = user1_config['id']
        self.user1.rating = user1_config['rating']
        self.user1.play_style = user1_config['play_style']
        self.user1.friends = user1_config['friends']
        self.user1.preferred_venues = user1_config['preferred_venues']
        self.user1.subscription_type = user1_config['subscription_type']
        
        self.user2 = Mock(spec=User)
        user2_config = TEST_USERS['user2']
        self.user2.id = user2_config['id']
        self.user2.rating = user2_config['rating']
        self.user2.play_style = user2_config['play_style']
        self.user2.friends = user2_config['friends']
        self.user2.preferred_venues = user2_config['preferred_venues']
        self.user2.subscription_type = user2_config['subscription_type']
        
        # Create mock preferences
        self.preferences1 = TEST_PREFERENCES['pref1']
        self.preferences2 = TEST_PREFERENCES['pref2']

    @pytest.mark.unit
    def test_add_to_queue(self):
        """Test adding players to the queue."""
        # Test successful addition
        result = self.matchmaker.add_to_queue(self.user1, self.preferences1)
        self.assertTrue(result)
        self.assertEqual(len(self.matchmaker.queue), 1)
        
        # Test queue entry properties
        entry = self.matchmaker.queue[0]
        self.assertEqual(entry['user'], self.user1)
        self.assertEqual(entry['preferences'], self.preferences1)
        self.assertIsInstance(entry['join_time'], datetime)
        self.assertEqual(
            entry['priority'],
            TEST_QUEUE['priority_levels']['standard']
        )
        
        # Test queue full
        self.matchmaker.queue = [Mock() for _ in range(TEST_QUEUE['max_size'])]
        result = self.matchmaker.add_to_queue(self.user2, self.preferences2)
        self.assertFalse(result)

    @pytest.mark.unit
    def test_remove_from_queue(self):
        """Test removing players from the queue."""
        # Add users to queue
        self.matchmaker.add_to_queue(self.user1, self.preferences1)
        self.matchmaker.add_to_queue(self.user2, self.preferences2)
        
        # Test successful removal
        result = self.matchmaker.remove_from_queue(self.user1)
        self.assertTrue(result)
        self.assertEqual(len(self.matchmaker.queue), 1)
        
        # Test removing non-existent user
        result = self.matchmaker.remove_from_queue(self.user1)
        self.assertFalse(result)

    @pytest.mark.unit
    def test_find_match(self):
        """Test finding matches for players."""
        # Add users to queue
        self.matchmaker.add_to_queue(self.user2, self.preferences2)
        
        # Test finding match
        match = self.matchmaker.find_match(self.user1, self.preferences1)
        self.assertEqual(match, self.user2)
        
        # Test no match found
        self.user2.rating = 3000  # Make users incompatible
        match = self.matchmaker.find_match(self.user1, self.preferences1)
        self.assertIsNone(match)

    @pytest.mark.unit
    def test_calculate_match_score(self):
        """Test match score calculation."""
        score = self.matchmaker._calculate_match_score(
            self.user1,
            self.user2,
            self.preferences1,
            self.preferences2
        )
        
        self.assertGreaterEqual(score, TEST_COMPATIBILITY['min_score'])
        self.assertLessEqual(score, TEST_COMPATIBILITY['perfect_score'])
        
        # Test perfect match
        self.user2.rating = self.user1.rating
        self.user2.play_style = self.user1.play_style
        self.user2.friends = self.user1.friends
        self.user2.preferred_venues = self.user1.preferred_venues
        self.preferences2['available_times'] = self.preferences1['available_times']
        
        score = self.matchmaker._calculate_match_score(
            self.user1,
            self.user2,
            self.preferences1,
            self.preferences2
        )
        self.assertAlmostEqual(score, TEST_COMPATIBILITY['perfect_score'])

    @pytest.mark.integration
    def test_process_queue(self):
        """Test queue processing."""
        # Add users to queue
        self.matchmaker.add_to_queue(self.user1, self.preferences1)
        self.matchmaker.add_to_queue(self.user2, self.preferences2)
        
        # Test processing queue
        matches = self.matchmaker.process_queue()
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0], (self.user1, self.user2))
        self.assertEqual(len(self.matchmaker.queue), 0)
        
        # Test queue processing interval
        matches = self.matchmaker.process_queue()
        self.assertEqual(len(matches), 0)
        
        # Test processing empty queue
        self.matchmaker.last_update = datetime.now() - timedelta(
            seconds=TEST_QUEUE['update_interval'] + 1
        )
        matches = self.matchmaker.process_queue()
        self.assertEqual(len(matches), 0)

    @pytest.mark.unit
    def test_get_queue_position(self):
        """Test getting queue position."""
        # Add users to queue
        self.matchmaker.add_to_queue(self.user1, self.preferences1)
        self.matchmaker.add_to_queue(self.user2, self.preferences2)
        
        # Test getting position
        position = self.matchmaker.get_queue_position(self.user1)
        self.assertEqual(position, 1)
        
        position = self.matchmaker.get_queue_position(self.user2)
        self.assertEqual(position, 2)
        
        # Test getting position for non-existent user
        user3 = Mock(spec=User)
        user3.id = 3
        position = self.matchmaker.get_queue_position(user3)
        self.assertIsNone(position)

    @pytest.mark.unit
    def test_get_estimated_wait_time(self):
        """Test wait time estimation."""
        # Test various positions
        wait_time = self.matchmaker.get_estimated_wait_time(1)
        self.assertEqual(wait_time, 0)
        
        wait_time = self.matchmaker.get_estimated_wait_time(
            TEST_QUEUE['batch_size'] + 1
        )
        self.assertEqual(
            wait_time,
            TEST_QUEUE['update_interval']
        )
        
        wait_time = self.matchmaker.get_estimated_wait_time(
            TEST_QUEUE['batch_size'] * 2 + 1
        )
        self.assertEqual(
            wait_time,
            TEST_QUEUE['update_interval'] * 2
        )

if __name__ == '__main__':
    unittest.main()
