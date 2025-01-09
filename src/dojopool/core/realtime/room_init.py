"""WebSocket room initialization module.

This module provides functionality for room setup and configuration.
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
from .room_validation import validate_room_creation
from .rooms import room_manager

class RoomInitializer:
    """Room initializer class."""
    
    def __init__(self):
        """Initialize RoomInitializer."""
        self._init_stats: Dict[str, Any] = {
            'total_initializations': 0,
            'successful_initializations': 0,
            'failed_initializations': 0,
            'last_initialization': None
        }
        self._init_lock = asyncio.Lock()
    
    async def initialize_room(
        self,
        room_type: str,
        metadata: Optional[Dict[str, Any]] = None,
        max_members: int = 100,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Initialize new room.
        
        Args:
            room_type: Room type
            metadata: Optional room metadata
            max_members: Maximum number of members
            config: Optional room configuration
            
        Returns:
            Optional[Dict[str, Any]]: Room data if successful, error response if failed
        """
        try:
            async with self._init_lock:
                # Validate room creation
                error = validate_room_creation(room_type, metadata)
                if error:
                    self._init_stats['failed_initializations'] += 1
                    return error
                
                # Create room in manager
                room = await room_manager.create_room(
                    room_type,
                    max_members,
                    metadata
                )
                
                if not room:
                    self._init_stats['failed_initializations'] += 1
                    return format_error_response(
                        ErrorCodes.ROOM_CREATION_FAILED,
                        "Failed to create room",
                        {
                            'room_type': room_type,
                            'metadata': metadata
                        }
                    )
                
                # Initialize room state
                error = await room_state_manager.initialize_room(
                    room.room_id,
                    room_type,
                    metadata
                )
                if error:
                    await room_manager.delete_room(room.room_id)
                    self._init_stats['failed_initializations'] += 1
                    return error
                
                # Configure room
                if config:
                    error = await self._configure_room(
                        room.room_id,
                        config
                    )
                    if error:
                        await room_manager.delete_room(room.room_id)
                        self._init_stats['failed_initializations'] += 1
                        return error
                
                # Initialize monitoring
                room_monitor.initialize_room_stats(
                    room.room_id,
                    {
                        'created_at': datetime.utcnow().isoformat(),
                        'room_type': room_type,
                        'max_members': max_members
                    }
                )
                
                # Transition to active state
                await room_state_manager.transition_state(
                    room.room_id,
                    RoomState.ACTIVE,
                    {
                        'initialized_at': datetime.utcnow().isoformat()
                    }
                )
                
                # Update initialization stats
                self._init_stats.update({
                    'total_initializations': self._init_stats['total_initializations'] + 1,
                    'successful_initializations': (
                        self._init_stats['successful_initializations'] + 1
                    ),
                    'last_initialization': datetime.utcnow().isoformat()
                })
                
                # Return room data
                return {
                    'room_id': room.room_id,
                    'room_type': room_type,
                    'metadata': metadata,
                    'max_members': max_members,
                    'config': config,
                    'created_at': datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(
                "Error initializing room",
                exc_info=True,
                extra={
                    'room_type': room_type,
                    'error': str(e)
                }
            )
            self._init_stats['failed_initializations'] += 1
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error initializing room",
                {'error': str(e)}
            )
    
    async def _configure_room(
        self,
        room_id: str,
        config: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Configure room settings.
        
        Args:
            room_id: Room ID
            config: Room configuration
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            # Get room state
            room_state = room_state_manager.get_room_state(room_id)
            if not room_state:
                return format_error_response(
                    ErrorCodes.ROOM_NOT_FOUND,
                    "Room not found",
                    {'room_id': room_id}
                )
            
            # Validate configuration
            error = self._validate_room_config(
                room_state['room_type'],
                config
            )
            if error:
                return error
            
            # Apply configuration
            room = room_manager.get_room(room_id)
            if not room:
                return format_error_response(
                    ErrorCodes.ROOM_NOT_FOUND,
                    "Room not found",
                    {'room_id': room_id}
                )
            
            # Update room settings
            for key, value in config.items():
                setattr(room, f"_{key}", value)
            
            # Persist configuration
            await room_persistence.save_room_config(
                room_id,
                config
            )
            
            return None
            
        except Exception as e:
            logger.error(
                "Error configuring room",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error configuring room",
                {'error': str(e)}
            )
    
    def _validate_room_config(
        self,
        room_type: str,
        config: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Validate room configuration.
        
        Args:
            room_type: Room type
            config: Room configuration
            
        Returns:
            Optional[Dict[str, Any]]: Error response if invalid, None if valid
        """
        try:
            # Define valid configuration options by room type
            valid_configs = {
                RoomTypes.GAME: {
                    'game_mode': str,
                    'time_limit': int,
                    'score_limit': int,
                    'team_size': int
                },
                RoomTypes.TOURNAMENT: {
                    'tournament_type': str,
                    'rounds': int,
                    'players_per_match': int,
                    'elimination_type': str
                },
                RoomTypes.CHAT: {
                    'message_history': int,
                    'user_limit': int,
                    'moderation_level': str
                }
            }
            
            # Check if room type has configuration options
            if room_type not in valid_configs:
                return format_error_response(
                    ErrorCodes.INVALID_ROOM_TYPE,
                    "Room type does not support configuration",
                    {'room_type': room_type}
                )
            
            # Validate configuration options
            valid_options = valid_configs[room_type]
            for key, value in config.items():
                # Check if option is valid
                if key not in valid_options:
                    return format_error_response(
                        ErrorCodes.INVALID_CONFIG,
                        f"Invalid configuration option: {key}",
                        {
                            'option': key,
                            'valid_options': list(valid_options.keys())
                        }
                    )
                
                # Check option type
                expected_type = valid_options[key]
                if not isinstance(value, expected_type):
                    return format_error_response(
                        ErrorCodes.INVALID_CONFIG,
                        f"Invalid type for option {key}",
                        {
                            'option': key,
                            'expected_type': expected_type.__name__,
                            'received_type': type(value).__name__
                        }
                    )
            
            return None
            
        except Exception as e:
            logger.error(
                "Error validating room configuration",
                exc_info=True,
                extra={
                    'room_type': room_type,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error validating room configuration",
                {'error': str(e)}
            )
    
    def get_initialization_stats(self) -> Dict[str, Any]:
        """Get initialization statistics.
        
        Returns:
            Dict[str, Any]: Initialization statistics
        """
        return dict(self._init_stats)
    
    async def reinitialize_room(
        self,
        room_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Reinitialize existing room.
        
        Args:
            room_id: Room ID
            config: Optional new configuration
            
        Returns:
            Optional[Dict[str, Any]]: Error response if failed, None if successful
        """
        try:
            # Get room state
            room_state = room_state_manager.get_room_state(room_id)
            if not room_state:
                return format_error_response(
                    ErrorCodes.ROOM_NOT_FOUND,
                    "Room not found",
                    {'room_id': room_id}
                )
            
            # Transition to initializing state
            await room_state_manager.transition_state(
                room_id,
                RoomState.INITIALIZING,
                {
                    'reinitialization': True,
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
            
            # Apply new configuration if provided
            if config:
                error = await self._configure_room(room_id, config)
                if error:
                    return error
            
            # Reset room stats
            room_monitor.reset_room_stats(room_id)
            
            # Transition back to active state
            await room_state_manager.transition_state(
                room_id,
                RoomState.ACTIVE,
                {
                    'reinitialized_at': datetime.utcnow().isoformat()
                }
            )
            
            return None
            
        except Exception as e:
            logger.error(
                "Error reinitializing room",
                exc_info=True,
                extra={
                    'room_id': room_id,
                    'error': str(e)
                }
            )
            return format_error_response(
                ErrorCodes.INTERNAL_ERROR,
                "Internal error reinitializing room",
                {'error': str(e)}
            )

# Global room initializer instance
room_initializer = RoomInitializer() 