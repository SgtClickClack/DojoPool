"""Tests for room initialization functionality."""
import pytest
from dojopool.websockets.room_init import room_initializer
from dojopool.websockets.constants import RoomTypes, RoomState, ErrorCodes
from dojopool.websockets.room_state import room_state_manager
from dojopool.websockets.room_monitor import room_monitor
from dojopool.websockets.rooms import room_manager

def test_room_initialization():
    """Test room initialization."""
    # Initialize room
    room = room_initializer.initialize_room(
        room_id="test_room",
        room_type=RoomTypes.GAME,
        capacity=2
    )
    assert room is not None
    assert room.id == "test_room"
    assert room.type == RoomTypes.GAME
    assert room.capacity == 2
    
    # Check room state
    state = room_state_manager.get_state(room.id)
    assert state == RoomState.INITIALIZED
    
    # Check room monitoring
    stats = room_monitor.get_room_stats(room.id)
    assert stats["member_count"] == 0
    assert stats["state"] == RoomState.INITIALIZED

def test_room_initialization_with_config():
    """Test room initialization with configuration."""
    # Initialize room with config
    config = {
        "game_type": "eight_ball",
        "time_limit": 3600,
        "score_limit": 100
    }
    room = room_initializer.initialize_room(
        room_id="test_room",
        room_type=RoomTypes.GAME,
        capacity=2,
        config=config
    )
    assert room is not None
    assert room.config == config
    
    # Check room state
    state = room_state_manager.get_state(room.id)
    assert state == RoomState.INITIALIZED
    
    # Check room monitoring
    stats = room_monitor.get_room_stats(room.id)
    assert stats["config"] == config

def test_room_initialization_errors():
    """Test room initialization errors."""
    # Test invalid room type
    with pytest.raises(ValueError):
        room_initializer.initialize_room(
            room_id="test_room",
            room_type="invalid_type",
            capacity=2
        )
    
    # Test invalid capacity
    with pytest.raises(ValueError):
        room_initializer.initialize_room(
            room_id="test_room",
            room_type=RoomTypes.GAME,
            capacity=0
        )
    
    # Test duplicate room
    room = room_initializer.initialize_room(
        room_id="test_room",
        room_type=RoomTypes.GAME,
        capacity=2
    )
    with pytest.raises(ValueError):
        room_initializer.initialize_room(
            room_id="test_room",
            room_type=RoomTypes.GAME,
            capacity=2
        ) 