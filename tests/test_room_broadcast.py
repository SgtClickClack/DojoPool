"""Tests for room broadcast functionality."""
import pytest
from dojopool.websockets.room_broadcast import room_broadcaster
from dojopool.websockets.constants import RoomTypes, RoomState, ErrorCodes
from dojopool.websockets.room_state import room_state_manager
from dojopool.websockets.room_monitor import room_monitor
from dojopool.websockets.rooms import room_manager

def test_room_broadcast():
    """Test room broadcast functionality."""
    # Create room
    room = room_manager.create_room("test_room", RoomTypes.GAME)
    assert room is not None
    
    # Add members
    room.add_member("user1")
    room.add_member("user2")
    
    # Broadcast message
    result = room_broadcaster.broadcast(room.id, "test_message")
    assert result is None
    
    # Check broadcast stats
    stats = room_broadcaster.get_broadcast_stats(room.id)
    assert stats["total_broadcasts"] == 1
    assert stats["successful_broadcasts"] == 1

def test_room_broadcast_with_data():
    """Test room broadcast with additional data."""
    # Create room
    room = room_manager.create_room("test_room", RoomTypes.GAME)
    
    # Add members
    room.add_member("user1")
    room.add_member("user2")
    
    # Broadcast message with data
    data = {
        "type": "game_update",
        "score": 100,
        "time": 60
    }
    result = room_broadcaster.broadcast(room.id, "game_update", data)
    assert result is None
    
    # Check broadcast stats
    stats = room_broadcaster.get_broadcast_stats(room.id)
    assert stats["total_broadcasts"] == 1
    assert stats["successful_broadcasts"] == 1

def test_room_broadcast_errors():
    """Test room broadcast error handling."""
    # Test nonexistent room
    with pytest.raises(ValueError):
        room_broadcaster.broadcast("nonexistent", "test_message")
    
    # Create room without members
    room = room_manager.create_room("empty_room", RoomTypes.GAME)
    
    # Test broadcast to empty room
    with pytest.raises(ValueError):
        room_broadcaster.broadcast(room.id, "test_message")
    
    # Check broadcast stats
    stats = room_broadcaster.get_broadcast_stats(room.id)
    assert stats["failed_broadcasts"] == 1 