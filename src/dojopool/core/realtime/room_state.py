"""WebSocket room state management module.

This module provides functionality for managing room states and transitions.
"""

import asyncio
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from .constants import ErrorCodes
from .log_config import logger
from .room_persistence import room_persistence
from .utils import format_error_response


class RoomState(str, Enum):
    """Room state enum."""

    INITIALIZING = "initializing"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSING = "closing"
    CLOSED = "closed"
    ERROR = "error"


class RoomStateManager:
    """Room state manager class."""

    def __init__(self):
        """Initialize RoomStateManager."""
        self._room_states: Dict[str, RoomState] = {}
        self._state_data: Dict[str, Dict[str, Any]] = {}
        self._state_locks: Dict[str, asyncio.Lock] = {}
        self._state_listeners: Dict[str, Set[asyncio.Queue]] = {}

    def _get_lock(self, room_id: str) -> asyncio.Lock:
        """Get lock for room.

        Args:
            room_id: Room ID

        Returns:
            asyncio.Lock: Room lock
        """
        if room_id not in self._state_locks:
            self._state_locks[room_id] = asyncio.Lock()
        return self._state_locks[room_id]

    async def initialize_room(
        self, room_id: str, room_type: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Initialize room state.

        Args:
            room_id: Room ID
            room_type: Room type
            metadata: Optional room metadata

        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            async with self._get_lock(room_id):
                if room_id in self._room_states:
                    return format_error_response(
                        ErrorCodes.ROOM_EXISTS, "Room already exists", {"room_id": room_id}
                    )

                # Set initial state
                self._room_states[room_id] = RoomState.INITIALIZING
                self._state_data[room_id] = {
                    "room_type": room_type,
                    "metadata": metadata or {},
                    "created_at": datetime.utcnow().isoformat(),
                    "state_history": [
                        {
                            "state": RoomState.INITIALIZING,
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    ],
                }

                # Persist initial state
                await room_persistence.save_room_data(room_id, self._state_data[room_id])

                # Notify listeners
                await self._notify_state_change(room_id, RoomState.INITIALIZING)

                return None

        except Exception as e:
            logger.error(
                "Error initializing room state",
                exc_info=True,
                extra={"room_id": room_id, "room_type": room_type, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error initializing room state",
                {"error": str(e)},
            )

    async def transition_state(
        self, room_id: str, new_state: RoomState, metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Transition room state.

        Args:
            room_id: Room ID
            new_state: New room state
            metadata: Optional state metadata

        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            async with self._get_lock(room_id):
                if room_id not in self._room_states:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
                    )

                current_state = self._room_states[room_id]

                # Validate state transition
                error = self._validate_transition(current_state, new_state)
                if error:
                    return error

                # Update state
                self._room_states[room_id] = new_state
                self._state_data[room_id]["state_history"].append(
                    {
                        "state": new_state,
                        "timestamp": datetime.utcnow().isoformat(),
                        "metadata": metadata,
                    }
                )

                # Persist updated state
                await room_persistence.save_room_data(room_id, self._state_data[room_id])

                # Notify listeners
                await self._notify_state_change(room_id, new_state, metadata)

                return None

        except Exception as e:
            logger.error(
                "Error transitioning room state",
                exc_info=True,
                extra={"room_id": room_id, "new_state": new_state, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error transitioning room state",
                {"error": str(e)},
            )

    def _validate_transition(
        self, current_state: RoomState, new_state: RoomState
    ) -> Optional[Dict[str, Any]]:
        """Validate state transition.

        Args:
            current_state: Current room state
            new_state: New room state

        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        # Define valid transitions
        valid_transitions = {
            RoomState.INITIALIZING: {RoomState.ACTIVE, RoomState.ERROR},
            RoomState.ACTIVE: {RoomState.PAUSED, RoomState.CLOSING, RoomState.ERROR},
            RoomState.PAUSED: {RoomState.ACTIVE, RoomState.CLOSING, RoomState.ERROR},
            RoomState.CLOSING: {RoomState.CLOSED, RoomState.ERROR},
            RoomState.CLOSED: {RoomState.ERROR},
            RoomState.ERROR: set(),
        }

        if new_state not in valid_transitions[current_state]:
            return format_error_response(
                ErrorCodes.INVALID_STATE_TRANSITION,
                "Invalid state transition",
                {
                    "current_state": current_state,
                    "new_state": new_state,
                    "valid_states": list(valid_transitions[current_state]),
                },
            )

        return None

    async def _notify_state_change(
        self, room_id: str, new_state: RoomState, metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Notify state change listeners.

        Args:
            room_id: Room ID
            new_state: New room state
            metadata: Optional state metadata
        """
        if room_id not in self._state_listeners:
            return

        # Prepare notification data
        notification = {
            "room_id": room_id,
            "state": new_state,
            "timestamp": datetime.utcnow().isoformat(),
        }
        if metadata:
            notification["metadata"] = metadata

        # Notify all listeners
        dead_listeners = set()
        for queue in self._state_listeners[room_id]:
            try:
                await queue.put(notification)
            except Exception:
                dead_listeners.add(queue)

        # Clean up dead listeners
        self._state_listeners[room_id] -= dead_listeners

    async def subscribe_to_state(self, room_id: str) -> Optional[asyncio.Queue]:
        """Subscribe to room state changes.

        Args:
            room_id: Room ID

        Returns:
            Optional[asyncio.Queue]: State change queue if room exists
        """
        if room_id not in self._room_states:
            return None

        # Create queue for subscriber
        queue = asyncio.Queue()

        # Add to listeners
        if room_id not in self._state_listeners:
            self._state_listeners[room_id] = set()
        self._state_listeners[room_id].add(queue)

        return queue

    def unsubscribe_from_state(self, room_id: str, queue: asyncio.Queue) -> None:
        """Unsubscribe from room state changes.

        Args:
            room_id: Room ID
            queue: State change queue
        """
        if room_id in self._state_listeners:
            self._state_listeners[room_id].discard(queue)
            if not self._state_listeners[room_id]:
                del self._state_listeners[room_id]

    def get_room_state(self, room_id: str) -> Optional[Dict[str, Any]]:
        """Get current room state.

        Args:
            room_id: Room ID

        Returns:
            Optional[Dict[str, Any]]: Room state if found
        """
        if room_id not in self._room_states:
            return None

        return {
            "room_id": room_id,
            "current_state": self._room_states[room_id],
            "state_history": self._state_data[room_id]["state_history"],
            "room_type": self._state_data[room_id]["room_type"],
            "metadata": self._state_data[room_id]["metadata"],
            "created_at": self._state_data[room_id]["created_at"],
        }

    def get_rooms_in_state(self, state: RoomState) -> List[str]:
        """Get rooms in specific state.

        Args:
            state: Room state

        Returns:
            List[str]: List of room IDs
        """
        return [room_id for room_id, room_state in self._room_states.items() if room_state == state]

    async def load_persisted_states(self) -> None:
        """Load persisted room states."""
        try:
            # Get all persisted rooms
            room_ids = await room_persistence.list_rooms()

            for room_id in room_ids:
                try:
                    # Load room data
                    room_data = await room_persistence.load_room_data(room_id)
                    if not room_data:
                        continue

                    # Get last state from history
                    state_history = room_data.get("state_history", [])
                    if not state_history:
                        continue

                    last_state = state_history[-1]["state"]

                    # Restore room state
                    self._room_states[room_id] = RoomState(last_state)
                    self._state_data[room_id] = room_data

                except Exception as e:
                    logger.error(
                        "Error loading persisted room state",
                        exc_info=True,
                        extra={"room_id": room_id, "error": str(e)},
                    )

        except Exception as e:
            logger.error("Error loading persisted states", exc_info=True, extra={"error": str(e)})


# Global room state manager instance
room_state_manager = RoomStateManager()


async def load_room_states() -> None:
    """Load persisted room states."""
    await room_state_manager.load_persisted_states()
