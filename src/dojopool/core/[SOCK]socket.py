"""Socket manager for server-side WebSocket handling.

This module provides a unified WebSocket manager for handling real-time game events,
frame processing, and client communication. It supports:

- Room-based message broadcasting
- Event subscription/unsubscription
- Automatic reconnection
- Error recovery
- Message queuing during disconnection
- Connection state management

Example usage:
    ```python
    # Initialize socket manager
    options = SocketManagerOptions(debug=True)
    socket_manager = SocketManager(options)

    # Subscribe to events
    async def on_shot(data):
        game_id = data['game_id']
        # Process shot data
        await socket_manager.emit(f"game_{game_id}", "game_state", new_state)

    socket_manager.subscribe("shot", on_shot)

    # Join a room
    await socket_manager.join_room(client_id, f"game_{game_id}")

    # Broadcast to room
    await socket_manager.emit(f"game_{game_id}", "game_event", {"message": "Game started"})
    ```

Message Format:
    All messages follow this format:
    {
        "type": str,      # Event type (e.g., "shot", "game_state", "error")
        "payload": dict,  # Event data
        "timestamp": str  # ISO format timestamp
    }

Event Types:
    - ready: Client is ready to receive messages
    - shot: Player took a shot
    - game_state: Game state update
    - error: Error occurred
    - monitoring_status: Frame processing status
    - frame_result: Frame processing result
"""

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, Optional, Set

import socketio
from aiohttp import web

# Set up logging
logger = logging.getLogger(__name__)


class ConnectionState(Enum):
    """Connection states for the socket manager."""

    INITIALIZING = "initializing"  # Initial setup
    CONNECTED = "connected"  # Successfully connected
    DISCONNECTED = "disconnected"  # Connection lost
    ERROR = "error"  # Error occurred


@dataclass
class SocketManagerOptions:
    """Configuration options for the socket manager.

    Args:
        url: WebSocket server URL
        reconnect_attempts: Number of reconnection attempts (default: 15)
        reconnect_delay: Delay between reconnection attempts in ms (default: 1000)
        debug: Enable debug logging (default: False)
        timeout: Connection timeout in ms (default: 60000)
    """

    url: str = ""
    reconnect_attempts: int = 15
    reconnect_delay: int = 1000
    debug: bool = False
    timeout: int = 60000


