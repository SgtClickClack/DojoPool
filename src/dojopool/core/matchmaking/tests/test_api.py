"""Tests for the matchmaking API endpoints."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from fastapi import FastAPI, WebSocket
from fastapi.testclient import TestClient
from httpx import AsyncClient

from ..api import (
    router,
    get_current_user,
    QueueEntryRequest,
    QueueEntryResponse,
    MatchHistoryResponse,
    UserPreferencesResponse,
    QueueStatusResponse
)
from ..matchmaker import Matchmaker
from ..database import MatchmakingDB
from ..websocket import MatchmakingWebSocket
from .test_config import TEST_USERS, TEST_VENUES

# Create test app
app = FastAPI()
app.include_router(router)

@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)

@pytest.fixture
async def async_client():
    """Create an async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def mock_user():
    """Create a mock user."""
    user = Mock()
    user.id = TEST_USERS['user1']['id']
    user.rating = TEST_USERS['user1']['rating']
    user.play_style = TEST_USERS['user1']['play_style']
    return user

@pytest.fixture
def mock_matchmaker():
    """Create a mock matchmaker."""
    matchmaker = AsyncMock(spec=Matchmaker)
    matchmaker.add_to_queue = AsyncMock(return_value=True)
    matchmaker.remove_from_queue = AsyncMock(return_value=True)
    matchmaker.get_queue_position = AsyncMock(return_value=1)
    matchmaker.get_estimated_wait_time = AsyncMock(return_value=300)
    matchmaker.queue = []
    return matchmaker

@pytest.fixture
def mock_db():
    """Create a mock database."""
    db = AsyncMock(spec=MatchmakingDB)
    db.get_user_match_history = AsyncMock(return_value=[])
    db.get_user_preferences = AsyncMock(return_value={})
    db.store_user_preferences = AsyncMock(return_value=True)
    db.store_blocked_pair = AsyncMock(return_value=True)
    db.remove_blocked_pair = AsyncMock(return_value=True)
    return db

@pytest.fixture
def mock_ws_server():
    """Create a mock WebSocket server."""
    server = AsyncMock(spec=MatchmakingWebSocket)
    server.connections = {}
    server._handle_message = AsyncMock()
    return server

@pytest.mark.asyncio
@pytest.mark.api
class TestMatchmakingAPI:
    """Test cases for matchmaking API endpoints."""

    async def test_join_queue(self, async_client, mock_user, mock_matchmaker):
        """Test joining matchmaking queue."""
        # Override dependency
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        request_data = {
            "preferences": {
                "skill_level": "intermediate",
                "play_style": "aggressive",
                "available_times": ["18:00-20:00"],
                "preferred_venues": [TEST_VENUES['venue1']['id']]
            }
        }
        
        response = await async_client.post("/api/v1/matchmaking/queue", json=request_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == mock_user.id
        assert data["position"] == 1
        assert data["estimated_wait_time"] == 300

    async def test_leave_queue(self, async_client, mock_user, mock_matchmaker):
        """Test leaving matchmaking queue."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        response = await async_client.delete("/api/v1/matchmaking/queue")
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully left queue"

    async def test_get_queue_status(self, async_client, mock_user, mock_matchmaker):
        """Test getting queue status."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        response = await async_client.get("/api/v1/matchmaking/queue/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["position"] == 1
        assert data["estimated_wait_time"] == 300
        assert data["total_in_queue"] == 0
        assert "active_matches" in data

    async def test_get_match_history(self, async_client, mock_user, mock_db):
        """Test getting match history."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingDB] = lambda: mock_db
        
        mock_db.get_user_match_history.return_value = [
            {
                "id": 1,
                "player1_id": mock_user.id,
                "player2_id": TEST_USERS['user2']['id'],
                "venue_id": TEST_VENUES['venue1']['id'],
                "start_time": datetime.now(),
                "end_time": datetime.now() + timedelta(hours=1),
                "score": "8-5",
                "winner_id": mock_user.id,
                "game_type": "eight_ball",
                "status": "completed"
            }
        ]
        
        response = await async_client.get("/api/v1/matchmaking/history")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) == 1
        assert data[0]["player1_id"] == mock_user.id

    async def test_get_preferences(self, async_client, mock_user, mock_db):
        """Test getting user preferences."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingDB] = lambda: mock_db
        
        mock_db.get_user_preferences.return_value = {
            "skill_level": "intermediate",
            "play_style": "aggressive"
        }
        
        response = await async_client.get("/api/v1/matchmaking/preferences")
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == mock_user.id
        assert data["preferences"]["skill_level"] == "intermediate"

    async def test_update_preferences(self, async_client, mock_user, mock_db):
        """Test updating user preferences."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingDB] = lambda: mock_db
        
        preferences = {
            "skill_level": "intermediate",
            "play_style": "aggressive",
            "preferred_venues": [TEST_VENUES['venue1']['id']]
        }
        
        response = await async_client.put(
            "/api/v1/matchmaking/preferences",
            json=preferences
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Preferences updated successfully"

    async def test_block_player(
        self,
        async_client,
        mock_user,
        mock_db,
        mock_matchmaker
    ):
        """Test blocking a player."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingDB] = lambda: mock_db
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        response = await async_client.post(
            f"/api/v1/matchmaking/block/{TEST_USERS['user2']['id']}"
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Player blocked successfully"

    async def test_unblock_player(
        self,
        async_client,
        mock_user,
        mock_db,
        mock_matchmaker
    ):
        """Test unblocking a player."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingDB] = lambda: mock_db
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        response = await async_client.delete(
            f"/api/v1/matchmaking/block/{TEST_USERS['user2']['id']}"
        )
        assert response.status_code == 200
        assert response.json()["message"] == "Player unblocked successfully"

    async def test_websocket_endpoint(self, mock_user, mock_ws_server):
        """Test WebSocket endpoint."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[MatchmakingWebSocket] = lambda: mock_ws_server
        
        websocket = WebSocket(scope={
            'type': 'websocket',
            'path': '/api/v1/matchmaking/ws',
            'headers': []
        })
        websocket.accept = AsyncMock()
        websocket.receive_json = AsyncMock(return_value={'type': 'ping'})
        websocket.send = AsyncMock()
        websocket.close = AsyncMock()
        
        # Test WebSocket connection
        await app.websocket_endpoint(websocket, mock_user, mock_ws_server)
        
        # Verify connection was handled
        assert mock_user.id in mock_ws_server.connections
        mock_ws_server._handle_message.assert_called_once()

    def test_error_handling(self, async_client, mock_user, mock_matchmaker):
        """Test API error handling."""
        app.dependency_overrides[get_current_user] = lambda: mock_user
        app.dependency_overrides[Matchmaker] = lambda: mock_matchmaker
        
        # Test invalid queue entry
        mock_matchmaker.add_to_queue.side_effect = Exception("Queue error")
        response = async_client.post(
            "/api/v1/matchmaking/queue",
            json={"preferences": {}}
        )
        assert response.status_code == 500
        
        # Test invalid authentication
        app.dependency_overrides[get_current_user] = lambda: None
        response = async_client.get("/api/v1/matchmaking/queue/status")
        assert response.status_code == 401

    @classmethod
    def teardown_class(cls):
        """Clean up after tests."""
        app.dependency_overrides.clear()
