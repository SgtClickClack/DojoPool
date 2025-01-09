"""WebSocket room rate limiting module.

This module provides rate limiting functionality for room operations.
"""
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import defaultdict
import asyncio

from .constants import ErrorCodes, EventTypes
from .utils import format_error_response
from .log_config import logger

class RateLimiter:
    """Rate limiter class."""
    
    def __init__(self):
        """Initialize RateLimiter."""
        # Track event counts per user
        self._user_events: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(
            lambda: defaultdict(
                lambda: {
                    'count': 0,
                    'first_request': None,
                    'last_request': None
                }
            )
        )
        
        # Track event counts per room
        self._room_events: Dict[str, Dict[str, Dict[str, Any]]] = defaultdict(
            lambda: defaultdict(
                lambda: {
                    'count': 0,
                    'first_request': None,
                    'last_request': None
                }
            )
        )
        
        # Track global event counts
        self._global_events: Dict[str, Dict[str, Any]] = defaultdict(
            lambda: {
                'count': 0,
                'first_request': None,
                'last_request': None
            }
        )
        
        self._cleanup_task: Optional[asyncio.Task] = None
    
    async def start_cleanup(
        self,
        cleanup_interval: int = 300
    ) -> None:
        """Start cleanup task.
        
        Args:
            cleanup_interval: Cleanup interval in seconds
        """
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(
                self._cleanup_loop(cleanup_interval)
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
    
    async def _cleanup_loop(self, interval: int) -> None:
        """Cleanup loop to reset rate limits.
        
        Args:
            interval: Cleanup interval in seconds
        """
        while True:
            try:
                await asyncio.sleep(interval)
                await self.cleanup_limits()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(
                    "Error in rate limiter cleanup",
                    exc_info=True,
                    extra={'error': str(e)}
                )
    
    async def cleanup_limits(self) -> None:
        """Reset expired rate limits."""
        try:
            current_time = datetime.utcnow()
            
            # Clean up user events
            for user_id in list(self._user_events.keys()):
                for event_type in list(self._user_events[user_id].keys()):
                    event_data = self._user_events[user_id][event_type]
                    if self._is_window_expired(event_data, current_time):
                        del self._user_events[user_id][event_type]
                if not self._user_events[user_id]:
                    del self._user_events[user_id]
            
            # Clean up room events
            for room_id in list(self._room_events.keys()):
                for event_type in list(self._room_events[room_id].keys()):
                    event_data = self._room_events[room_id][event_type]
                    if self._is_window_expired(event_data, current_time):
                        del self._room_events[room_id][event_type]
                if not self._room_events[room_id]:
                    del self._room_events[room_id]
            
            # Clean up global events
            for event_type in list(self._global_events.keys()):
                event_data = self._global_events[event_type]
                if self._is_window_expired(event_data, current_time):
                    del self._global_events[event_type]
            
        except Exception as e:
            logger.error(
                "Error cleaning up rate limits",
                exc_info=True,
                extra={'error': str(e)}
            )
    
    def _is_window_expired(
        self,
        event_data: Dict[str, Any],
        current_time: datetime
    ) -> bool:
        """Check if rate limit window has expired.
        
        Args:
            event_data: Event tracking data
            current_time: Current time
            
        Returns:
            bool: True if window expired, False otherwise
        """
        if not event_data['first_request']:
            return True
        
        first_request = datetime.fromisoformat(event_data['first_request'])
        return (current_time - first_request) > timedelta(minutes=1)
    
    def _get_limits(self, event_type: str) -> Tuple[int, int, int]:
        """Get rate limits for event type.
        
        Args:
            event_type: Event type
            
        Returns:
            Tuple[int, int, int]: User limit, room limit, global limit
        """
        # Define rate limits per event type
        if event_type == EventTypes.CREATE_ROOM:
            return 10, 0, 1000  # User can create 10 rooms/min
        elif event_type == EventTypes.JOIN_ROOM:
            return 20, 100, 2000  # User can join 20 rooms/min
        elif event_type == EventTypes.SEND_CHAT:
            return 60, 600, 10000  # User can send 60 messages/min
        elif event_type == EventTypes.UPDATE_ROOM:
            return 30, 300, 3000  # User can update room 30 times/min
        else:
            return 100, 1000, 10000  # Default limits
    
    async def check_rate_limit(
        self,
        event_type: str,
        user_id: Optional[str] = None,
        room_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Check rate limits for an event.
        
        Args:
            event_type: Event type
            user_id: Optional user ID
            room_id: Optional room ID
            
        Returns:
            Optional[Dict[str, Any]]: Error response if rate limited, None if allowed
        """
        try:
            current_time = datetime.utcnow()
            user_limit, room_limit, global_limit = self._get_limits(event_type)
            
            # Check user rate limit
            if user_id and user_limit > 0:
                event_data = self._user_events[user_id][event_type]
                if not event_data['first_request']:
                    event_data['first_request'] = current_time.isoformat()
                
                if self._is_window_expired(event_data, current_time):
                    # Reset counter for new window
                    event_data['count'] = 1
                    event_data['first_request'] = current_time.isoformat()
                else:
                    event_data['count'] += 1
                    if event_data['count'] > user_limit:
                        return format_error_response(
                            ErrorCodes.RATE_LIMIT_EXCEEDED,
                            "User rate limit exceeded",
                            {
                                'user_id': user_id,
                                'event_type': event_type,
                                'limit': user_limit
                            }
                        )
                
                event_data['last_request'] = current_time.isoformat()
            
            # Check room rate limit
            if room_id and room_limit > 0:
                event_data = self._room_events[room_id][event_type]
                if not event_data['first_request']:
                    event_data['first_request'] = current_time.isoformat()
                
                if self._is_window_expired(event_data, current_time):
                    # Reset counter for new window
                    event_data['count'] = 1
                    event_data['first_request'] = current_time.isoformat()
                else:
                    event_data['count'] += 1
                    if event_data['count'] > room_limit:
                        return format_error_response(
                            ErrorCodes.RATE_LIMIT_EXCEEDED,
                            "Room rate limit exceeded",
                            {
                                'room_id': room_id,
                                'event_type': event_type,
                                'limit': room_limit
                            }
                        )
                
                event_data['last_request'] = current_time.isoformat()
            
            # Check global rate limit
            event_data = self._global_events[event_type]
            if not event_data['first_request']:
                event_data['first_request'] = current_time.isoformat()
            
            if self._is_window_expired(event_data, current_time):
                # Reset counter for new window
                event_data['count'] = 1
                event_data['first_request'] = current_time.isoformat()
            else:
                event_data['count'] += 1
                if event_data['count'] > global_limit:
                    return format_error_response(
                        ErrorCodes.RATE_LIMIT_EXCEEDED,
                        "Global rate limit exceeded",
                        {
                            'event_type': event_type,
                            'limit': global_limit
                        }
                    )
            
            event_data['last_request'] = current_time.isoformat()
            return None
            
        except Exception as e:
            logger.error(
                "Error checking rate limit",
                exc_info=True,
                extra={
                    'event_type': event_type,
                    'user_id': user_id,
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return None  # Don't rate limit on error
    
    def get_user_limits(
        self,
        user_id: str,
        event_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get rate limit info for a user.
        
        Args:
            user_id: User ID
            event_type: Optional event type filter
            
        Returns:
            Dict[str, Any]: Rate limit information
        """
        if event_type:
            return dict(self._user_events[user_id][event_type])
        return {
            event_type: dict(data)
            for event_type, data in self._user_events[user_id].items()
        }
    
    def get_room_limits(
        self,
        room_id: str,
        event_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get rate limit info for a room.
        
        Args:
            room_id: Room ID
            event_type: Optional event type filter
            
        Returns:
            Dict[str, Any]: Rate limit information
        """
        if event_type:
            return dict(self._room_events[room_id][event_type])
        return {
            event_type: dict(data)
            for event_type, data in self._room_events[room_id].items()
        }
    
    def get_global_limits(
        self,
        event_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get global rate limit info.
        
        Args:
            event_type: Optional event type filter
            
        Returns:
            Dict[str, Any]: Rate limit information
        """
        if event_type:
            return dict(self._global_events[event_type])
        return {
            event_type: dict(data)
            for event_type, data in self._global_events.items()
        }

# Global rate limiter instance
rate_limiter = RateLimiter()

async def start_rate_limiter(
    cleanup_interval: int = 300
) -> None:
    """Start rate limiter cleanup task.
    
    Args:
        cleanup_interval: Cleanup interval in seconds
    """
    await rate_limiter.start_cleanup(cleanup_interval)

async def stop_rate_limiter() -> None:
    """Stop rate limiter cleanup task."""
    await rate_limiter.stop_cleanup() 