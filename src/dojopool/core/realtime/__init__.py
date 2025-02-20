import gc
import gc
"""WebSocket initialization module.

This module initializes the WebSocket server and registers event handlers.
"""

from typing import Any, Dict, Set

from flask import Flask, current_app
from flask_socketio import SocketIO
from werkzeug.wrappers import Response

from ..extensions import socketio
from ..matchmaking.events import (
    MatchAcceptedEvent,
    MatchCancelledEvent,
    MatchCompletedEvent,
    MatchDeclinedEvent,
    MatchEvent,
    MatchFoundEvent,
    MatchStartedEvent,
)
from .events import (
    handle_chat_message,
    handle_connect,
    handle_disconnect,
    handle_end_game,
    handle_join_game,
    handle_join_tournament,
    handle_leave_game,
    handle_leave_tournament,
    handle_update_score,
)
from .metrics import track_error


def init_websockets(app: Flask) -> None:
    """Initialize WebSocket event handlers."""
    # Register connection handlers
    socketio.on_event("connect", handle_connect)
    socketio.on_event("disconnect", handle_disconnect)

    # Register game event handlers
    socketio.on_event("join_game", handle_join_game)
    socketio.on_event("leave_game", handle_leave_game)
    socketio.on_event("update_score", handle_update_score)
    socketio.on_event("end_game", handle_end_game)

    # Register tournament event handlers
    socketio.on_event("join_tournament", handle_join_tournament)
    socketio.on_event("leave_tournament", handle_leave_tournament)

    # Register chat event handlers
    socketio.on_event("chat_message", handle_chat_message)

    # Register matchmaking event handlers
    socketio.on_event("match_found", handle_match_found)
    socketio.on_event("match_accepted", handle_match_accepted)
    socketio.on_event("match_declined", handle_match_declined)
    socketio.on_event("match_cancelled", handle_match_cancelled)
    socketio.on_event("match_started", handle_match_started)
    socketio.on_event("match_completed", handle_match_completed)

    # Register notification event handlers
    socketio.on_event("subscribe_notifications", handle_subscribe_notifications)
    socketio.on_event("unsubscribe_notifications", handle_unsubscribe_notifications)

    # Register error handler
    @socketio.on_error()
    def error_handler(e: Exception):
        """Handle WebSocket errors."""
        current_app.logger.error(f"WebSocket error: {str(e)}")
        track_error(e)


def emit_to_user(user_id: str, event: str, data: Dict[str, Any]):
    """
    Emit event to a specific user.

    Args:
        user_id: Target user ID
        event: Event name
        data: Event data
    """
    socketio.emit(event, data, room=f"user_{user_id}")


def emit_to_game(game_id: str, event: str, data: Dict[str, Any]):
    """
    Emit event to all users in a game.

    Args:
        game_id: Target game ID
        event: Event name
        data: Event data
    """
    socketio.emit(event, data, room=f"game_{game_id}")


def emit_to_tournament(tournament_id: str, event: str, data: Dict[str, Any]) -> None:
    """
    Emit event to all users in a tournament.

    Args:
        tournament_id: Target tournament ID
        event: Event name
        data: Event data
    """
    socketio.emit(event, data, room=f"tournament_{tournament_id}")


def broadcast_system_message(message: str):
    """
    Broadcast a system message to all connected users.

    Args:
        message: Message to broadcast
    """
    socketio.emit("system_message", {"message": message}, broadcast=True)


def notify_match_event(event: MatchEvent, user_ids: Set[int]):
    """
    Notify users about a match event.

    Args:
        event: Match event
        user_ids: Set of user IDs to notify
    """
    event_type = type(event).__name__
    event_data = event.to_dict()

    for user_id in user_ids:
        emit_to_user(str(user_id), event_type.lower(), event_data)


def handle_subscribe_notifications(data: Dict[str, Any]):
    """
    Handle notification subscription request.

    Args:
        data: Subscription data
    """
    user_id = data.get("user_id")
    if user_id:
        socketio.join_room(f"user_{user_id}")


def handle_unsubscribe_notifications(data: Dict[str, Any]) -> None:
    """
    Handle notification unsubscription request.

    Args:
        data: Unsubscription data
    """
    user_id = data.get("user_id")
    if user_id:
        socketio.leave_room(f"user_{user_id}")


def send_notification(user_id: str, notification: Dict[str, Any]):
    """
    Send a notification to a user.

    Args:
        user_id: Target user ID
        notification: Notification data
    """
    emit_to_user(user_id, "notification", notification)


# Matchmaking event handlers
def handle_match_found(data: Dict[str, Any]):
    """Handle match found event."""
    event = MatchFoundEvent.from_dict(data)
    notify_match_event(event, {event.player1_id, event.player2_id})


def handle_match_accepted(data: Dict[str, Any]):
    """Handle match accepted event."""
    event = MatchAcceptedEvent.from_dict(data)
    notify_match_event(event, {event.player1_id, event.player2_id})


def handle_match_declined(data: Dict[str, Any]) -> None:
    """Handle match declined event."""
    event = MatchDeclinedEvent.from_dict(data)
    notify_match_event(event, {event.player1_id, event.player2_id})


def handle_match_cancelled(data: Dict[str, Any]):
    """Handle match cancelled event."""
    event = MatchCancelledEvent.from_dict(data)
    notify_match_event(event, set(data.get("user_ids", [])))


def handle_match_started(data: Dict[str, Any]):
    """Handle match started event."""
    event = MatchStartedEvent.from_dict(data)
    notify_match_event(event, set(data.get("user_ids", [])))


def handle_match_completed(data: Dict[str, Any]):
    """Handle match completed event."""
    event = MatchCompletedEvent.from_dict(data)
    notify_match_event(event, set(data.get("user_ids", [])))
