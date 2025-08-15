import pytest
import asyncio
from datetime import datetime
from typing import AsyncGenerator, Set, Dict, Any, cast
from unittest.mock import Mock, patch, AsyncMock
from fastapi import WebSocket

from dojopool.core.ranking.realtime_service import RealTimeRankingService
from dojopool.models.user import User


@pytest.fixture
async def mock_websocket() -> AsyncGenerator[AsyncMock, None]:
    websocket = AsyncMock(spec=WebSocket)
    websocket.send_json = AsyncMock()
    websocket.receive_text = AsyncMock()
    websocket.send_bytes = AsyncMock()
    websocket.receive_json = AsyncMock(return_value={"type": "pong"})
    yield websocket


@pytest.fixture
async def mock_cache_service() -> AsyncGenerator[AsyncMock, None]:
    cache = AsyncMock()
    cache.get = AsyncMock(return_value=None)
    cache.set = AsyncMock()
    yield cache


@pytest.fixture
async def realtime_service(
    mock_cache_service: AsyncMock,
) -> AsyncGenerator[RealTimeRankingService, None]:
    with patch("dojopool.core.ranking.realtime_service.cache_service", mock_cache_service):
        service = RealTimeRankingService()
        yield service


class TestRealTimeRankingService:
    @pytest.mark.asyncio
    async def test_connect(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test WebSocket connection."""
        user_id = 1
        await realtime_service.connect(mock_websocket, user_id)

        # Verify connection was added
        assert user_id in realtime_service.active_connections
        assert mock_websocket in realtime_service.active_connections[user_id]

        # Verify stats were updated
        assert cast(int, realtime_service.stats["total_connections"]) == 1
        assert user_id in cast(Set[int], realtime_service.stats["connected_users"])
        assert cast(int, realtime_service.stats["peak_connections"]) == 1

    @pytest.mark.asyncio
    async def test_disconnect(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test WebSocket disconnection."""
        user_id = 1
        await realtime_service.connect(mock_websocket, user_id)
        await realtime_service.disconnect(mock_websocket, user_id)

        # Verify connection was removed
        assert user_id not in realtime_service.active_connections
        assert user_id not in cast(Set[int], realtime_service.stats["connected_users"])

    @pytest.mark.asyncio
    async def test_broadcast_ranking_update(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test broadcasting ranking updates."""
        user_id = 1
        ranking_data: Dict[str, Any] = {"rating": 2000, "rank": 1}

        # Connect a client
        await realtime_service.connect(mock_websocket, user_id)

        # Broadcast update
        await realtime_service.broadcast_ranking_update(user_id, ranking_data)

        # Verify message was sent
        mock_websocket.send_json.assert_called_once()
        sent_message = mock_websocket.send_json.call_args[0][0]
        assert sent_message["type"] == "ranking_update"
        assert sent_message["data"] == ranking_data
        assert "timestamp" in sent_message

        # Verify stats were updated
        assert cast(int, realtime_service.stats["messages_sent"]) == 1
        assert cast(int, realtime_service.stats["errors"]) == 0

    @pytest.mark.asyncio
    async def test_broadcast_global_update(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test broadcasting global updates."""
        # Connect multiple clients
        await realtime_service.connect(mock_websocket, 1)
        await realtime_service.connect(AsyncMock(spec=WebSocket), 2)

        # Broadcast update
        await realtime_service.broadcast_global_update(1, 10)

        # Verify messages were sent
        assert mock_websocket.send_json.called
        sent_message = mock_websocket.send_json.call_args[0][0]
        assert sent_message["type"] == "global_update"
        assert "timestamp" in sent_message

        # Verify stats were updated
        assert cast(int, realtime_service.stats["messages_sent"]) == 2
        assert cast(int, realtime_service.stats["errors"]) == 0

    @pytest.mark.asyncio
    async def test_notify_significant_changes(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test significant change notifications."""
        user_id = 1
        await realtime_service.connect(mock_websocket, user_id)

        # Test significant change
        await realtime_service.notify_significant_changes(user_id, 10, 4)  # 6 rank improvement

        # Verify notification was sent
        mock_websocket.send_json.assert_called_once()
        sent_message = mock_websocket.send_json.call_args[0][0]
        assert sent_message["type"] == "significant_change"
        assert sent_message["data"]["change"] == 6

        # Test insignificant change
        mock_websocket.send_json.reset_mock()
        await realtime_service.notify_significant_changes(user_id, 10, 8)  # 2 rank improvement

        # Verify no notification was sent
        assert not mock_websocket.send_json.called

    @pytest.mark.asyncio
    async def test_error_handling(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test error handling during broadcasts."""
        user_id = 1
        await realtime_service.connect(mock_websocket, user_id)

        # Simulate send error
        mock_websocket.send_json.side_effect = Exception("Connection lost")

        # Attempt broadcast
        await realtime_service.broadcast_ranking_update(user_id, {"rating": 2000})

        # Verify error was handled
        assert cast(int, realtime_service.stats["errors"]) == 1
        assert user_id not in realtime_service.active_connections

    @pytest.mark.asyncio
    async def test_connection_limits(self, realtime_service: RealTimeRankingService) -> None:
        """Test connection limits and peak tracking."""
        # Connect maximum allowed clients
        websockets: list[AsyncMock] = []
        for i in range(100):  # Assuming 100 is max
            ws = AsyncMock(spec=WebSocket)
            await realtime_service.connect(ws, i)
            websockets.append(ws)

        # Verify peak connections
        assert cast(int, realtime_service.stats["peak_connections"]) == 100

        # Disconnect some clients
        for ws in websockets[:50]:
            await realtime_service.disconnect(ws, websockets.index(ws))

        # Verify peak is maintained
        assert cast(int, realtime_service.stats["peak_connections"]) == 100
        assert len(cast(Set[int], realtime_service.stats["connected_users"])) == 50

    @pytest.mark.asyncio
    async def test_stats_caching(
        self, realtime_service: RealTimeRankingService, mock_cache_service: AsyncMock
    ) -> None:
        """Test statistics caching."""
        # Connect a client
        await realtime_service.connect(AsyncMock(spec=WebSocket), 1)

        # Verify stats were cached
        assert mock_cache_service.set.called
        cached_stats = mock_cache_service.set.call_args[0][1]
        assert cast(int, cached_stats["total_connections"]) == 1
        assert cast(int, cached_stats["current_connections"]) == 1
        assert len(cast(Set[int], cached_stats["connected_users"])) == 1

    @pytest.mark.asyncio
    async def test_periodic_updates(
        self, realtime_service: RealTimeRankingService, mock_websocket: AsyncMock
    ) -> None:
        """Test periodic update functionality."""
        # Mock ranking service
        realtime_service.ranking_service.update_global_rankings = Mock(return_value=True)

        # Start periodic updates
        update_task = asyncio.create_task(realtime_service.start_periodic_updates())

        # Wait for first update
        await asyncio.sleep(0.1)

        # Cancel task
        update_task.cancel()

        # Verify update was attempted
        assert realtime_service.ranking_service.update_global_rankings.called

    @pytest.mark.asyncio
    async def test_multiple_connections_per_user(
        self, realtime_service: RealTimeRankingService
    ) -> None:
        """Test multiple connections for the same user."""
        user_id = 1
        ws1 = AsyncMock(spec=WebSocket)
        ws2 = AsyncMock(spec=WebSocket)

        # Connect two websockets for same user
        await realtime_service.connect(ws1, user_id)
        await realtime_service.connect(ws2, user_id)

        # Verify both connections are active
        assert len(realtime_service.active_connections[user_id]) == 2

        # Disconnect one
        await realtime_service.disconnect(ws1, user_id)

        # Verify one connection remains
        assert len(realtime_service.active_connections[user_id]) == 1
        assert ws2 in realtime_service.active_connections[user_id]

    @pytest.mark.asyncio
    async def test_get_stats(
        self, realtime_service: RealTimeRankingService, mock_cache_service: AsyncMock
    ) -> None:
        """Test retrieving statistics."""
        # Set up mock stats
        mock_stats: Dict[str, Any] = {
            "total_connections": 10,
            "messages_sent": 100,
            "errors": 5,
            "connected_users": [1, 2, 3],
        }
        mock_cache_service.get.return_value = mock_stats

        # Get stats
        stats = await realtime_service.get_stats()

        # Verify stats were retrieved from cache
        assert stats == mock_stats
        assert mock_cache_service.get.called
