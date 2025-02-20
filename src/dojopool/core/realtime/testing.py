"""WebSocket testing module.

This module provides utilities for testing WebSocket functionality.
"""

from contextlib import contextmanager
from typing import Any, Callable, Dict, List, Optional
from unittest.mock import patch

from flask_socketio import SocketIO

from .errors import WebSocketError


class MockWebSocketClient:
    """Mock WebSocket client for testing."""

    def __init__(self, socket: SocketIO):
        self.socket = socket
        self.received_events: List[Dict[str, Any]] = []
        self.connected = False
        self.rooms: List[str] = []
        self.user_id: Optional[str] = None
        self.handlers: Dict[str, List[Callable]] = {}

    def connect(self, user_id: Optional[str] = None) -> None:
        """Connect mock client.

        Args:
            user_id: Optional user ID to connect with.
        """
        self.connected = True
        self.user_id = user_id

    def disconnect(self):
        """Disconnect mock client."""
        self.connected = False
        self.rooms = []
        self.user_id = None

    def emit(self, event: str, data: Optional[Dict[str, Any]] = None):
        """Emit event to server.

        Args:
            event: Event name.
            data: Event data.
        """
        if not self.connected:
            raise WebSocketError("Client not connected")

        self.socket.emit(event, data or {})

    def on(self, event: str, handler: Callable):
        """Register event handler.

        Args:
            event: Event name.
            handler: Event handler function.
        """
        if event not in self.handlers:
            self.handlers[event] = []
        self.handlers[event].append(handler)

    def handle_event(self, event: str, data: Dict[str, Any]) -> None:
        """Handle received event.

        Args:
            event: Event name.
            data: Event data.
        """
        self.received_events.append({"event": event, "data": data})

        if event in self.handlers:
            for handler in self.handlers[event]:
                handler(data)

    def join_room(self, room: str):
        """Join room.

        Args:
            room: Room ID.
        """
        if not self.connected:
            raise WebSocketError("Client not connected")

        if room not in self.rooms:
            self.rooms.append(room)
            self.emit("join_room", {"room": room})

    def leave_room(self, room: str):
        """Leave room.

        Args:
            room: Room ID.
        """
        if not self.connected:
            raise WebSocketError("Client not connected")

        if room in self.rooms:
            self.rooms.remove(room)
            self.emit("leave_room", {"room": room})

    def get_received_events(self):
        """Get list of received events.

        Returns:
            List[Dict[str, Any]]: List of received events.
        """
        return self.received_events

    def clear_received_events(self) -> None:
        """Clear list of received events."""
        self.received_events = []


@contextmanager
def mock_socketio_emit():
    """Context manager for mocking SocketIO emit function."""
    with patch("flask_socketio.SocketIO.emit") as mock_emit:
        yield mock_emit


@contextmanager
def mock_websocket_client(socket: SocketIO, user_id: Optional[str] = None):
    """Context manager for creating mock WebSocket client.

    Args:
        socket: SocketIO instance.
        user_id: Optional user ID for client.

    Yields:
        MockWebSocketClient: Mock WebSocket client.
    """
    client = MockWebSocketClient(socket)
    try:
        client.connect(user_id)
        yield client
    finally:
        client.disconnect()


class GameTestClient(MockWebSocketClient):
    """Mock WebSocket client for testing game functionality."""

    def __init__(self, socket: SocketIO, game_id: str):
        super().__init__(socket)
        self.game_id = game_id

    def join_game(self):
        """Join game room."""
        self.join_room(f"game_{self.game_id}")
        self.emit("join_game", {"game_id": self.game_id})

    def leave_game(self):
        """Leave game room."""
        self.leave_room(f"game_{self.game_id}")
        self.emit("leave_game", {"game_id": self.game_id})

    def update_score(self, player1_score: int, player2_score: int):
        """Update game scores.

        Args:
            player1_score: Score for player 1.
            player2_score: Score for player 2.
        """
        self.emit(
            "update_score",
            {
                "game_id": self.game_id,
                "player1_score": player1_score,
                "player2_score": player2_score,
            },
        )

    def end_game(self) -> None:
        """End game."""
        self.emit("end_game", {"game_id": self.game_id})


class TournamentTestClient(MockWebSocketClient):
    """Mock WebSocket client for testing tournament functionality."""

    def __init__(self, socket: SocketIO, tournament_id: str):
        super().__init__(socket)
        self.tournament_id = tournament_id

    def join_tournament(self):
        """Join tournament room."""
        self.join_room(f"tournament_{self.tournament_id}")
        self.emit("join_tournament", {"tournament_id": self.tournament_id})

    def leave_tournament(self):
        """Leave tournament room."""
        self.leave_room(f"tournament_{self.tournament_id}")
        self.emit("leave_tournament", {"tournament_id": self.tournament_id})


@contextmanager
def mock_game_client(socket: SocketIO, game_id: str, user_id: Optional[str] = None):
    """Context manager for creating mock game client.

    Args:
        socket: SocketIO instance.
        game_id: Game ID.
        user_id: Optional user ID for client.

    Yields:
        GameTestClient: Mock game client.
    """
    client = GameTestClient(socket, game_id)
    try:
        client.connect(user_id)
        yield client
    finally:
        client.disconnect()


@contextmanager
def mock_tournament_client(
    socket: SocketIO, tournament_id: str, user_id: Optional[str] = None
):
    """Context manager for creating mock tournament client.

    Args:
        socket: SocketIO instance.
        tournament_id: Tournament ID.
        user_id: Optional user ID for client.

    Yields:
        TournamentTestClient: Mock tournament client.
    """
    client = TournamentTestClient(socket, tournament_id)
    try:
        client.connect(user_id)
        yield client
    finally:
        client.disconnect()
