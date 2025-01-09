"""Matchmaking events module.

This module handles events and notifications for the matchmaking system.
"""

from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass

from ...models.user import User
from ...models.game import Game
from ...models.venue import Venue
from ..config.matchmaking import TIME_SETTINGS

@dataclass
class MatchEvent:
    """Base class for matchmaking events."""
    timestamp: datetime
    event_type: str
    user_id: int
    data: Dict

@dataclass
class MatchFoundEvent(MatchEvent):
    """Event for when a match is found."""
    def __init__(self, user1: User, user2: User, venue: Venue, start_time: datetime):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_found',
            user_id=user1.id,
            data={
                'opponent_id': user2.id,
                'venue_id': venue.id,
                'start_time': start_time.isoformat(),
                'game_type': 'eight_ball',  # Default game type
                'timeout': TIME_SETTINGS['default_game_duration']
            }
        )

@dataclass
class MatchAcceptedEvent(MatchEvent):
    """Event for when a match is accepted."""
    def __init__(self, user_id: int, match_id: int):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_accepted',
            user_id=user_id,
            data={'match_id': match_id}
        )

@dataclass
class MatchDeclinedEvent(MatchEvent):
    """Event for when a match is declined."""
    def __init__(self, user_id: int, match_id: int, reason: Optional[str] = None):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_declined',
            user_id=user_id,
            data={
                'match_id': match_id,
                'reason': reason
            }
        )

@dataclass
class MatchCancelledEvent(MatchEvent):
    """Event for when a match is cancelled."""
    def __init__(self, user_id: int, match_id: int, reason: str):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_cancelled',
            user_id=user_id,
            data={
                'match_id': match_id,
                'reason': reason
            }
        )

@dataclass
class MatchStartedEvent(MatchEvent):
    """Event for when a match starts."""
    def __init__(self, match_id: int, user1_id: int, user2_id: int, venue_id: int):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_started',
            user_id=user1_id,
            data={
                'match_id': match_id,
                'opponent_id': user2_id,
                'venue_id': venue_id
            }
        )

@dataclass
class MatchCompletedEvent(MatchEvent):
    """Event for when a match is completed."""
    def __init__(
        self,
        match_id: int,
        winner_id: int,
        loser_id: int,
        score: str,
        duration: int
    ):
        super().__init__(
            timestamp=datetime.now(),
            event_type='match_completed',
            user_id=winner_id,
            data={
                'match_id': match_id,
                'opponent_id': loser_id,
                'score': score,
                'duration': duration
            }
        )

class EventManager:
    """Manages matchmaking events and notifications."""
    
    def __init__(self):
        """Initialize the event manager."""
        self.subscribers = {}
        self.event_history = []

    def subscribe(self, event_type: str, callback) -> None:
        """Subscribe to an event type.
        
        Args:
            event_type: Type of event to subscribe to
            callback: Function to call when event occurs
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback) -> None:
        """Unsubscribe from an event type.
        
        Args:
            event_type: Type of event to unsubscribe from
            callback: Function to remove from subscribers
        """
        if event_type in self.subscribers:
            self.subscribers[event_type].remove(callback)

    def publish(self, event: MatchEvent) -> None:
        """Publish an event to all subscribers.
        
        Args:
            event: Event to publish
        """
        # Store event in history
        self.event_history.append(event)
        
        # Notify subscribers
        if event.event_type in self.subscribers:
            for callback in self.subscribers[event.event_type]:
                try:
                    callback(event)
                except Exception as e:
                    # Log error but continue notifying other subscribers
                    print(f"Error notifying subscriber: {str(e)}")

    def get_user_events(
        self,
        user_id: int,
        event_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[MatchEvent]:
        """Get events for a specific user.
        
        Args:
            user_id: ID of user to get events for
            event_type: Optional type of events to filter by
            start_time: Optional start time for event range
            end_time: Optional end time for event range
            
        Returns:
            List[MatchEvent]: List of events matching criteria
        """
        events = []
        for event in self.event_history:
            # Check user ID
            if event.user_id != user_id:
                continue
                
            # Check event type
            if event_type and event.event_type != event_type:
                continue
                
            # Check time range
            if start_time and event.timestamp < start_time:
                continue
            if end_time and event.timestamp > end_time:
                continue
                
            events.append(event)
            
        return events

    def clear_history(
        self,
        before_time: Optional[datetime] = None,
        event_type: Optional[str] = None
    ) -> None:
        """Clear event history.
        
        Args:
            before_time: Optional time before which to clear events
            event_type: Optional type of events to clear
        """
        if not before_time and not event_type:
            self.event_history = []
            return
            
        self.event_history = [
            event for event in self.event_history
            if (before_time and event.timestamp >= before_time) or
               (event_type and event.event_type != event_type)
        ]
