"""Real-time notification system."""

from datetime import datetime
from functools import wraps

from flask_login import current_user
from flask_socketio import emit, join_room, leave_room

from src.extensions import socketio  # Import from main extensions


def init_notifications(app):
    """Initialize notification system."""

    @socketio.on("connect")
    def handle_connect():
        """Handle client connection."""
        if current_user.is_authenticated:
            join_room(f"user_{current_user.id}")
            emit("connection_status", {"status": "connected"})

    @socketio.on("disconnect")
    def handle_disconnect():
        """Handle client disconnection."""
        if current_user.is_authenticated:
            leave_room(f"user_{current_user.id}")

    @socketio.on_error()
    def error_handler(e):
        """Handle WebSocket errors."""
        app.logger.error(f"WebSocket error: {str(e)}")


def send_notification(user_id, notification_type, data):
    """Send notification to specific user.

    Args:
        user_id: ID of the user to notify
        notification_type: Type of notification (e.g., 'game_invite', 'match_update')
        data: Dictionary containing notification data
    """
    notification = {
        "type": notification_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
    }
    socketio.emit("notification", notification, room=f"user_{user_id}")


def broadcast_game_update(game_id, update_type, data):
    """Broadcast game update to all participants.

    Args:
        game_id: ID of the game
        update_type: Type of update (e.g., 'score_update', 'game_complete')
        data: Dictionary containing update data
    """
    notification = {
        "type": "game_update",
        "game_id": game_id,
        "update_type": update_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
    }
    socketio.emit("game_update", notification, room=f"game_{game_id}")


def notify_tournament_update(tournament_id, update_type, data):
    """Notify all tournament participants of updates.

    Args:
        tournament_id: ID of the tournament
        update_type: Type of update (e.g., 'new_match', 'results')
        data: Dictionary containing update data
    """
    notification = {
        "type": "tournament_update",
        "tournament_id": tournament_id,
        "update_type": update_type,
        "timestamp": datetime.utcnow().isoformat(),
        "data": data,
    }
    socketio.emit("tournament_update", notification, room=f"tournament_{tournament_id}")


# Decorator for requiring WebSocket authentication
def ws_login_required(f):
    """Ensure WebSocket connection is authenticated."""

    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            return False
        return f(*args, **kwargs)

    return decorated


# Event handlers for specific notifications
@socketio.on("join_game")
@ws_login_required
def on_join_game(data):
    """Join a game's notification room."""
    game_id = data.get("game_id")
    if game_id:
        join_room(f"game_{game_id}")
        emit("room_join", {"status": "joined", "room": f"game_{game_id}"})


@socketio.on("leave_game")
@ws_login_required
def on_leave_game(data):
    """Leave a game's notification room."""
    game_id = data.get("game_id")
    if game_id:
        leave_room(f"game_{game_id}")
        emit("room_leave", {"status": "left", "room": f"game_{game_id}"})


@socketio.on("join_tournament")
@ws_login_required
def on_join_tournament(data):
    """Join a tournament's notification room."""
    tournament_id = data.get("tournament_id")
    if tournament_id:
        join_room(f"tournament_{tournament_id}")
        emit("room_join", {"status": "joined", "room": f"tournament_{tournament_id}"})


# Utility functions for notification management
def get_user_notifications(user_id, limit=10):
    """Get recent notifications for a user."""
    # This would typically query a database
    # For now, returning a placeholder
    return []


def mark_notification_read(notification_id):
    """Mark a notification as read."""
    # This would typically update a database
    pass


def clear_user_notifications(user_id):
    """Clear all notifications for a user."""
    # This would typically update a database
    pass