class SocketManager:
    """Server-side WebSocket manager.

    This class handles all WebSocket communication, including:
    - Connection management
    - Room-based message broadcasting
    - Event subscription
    - Error handling
    - Reconnection logic

    The manager is implemented as a singleton to ensure consistent state
    across the application.
    """

    _instance = None

    def __new__(cls, options: Optional[SocketManagerOptions] = None):
        """Create or return the singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, options: Optional[SocketManagerOptions] = None):
        """Initialize the socket manager.

        Args:
            options: Configuration options
        """
        if self._initialized:
            return

        self.options = options or SocketManagerOptions()
        self.sio = socketio.AsyncServer(
            async_mode="aiohttp",
            cors_allowed_origins="*",
            ping_timeout=self.options.timeout,
            ping_interval=self.options.timeout // 3,
        )
        self.app = web.Application()
        self.sio.attach(self.app)

        self.connections: Dict[str, Set[str]] = {}  # room_id -> set of sid
        self.user_rooms: Dict[str, Set[str]] = {}  # user_id -> set of room_id
        self.subscriptions: Dict[str, Set[Callable]] = {}
        self.state = ConnectionState.INITIALIZING
        self.last_error: Optional[str] = None
        self.last_event_time = datetime.now()

        self.setup_event_handlers()
        self._initialized = True
        logger.info("Socket manager initialized")

    def setup_event_handlers(self):
        """Set up WebSocket event handlers."""

        @self.sio.event
        async def connect(sid, environ):
            """Handle client connection.

            Args:
                sid: Session ID
                environ: WSGI environment
            """
            self.state = ConnectionState.CONNECTED
            self.last_event_time = datetime.now()
            logger.info(f"Client connected: {sid}")
            if self.options.debug:
                logger.debug(f"Connection environ: {environ}")

        @self.sio.event
        async def disconnect(sid):
            """Handle client disconnection.

            Args:
                sid: Session ID
            """
            self.state = ConnectionState.DISCONNECTED
            self.last_event_time = datetime.now()
            # Remove from all rooms
            for room_id in list(self.connections.keys()):
                if sid in self.connections[room_id]:
                    self.connections[room_id].remove(sid)
                    if not self.connections[room_id]:
                        del self.connections[room_id]
            logger.info(f"Client disconnected: {sid}")

        @self.sio.event
        async def error(sid, error_data):
            """Handle connection errors.

            Args:
                sid: Session ID
                error_data: Error information
            """
            self.state = ConnectionState.ERROR
            self.last_error = str(error_data)
            self.last_event_time = datetime.now()
            logger.error(f"Error for client {sid}: {error_data}")

        @self.sio.event
        async def message(sid, data):
            """Handle incoming messages.

            Args:
                sid: Session ID
                data: Message data
            """
            try:
                if isinstance(data, str):
                    data = json.loads(data)
                message_type = data.get("type")
                if message_type and message_type in self.subscriptions:
                    for callback in self.subscriptions[message_type]:
                        try:
                            await callback(data.get("payload", {}))
                        except Exception as e:
                            logger.error(f"Error in message handler: {e}")
                            if self.options.debug:
                                logger.exception("Message handler error details:")
            except Exception as e:
                logger.error(f"Error parsing message: {e}")
                if self.options.debug:
                    logger.exception("Message parsing error details:")

    async def emit(self, room: str, event_type: str, data: Any):
        """Emit an event to a room.

        Args:
            room: Room ID to send to
            event_type: Type of event
            data: Event data
        """
        if room in self.connections:
            message = {"type": event_type, "payload": data, "timestamp": datetime.now().isoformat()}
            await self.sio.emit("message", message, room=room)
            logger.debug(f"Emitted {event_type} to room {room}")

    def subscribe(self, event_type: str, callback: Callable):
        """Subscribe to an event type.

        Args:
            event_type: Type of event to subscribe to
            callback: Async function to call when event occurs
        """
        if event_type not in self.subscriptions:
            self.subscriptions[event_type] = set()
        self.subscriptions[event_type].add(callback)
        logger.debug(f"Subscribed to {event_type}")

    def unsubscribe(self, event_type: str, callback: Callable):
        """Unsubscribe from an event type.

        Args:
            event_type: Type of event to unsubscribe from
            callback: Callback function to remove
        """
        if event_type in self.subscriptions:
            self.subscriptions[event_type].discard(callback)
            if not self.subscriptions[event_type]:
                del self.subscriptions[event_type]
            logger.debug(f"Unsubscribed from {event_type}")

    async def join_room(self, sid: str, room: str):
        """Add a client to a room.

        Args:
            sid: Session ID
            room: Room ID to join
        """
        await self.sio.enter_room(sid, room)
        if room not in self.connections:
            self.connections[room] = set()
        self.connections[room].add(sid)
        logger.info(f"Client {sid} joined room {room}")

    async def leave_room(self, sid: str, room: str):
        """Remove a client from a room.

        Args:
            sid: Session ID
            room: Room ID to leave
        """
        await self.sio.leave_room(sid, room)
        if room in self.connections:
            self.connections[room].discard(sid)
            if not self.connections[room]:
                del self.connections[room]
            logger.info(f"Client {sid} left room {room}")

    def get_room_members(self, room: str) -> Set[str]:
        """Get all client IDs in a room.

        Args:
            room: Room ID

        Returns:
            Set of session IDs in the room
        """
        return self.connections.get(room, set())

    def get_connection_state(self) -> Dict[str, Any]:
        """Get current connection state.

        Returns:
            Dict containing:
            - state: Current connection state
            - last_error: Last error message (if any)
            - last_event_time: Timestamp of last event
            - connection_count: Total number of connections
        """
        return {
            "state": self.state.value,
            "last_error": self.last_error,
            "last_event_time": self.last_event_time.isoformat(),
            "connection_count": sum(len(room) for room in self.connections.values()),
        }


# Create singleton instance with debug enabled
socket_manager = SocketManager(SocketManagerOptions(debug=True))
