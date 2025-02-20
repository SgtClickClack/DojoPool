import gc
import gc
"""WebSocket module."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from flask_socketio import SocketIO, emit, join_room, leave_room

from dojopool.core.exceptions import WebSocketError
from dojopool.models import User

socketio = SocketIO()


class WebSocketService:
    """WebSocket service."""

    def __init__(self):
        """Initialize WebSocket service."""
        self.connected_users: Dict[int, Set[str]] = {}  # user_id -> set of session_ids
        self.user_rooms: Dict[int, Set[str]] = {}  # user_id -> set of room_ids
        self.room_users: Dict[str, Set[int]] = {}  # room_id -> set of user_ids

    def connect_user(self, user_id: int, session_id: str) -> None:
        """Connect user to WebSocket.

        Args:
            user_id: User ID
            session_id: Session ID
        """
        if user_id not in self.connected_users:
            self.connected_users[user_id] = set()
        self.connected_users[user_id].add(session_id)

    def disconnect_user(self, user_id: int, session_id: str):
        """Disconnect user from WebSocket.

        Args:
            user_id: User ID
            session_id: Session ID
        """
        if user_id in self.connected_users:
            self.connected_users[user_id].discard(session_id)
            if not self.connected_users[user_id]:
                del self.connected_users[user_id]

    def join_room(self, user_id: int, room_id: str):
        """Join room.

        Args:
            user_id: User ID
            room_id: Room ID
        """
        # Add user to room tracking
        if user_id not in self.user_rooms:
            self.user_rooms[user_id] = set()
        self.user_rooms[user_id].add(room_id)

        if room_id not in self.room_users:
            self.room_users[room_id] = set()
        self.room_users[room_id].add(user_id)

        # Join room in all user's sessions
        if user_id in self.connected_users:
            for session_id in self.connected_users[user_id]:
                join_room(room_id, sid=session_id)

    def leave_room(self, user_id: int, room_id: str):
        """Leave room.

        Args:
            user_id: User ID
            room_id: Room ID
        """
        # Remove user from room tracking
        if user_id in self.user_rooms:
            self.user_rooms[user_id].discard(room_id)
            if not self.user_rooms[user_id]:
                del self.user_rooms[user_id]

        if room_id in self.room_users:
            self.room_users[room_id].discard(user_id)
            if not self.room_users[room_id]:
                del self.room_users[room_id]

        # Leave room in all user's sessions
        if user_id in self.connected_users:
            for session_id in self.connected_users[user_id]:
                leave_room(room_id, sid=session_id)

    def emit_to_user(self, user_id: int, event: str, data: Dict[str, Any]) -> None:
        """Emit event to user.

        Args:
            user_id: User ID
            event: Event name
            data: Event data
        """
        if user_id in self.connected_users:
            for session_id in self.connected_users[user_id]:
                emit(event, data, room=session_id)

    def emit_to_room(self, room_id: str, event: str, data: Dict[str, Any]):
        """Emit event to room.

        Args:
            room_id: Room ID
            event: Event name
            data: Event data
        """
        emit(event, data, room=room_id)

    def broadcast(self, event: str, data: Dict[str, Any]):
        """Broadcast event to all connected users.

        Args:
            event: Event name
            data: Event data
        """
        emit(event, data, broadcast=True)

    def get_user_rooms(self, user_id: int):
        """Get rooms user is in.

        Args:
            user_id: User ID

        Returns:
            Set of room IDs
        """
        return self.user_rooms.get(user_id, set())

    def get_room_users(self, room_id: str) -> Set[int]:
        """Get users in room.

        Args:
            room_id: Room ID

        Returns:
            Set of user IDs
        """
        return self.room_users.get(room_id, set())

    def is_user_connected(self, user_id: int):
        """Check if user is connected.

        Args:
            user_id: User ID

        Returns:
            True if user is connected
        """
        return user_id in self.connected_users

    def is_user_in_room(self, user_id: int, room_id: str):
        """Check if user is in room.

        Args:
            user_id: User ID
            room_id: Room ID

        Returns:
            True if user is in room
        """
        return user_id in self.user_rooms and room_id in self.user_rooms[user_id]


websocket_service = WebSocketService()

__all__ = ["socketio", "websocket_service", "WebSocketService"]
