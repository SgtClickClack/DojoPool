"""WebSocket events package."""

from flask_login import current_user
from flask_socketio import emit, join_room, leave_room
from src.extensions import socketio
from src.models import Notification, NotificationType


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


@socketio.on("read_notification")
def handle_read_notification(data):
    """Handle notification read event."""
    if current_user.is_authenticated:
        notification_id = data.get("notification_id")
        notification = Notification.query.get(notification_id)
        if notification and notification.user_id == current_user.id:
            notification.mark_as_read()
            emit(
                "notification_updated",
                notification.to_dict(),
                room=f"user_{current_user.id}",
            )
