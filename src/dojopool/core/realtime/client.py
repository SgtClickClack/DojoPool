"""WebSocket client module.

This module provides a client-side interface for WebSocket connections.
"""

from typing import Any, Callable, Dict, List, Optional

from src.extensions import socketio

from .errors import WebSocketError


class WebSocketClient:
    """Client for WebSocket connections."""

    def __init__(self, url: str, auth_token: Optional[str] = None):
        """Initialize WebSocket client.

        Args:
            url: WebSocket server URL.
            auth_token: Optional authentication token.
        """
        self.url = url
        self.auth_token = auth_token
        self.connected = False
        self.handlers: Dict[str, List[Callable]] = {}

    def connect(self):
        """Connect to the WebSocket server."""
        try:
            self.connected = True
        except Exception as e:
            raise WebSocketError(f"Failed to connect: {str(e)}")

    def disconnect(self):
        """Disconnect from the WebSocket server."""
        if self.connected:
            self.connected = False

    def on(self, event: str, handler: Callable):
        """Register an event handler.

        Args:
            event: Event name.
            handler: Event handler function.
        """
        if event not in self.handlers:
            self.handlers[event] = []
        self.handlers[event].append(handler)
        socketio.on(event)(handler)

    def emit(self, event: str, data: Dict[str, Any]):
        """Emit an event to the server.

        Args:
            event: Event name.
            data: Event data.
        """
        if not self.connected:
            raise WebSocketError("Not connected")

        try:
            socketio.emit(event, data)
        except Exception as e:
            raise WebSocketError(f"Failed to emit event: {str(e)}")
