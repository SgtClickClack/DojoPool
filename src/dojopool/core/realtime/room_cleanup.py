"""WebSocket room cleanup module.

This module provides functionality for cleaning up inactive and expired rooms.
"""
from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timedelta
import asyncio

from .constants import ErrorCodes, RoomTypes, RoomState
from .utils import format_error_response
from .log_config import logger
from .room_state import room_state_manager
from .room_persistence import room_persistence
from .room_monitor import room_monitor
from .rooms import room_manager

class RoomCleanup:
    """Room cleanup class."""
    
    def __init__(self):
        """Initialize RoomCleanup."""
        self._cleanup_task: Optional[asyncio.Task] = None
        self._cleanup_stats: Dict[str, Any] = {
            'last_cleanup': None,
            'total_cleanups': 0,
            'rooms_cleaned': 0,
            'errors': 0
        }
        self._cleanup_lock = asyncio.Lock()
    
    async def start_cleanup(
        self,
        cleanup_interval: int = 300,  # 5 minutes
        idle_timeout: int = 1800,  # 30 minutes
        error_timeout: int = 300,  # 5 minutes
        max_age: int = 86400  # 24 hours
    ) -> None:
        """Start cleanup task.
        
        Args:
            cleanup_interval: Cleanup interval in seconds
            idle_timeout: Room idle timeout in seconds
            error_timeout: Error state timeout in seconds
            max_age: Maximum room age in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(
                self._cleanup_loop(
                    cleanup_interval,
                    idle_timeout,
                    error_timeout,
                    max_age
                )
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
        interval: int,
        idle_timeout: int,
        error_timeout: int,
        max_age: int
    ) -> None:
        """Cleanup loop to remove inactive and expired rooms.
        
        Args:
            interval: Cleanup interval in seconds
            idle_timeout: Room idle timeout in seconds
            error_timeout: Error state timeout in seconds
            max_age: Maximum room age in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.cleanup_rooms(
                    idle_timeout,
                    error_timeout,
                    max_age
                )
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in room cleanup loop",
                    exc_info=True,
                    extra={'error': str(e)}
                )
    
    async def cleanup_rooms(
        self,
        idle_timeout: int,
        error_timeout: int,
        max_age: int
    ) -> None:
        """Clean up inactive and expired rooms.
        
        Args:
            idle_timeout: Room idle timeout in seconds
            error_timeout: Error state timeout in seconds
            max_age: Maximum room age in seconds
        """
        try:
            async with self._cleanup_lock:
                current_time = datetime.utcnow()
                rooms_cleaned = 0
                errors = 0
                
                # Get all room states
                for room_id, room_state in room_state_manager._room_states.items():
                    try:
                        # Get room data
                        room_data = room_state_manager.get_room_state(room_id)
                        if not room_data:
                            continue
                        
                        # Check room age
                        created_at = datetime.fromisoformat(room_data['created_at'])
                        age = (current_time - created_at).total_seconds()
                        
                        if age > max_age:
                            # Room has exceeded maximum age
                            await self._close_room(
                                room_id,
                                "Room exceeded maximum age"
                            )
                            rooms_cleaned += 1
                            continue
                        
                        # Check room state
                        if room_state == RoomState.ERROR:
                            # Check error timeout
                            last_state = room_data['state_history'][-1]
                            error_time = datetime.fromisoformat(last_state['timestamp'])
                            error_age = (current_time - error_time).total_seconds()
                            
                            if error_age > error_timeout:
                                await self._close_room(
                                    room_id,
                                    "Room in error state exceeded timeout"
                                )
                                rooms_cleaned += 1
                                continue
                        
                        # Check room activity
                        room_stats = room_monitor.get_room_stats(room_id)
                        if room_stats:
                            last_activity = room_stats.get('last_activity')
                            if last_activity:
                                idle_time = (
                                    current_time - 
                                    datetime.fromisoformat(last_activity)
                                ).total_seconds()
                                
                                if idle_time > idle_timeout:
                                    await self._close_room(
                                        room_id,
                                        "Room exceeded idle timeout"
                                    )
                                    rooms_cleaned += 1
                                    continue
                        
                    except Exception as e:
                        logger.error(
                            "Error cleaning up room",
                            exc_info=True,
                            extra={
                                'room_id': room_id,
                                'error': str(e)
                            }
                        )
                        errors += 1
                
                # Update cleanup stats
                self._cleanup_stats.update({
                    'last_cleanup': current_time.isoformat(),
                    'total_cleanups': self._cleanup_stats['total_cleanups'] + 1,
                    'rooms_cleaned': self._cleanup_stats['rooms_cleaned'] + rooms_cleaned,
                    'errors': self._cleanup_stats['errors'] + errors
                })
                
        except Exception as e:
            logger.error(
                "Error performing room cleanup",
                exc_info=True,
                extra={'error': str(e)}
            )
    
    async def _close_room(
        self,
        room_id: str,
        reason: str
    ) -> None:
        """Close and clean up room.
        
        Args:
            room_id: Room ID
            reason: Closure reason
        """
        try:
            # Transition room to closing state
            await room_state_manager.transition_state(
                room_id,
                RoomState.CLOSING,
                {'reason': reason}
            )
            
            # Remove room from manager
            await room_manager.delete_room(room_id)
            
            # Transition to closed state
            await room_state_manager.transition_state(
                room_id,
                RoomState.CLOSED,
                {'reason': reason}
            )
            
            logger.info(
                "Room closed and cleaned up",
                extra={
                    'room_id': room_id,
                    'reason': reason
                }
            )
            
        except Exception as e:
            logger.error(
                "Error closing room",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'reason': reason,
                    'error': str(e)
                }
            )
            
            # Attempt to transition to error state
            await room_state_manager.transition_state(
                room_id,
                RoomState.ERROR,
                {
                    'reason': reason,
                    'error': str(e)
                }
            )
    
    def get_cleanup_stats(self) -> Dict[str, Any]:
        """Get cleanup statistics.
        
        Returns:
            Dict[str, Any]: Cleanup statistics
        """
        return dict(self._cleanup_stats)
    
    async def force_cleanup(
        self,
        room_id: str,
        reason: str
    ) -> Optional[Dict[str, Any]]:
        """Force cleanup of specific room.
        
        Args:
            room_id: Room ID
            reason: Cleanup reason
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            # Check if room exists
            room_state = room_state_manager.get_room_state(room_id)
            if not room_state:
                return format_error_response(
                    ErrorCodes.ROOM_NOT_FOUND,
                    "Room not found",
                    {'room_id': room_id}
                )
            
            # Close room
            await self._close_room(room_id, reason)
            return None
            
        except Exception as e:
            logger.error(
                "Error force cleaning room",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'reason': reason,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error force cleaning room",
                {'error': str(e)}
            )

# Global room cleanup instance
room_cleanup = RoomCleanup()

async def start_room_cleanup(
    cleanup_interval: int = 300,
    idle_timeout: int = 1800,
    error_timeout: int = 300,
    max_age: int = 86400
) -> None:
    """Start room cleanup.
    
    Args:
        cleanup_interval: Cleanup interval in seconds
        idle_timeout: Room idle timeout in seconds
        error_timeout: Error state timeout in seconds
        max_age: Maximum room age in seconds
    """
    await room_cleanup.start_cleanup(
        cleanup_interval,
        idle_timeout,
        error_timeout,
        max_age
    )

async def stop_room_cleanup() -> None:
    """Stop room cleanup."""
    await room_cleanup.stop_cleanup() 