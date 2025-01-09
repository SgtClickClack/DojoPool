import pytest
import asyncio
import websockets
import json
from datetime import datetime
from dojopool.services.websocket_service import WebSocketService
from dojopool.models.game import Game
from dojopool.models.user import User
from dojopool.extensions import db

@pytest.fixture
async def websocket_client():
    uri = "ws://localhost:8000/ws"
    async with websockets.connect(uri) as websocket:
        yield websocket

@pytest.fixture
def websocket_service():
    return WebSocketService()

class TestWebSocketEvents:
    @pytest.mark.asyncio
    async def test_connection_management(self, websocket_client, sample_user):
        """Test WebSocket connection management"""
        # Test connection establishment
        auth_message = {
            "type": "authenticate",
            "token": "valid_token"
        }
        await websocket_client.send(json.dumps(auth_message))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "authentication_success"
        
        # Test heartbeat
        heartbeat = {
            "type": "heartbeat",
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket_client.send(json.dumps(heartbeat))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "heartbeat_ack"
        
        # Test connection close
        close_message = {"type": "close"}
        await websocket_client.send(json.dumps(close_message))
        with pytest.raises(websockets.ConnectionClosed):
            await websocket_client.recv()

    @pytest.mark.asyncio
    async def test_game_events(self, websocket_client, sample_game):
        """Test game-related WebSocket events"""
        # Test game state update
        game_update = {
            "type": "game_update",
            "game_id": sample_game.id,
            "state": {
                "current_player": 1,
                "score": {"player1": 3, "player2": 2},
                "balls_remaining": [2, 4, 8]
            }
        }
        await websocket_client.send(json.dumps(game_update))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "game_state_updated"
        assert response_data["game_id"] == sample_game.id
        
        # Test player action
        player_action = {
            "type": "player_action",
            "game_id": sample_game.id,
            "action": {
                "type": "shot",
                "target_ball": 2,
                "pocket": "top_right"
            }
        }
        await websocket_client.send(json.dumps(player_action))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "action_processed"
        
        # Test game completion
        game_complete = {
            "type": "game_complete",
            "game_id": sample_game.id,
            "winner_id": 1,
            "final_score": {"player1": 8, "player2": 5}
        }
        await websocket_client.send(json.dumps(game_complete))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "game_completed"
        assert "winner_id" in response_data

    @pytest.mark.asyncio
    async def test_spectator_events(self, websocket_client, sample_game):
        """Test spectator-related WebSocket events"""
        # Test spectator join
        join_message = {
            "type": "spectator_join",
            "game_id": sample_game.id
        }
        await websocket_client.send(json.dumps(join_message))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "spectator_joined"
        assert "game_state" in response_data
        
        # Test spectator message
        chat_message = {
            "type": "spectator_message",
            "game_id": sample_game.id,
            "message": "Great shot!"
        }
        await websocket_client.send(json.dumps(chat_message))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "chat_message"
        assert response_data["message"] == "Great shot!"
        
        # Test spectator leave
        leave_message = {
            "type": "spectator_leave",
            "game_id": sample_game.id
        }
        await websocket_client.send(json.dumps(leave_message))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "spectator_left"

    @pytest.mark.asyncio
    async def test_tournament_events(self, websocket_client, sample_tournament):
        """Test tournament-related WebSocket events"""
        # Test tournament updates
        tournament_update = {
            "type": "tournament_update",
            "tournament_id": sample_tournament.id,
            "round": 1,
            "matches": [
                {"match_id": 1, "player1_id": 1, "player2_id": 2},
                {"match_id": 2, "player1_id": 3, "player2_id": 4}
            ]
        }
        await websocket_client.send(json.dumps(tournament_update))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "tournament_updated"
        assert "matches" in response_data
        
        # Test match results
        match_result = {
            "type": "match_complete",
            "tournament_id": sample_tournament.id,
            "match_id": 1,
            "winner_id": 1,
            "score": {"player1": 3, "player2": 1}
        }
        await websocket_client.send(json.dumps(match_result))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "match_completed"
        assert "next_match" in response_data

    @pytest.mark.asyncio
    async def test_error_handling(self, websocket_client):
        """Test WebSocket error handling"""
        # Test invalid message format
        invalid_message = "invalid json"
        await websocket_client.send(invalid_message)
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "error"
        assert "invalid_format" in response_data["error"]
        
        # Test invalid event type
        invalid_event = {
            "type": "invalid_event",
            "data": {}
        }
        await websocket_client.send(json.dumps(invalid_event))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "error"
        assert "unknown_event" in response_data["error"]
        
        # Test unauthorized action
        unauthorized_action = {
            "type": "admin_action",
            "action": "shutdown"
        }
        await websocket_client.send(json.dumps(unauthorized_action))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "error"
        assert "unauthorized" in response_data["error"]

    @pytest.mark.asyncio
    async def test_reconnection_handling(self, websocket_client, sample_game):
        """Test WebSocket reconnection scenarios"""
        # Test connection drop simulation
        await websocket_client.close()
        
        # Reconnect with state recovery
        uri = "ws://localhost:8000/ws"
        async with websockets.connect(uri) as new_client:
            recovery_message = {
                "type": "recover_state",
                "session_id": "previous_session_id",
                "game_id": sample_game.id
            }
            await new_client.send(json.dumps(recovery_message))
            response = await new_client.recv()
            response_data = json.loads(response)
            assert response_data["type"] == "state_recovered"
            assert "game_state" in response_data

    @pytest.mark.asyncio
    async def test_performance_metrics(self, websocket_client, websocket_service):
        """Test WebSocket performance monitoring"""
        # Test latency measurement
        latency_check = {
            "type": "ping",
            "timestamp": datetime.utcnow().isoformat()
        }
        await websocket_client.send(json.dumps(latency_check))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "pong"
        assert "latency_ms" in response_data
        
        # Test connection quality metrics
        metrics = websocket_service.get_connection_metrics(websocket_client)
        assert "average_latency" in metrics
        assert "packet_loss" in metrics
        assert "connection_stability" in metrics

    @pytest.mark.asyncio
    async def test_bulk_events(self, websocket_client):
        """Test handling of bulk WebSocket events"""
        # Test bulk message processing
        bulk_messages = {
            "type": "bulk_message",
            "messages": [
                {"type": "game_update", "game_id": 1, "state": {}},
                {"type": "chat_message", "message": "Hello"},
                {"type": "player_action", "action": {}}
            ]
        }
        await websocket_client.send(json.dumps(bulk_messages))
        response = await websocket_client.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "bulk_processed"
        assert len(response_data["results"]) == 3 