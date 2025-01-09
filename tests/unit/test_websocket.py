"""Test websocket functionality."""
import pytest
from datetime import datetime, timedelta

from dojopool.core.websocket import websocket_service
from dojopool.models import User, Game, Match

def test_websocket_connection():
    """Test websocket connection."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    assert connection.is_connected is True
    assert connection.user_id == user.id
    assert connection.connection_id is not None

def test_websocket_message():
    """Test websocket messaging."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    message = websocket_service.send_message(
        connection_id=connection.connection_id,
        message_type="test",
        data={"content": "Hello, World!"}
    )
    
    assert message.sent is True
    assert message.message_type == "test"
    assert message.data["content"] == "Hello, World!"

def test_websocket_broadcast():
    """Test websocket broadcasting."""
    users = [
        User(username=f"user{i}", email=f"user{i}@example.com")
        for i in range(3)
    ]
    connections = [
        websocket_service.connect(user.id)
        for user in users
    ]
    
    broadcast = websocket_service.broadcast_message(
        message_type="announcement",
        data={"content": "Broadcast message"}
    )
    
    assert broadcast.success is True
    assert broadcast.recipient_count == len(users)
    assert all(r.received for r in broadcast.receipts)

def test_websocket_room():
    """Test websocket room functionality."""
    users = [
        User(username=f"user{i}", email=f"user{i}@example.com")
        for i in range(3)
    ]
    connections = [
        websocket_service.connect(user.id)
        for user in users
    ]
    
    room = websocket_service.create_room("test_room")
    for connection in connections:
        websocket_service.join_room(room.id, connection.connection_id)
    
    room_message = websocket_service.send_room_message(
        room_id=room.id,
        message_type="room_message",
        data={"content": "Room message"}
    )
    
    assert room_message.success is True
    assert room_message.recipient_count == len(users)

def test_websocket_authentication():
    """Test websocket authentication."""
    user = User(username="test_user", email="test@example.com")
    
    # Test valid authentication
    auth = websocket_service.authenticate(
        user_id=user.id,
        token="valid_token"
    )
    assert auth.success is True
    
    # Test invalid authentication
    with pytest.raises(ValueError):
        websocket_service.authenticate(
            user_id=user.id,
            token="invalid_token"
        )

def test_websocket_heartbeat():
    """Test websocket heartbeat."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    heartbeat = websocket_service.send_heartbeat(connection.connection_id)
    assert heartbeat.received is True
    assert heartbeat.latency < 1000  # Less than 1 second

def test_websocket_reconnection():
    """Test websocket reconnection."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    # Simulate disconnect
    websocket_service.disconnect(connection.connection_id)
    assert connection.is_connected is False
    
    # Reconnect
    new_connection = websocket_service.reconnect(
        user_id=user.id,
        previous_connection_id=connection.connection_id
    )
    assert new_connection.is_connected is True
    assert new_connection.connection_id != connection.connection_id

def test_websocket_error_handling():
    """Test websocket error handling."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    # Test invalid message type
    with pytest.raises(ValueError):
        websocket_service.send_message(
            connection_id=connection.connection_id,
            message_type="invalid_type",
            data={}
        )
    
    # Test invalid connection ID
    with pytest.raises(ValueError):
        websocket_service.send_message(
            connection_id="invalid_id",
            message_type="test",
            data={}
        )

def test_websocket_rate_limiting():
    """Test websocket rate limiting."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    # Send messages rapidly
    messages_sent = 0
    for i in range(100):
        try:
            websocket_service.send_message(
                connection_id=connection.connection_id,
                message_type="test",
                data={"content": f"Message {i}"}
            )
            messages_sent += 1
        except ValueError:
            break
    
    assert messages_sent < 100  # Rate limit should kick in

def test_websocket_metrics():
    """Test websocket metrics collection."""
    user = User(username="test_user", email="test@example.com")
    connection = websocket_service.connect(user.id)
    
    # Generate some activity
    for i in range(5):
        websocket_service.send_message(
            connection_id=connection.connection_id,
            message_type="test",
            data={"content": f"Message {i}"}
        )
    
    metrics = websocket_service.get_metrics(connection.connection_id)
    assert metrics.messages_sent == 5
    assert metrics.bytes_transferred > 0
    assert metrics.average_latency > 0 