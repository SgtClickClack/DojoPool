"""Tests for room notification functionality."""
import pytest
from dojopool.websockets.room_notifications import room_notifications
from dojopool.websockets.constants import RoomTypes, RoomState, ErrorCodes
from dojopool.websockets.room_state import room_state_manager
from dojopool.websockets.room_monitor import room_monitor
from dojopool.websockets.room_broadcast import room_broadcaster
from dojopool.websockets.rooms import room_manager

def test_room_notifications():
    """Test room notification functionality."""
    # Create room
    room = room_manager.create_room("test_room", RoomTypes.GAME)
    assert room is not None
    
    # Subscribe to notifications
    subscription = room_notifications.subscribe(room.id)
    assert subscription is not None
    
    # Send notification
    room_notifications.notify(room.id, "test_event", {"message": "test"})
    
    # Check notification
    notification = subscription.get_next()
    assert notification is not None
    assert notification["event"] == "test_event"
    assert notification["data"]["message"] == "test"

def test_room_state_notifications():
    """Test room state change notifications."""
    # Create room
    room = room_manager.create_room("test_room", RoomTypes.GAME)
    
    # Subscribe to state changes
    subscription = room_notifications.subscribe(room.id)
    
    # Update room state
    room_state_manager.update_state(room.id, RoomState.ACTIVE)
    
    # Check notification
    notification = subscription.get_next()
    assert notification["event"] == "state_changed"
    assert notification["data"]["state"] == RoomState.ACTIVE

def test_room_broadcast_notifications():
    """Test room broadcast notifications."""
    # Create room
    room = room_manager.create_room("test_room", RoomTypes.GAME)
    
    # Subscribe to broadcasts
    subscription = room_notifications.subscribe(room.id)
    
    # Broadcast message
    room_broadcaster.broadcast(room.id, "test_message")
    
    # Check notification
    notification = subscription.get_next()
    assert notification["event"] == "broadcast"
    assert notification["data"]["message"] == "test_message" 