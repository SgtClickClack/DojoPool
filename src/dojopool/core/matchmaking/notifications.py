"""Matchmaking notifications module.

This module handles sending notifications to users about matchmaking events.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from ...core.database import db, reference_col
from ...core.auth.models import User
from ..models.game import Game
from ..models.venue import Venue
from ..config.matchmaking import TIME_SETTINGS
from .events import (
    MatchEvent,
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent
)

@dataclass
class Notification:
    """Base class for notifications."""
    user_id: int
    title: str
    message: str
    timestamp: datetime
    priority: str = 'normal'
    data: Optional[Dict] = None

class NotificationManager:
    """Manages sending notifications to users."""
    
    def __init__(self):
        """Initialize the notification manager."""
        self.notification_history = []
        self.notification_handlers = {
            'match_found': self._handle_match_found,
            'match_accepted': self._handle_match_accepted,
            'match_declined': self._handle_match_declined,
            'match_cancelled': self._handle_match_cancelled,
            'match_started': self._handle_match_started,
            'match_completed': self._handle_match_completed
        }

    def handle_event(self, event: MatchEvent) -> None:
        """Handle a matchmaking event.
        
        Args:
            event: Event to handle
        """
        if event.event_type in self.notification_handlers:
            handler = self.notification_handlers[event.event_type]
            notifications = handler(event)
            for notification in notifications:
                self.send_notification(notification)

    def send_notification(self, notification: Notification) -> bool:
        """Send a notification to a user.
        
        Args:
            notification: Notification to send
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            # Store notification in history
            self.notification_history.append(notification)
            
            # TODO: Implement actual notification sending
            # This could be push notifications, emails, SMS, etc.
            print(f"Sending notification to user {notification.user_id}:")
            print(f"Title: {notification.title}")
            print(f"Message: {notification.message}")
            print(f"Priority: {notification.priority}")
            if notification.data:
                print(f"Data: {notification.data}")
                
            return True
            
        except Exception as e:
            print(f"Error sending notification: {str(e)}")
            return False

    def get_user_notifications(
        self,
        user_id: int,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[Notification]:
        """Get notifications for a specific user.
        
        Args:
            user_id: ID of user to get notifications for
            start_time: Optional start time for notification range
            end_time: Optional end time for notification range
            
        Returns:
            List[Notification]: List of notifications matching criteria
        """
        notifications = []
        for notification in self.notification_history:
            # Check user ID
            if notification.user_id != user_id:
                continue
                
            # Check time range
            if start_time and notification.timestamp < start_time:
                continue
            if end_time and notification.timestamp > end_time:
                continue
                
            notifications.append(notification)
            
        return notifications

    def clear_history(
        self,
        before_time: Optional[datetime] = None,
        user_id: Optional[int] = None
    ) -> None:
        """Clear notification history.
        
        Args:
            before_time: Optional time before which to clear notifications
            user_id: Optional user ID to clear notifications for
        """
        if not before_time and not user_id:
            self.notification_history = []
            return
            
        self.notification_history = [
            n for n in self.notification_history
            if (before_time and n.timestamp >= before_time) or
               (user_id and n.user_id != user_id)
        ]

    def _handle_match_found(self, event: MatchFoundEvent) -> List[Notification]:
        """Handle match found event.
        
        Args:
            event: Match found event
            
        Returns:
            List[Notification]: Notifications to send
        """
        notifications = []
        
        # Notification for player 1
        notifications.append(Notification(
            user_id=event.user_id,
            title="Match Found!",
            message="A suitable opponent has been found for your game.",
            timestamp=event.timestamp,
            priority='high',
            data={
                'opponent_id': event.data['opponent_id'],
                'venue_id': event.data['venue_id'],
                'start_time': event.data['start_time']
            }
        ))
        
        # Notification for player 2
        notifications.append(Notification(
            user_id=event.data['opponent_id'],
            title="Match Found!",
            message="A suitable opponent has been found for your game.",
            timestamp=event.timestamp,
            priority='high',
            data={
                'opponent_id': event.user_id,
                'venue_id': event.data['venue_id'],
                'start_time': event.data['start_time']
            }
        ))
        
        return notifications

    def _handle_match_accepted(self, event: MatchAcceptedEvent) -> List[Notification]:
        """Handle match accepted event.
        
        Args:
            event: Match accepted event
            
        Returns:
            List[Notification]: Notifications to send
        """
        return [Notification(
            user_id=event.user_id,
            title="Match Accepted",
            message="Your match has been confirmed.",
            timestamp=event.timestamp,
            priority='high',
            data={'match_id': event.data['match_id']}
        )]

    def _handle_match_declined(self, event: MatchDeclinedEvent) -> List[Notification]:
        """Handle match declined event.
        
        Args:
            event: Match declined event
            
        Returns:
            List[Notification]: Notifications to send
        """
        message = "Match was declined"
        if event.data.get('reason'):
            message += f": {event.data['reason']}"
            
        return [Notification(
            user_id=event.user_id,
            title="Match Declined",
            message=message,
            timestamp=event.timestamp,
            priority='normal',
            data={'match_id': event.data['match_id']}
        )]

    def _handle_match_cancelled(self, event: MatchCancelledEvent) -> List[Notification]:
        """Handle match cancelled event.
        
        Args:
            event: Match cancelled event
            
        Returns:
            List[Notification]: Notifications to send
        """
        return [Notification(
            user_id=event.user_id,
            title="Match Cancelled",
            message=f"Match was cancelled: {event.data['reason']}",
            timestamp=event.timestamp,
            priority='high',
            data={'match_id': event.data['match_id']}
        )]

    def _handle_match_started(self, event: MatchStartedEvent) -> List[Notification]:
        """Handle match started event.
        
        Args:
            event: Match started event
            
        Returns:
            List[Notification]: Notifications to send
        """
        notifications = []
        
        # Notification for both players
        for user_id in [event.user_id, event.data['opponent_id']]:
            notifications.append(Notification(
                user_id=user_id,
                title="Match Started",
                message="Your match has started. Good luck!",
                timestamp=event.timestamp,
                priority='normal',
                data={
                    'match_id': event.data['match_id'],
                    'venue_id': event.data['venue_id']
                }
            ))
            
        return notifications

    def _handle_match_completed(self, event: MatchCompletedEvent) -> List[Notification]:
        """Handle match completed event.
        
        Args:
            event: Match completed event
            
        Returns:
            List[Notification]: Notifications to send
        """
        notifications = []
        
        # Notification for winner
        notifications.append(Notification(
            user_id=event.user_id,
            title="Match Complete",
            message=f"Congratulations! You won the match {event.data['score']}",
            timestamp=event.timestamp,
            priority='normal',
            data={
                'match_id': event.data['match_id'],
                'score': event.data['score']
            }
        ))
        
        # Notification for loser
        notifications.append(Notification(
            user_id=event.data['opponent_id'],
            title="Match Complete",
            message=f"Match complete. Final score: {event.data['score']}",
            timestamp=event.timestamp,
            priority='normal',
            data={
                'match_id': event.data['match_id'],
                'score': event.data['score']
            }
        ))
        
        return notifications
