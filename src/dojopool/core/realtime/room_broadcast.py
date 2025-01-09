"""WebSocket room broadcast module.

This module provides functionality for broadcasting messages to room members.
"""
from typing import Dict, Any, Optional, List, Set
from datetime import datetime
import asyncio

from .constants import ErrorCodes, RoomTypes, RoomState
from .utils import format_error_response
from .log_config import logger
from .room_state import room_state_manager
from .room_monitor import room_monitor
from .rooms import room_manager

class RoomBroadcaster:
    """Room broadcaster class."""
    
    def __init__(self):
        """Initialize RoomBroadcaster."""
        self._broadcast_stats: Dict[str, Any] = {
            'total_broadcasts': 0,
            'successful_broadcasts': 0,
            'failed_broadcasts': 0,
            'last_broadcast': None
        }
        self._broadcast_lock = asyncio.Lock()
        self._socket = None
    
    def set_socket(self, socket: Any) -> None:
        """Set WebSocket instance.
        
        Args:
            socket: WebSocket instance
        """
        self._socket = socket
    
    async def broadcast_to_room(
        self,
        room_id: str,
        event: str,
        data: Dict[str, Any],
        exclude_sid: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Broadcast message to all room members.
        
        Args:
            room_id: Room ID
            event: Event name
            data: Event data
            exclude_sid: Optional session ID to exclude
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            if not self._socket:
                return format_error_response(
                    ErrorCodes.NO_SOCKET,
                    "WebSocket not initialized",
                    None
                )
            
            async with self._broadcast_lock:
                # Get room state
                room_state = room_state_manager.get_room_state(room_id)
                if not room_state:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {'room_id': room_id}
                    )
                
                # Get room
                room = room_manager.get_room(room_id)
                if not room:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {'room_id': room_id}
                    )
                
                # Prepare broadcast data
                broadcast_data = {
                    **data,
                    'room_id': room_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                try:
                    # Emit to room
                    if exclude_sid:
                        await self._socket.emit(
                            event,
                            broadcast_data,
                            room=room_id,
                            skip_sid=exclude_sid
                        )
                    else:
                        await self._socket.emit(
                            event,
                            broadcast_data,
                            room=room_id
                        )
                    
                    # Update stats
                    self._broadcast_stats.update({
                        'total_broadcasts': self._broadcast_stats['total_broadcasts'] + 1,
                        'successful_broadcasts': (
                            self._broadcast_stats['successful_broadcasts'] + 1
                        ),
                        'last_broadcast': datetime.utcnow().isoformat()
                    })
                    
                    # Update room stats
                    room_monitor.update_room_stats(
                        room_id,
                        {
                            'last_broadcast': datetime.utcnow().isoformat(),
                            'broadcast_count': room_monitor.get_room_stats(room_id).get(
                                'broadcast_count',
                                0
                            ) + 1
                        }
                    )
                    
                    return None
                    
                except Exception as e:
                    self._broadcast_stats['failed_broadcasts'] += 1
                    return format_error_response(
                        ErrorCodes.BROADCAST_FAILED,
                        "Failed to broadcast message",
                        {'error': str(e)}
                    )
                
        except Exception as e:
            logger.error(
                "Error broadcasting to room",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'event': event,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error broadcasting to room",
                {'error': str(e)}
            )
    
    async def broadcast_to_user(
        self,
        user_id: str,
        event: str,
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Broadcast message to specific user.
        
        Args:
            user_id: User ID
            event: Event name
            data: Event data
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            if not self._socket:
                return format_error_response(
                    ErrorCodes.NO_SOCKET,
                    "WebSocket not initialized",
                    None
                )
            
            async with self._broadcast_lock:
                # Prepare broadcast data
                broadcast_data = {
                    **data,
                    'user_id': user_id,
                    'timestamp': datetime.utcnow().isoformat()
                }
                
                try:
                    # Emit to user
                    await self._socket.emit(
                        event,
                        broadcast_data,
                        room=user_id
                    )
                    
                    # Update stats
                    self._broadcast_stats.update({
                        'total_broadcasts': self._broadcast_stats['total_broadcasts'] + 1,
                        'successful_broadcasts': (
                            self._broadcast_stats['successful_broadcasts'] + 1
                        ),
                        'last_broadcast': datetime.utcnow().isoformat()
                    })
                    
                    return None
                    
                except Exception as e:
                    self._broadcast_stats['failed_broadcasts'] += 1
                    return format_error_response(
                        ErrorCodes.BROADCAST_FAILED,
                        "Failed to broadcast message",
                        {'error': str(e)}
                    )
                
        except Exception as e:
            logger.error(
                "Error broadcasting to user",
                exc_info=True,
                extra={
                    'user_id': user_id,
                    'event': event,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error broadcasting to user",
                {'error': str(e)}
            )
    
    async def broadcast_system_message(
        self,
        room_id: str,
        message: str,
        level: str = 'info'
    ) -> Optional[Dict[str, Any]]:
        """Broadcast system message to room.
        
        Args:
            room_id: Room ID
            message: System message
            level: Message level (info, warning, error)
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        return await self.broadcast_to_room(
            room_id,
            'system_message',
            {
                'message': message,
                'level': level
            }
        )
    
    async def broadcast_error(
        self,
        room_id: str,
        error: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Broadcast error message to room.
        
        Args:
            room_id: Room ID
            error: Error data
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        return await self.broadcast_to_room(
            room_id,
            'error',
            error
        )
    
    def get_broadcast_stats(self) -> Dict[str, Any]:
        """Get broadcast statistics.
        
        Returns:
            Dict[str, Any]: Broadcast statistics
        """
        return dict(self._broadcast_stats)

# Global room broadcaster instance
room_broadcaster = RoomBroadcaster() 