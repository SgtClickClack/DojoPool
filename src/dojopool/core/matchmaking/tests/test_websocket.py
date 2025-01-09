"""Tests for the matchmaking WebSocket module."""

import pytest
import json
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
import websockets
from websockets.server import WebSocketServerProtocol
from websockets.exceptions import ConnectionClosed

from ..websocket import MatchmakingWebSocket
from ..events import (
    MatchFoundEvent,
    MatchAcceptedEvent,
    MatchDeclinedEvent,
    MatchCancelledEvent,
    MatchStartedEvent,
    MatchCompletedEvent
)
from ..exceptions import WebSocketError
from .test_config import TEST_USERS, TEST_VENUES

@pytest.mark.asyncio
@pytest.mark.websocket
class TestMatchmakingWebSocket:
    """Test cases for MatchmakingWebSocket class."""

    @pytest.fixture
    async def websocket_server(self):
        """Create a WebSocket server instance for testing."""
        server = MatchmakingWebSocket()
        yield server
        await server.stop()

    @pytest.fixture
    def mock_websocket(self):
        """Create a mock WebSocket connection."""
        websocket = AsyncMock(spec=WebSocketServerProtocol)
        websocket.send = AsyncMock()
        websocket.recv = AsyncMock()
        websocket.close = AsyncMock()
        return websocket

    async def test_start_server(self, websocket_server):
        """Test starting WebSocket server."""
        with patch('websockets.serve', return_value=AsyncMock()):
            await websocket_server.start()
            assert websocket_server.running is True

    async def test_start_server_error(self, websocket_server):
        """Test server start error handling."""
        with patch('websockets.serve', side_effect=Exception("Server error")):
            with pytest.raises(WebSocketError):
                await websocket_server.start()

    async def test_stop_server(self, websocket_server):
        """Test stopping WebSocket server."""
        websocket_server.server = AsyncMock()
        websocket_server.running = True
        
        await websocket_server.stop()
        assert websocket_server.running is False
        assert len(websocket_server.connections) == 0

    async def test_authenticate_connection(self, websocket_server):
        """Test connection authentication."""
        auth_data = {'token': f"{TEST_USERS['user1']['id']}:test_token"}
        user_id = await websocket_server._authenticate_connection(auth_data)
        assert user_id == TEST_USERS['user1']['id']

    async def test_authenticate_connection_invalid(self, websocket_server):
        """Test invalid connection authentication."""
        auth_data = {'token': None}
        user_id = await websocket_server._authenticate_connection(auth_data)
        assert user_id is None

    async def test_handle_connection(self, websocket_server, mock_websocket):
        """Test handling WebSocket connection."""
        mock_websocket.recv.return_value = json.dumps({
            'token': f"{TEST_USERS['user1']['id']}:test_token"
        })
        
        await websocket_server._handle_connection(mock_websocket, "/")
        assert TEST_USERS['user1']['id'] in websocket_server.connections

    async def test_handle_connection_auth_failed(self, websocket_server, mock_websocket):
        """Test connection handling with failed authentication."""
        mock_websocket.recv.return_value = json.dumps({'token': None})
        
        await websocket_server._handle_connection(mock_websocket, "/")
        mock_websocket.close.assert_called_once_with(1008, "Authentication failed")

    async def test_handle_message_ping(self, websocket_server, mock_websocket):
        """Test handling ping message."""
        data = {'type': 'ping'}
        await websocket_server._handle_message(TEST_USERS['user1']['id'], data, mock_websocket)
        
        mock_websocket.send.assert_called_once()
        sent_data = json.loads(mock_websocket.send.call_args[0][0])
        assert sent_data['type'] == 'pong'

    async def test_handle_message_subscribe(self, websocket_server, mock_websocket):
        """Test handling subscribe message."""
        data = {
            'type': 'subscribe',
            'event_types': ['match_found', 'match_started']
        }
        await websocket_server._handle_message(TEST_USERS['user1']['id'], data, mock_websocket)
        
        mock_websocket.send.assert_called_once()
        sent_data = json.loads(mock_websocket.send.call_args[0][0])
        assert sent_data['type'] == 'subscribed'
        assert sent_data['event_types'] == data['event_types']

    async def test_handle_message_unsubscribe(self, websocket_server, mock_websocket):
        """Test handling unsubscribe message."""
        data = {
            'type': 'unsubscribe',
            'event_types': ['match_found']
        }
        await websocket_server._handle_message(TEST_USERS['user1']['id'], data, mock_websocket)
        
        mock_websocket.send.assert_called_once()
        sent_data = json.loads(mock_websocket.send.call_args[0][0])
        assert sent_data['type'] == 'unsubscribed'
        assert sent_data['event_types'] == data['event_types']

    async def test_handle_message_invalid(self, websocket_server, mock_websocket):
        """Test handling invalid message."""
        data = {'type': 'unknown'}
        await websocket_server._handle_message(TEST_USERS['user1']['id'], data, mock_websocket)
        
        mock_websocket.send.assert_called_once()
        sent_data = json.loads(mock_websocket.send.call_args[0][0])
        assert sent_data['type'] == 'error'
        assert 'Unknown message type' in sent_data['message']

    async def test_notify_user(self, websocket_server, mock_websocket):
        """Test sending notification to user."""
        user_id = TEST_USERS['user1']['id']
        websocket_server.connections[user_id] = {mock_websocket}
        
        event = MatchFoundEvent(
            TEST_USERS['user1'],
            TEST_USERS['user2'],
            TEST_VENUES['venue1'],
            datetime.now()
        )
        
        await websocket_server.notify_user(user_id, event)
        mock_websocket.send.assert_called_once()
        sent_data = json.loads(mock_websocket.send.call_args[0][0])
        assert sent_data['type'] == 'event'
        assert sent_data['event_type'] == event.event_type

    async def test_notify_user_connection_error(self, websocket_server, mock_websocket):
        """Test notification with connection error."""
        user_id = TEST_USERS['user1']['id']
        websocket_server.connections[user_id] = {mock_websocket}
        mock_websocket.send.side_effect = Exception("Connection error")
        
        event = MatchFoundEvent(
            TEST_USERS['user1'],
            TEST_USERS['user2'],
            TEST_VENUES['venue1'],
            datetime.now()
        )
        
        await websocket_server.notify_user(user_id, event)
        mock_websocket.close.assert_called_once_with(1011, "Failed to send message")
        assert len(websocket_server.connections[user_id]) == 0

    async def test_broadcast_event(self, websocket_server, mock_websocket):
        """Test broadcasting event to multiple users."""
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        websocket_server.connections[user1_id] = {mock_websocket}
        websocket_server.connections[user2_id] = {mock_websocket}
        
        event = MatchStartedEvent(1, user1_id, user2_id, TEST_VENUES['venue1']['id'])
        await websocket_server.broadcast_event(event, {user1_id, user2_id})
        
        assert mock_websocket.send.call_count == 2

    async def test_get_connected_users(self, websocket_server, mock_websocket):
        """Test getting connected users."""
        user1_id = TEST_USERS['user1']['id']
        user2_id = TEST_USERS['user2']['id']
        websocket_server.connections[user1_id] = {mock_websocket}
        websocket_server.connections[user2_id] = {mock_websocket}
        
        connected_users = await websocket_server.get_connected_users()
        assert connected_users == {user1_id, user2_id}

    async def test_get_user_connections(self, websocket_server, mock_websocket):
        """Test getting user connections."""
        user_id = TEST_USERS['user1']['id']
        websocket_server.connections[user_id] = {mock_websocket}
        
        connections = await websocket_server.get_user_connections(user_id)
        assert connections == {mock_websocket}

    async def test_close_user_connections(self, websocket_server, mock_websocket):
        """Test closing user connections."""
        user_id = TEST_USERS['user1']['id']
        websocket_server.connections[user_id] = {mock_websocket}
        
        await websocket_server.close_user_connections(user_id)
        mock_websocket.close.assert_called_once()
        assert user_id not in websocket_server.connections

    async def test_error_handling(self, websocket_server, mock_websocket):
        """Test general error handling."""
        mock_websocket.recv.side_effect = ConnectionClosed(1000, "Normal closure")
        
        await websocket_server._handle_connection(mock_websocket, "/")
        mock_websocket.close.assert_not_called()  # Connection already closed
