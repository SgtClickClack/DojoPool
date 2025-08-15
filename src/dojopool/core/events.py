"""Events module for handling application events."""

from typing import Any, Dict, Optional

from flask import current_app
from flask_socketio import emit


def emit_event(event_type: str, data: Dict[str, Any], room: Optional[str] = None) -> None:
    """Emit an event to connected clients.

    Args:
        event_type: Type of event to emit
        data: Event data
        room: Optional room to emit to
    """
    try:
        if room:
            emit(event_type, data, room=room)
        else:
            emit(event_type, data, broadcast=True)
    except Exception as e:
        current_app.logger.error(f"Error emitting event {event_type}: {str(e)}")
