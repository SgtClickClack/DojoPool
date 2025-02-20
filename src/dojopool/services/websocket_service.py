import gc
import gc
"""WebSocket service module."""

from typing import Any, Dict, List, NoReturn, Optional, Tuple, Union

from flask import Flask, Request, Response, current_app, request
from flask.typing import ResponseReturnValue
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.wrappers import Response as WerkzeugResponse


class WebSocketService:
    """WebSocket service for real-time communication."""

    def __init__(self):
        """Initialize WebSocket service."""
        self.socketio: Optional[SocketIO] = None
        self.app: Optional[Flask] = None
        self.connected_clients: Dict[str, Any] = {}

    def init_app(self, app: Flask, socketio: SocketIO) -> None:
        """Initialize the WebSocket service with Flask app and SocketIO.

        Args:
            app: Flask application instance
            socketio: SocketIO instance
        """
        self.app = app
        self.socketio = socketio

        # Register event handlers
        self.register_handlers()

    def register_handlers(self):
        """Register WebSocket event handlers."""
        if not self.socketio:
            raise RuntimeError("SocketIO not initialized. Call init_app first.")

        @self.socketio.on("connect")
        def handle_connect():
            """Handle client connection."""
            client_id: Any = request.sid
            self.connected_clients[client_id] = {"user_id": None, "rooms": set()}
            emit("connection_established", {"client_id": client_id})

        @self.socketio.on("disconnect")
        def handle_disconnect():
            """Handle client disconnection."""
            client_id: Any = request.sid
            if client_id in self.connected_clients:
                del self.connected_clients[client_id]

        @self.socketio.on("join")
        def handle_join(data):
            """Handle room join request."""
            room: Any = data.get("room")
            if room:
                join_room(room)
                client_id: Any = request.sid
                if client_id in self.connected_clients:
                    self.connected_clients[client_id]["rooms"].add(room)
                emit("room_joined", {"room": room}, room=room)

        @self.socketio.on("leave")
        def handle_leave(data):
            """Handle room leave request."""
            room: Any = data.get("room")
            if room:
                leave_room(room)
                client_id: Any = request.sid
                if client_id in self.connected_clients:
                    self.connected_clients[client_id]["rooms"].discard(room)
                emit("room_left", {"room": room}, room=room)

    def emit_to_room(self, room: str, event: str, data: Dict[str, Any]):
        """Emit event to a specific room.

        Args:
            room: Room identifier
            event: Event name
            data: Event data
        """
        if not self.socketio:
            raise RuntimeError("SocketIO not initialized. Call init_app first.")
        self.socketio.emit(event, data, room=room)

    def emit_to_all(self, event: str, data: Dict[str, Any]):
        """Emit event to all connected clients.

        Args:
            event: Event name
            data: Event data
        """
        if not self.socketio:
            raise RuntimeError("SocketIO not initialized. Call init_app first.")
        self.socketio.emit(event, data)

    def get_connected_clients(self) -> Dict[str, Any]:
        """Get information about connected clients.

        Returns:
            Dictionary of connected clients and their information
        """
        return self.connected_clients


# Create singleton instance
websocket_service: WebSocketService = WebSocketService()
