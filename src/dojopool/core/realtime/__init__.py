"""WebSocket initialization module.

This module initializes the WebSocket server and registers event handlers.
"""
from typing import Dict, Any, Set
from flask import Flask
from flask_socketio import SocketIO
from .events import (
    handle_connect,
    handle_disconnect,
    handle_join_game,
    handle_leave_game,
    handle_update_score,
    handle_end_game,
    handle_join_tournament,
    handle_leave_tournament,
    handle_chat_message
)
from ..matchmaking.events import (
    MatchEvent,
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent
)
from .metrics import track_error
from ..extensions import socketio

def init_websockets(app: Flask) -> None:
    """Initialize WebSocket server.
    
    Args:
        app: Flask application instance.
    """
    # Register game event handlers
    socketio.on_event('connect', handle_connect)
    socketio.on_event('disconnect', handle_disconnect)
    socketio.on_event('join_game', handle_join_game)
    socketio.on_event('leave_game', handle_leave_game)
    socketio.on_event('update_score', handle_update_score)
    socketio.on_event('end_game', handle_end_game)
    socketio.on_event('join_tournament', handle_join_tournament)
    socketio.on_event('leave_tournament', handle_leave_tournament)
    socketio.on_event('chat_message', handle_chat_message)
    
    # Register notification event handlers
    socketio.on_event('subscribe_notifications', handle_subscribe_notifications)
    socketio.on_event('unsubscribe_notifications', handle_unsubscribe_notifications)
    
    # Register matchmaking event handlers
    socketio.on_event('match_found', handle_match_found)
    socketio.on_event('match_accepted', handle_match_accepted)
    socketio.on_event('match_declined', handle_match_declined)
    socketio.on_event('match_cancelled', handle_match_cancelled)
    socketio.on_event('match_started', handle_match_started)
    socketio.on_event('match_completed', handle_match_completed)
    
    # Register error handler
    @socketio.on_error()
    def error_handler(e: Exception) -> None:
        """Handle WebSocket errors.
        
        Args:
            e: Exception instance.
        """
        track_error(type(e).__name__)

def emit_to_user(user_id: str, event: str, data: Dict[str, Any]) -> None:
    """Emit event to specific user.
    
    Args:
        user_id: ID of the user.
        event: Event name.
        data: Event data.
    """
    room = f'user_{user_id}'
    socketio.emit(event, data, room=room)

def emit_to_game(game_id: str, event: str, data: Dict[str, Any]) -> None:
    """Emit event to game room.
    
    Args:
        game_id: ID of the game.
        event: Event name.
        data: Event data.
    """
    room = f'game_{game_id}'
    socketio.emit(event, data, room=room)

def emit_to_tournament(tournament_id: str, event: str, data: Dict[str, Any]) -> None:
    """Emit event to tournament room.
    
    Args:
        tournament_id: ID of the tournament.
        event: Event name.
        data: Event data.
    """
    room = f'tournament_{tournament_id}'
    socketio.emit(event, data, room=room)

def broadcast_system_message(message: str) -> None:
    """Broadcast system message to all connected clients.
    
    Args:
        message: Message to broadcast.
    """
    socketio.emit('system_message', {'message': message})

def notify_match_event(event: MatchEvent, user_ids: Set[int]) -> None:
    """Send a match event to multiple users.
    
    Args:
        event: Match event to send
        user_ids: Set of user IDs to notify
    """
    message = {
        'type': 'event',
        'event_type': event.event_type,
        'timestamp': event.timestamp.isoformat(),
        'data': event.data
    }
    
    for user_id in user_ids:
        emit_to_user(str(user_id), 'match_event', message)

def handle_subscribe_notifications(data: Dict[str, Any]) -> None:
    """Handle notification subscription.
    
    Args:
        data: Subscription data
    """
    user_id = data.get('user_id')
    if user_id:
        room = f'notifications_{user_id}'
        socketio.join_room(room)
        socketio.emit('notification_subscribed', {'user_id': user_id})

def handle_unsubscribe_notifications(data: Dict[str, Any]) -> None:
    """Handle notification unsubscription.
    
    Args:
        data: Unsubscription data
    """
    user_id = data.get('user_id')
    if user_id:
        room = f'notifications_{user_id}'
        socketio.leave_room(room)
        socketio.emit('notification_unsubscribed', {'user_id': user_id})

def send_notification(user_id: str, notification: Dict[str, Any]) -> None:
    """Send notification to user.
    
    Args:
        user_id: User ID
        notification: Notification data
    """
    room = f'notifications_{user_id}'
    socketio.emit('notification', notification, room=room)

# Matchmaking event handlers
def handle_match_found(data: Dict[str, Any]) -> None:
    """Handle match found event."""
    event = MatchFoundEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))

def handle_match_accepted(data: Dict[str, Any]) -> None:
    """Handle match accepted event."""
    event = MatchAcceptedEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))

def handle_match_declined(data: Dict[str, Any]) -> None:
    """Handle match declined event."""
    event = MatchDeclinedEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))

def handle_match_cancelled(data: Dict[str, Any]) -> None:
    """Handle match cancelled event."""
    event = MatchCancelledEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))

def handle_match_started(data: Dict[str, Any]) -> None:
    """Handle match started event."""
    event = MatchStartedEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))

def handle_match_completed(data: Dict[str, Any]) -> None:
    """Handle match completed event."""
    event = MatchCompletedEvent(**data)
    notify_match_event(event, set(data.get('user_ids', [])))