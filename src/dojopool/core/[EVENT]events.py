"""Events module.

This module provides real-time event functionality using Server-Sent Events (SSE).
"""

import json
import queue
import threading
from datetime import datetime

from flask import Response, current_app

# Update or remove: from dojopool.extensions import redis_client


class EventManager:
    """Event manager for real-time events."""

    def __init__(self):
        """Initialize event manager."""
        self.clients = {}  # user_id -> set of client queues
        self._lock = threading.Lock()

    def register_client(self, user_id):
        """Register a new client.

        Args:
            user_id: User ID

        Returns:
            queue.Queue: Client event queue
        """
        client_queue = queue.Queue()
        with self._lock:
            if user_id not in self.clients:
                self.clients[user_id] = set()
            self.clients[user_id].add(client_queue)
        return client_queue

    def unregister_client(self, user_id, client_queue):
        """Unregister a client.

        Args:
            user_id: User ID
            client_queue: Client queue to unregister
        """
        with self._lock:
            if user_id in self.clients:
                self.clients[user_id].discard(client_queue)
                if not self.clients[user_id]:
                    del self.clients[user_id]

    def emit(self, event_type, data, user_ids=None):
        """Emit an event to clients.

        Args:
            event_type: Type of event
            data: Event data
            user_ids: Optional list of user IDs to send to
        """
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        }

        # Store event in Redis for recovery
        event_key = f"event:{event_type}:{datetime.utcnow().timestamp()}"
        redis_client.setex(
            event_key,
            current_app.config.get("EVENT_RETENTION_SECONDS", 86400),  # 24 hours
            json.dumps(event),
        )

        # Send to specific users or broadcast
        with self._lock:
            if user_ids:
                for user_id in user_ids:
                    if user_id in self.clients:
                        for client_queue in self.clients[user_id]:
                            client_queue.put(event)
            else:
                for client_queues in self.clients.values():
                    for client_queue in client_queues:
                        client_queue.put(event)


def event_stream(user_id):
    """Generate SSE stream for a user.

    Args:
        user_id: User ID

    Yields:
        str: SSE formatted event data
    """
    # Get event manager instance
    event_manager = current_app.event_manager

    # Register client
    client_queue = event_manager.register_client(user_id)

    try:
        while True:
            # Get event from queue
            try:
                event = client_queue.get(timeout=30)  # 30 second timeout
                yield f"data: {json.dumps(event)}\n\n"
            except queue.Empty:
                # Send keepalive
                yield ": keepalive\n\n"
    finally:
        # Unregister client when connection closes
        event_manager.unregister_client(user_id, client_queue)


def emit_event(event_type, data, user_ids=None):
    """Emit an event.

    Args:
        event_type: Type of event
        data: Event data
        user_ids: Optional list of user IDs to send to
    """
    if hasattr(current_app, "event_manager"):
        current_app.event_manager.emit(event_type, data, user_ids)


def init_events(app):
    """Initialize event system.

    Args:
        app: Flask application instance
    """
    app.event_manager = EventManager()

    @app.route("/events")
    def events():
        """SSE endpoint."""
        user_id = getattr(app.request, "user", {}).get("id")
        if not user_id:
            return "Unauthorized", 401

        return {'data': event_stream(user_id)}, 200
