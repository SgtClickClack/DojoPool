"""WebSocket room configuration module.

This module defines room types and their settings.
"""
from datetime import timedelta
from typing import Dict, Any

from .constants import RoomTypes

# Room type configurations
ROOM_CONFIGS: Dict[str, Dict[str, Any]] = {
    RoomTypes.GAME: {
        'name': 'Game Room',
        'description': 'Room for a single game session',
        'max_members': 2,
        'idle_timeout': timedelta(minutes=30),
        'requires_auth': True,
        'allow_spectators': False,
        'allow_chat': True,
        'auto_close': True,
        'metadata_schema': {
            'game_id': {'type': 'string', 'required': True},
            'game_type': {'type': 'string', 'required': True},
            'game_mode': {'type': 'string', 'required': True},
            'game_status': {'type': 'string', 'required': True},
            'game_settings': {'type': 'dict', 'required': False}
        }
    },
    RoomTypes.TOURNAMENT: {
        'name': 'Tournament Room',
        'description': 'Room for a tournament session',
        'max_members': 100,
        'idle_timeout': timedelta(hours=2),
        'requires_auth': True,
        'allow_spectators': True,
        'allow_chat': True,
        'auto_close': False,
        'metadata_schema': {
            'tournament_id': {'type': 'string', 'required': True},
            'tournament_type': {'type': 'string', 'required': True},
            'tournament_status': {'type': 'string', 'required': True},
            'tournament_settings': {'type': 'dict', 'required': False}
        }
    },
    RoomTypes.LOBBY: {
        'name': 'Lobby Room',
        'description': 'Room for matchmaking and general chat',
        'max_members': 200,
        'idle_timeout': timedelta(hours=4),
        'requires_auth': True,
        'allow_spectators': True,
        'allow_chat': True,
        'auto_close': False,
        'metadata_schema': {
            'lobby_type': {'type': 'string', 'required': True},
            'lobby_status': {'type': 'string', 'required': True},
            'lobby_settings': {'type': 'dict', 'required': False}
        }
    },
    RoomTypes.PRIVATE: {
        'name': 'Private Room',
        'description': 'Private room for invited players',
        'max_members': 10,
        'idle_timeout': timedelta(hours=1),
        'requires_auth': True,
        'allow_spectators': False,
        'allow_chat': True,
        'auto_close': True,
        'metadata_schema': {
            'owner_id': {'type': 'string', 'required': True},
            'room_name': {'type': 'string', 'required': True},
            'room_settings': {'type': 'dict', 'required': False},
            'invited_users': {'type': 'list', 'required': False}
        }
    }
}

def get_room_config(room_type: str) -> Dict[str, Any]:
    """Get room configuration for a specific room type.
    
    Args:
        room_type: Room type
        
    Returns:
        Dict[str, Any]: Room configuration
        
    Raises:
        ValueError: If room type is invalid
    """
    if room_type not in ROOM_CONFIGS:
        raise ValueError(f"Invalid room type: {room_type}")
    return ROOM_CONFIGS[room_type]

def validate_room_metadata(room_type: str, metadata: Dict[str, Any]) -> None:
    """Validate room metadata against schema.
    
    Args:
        room_type: Room type
        metadata: Room metadata
        
    Raises:
        ValueError: If metadata is invalid
    """
    config = get_room_config(room_type)
    schema = config['metadata_schema']
    
    # Check required fields
    for field, field_schema in schema.items():
        if field_schema.get('required', False):
            if field not in metadata:
                raise ValueError(f"Missing required field: {field}")
            
            # Type validation
            field_type = field_schema['type']
            value = metadata[field]
            
            if field_type == 'string' and not isinstance(value, str):
                raise ValueError(f"Field {field} must be a string")
            elif field_type == 'dict' and not isinstance(value, dict):
                raise ValueError(f"Field {field} must be a dictionary")
            elif field_type == 'list' and not isinstance(value, list):
                raise ValueError(f"Field {field} must be a list")

def get_default_metadata(room_type: str) -> Dict[str, Any]:
    """Get default metadata for a room type.
    
    Args:
        room_type: Room type
        
    Returns:
        Dict[str, Any]: Default metadata
    """
    config = get_room_config(room_type)
    schema = config['metadata_schema']
    
    defaults = {}
    for field, field_schema in schema.items():
        if not field_schema.get('required', False):
            if field_schema['type'] == 'dict':
                defaults[field] = {}
            elif field_schema['type'] == 'list':
                defaults[field] = []
            elif field_schema['type'] == 'string':
                defaults[field] = ''
    
    return defaults 