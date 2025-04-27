import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from typing import Dict, Any

from src.core.network.NetworkTransport import NetworkTransport
from src.core.network.NetworkConsensusIntegration import NetworkConsensusIntegration
from src.core.consensus.ConsensusManager import ConsensusManager
from src.core.replication.StateReplicator import StateReplicator
from src.core.consistency.VectorClock import VectorClock
from src.core.network.types import NetworkError, NetworkMessageType

# Mock configurations
TEST_CONFIG = {
    "nodeId": "test-node-1",
    "nodes": ["test-node-1", "test-node-2", "test-node-3"],
    "port": 8000,
    "heartbeatInterval": 1000,
    "electionTimeout": 3000,
    "syncInterval": 2000
}

MOCK_GAME_STATE = {
    "id": "test-game-1",
    "status": "active",
    "players": ["player1", "player2"],
    "score": {"player1": 0, "player2": 0}
}

@pytest.fixture
def network_integration():
    """Create a mocked network integration instance."""
    with patch("src.core.network.NetworkTransport") as mock_transport, \
         patch("src.core.consensus.ConsensusManager") as mock_consensus, \
         patch("src.core.replication.StateReplicator") as mock_replicator:
        
        integration = NetworkConsensusIntegration(TEST_CONFIG)
        
        # Setup mock methods
        integration.networkTransport = mock_transport.return_value
        integration.networkTransport.start = AsyncMock()
        integration.networkTransport.stop = AsyncMock()
        integration.networkTransport.send = AsyncMock()
        
        integration.consensusManager = mock_consensus.return_value
        integration.consensusManager.start = AsyncMock()
        integration.consensusManager.stop = AsyncMock()
        integration.consensusManager.isLeader = MagicMock(return_value=False)
        
        integration.stateReplicator = mock_replicator.return_value
        integration.stateReplicator.getState = MagicMock(return_value=MOCK_GAME_STATE)
        integration.stateReplicator.stop = MagicMock()
        
        yield integration

async def test_network_initialization(network_integration):
    """Test network transport initialization."""
    # Test successful initialization
    await network_integration.start()
    network_integration.networkTransport.start.assert_called_once()
    network_integration.consensusManager.start.assert_called_once()
    
    # Test initialization with network error
    network_integration.networkTransport.start.reset_mock()
    network_integration.networkTransport.start.side_effect = NetworkError("Connection failed")
    
    with pytest.raises(NetworkError):
        await network_integration.start()

async def test_network_shutdown(network_integration):
    """Test network transport shutdown."""
    # Test successful shutdown
    await network_integration.stop()
    network_integration.consensusManager.stop.assert_called_once()
    network_integration.networkTransport.stop.assert_called_once()
    network_integration.stateReplicator.stop.assert_called_once()
    
    # Test shutdown with error
    network_integration.networkTransport.stop.reset_mock()
    network_integration.networkTransport.stop.side_effect = NetworkError("Shutdown failed")
    
    with pytest.raises(NetworkError):
        await network_integration.stop()

async def test_state_replication(network_integration):
    """Test state replication functionality."""
    # Test getting current state
    state = network_integration.getState()
    assert state == MOCK_GAME_STATE
    network_integration.stateReplicator.getState.assert_called_once()
    
    # Test state update event
    mock_state = {"id": "test-game-2", "status": "completed"}
    network_integration.stateReplicator.emit("stateUpdated", mock_state)
    # Add assertions for state update event handling

async def test_consensus_management(network_integration):
    """Test consensus management functionality."""
    # Test leader status
    assert not network_integration.isLeader()
    network_integration.consensusManager.isLeader.assert_called_once()
    
    # Test leader election
    network_integration.consensusManager.emit("leader:elected", "test-node-1")
    # Add assertions for leader election event handling
    
    # Test consensus state changes
    network_integration.consensusManager.emit("state:change", "follower")
    # Add assertions for consensus state change handling

async def test_network_events(network_integration):
    """Test network event handling."""
    # Test node connection event
    network_integration.networkTransport.emit("connect", "test-node-2")
    # Add assertions for connection event handling
    
    # Test node disconnection event
    network_integration.networkTransport.emit("disconnect", "test-node-2")
    # Add assertions for disconnection event handling
    
    # Test error event
    mock_error = NetworkError("Test error")
    network_integration.networkTransport.emit("error", mock_error)
    # Add assertions for error event handling

async def test_message_handling(network_integration):
    """Test network message handling."""
    # Test sending message
    await network_integration.networkTransport.send(
        "test-node-2",
        NetworkMessageType.STATE_SYNC,
        {"state": MOCK_GAME_STATE}
    )
    network_integration.networkTransport.send.assert_called_once()
    
    # Test receiving message
    mock_message = {
        "type": NetworkMessageType.STATE_SYNC,
        "data": {"state": MOCK_GAME_STATE}
    }
    network_integration.networkTransport.emit("message", "test-node-2", mock_message)
    # Add assertions for message handling

async def test_error_recovery(network_integration):
    """Test error recovery mechanisms."""
    # Test network disconnect recovery
    network_integration.networkTransport.emit("disconnect", "test-node-2")
    await asyncio.sleep(0.1)  # Allow for reconnection attempt
    # Add assertions for reconnection attempt
    
    # Test consensus error recovery
    mock_error = Exception("Consensus error")
    network_integration.consensusManager.emit("error", mock_error)
    # Add assertions for consensus error recovery
    
    # Test state replication error recovery
    mock_error = Exception("Replication error")
    network_integration.stateReplicator.emit("error", mock_error)
    # Add assertions for replication error recovery

async def test_vector_clock_integration(network_integration):
    """Test vector clock integration."""
    # Test vector clock updates
    mock_event = {
        "type": "game_update",
        "data": {"score": 10},
        "timestamp": {"node1": 1, "node2": 2}
    }
    network_integration.vectorClock.increment()
    # Add assertions for vector clock updates
    
    # Test causality tracking
    network_integration.vectorClock.update({"test-node-2": 3})
    # Add assertions for causality tracking 