"""Event handling module.

This module provides event handling functionality for the application.
"""

from typing import Any, Dict, List, Optional, Union

from flask import current_app


def emit_event(
    event_type: str, data: Dict[str, Any], user_ids: Optional[List[int]] = None
) -> None:
    """Emit an event to connected clients.

    Args:
        event_type: Type of event to emit
        data: Event data
        user_ids: Optional list of user IDs to send to
    """
    if hasattr(current_app, "event_manager"):
        current_app.event_manager.emit(event_type, data, user_ids)
