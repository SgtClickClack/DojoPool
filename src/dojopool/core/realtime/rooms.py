"""WebSocket room management module.

This module provides room management functionality for WebSocket operations.
"""
from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

from .constants import ErrorCodes, RoomTypes
from .utils import format_error_response, generate_room_id
from .log_config import logger

class Room:
    """Room class."""
    
    def __init__(
        self,
        room_id: str,
        room_type: str,
        max_members: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Initialize Room.
        
        Args:
            room_id: Room ID
            room_type: Room type
            max_members: Maximum number of members
            metadata: Optional room metadata
        """
        self.room_id = room_id
        self.room_type = room_type
        self.max_members = max_members
        self.metadata = metadata or {}
        self.members: Set[str] = set()
        self.created_at = datetime.utcnow()
        self.last_activity = self.created_at
    
    def add_member(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Add member to room.
        
        Args:
            user_id: User ID to add
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        if user_id in self.members:
            return format_error_response(
                ErrorCodes.ALREADY_IN_ROOM,
                "User is already in room",
                {'room_id': self.room_id, 'user_id': user_id}
            )
        
        if len(self.members) >= self.max_members:
            return format_error_response(
                ErrorCodes.ROOM_FULL,
                "Room is full",
                {
                    'room_id': self.room_id,
                    'max_members': self.max_members
                }
            )
        
        self.members.add(user_id)
        self.last_activity = datetime.utcnow()
        return None
    
    def remove_member(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Remove member from room.
        
        Args:
            user_id: User ID to remove
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        if user_id not in self.members:
            return format_error_response(
                ErrorCodes.NOT_IN_ROOM,
                "User is not in room",
                {'room_id': self.room_id, 'user_id': user_id}
            )
        
        self.members.remove(user_id)
        self.last_activity = datetime.utcnow()
        return None
    
    def update_metadata(self, metadata: Dict[str, Any]) -> None:
        """Update room metadata.
        
        Args:
            metadata: New metadata
        """
        self.metadata.update(metadata)
        self.last_activity = datetime.utcnow()
    
    def is_empty(self) -> bool:
        """Check if room is empty.
        
        Returns:
            bool: True if empty, False otherwise
        """
        return len(self.members) == 0
    
    def is_idle(self, idle_timeout: timedelta) -> bool:
        """Check if room is idle.
        
        Args:
            idle_timeout: Idle timeout duration
            
        Returns:
            bool: True if idle, False otherwise
        """
        return (
            datetime.utcnow() - self.last_activity
        ) > idle_timeout
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert room to dictionary.
        
        Returns:
            Dict[str, Any]: Room data
        """
        return {
            'room_id': self.room_id,
            'room_type': self.room_type,
            'max_members': self.max_members,
            'members': list(self.members),
            'metadata': self.metadata,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat()
        }

class RoomManager:
    """Room manager class."""
    
    def __init__(self):
        """Initialize RoomManager."""
        self._rooms: Dict[str, Room] = {}
        self._user_rooms: Dict[str, Set[str]] = defaultdict(set)
        self._cleanup_task: Optional[asyncio.Task] = None
    
    async def start_cleanup(
        self,
        idle_timeout: timedelta = timedelta(minutes=30),
        cleanup_interval: int = 300
    ) -> None:
        """Start cleanup task.
        
        Args:
            idle_timeout: Room idle timeout
            cleanup_interval: Cleanup interval in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(
                self._cleanup_loop(idle_timeout, cleanup_interval)
            )
    
    async def stop_cleanup(self) -> None:
        """Stop cleanup task."""
        if self._cleanup_task is not None:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
    
    async def _cleanup_loop(
        self,
        idle_timeout: timedelta,
        interval: int
    ) -> None:
        """Cleanup loop to remove idle rooms.
        
        Args:
            idle_timeout: Room idle timeout
            interval: Cleanup interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.cleanup_rooms(idle_timeout)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in room manager cleanup",
                    exc_info=True,
                    extra={'error': str(e)}
                )
    
    async def cleanup_rooms(self, idle_timeout: timedelta) -> None:
        """Remove idle and empty rooms.
        
        Args:
            idle_timeout: Room idle timeout
        """
        rooms_to_remove = [
            room_id for room_id, room in self._rooms.items()
            if room.is_empty() or room.is_idle(idle_timeout)
        ]
        
        for room_id in rooms_to_remove:
            await self.delete_room(room_id)
    
    async def create_room(
        self,
        room_type: str,
        max_members: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Room:
        """Create new room.
        
        Args:
            room_type: Room type
            max_members: Maximum number of members
            metadata: Optional room metadata
            
        Returns:
            Room: Created room
        """
        room_id = generate_room_id(room_type)
        room = Room(room_id, room_type, max_members, metadata)
        self._rooms[room_id] = room
        
        logger.info(
            "Room created",
            extra={
                'room_id': room_id,
                'room_type': room_type,
                'max_members': max_members
            }
        )
        
        return room
    
    async def delete_room(self, room_id: str) -> Optional[Dict[str, Any]]:
        """Delete room.
        
        Args:
            room_id: Room ID to delete
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        room = self._rooms.get(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND,
                "Room not found",
                {'room_id': room_id}
            )
        
        # Remove room from user mappings
        for user_id in room.members:
            self._user_rooms[user_id].remove(room_id)
            if not self._user_rooms[user_id]:
                del self._user_rooms[user_id]
        
        # Delete room
        del self._rooms[room_id]
        
        logger.info(
            "Room deleted",
            extra={'room_id': room_id}
        )
        
        return None
    
    async def add_user_to_room(
        self,
        user_id: str,
        room_id: str
    ) -> Optional[Dict[str, Any]]:
        """Add user to room.
        
        Args:
            user_id: User ID to add
            room_id: Room ID to add to
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        room = self._rooms.get(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND,
                "Room not found",
                {'room_id': room_id}
            )
        
        error = room.add_member(user_id)
        if error:
            return error
        
        self._user_rooms[user_id].add(room_id)
        
        logger.info(
            "User added to room",
            extra={
                'user_id': user_id,
                'room_id': room_id
            }
        )
        
        return None
    
    async def remove_user_from_room(
        self,
        user_id: str,
        room_id: str
    ) -> Optional[Dict[str, Any]]:
        """Remove user from room.
        
        Args:
            user_id: User ID to remove
            room_id: Room ID to remove from
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        room = self._rooms.get(room_id)
        if not room:
            return format_error_response(
                ErrorCodes.ROOM_NOT_FOUND,
                "Room not found",
                {'room_id': room_id}
            )
        
        error = room.remove_member(user_id)
        if error:
            return error
        
        self._user_rooms[user_id].remove(room_id)
        if not self._user_rooms[user_id]:
            del self._user_rooms[user_id]
        
        logger.info(
            "User removed from room",
            extra={
                'user_id': user_id,
                'room_id': room_id
            }
        )
        
        return None
    
    def get_room(self, room_id: str) -> Optional[Room]:
        """Get room by ID.
        
        Args:
            room_id: Room ID
            
        Returns:
            Optional[Room]: Room if found, None otherwise
        """
        return self._rooms.get(room_id)
    
    def get_user_rooms(self, user_id: str) -> List[Room]:
        """Get rooms user is in.
        
        Args:
            user_id: User ID
            
        Returns:
            List[Room]: List of rooms
        """
        return [
            self._rooms[room_id]
            for room_id in self._user_rooms.get(user_id, set())
        ]
    
    def get_rooms_by_type(self, room_type: str) -> List[Room]:
        """Get rooms by type.
        
        Args:
            room_type: Room type
            
        Returns:
            List[Room]: List of rooms
        """
        return [
            room for room in self._rooms.values()
            if room.room_type == room_type
        ]

# Global room manager instance
room_manager = RoomManager()

async def start_room_manager(
    idle_timeout: timedelta = timedelta(minutes=30),
    cleanup_interval: int = 300
) -> None:
    """Start room manager cleanup task.
    
    Args:
        idle_timeout: Room idle timeout
        cleanup_interval: Cleanup interval in seconds
    """
    await room_manager.start_cleanup(idle_timeout, cleanup_interval)

async def stop_room_manager() -> None:
    """Stop room manager cleanup task."""
    await room_manager.stop_cleanup()