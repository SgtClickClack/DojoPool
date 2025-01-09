"""WebSocket room recovery module.

This module provides functionality for room state recovery and error handling.
"""
from typing import Dict, Any, Optional, List, Set
from datetime import datetime
import asyncio

from .constants import ErrorCodes, RoomTypes, RoomState
from .utils import format_error_response
from .log_config import logger
from .room_state import room_state_manager
from .room_persistence import room_persistence
from .room_monitor import room_monitor
from .room_notifications import room_notifications
from .rooms import room_manager

class RoomRecovery:
    """Room recovery class."""
    
    def __init__(self):
        """Initialize RoomRecovery."""
        self._recovery_stats: Dict[str, Any] = {
            'total_recoveries': 0,
            'successful_recoveries': 0,
            'failed_recoveries': 0,
            'last_recovery': None
        }
        self._recovery_lock = asyncio.Lock()
        self._recovery_tasks: Dict[str, asyncio.Task] = {}
    
    async def recover_room(
        self,
        room_id: str,
        error_data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Attempt to recover room from error state.
        
        Args:
            room_id: Room ID
            error_data: Optional error data
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            async with self._recovery_lock:
                # Check if room exists
                room_state = room_state_manager.get_room_state(room_id)
                if not room_state:
                    return format_error_response(
                        ErrorCodes.ROOM_NOT_FOUND,
                        "Room not found",
                        {'room_id': room_id}
                    )
                
                # Check if room is in error state
                if room_state['current_state'] != RoomState.ERROR:
                    return format_error_response(
                        ErrorCodes.INVALID_STATE,
                        "Room is not in error state",
                        {
                            'room_id': room_id,
                            'current_state': room_state['current_state']
                        }
                    )
                
                # Start recovery task
                recovery_task = asyncio.create_task(
                    self._perform_recovery(room_id, error_data)
                )
                self._recovery_tasks[room_id] = recovery_task
                
                try:
                    await recovery_task
                    self._recovery_stats['successful_recoveries'] += 1
                    return None
                    
                except Exception as e:
                    self._recovery_stats['failed_recoveries'] += 1
                    return format_error_response(
                        ErrorCodes.RECOVERY_FAILED,
                        "Room recovery failed",
                        {'error': str(e)}
                    )
                    
                finally:
                    self._recovery_tasks.pop(room_id, None)
                    self._recovery_stats['total_recoveries'] += 1
                    self._recovery_stats['last_recovery'] = datetime.utcnow().isoformat()
                
        except Exception as e:
            logger.error(
                "Error initiating room recovery",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error initiating room recovery",
                {'error': str(e)}
            )
    
    async def _perform_recovery(
        self,
        room_id: str,
        error_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Perform room recovery steps.
        
        Args:
            room_id: Room ID
            error_data: Optional error data
        """
        try:
            # Get room data
            room_data = room_state_manager.get_room_state(room_id)
            if not room_data:
                raise ValueError("Room data not found")
            
            # Load persisted state
            persisted_data = await room_persistence.load_room_data(room_id)
            if not persisted_data:
                raise ValueError("Persisted room data not found")
            
            # Get room stats
            room_stats = room_monitor.get_room_stats(room_id)
            
            # Notify users of recovery attempt
            await room_notifications.broadcast_room_event(
                room_id,
                'recovery_started',
                {
                    'timestamp': datetime.utcnow().isoformat(),
                    'error_data': error_data
                }
            )
            
            # Attempt state restoration
            await self._restore_room_state(
                room_id,
                persisted_data,
                room_stats
            )
            
            # Verify room state
            if not await self._verify_room_state(room_id):
                raise ValueError("Room state verification failed")
            
            # Transition to active state
            await room_state_manager.transition_state(
                room_id,
                RoomState.ACTIVE,
                {
                    'recovery': True,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
            # Notify users of successful recovery
            await room_notifications.broadcast_room_event(
                room_id,
                'recovery_completed',
                {
                    'timestamp': datetime.utcnow().isoformat(),
                    'success': True
                }
            )
            
            logger.info(
                "Room recovery successful",
                extra={
                    'room_id': room_id,
                    'recovery_time': datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(
                "Room recovery failed",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            
            # Notify users of failed recovery
            await room_notifications.broadcast_room_event(
                room_id,
                'recovery_failed',
                {
                    'timestamp': datetime.utcnow().isoformat(),
                    'error': str(e)
                }
            )
            
            raise
    
    async def _restore_room_state(
        self,
        room_id: str,
        persisted_data: Dict[str, Any],
        room_stats: Optional[Dict[str, Any]]
    ) -> None:
        """Restore room state from persisted data.
        
        Args:
            room_id: Room ID
            persisted_data: Persisted room data
            room_stats: Optional room statistics
        """
        try:
            # Recreate room in manager
            await room_manager.create_room(
                room_id,
                persisted_data['room_type'],
                persisted_data['metadata']
            )
            
            # Restore room state
            self._state_data[room_id] = persisted_data
            
            # Restore room stats if available
            if room_stats:
                room_monitor.update_room_stats(
                    room_id,
                    room_stats
                )
            
        except Exception as e:
            logger.error(
                "Error restoring room state",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            raise
    
    async def _verify_room_state(
        self,
        room_id: str
    ) -> bool:
        """Verify room state consistency.
        
        Args:
            room_id: Room ID
            
        Returns:
            bool: True if state is consistent
        """
        try:
            # Get current state
            room_state = room_state_manager.get_room_state(room_id)
            if not room_state:
                return False
            
            # Get persisted state
            persisted_data = await room_persistence.load_room_data(room_id)
            if not persisted_data:
                return False
            
            # Verify room exists in manager
            if not room_manager.room_exists(room_id):
                return False
            
            # Verify state consistency
            if (
                room_state['room_type'] != persisted_data['room_type'] or
                room_state['metadata'] != persisted_data['metadata']
            ):
                return False
            
            return True
            
        except Exception as e:
            logger.error(
                "Error verifying room state",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return False
    
    def get_recovery_stats(self) -> Dict[str, Any]:
        """Get recovery statistics.
        
        Returns:
            Dict[str, Any]: Recovery statistics
        """
        return dict(self._recovery_stats)
    
    async def cancel_recovery(
        self,
        room_id: str
    ) -> Optional[Dict[str, Any]]:
        """Cancel ongoing room recovery.
        
        Args:
            room_id: Room ID
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            # Check if recovery is in progress
            recovery_task = self._recovery_tasks.get(room_id)
            if not recovery_task:
                return format_error_response(
                    ErrorCodes.NO_RECOVERY,
                    "No recovery in progress",
                    {'room_id': room_id}
                )
            
            # Cancel recovery task
            recovery_task.cancel()
            try:
                await recovery_task
            except asyncio.CancelledError:
                pass
            
            # Update stats
            self._recovery_stats['failed_recoveries'] += 1
            
            # Notify users
            await room_notifications.broadcast_room_event(
                room_id,
                'recovery_cancelled',
                {
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
            return None
            
        except Exception as e:
            logger.error(
                "Error cancelling room recovery",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error cancelling room recovery",
                {'error': str(e)}
            )

# Global room recovery instance
room_recovery = RoomRecovery() 