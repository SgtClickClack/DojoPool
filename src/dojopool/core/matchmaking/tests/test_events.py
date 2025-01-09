"""Tests for the matchmaking events module."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, call

from ..events import (
    MatchEvent,
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent,
    EventManager
)
from .test_config import TEST_USERS, TEST_VENUES

@pytest.mark.unit
@pytest.mark.events
class TestMatchEvents:
    """Test cases for match event classes."""

    def test_match_found_event(self, mock_user1, mock_user2, mock_venue1):
        """Test MatchFoundEvent creation."""
        start_time = datetime.now() + timedelta(hours=1)
        event = MatchFoundEvent(mock_user1, mock_user2, mock_venue1, start_time)
        
        assert event.event_type == 'match_found'
        assert event.user_id == mock_user1.id
        assert event.data['opponent_id'] == mock_user2.id
        assert event.data['venue_id'] == mock_venue1.id
        assert event.data['start_time'] == start_time.isoformat()
        assert event.data['game_type'] == 'eight_ball'

    def test_match_accepted_event(self, mock_user1):
        """Test MatchAcceptedEvent creation."""
        match_id = 1
        event = MatchAcceptedEvent(mock_user1.id, match_id)
        
        assert event.event_type == 'match_accepted'
        assert event.user_id == mock_user1.id
        assert event.data['match_id'] == match_id

    def test_match_declined_event(self, mock_user1):
        """Test MatchDeclinedEvent creation."""
        match_id = 1
        reason = "Schedule conflict"
        event = MatchDeclinedEvent(mock_user1.id, match_id, reason)
        
        assert event.event_type == 'match_declined'
        assert event.user_id == mock_user1.id
        assert event.data['match_id'] == match_id
        assert event.data['reason'] == reason

    def test_match_cancelled_event(self, mock_user1):
        """Test MatchCancelledEvent creation."""
        match_id = 1
        reason = "Venue closed"
        event = MatchCancelledEvent(mock_user1.id, match_id, reason)
        
        assert event.event_type == 'match_cancelled'
        assert event.user_id == mock_user1.id
        assert event.data['match_id'] == match_id
        assert event.data['reason'] == reason

    def test_match_started_event(self, mock_user1, mock_user2, mock_venue1):
        """Test MatchStartedEvent creation."""
        match_id = 1
        event = MatchStartedEvent(match_id, mock_user1.id, mock_user2.id, mock_venue1.id)
        
        assert event.event_type == 'match_started'
        assert event.user_id == mock_user1.id
        assert event.data['match_id'] == match_id
        assert event.data['opponent_id'] == mock_user2.id
        assert event.data['venue_id'] == mock_venue1.id

    def test_match_completed_event(self, mock_user1, mock_user2):
        """Test MatchCompletedEvent creation."""
        match_id = 1
        score = "8-5"
        duration = 45
        event = MatchCompletedEvent(
            match_id,
            mock_user1.id,
            mock_user2.id,
            score,
            duration
        )
        
        assert event.event_type == 'match_completed'
        assert event.user_id == mock_user1.id
        assert event.data['match_id'] == match_id
        assert event.data['opponent_id'] == mock_user2.id
        assert event.data['score'] == score
        assert event.data['duration'] == duration

@pytest.mark.unit
@pytest.mark.events
class TestEventManager:
    """Test cases for EventManager class."""

    @pytest.fixture
    def event_manager(self):
        """Create an event manager instance for testing."""
        return EventManager()

    def test_subscribe_unsubscribe(self, event_manager):
        """Test subscribing and unsubscribing from events."""
        callback = Mock()
        event_type = 'match_found'
        
        # Test subscribe
        event_manager.subscribe(event_type, callback)
        assert callback in event_manager.subscribers[event_type]
        
        # Test unsubscribe
        event_manager.unsubscribe(event_type, callback)
        assert event_type in event_manager.subscribers
        assert callback not in event_manager.subscribers[event_type]

    def test_publish(self, event_manager, mock_user1, mock_user2, mock_venue1):
        """Test publishing events."""
        callback1 = Mock()
        callback2 = Mock()
        event_manager.subscribe('match_found', callback1)
        event_manager.subscribe('match_accepted', callback2)
        
        # Create and publish events
        event1 = MatchFoundEvent(
            mock_user1,
            mock_user2,
            mock_venue1,
            datetime.now() + timedelta(hours=1)
        )
        event2 = MatchAcceptedEvent(mock_user1.id, 1)
        
        event_manager.publish(event1)
        event_manager.publish(event2)
        
        # Check callbacks were called
        callback1.assert_called_once_with(event1)
        callback2.assert_called_once_with(event2)
        
        # Check event history
        assert len(event_manager.event_history) == 2
        assert event_manager.event_history[0] == event1
        assert event_manager.event_history[1] == event2

    def test_get_user_events(self, event_manager, mock_user1, mock_user2, mock_venue1):
        """Test getting user events."""
        # Create events
        start_time = datetime.now()
        events = [
            MatchFoundEvent(
                mock_user1,
                mock_user2,
                mock_venue1,
                start_time + timedelta(hours=1)
            ),
            MatchAcceptedEvent(mock_user1.id, 1),
            MatchStartedEvent(1, mock_user1.id, mock_user2.id, mock_venue1.id),
            MatchCompletedEvent(1, mock_user2.id, mock_user1.id, "8-5", 45)
        ]
        
        # Publish events
        for event in events:
            event_manager.publish(event)
            
        # Test getting all events for user1
        user1_events = event_manager.get_user_events(mock_user1.id)
        assert len(user1_events) == 3  # All except completed event
        
        # Test getting events by type
        found_events = event_manager.get_user_events(
            mock_user1.id,
            event_type='match_found'
        )
        assert len(found_events) == 1
        assert found_events[0].event_type == 'match_found'
        
        # Test getting events by time range
        recent_events = event_manager.get_user_events(
            mock_user1.id,
            start_time=start_time,
            end_time=datetime.now() + timedelta(hours=2)
        )
        assert len(recent_events) == 3

    def test_clear_history(self, event_manager, mock_user1, mock_user2, mock_venue1):
        """Test clearing event history."""
        # Create and publish events
        events = [
            MatchFoundEvent(
                mock_user1,
                mock_user2,
                mock_venue1,
                datetime.now() + timedelta(hours=1)
            ),
            MatchAcceptedEvent(mock_user1.id, 1),
            MatchStartedEvent(1, mock_user1.id, mock_user2.id, mock_venue1.id)
        ]
        
        for event in events:
            event_manager.publish(event)
            
        # Test clearing specific event type
        event_manager.clear_history(event_type='match_found')
        assert len(event_manager.event_history) == 2
        assert all(e.event_type != 'match_found' for e in event_manager.event_history)
        
        # Test clearing before time
        clear_time = datetime.now()
        event_manager.clear_history(before_time=clear_time)
        assert all(e.timestamp >= clear_time for e in event_manager.event_history)
        
        # Test clearing all history
        event_manager.clear_history()
        assert len(event_manager.event_history) == 0

    def test_error_handling(self, event_manager, mock_user1, mock_user2, mock_venue1):
        """Test error handling in event publishing."""
        def failing_callback(event):
            raise Exception("Test error")
            
        def working_callback(event):
            pass
            
        # Subscribe both callbacks
        event_manager.subscribe('match_found', failing_callback)
        event_manager.subscribe('match_found', working_callback)
        
        # Create and publish event
        event = MatchFoundEvent(
            mock_user1,
            mock_user2,
            mock_venue1,
            datetime.now() + timedelta(hours=1)
        )
        
        # Should not raise exception
        event_manager.publish(event)
        
        # Event should still be in history
        assert len(event_manager.event_history) == 1
        assert event_manager.event_history[0] == event
