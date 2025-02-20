"""WebSocket room events module.

This module provides event handlers for room operations.
"""

from datetime import datetime
from typing import Any, Callable, Dict, Optional

from .constants import ErrorCodes, EventTypes
from .log_config import logger
from .room_config import get_room_config
from .room_validation import (
    validate_room_access,
    validate_room_chat,
    validate_room_creation,
    validate_room_join,
)
from .rooms import room_manager
from .utils import format_error_response, format_success_response


class RoomEventHandler:
    """Room event handler class."""

    def __init__(self):
        """Initialize RoomEventHandler."""
        self._event_handlers: Dict[str, Callable] = {}
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Register event handlers."""
        self._event_handlers = {
            EventTypes.CREATE_ROOM: self.handle_create_room,
            EventTypes.JOIN_ROOM: self.handle_join_room,
            EventTypes.LEAVE_ROOM: self.handle_leave_room,
            EventTypes.SEND_CHAT: self.handle_send_chat,
            EventTypes.UPDATE_ROOM: self.handle_update_room,
            EventTypes.DELETE_ROOM: self.handle_delete_room,
        }

    async def handle_event(
        self, event_type: str, data: Dict[str, Any], user_id: Optional[str] = None
    ):
        """Handle room event.

        Args:
            event_type: Event type
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        handler = self._event_handlers.get(event_type)
        if not handler:
            return format_error_response(
                ErrorCodes.INVALID_EVENT,
                "Invalid event type",
                {"event_type": event_type},
            )

        try:
            return await handler(data, user_id)
        except Exception as e:
            logger.error(
                "Error handling room event",
                exc_info=True,
                extra={"event_type": event_type, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error handling room event",
                {"error": str(e)},
            )

    async def handle_create_room(self, data: Dict[str, Any], user_id: Optional[str]):
        """Handle room creation event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_type = data.get("room_type")
        metadata = data.get("metadata")

        # Validate room creation
        error = validate_room_creation(room_type, metadata, user_id)
        if error:
            return error

        try:
            # Create room
            room_config = get_room_config(room_type)
            room = await room_manager.create_room(
                room_type, room_config["max_members"], metadata
            )

            # Add creator to room
            if user_id:
                await room_manager.add_user_to_room(user_id, room.room_id)

            return format_success_response(
                "Room created successfully", {"room": room.to_dict()}
            )

        except Exception as e:
            logger.error(
                "Error creating room",
                exc_info=True,
                extra={"room_type": room_type, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error creating room",
                {"error": str(e)},
            )

    async def handle_join_room(self, data: Dict[str, Any], user_id: Optional[str]):
        """Handle room join event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_id = data.get("room_id")
        is_spectator = data.get("is_spectator", False)

        # Get room
        room = room_manager.get_room(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
            )

        # Validate room join
        error = validate_room_join(
            room.room_type, user_id, len(room.members), is_spectator
        )
        if error:
            return error

        # Validate room access
        error = validate_room_access(room.room_type, user_id, room.metadata)
        if error:
            return error

        try:
            # Add user to room
            error = await room_manager.add_user_to_room(user_id, room_id)
            if error:
                return error

            return format_success_response(
                "Joined room successfully", {"room": room.to_dict()}
            )

        except Exception as e:
            logger.error(
                "Error joining room",
                exc_info=True,
                extra={"room_id": room_id, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error joining room",
                {"error": str(e)},
            )

    async def handle_leave_room(
        self, data: Dict[str, Any], user_id: Optional[str]
    ) -> Dict[str, Any]:
        """Handle room leave event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_id = data.get("room_id")

        # Get room
        room = room_manager.get_room(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
            )

        try:
            # Remove user from room
            error = await room_manager.remove_user_from_room(user_id, room_id)
            if error:
                return error

            return format_success_response(
                "Left room successfully", {"room_id": room_id}
            )

        except Exception as e:
            logger.error(
                "Error leaving room",
                exc_info=True,
                extra={"room_id": room_id, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error leaving room",
                {"error": str(e)},
            )

    async def handle_send_chat(self, data: Dict[str, Any], user_id: Optional[str]):
        """Handle room chat event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_id = data.get("room_id")
        message = data.get("message")

        # Get room
        room = room_manager.get_room(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
            )

        # Validate chat permission
        error = validate_room_chat(room.room_type, user_id)
        if error:
            return error

        # Validate room access
        error = validate_room_access(room.room_type, user_id, room.metadata)
        if error:
            return error

        try:
            # Create chat message
            chat_data = {
                "room_id": room_id,
                "user_id": user_id,
                "message": message,
                "timestamp": datetime.utcnow().isoformat(),
            }

            # Note: In a real implementation, you would broadcast this
            # message to all room members using your WebSocket framework

            return format_success_response(
                "Chat message sent successfully", {"chat": chat_data}
            )

        except Exception as e:
            logger.error(
                "Error sending chat message",
                exc_info=True,
                extra={"room_id": room_id, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error sending chat message",
                {"error": str(e)},
            )

    async def handle_update_room(self, data: Dict[str, Any], user_id: Optional[str]):
        """Handle room update event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_id = data.get("room_id")
        metadata = data.get("metadata")

        # Get room
        room = room_manager.get_room(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
            )

        # Validate room access
        error = validate_room_access(room.room_type, user_id, room.metadata)
        if error:
            return error

        try:
            # Update room metadata
            room.update_metadata(metadata)

            return format_success_response(
                "Room updated successfully", {"room": room.to_dict()}
            )

        except Exception as e:
            logger.error(
                "Error updating room",
                exc_info=True,
                extra={"room_id": room_id, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error updating room",
                {"error": str(e)},
            )

    async def handle_delete_room(self, data: Dict[str, Any], user_id: Optional[str]):
        """Handle room deletion event.

        Args:
            data: Event data
            user_id: Optional user ID

        Returns:
            Dict[str, Any]: Response data
        """
        room_id = data.get("room_id")

        # Get room
        room = room_manager.get_room(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND, "Room not found", {"room_id": room_id}
            )

        # Validate room access
        error = validate_room_access(room.room_type, user_id, room.metadata)
        if error:
            return error

        try:
            # Delete room
            error = await room_manager.delete_room(room_id)
            if error:
                return error

            return format_success_response(
                "Room deleted successfully", {"room_id": room_id}
            )

        except Exception as e:
            logger.error(
                "Error deleting room",
                exc_info=True,
                extra={"room_id": room_id, "user_id": user_id, "error": str(e)},
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error deleting room",
                {"error": str(e)},
            )


# Global room event handler instance
room_event_handler = RoomEventHandler()
