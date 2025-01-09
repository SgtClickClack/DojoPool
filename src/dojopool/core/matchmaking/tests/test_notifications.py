"""Tests for the matchmaking notifications module."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

from ..notifications import Notification, NotificationManager
from ..events import (
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent
)
from .test_config import TEST_USERS, TEST_VENUES

@pytest.mark.unit
@pytest.mark.notifications
class TestNotification:
    """Test cases for Notification class."""

    def test_notification_creation(self):
        """Test creating a notification."""
        user_id = TEST_USERS['user1']['id']
        title = "Test Notification"
        message = "This is a test notification"
        timestamp = datetime.now()
        data = {'test_key': 'test_value'}
        
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            timestamp=timestamp,
            priority='high',
            data=data
        )
        
        assert notification.user_id == user_id
        assert notification.title == title
        assert notification.message == message
        assert notification.timestamp == timestamp
        assert notification.priority == 'high'
        assert notification.data == data

    def test_notification_defaults(self):
        """Test notification default values."""
        notification = Notification(
            user_id=1,
            title="Test",
            message="Test message",
            timestamp=datetime.now()
        )
        
        assert notification.priority == 'normal'
        assert notification.data is None

@pytest.mark.unit
@pytest.mark.notifications
class TestNotificationManager:
    """Test cases for NotificationManager class."""

    @pytest.fixture
    def notification_manager(self):
        """Create a notification manager instance for testing."""
        return NotificationManager()

    def test_handle_match_found(self, notification_manager, mock_user1, mock_user2, mock_venue1):
        """Test handling match found event."""
        start_time = datetime.now() + timedelta(hours=1)
        event = MatchFoundEvent(mock_user1, mock_user2, mock_venue1, start_time)
        
        notification_manager.handle_event(event)
        
        # Should create notifications for both players
        notifications = notification_manager.notification_history
        assert len(notifications) == 2
        
        # Check player 1 notification
        p1_notif = next(n for n in notifications if n.user_id == mock_user1.id)
        assert p1_notif.title == "Match Found!"
        assert "opponent" in p1_notif.message.lower()
        assert p1_notif.priority == 'high'
        assert p1_notif.data['opponent_id'] == mock_user2.id
        
        # Check player 2 notification
        p2_notif = next(n for n in notifications if n.user_id == mock_user2.id)
        assert p2_notif.title == "Match Found!"
        assert "opponent" in p2_notif.message.lower()
        assert p2_notif.priority == 'high'
        assert p2_notif.data['opponent_id'] == mock_user1.id

    def test_handle_match_accepted(self, notification_manager, mock_user1):
        """Test handling match accepted event."""
        event = MatchAcceptedEvent(mock_user1.id, 1)
        
        notification_manager.handle_event(event)
        
        notifications = notification_manager.notification_history
        assert len(notifications) == 1
        
        notification = notifications[0]
        assert notification.user_id == mock_user1.id
        assert notification.title == "Match Accepted"
        assert "confirmed" in notification.message.lower()
        assert notification.priority == 'high'
        assert notification.data['match_id'] == 1

    def test_handle_match_declined(self, notification_manager, mock_user1):
        """Test handling match declined event."""
        reason = "Schedule conflict"
        event = MatchDeclinedEvent(mock_user1.id, 1, reason)
        
        notification_manager.handle_event(event)
        
        notifications = notification_manager.notification_history
        assert len(notifications) == 1
        
        notification = notifications[0]
        assert notification.user_id == mock_user1.id
        assert notification.title == "Match Declined"
        assert reason in notification.message
        assert notification.priority == 'normal'
        assert notification.data['match_id'] == 1

    def test_handle_match_cancelled(self, notification_manager, mock_user1):
        """Test handling match cancelled event."""
        reason = "Venue closed"
        event = MatchCancelledEvent(mock_user1.id, 1, reason)
        
        notification_manager.handle_event(event)
        
        notifications = notification_manager.notification_history
        assert len(notifications) == 1
        
        notification = notifications[0]
        assert notification.user_id == mock_user1.id
        assert notification.title == "Match Cancelled"
        assert reason in notification.message
        assert notification.priority == 'high'
        assert notification.data['match_id'] == 1

    def test_handle_match_started(self, notification_manager, mock_user1, mock_user2, mock_venue1):
        """Test handling match started event."""
        event = MatchStartedEvent(1, mock_user1.id, mock_user2.id, mock_venue1.id)
        
        notification_manager.handle_event(event)
        
        notifications = notification_manager.notification_history
        assert len(notifications) == 2
        
        # Check both players received notifications
        user_ids = {n.user_id for n in notifications}
        assert user_ids == {mock_user1.id, mock_user2.id}
        
        for notification in notifications:
            assert notification.title == "Match Started"
            assert "good luck" in notification.message.lower()
            assert notification.priority == 'normal'
            assert notification.data['match_id'] == 1
            assert notification.data['venue_id'] == mock_venue1.id

    def test_handle_match_completed(self, notification_manager, mock_user1, mock_user2):
        """Test handling match completed event."""
        event = MatchCompletedEvent(1, mock_user1.id, mock_user2.id, "8-5", 45)
        
        notification_manager.handle_event(event)
        
        notifications = notification_manager.notification_history
        assert len(notifications) == 2
        
        # Check winner notification
        winner_notif = next(n for n in notifications if n.user_id == mock_user1.id)
        assert winner_notif.title == "Match Complete"
        assert "congratulations" in winner_notif.message.lower()
        assert winner_notif.data['score'] == "8-5"
        
        # Check loser notification
        loser_notif = next(n for n in notifications if n.user_id == mock_user2.id)
        assert loser_notif.title == "Match Complete"
        assert "final score" in loser_notif.message.lower()
        assert loser_notif.data['score'] == "8-5"

    def test_get_user_notifications(self, notification_manager, mock_user1, mock_user2):
        """Test getting user notifications."""
        # Create multiple notifications
        start_time = datetime.now()
        notifications = [
            Notification(
                user_id=mock_user1.id,
                title="Test 1",
                message="Message 1",
                timestamp=start_time
            ),
            Notification(
                user_id=mock_user2.id,
                title="Test 2",
                message="Message 2",
                timestamp=start_time + timedelta(minutes=5)
            ),
            Notification(
                user_id=mock_user1.id,
                title="Test 3",
                message="Message 3",
                timestamp=start_time + timedelta(minutes=10)
            )
        ]
        
        for notification in notifications:
            notification_manager.send_notification(notification)
            
        # Test getting all notifications for user1
        user1_notifications = notification_manager.get_user_notifications(mock_user1.id)
        assert len(user1_notifications) == 2
        assert all(n.user_id == mock_user1.id for n in user1_notifications)
        
        # Test getting notifications in time range
        recent_notifications = notification_manager.get_user_notifications(
            mock_user1.id,
            start_time=start_time + timedelta(minutes=5)
        )
        assert len(recent_notifications) == 1
        assert recent_notifications[0].title == "Test 3"

    def test_clear_history(self, notification_manager, mock_user1, mock_user2):
        """Test clearing notification history."""
        # Create notifications
        notifications = [
            Notification(
                user_id=mock_user1.id,
                title="Test 1",
                message="Message 1",
                timestamp=datetime.now()
            ),
            Notification(
                user_id=mock_user2.id,
                title="Test 2",
                message="Message 2",
                timestamp=datetime.now()
            )
        ]
        
        for notification in notifications:
            notification_manager.send_notification(notification)
            
        # Test clearing by user ID
        notification_manager.clear_history(user_id=mock_user1.id)
        remaining = notification_manager.notification_history
        assert len(remaining) == 1
        assert remaining[0].user_id == mock_user2.id
        
        # Test clearing all history
        notification_manager.clear_history()
        assert len(notification_manager.notification_history) == 0

    def test_error_handling(self, notification_manager):
        """Test error handling in notification sending."""
        notification = Notification(
            user_id=1,
            title="Test",
            message="Test message",
            timestamp=datetime.now()
        )
        
        # Mock print to raise exception
        with patch('builtins.print', side_effect=Exception("Test error")):
            result = notification_manager.send_notification(notification)
            
        # Should return False but not raise exception
        assert not result
        # Notification should still be in history
        assert len(notification_manager.notification_history) == 1
