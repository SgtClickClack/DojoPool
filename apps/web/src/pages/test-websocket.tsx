import { websocketService } from '@/services/WebSocketService';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';

interface TestData {
  playerPositions: any[];
  dojoStatuses: any[];
  gameEvents: any[];
  connectionStatus: string;
  messageCount: number;
}

const TestWebSocketPage: React.FC = () => {
  const [testData, setTestData] = useState<TestData>({
    playerPositions: [],
    dojoStatuses: [],
    gameEvents: [],
    connectionStatus: 'Disconnected',
    messageCount: 0,
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const connectAndTest = async () => {
      try {
        // Connect to WebSocket
        await websocketService.connect();
        setIsConnected(true);
        setTestData((prev) => ({ ...prev, connectionStatus: 'Connected' }));

        // Subscribe to message activity for heartbeat testing
        unsubscribe = websocketService.subscribeToMessageActivity(() => {
          setTestData((prev) => ({
            ...prev,
            messageCount: prev.messageCount + 1,
          }));
        });

        // Subscribe to player position updates
        websocketService.subscribe('player_position_update', (data: any) => {
          setTestData((prev) => ({
            ...prev,
            playerPositions: data.data || data,
          }));
        });

        // Subscribe to dojo status updates
        websocketService.subscribe('dojo_status_update', (data: any) => {
          setTestData((prev) => ({
            ...prev,
            dojoStatuses: data.data?.dojos || data,
          }));
        });

        // Subscribe to game updates
        websocketService.subscribe('game_update', (data: any) => {
          setTestData((prev) => ({
            ...prev,
            gameEvents: [...prev.gameEvents, data.data || data].slice(-10),
          }));
        });

        // Join world map
        websocketService.emit('join_world_map', {
          playerId: 'test-player',
          playerName: 'Test Player',
        });

        // Request initial data
        websocketService.emit('request_player_positions', {});
        websocketService.emit('request_dojo_statuses', {});
      } catch (error) {
        console.error('Failed to connect:', error);
        setTestData((prev) => ({
          ...prev,
          connectionStatus: 'Connection Failed',
        }));
      }
    };

    connectAndTest();

    return () => {
      if (unsubscribe) unsubscribe();
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  const sendTestEvent = () => {
    if (isConnected) {
      websocketService.emit('game_event', {
        type: 'match_started',
        dojoId: 'test-dojo',
        playerId: 'test-player',
      });
    }
  };

  const updateTestPosition = () => {
    if (isConnected) {
      websocketService.emit('update_player_position', {
        playerId: 'test-player',
        playerName: 'Test Player',
        lat: -27.4698 + (Math.random() - 0.5) * 0.01,
        lng: 153.0251 + (Math.random() - 0.5) * 0.01,
        isOnline: true,
      });
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        WebSocket Connection Test
      </Typography>

      {/* Connection Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Chip
            label={testData.connectionStatus}
            color={isConnected ? 'success' : 'error'}
            variant="outlined"
          />
          <Typography variant="body2">
            Messages Received: {testData.messageCount}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={sendTestEvent}
            disabled={!isConnected}
          >
            Send Test Game Event
          </Button>
          <Button
            variant="contained"
            onClick={updateTestPosition}
            disabled={!isConnected}
          >
            Update Test Position
          </Button>
        </Box>
      </Paper>

      {/* Player Positions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Player Positions ({testData.playerPositions.length})
        </Typography>
        {testData.playerPositions.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {testData.playerPositions.map((player, index) => (
              <Box
                key={index}
                sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}
              >
                <Typography variant="body2">
                  {player.playerName} ({player.clan || 'No Clan'})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lat: {player.lat.toFixed(6)}, Lng: {player.lng.toFixed(6)}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No player positions received yet
          </Typography>
        )}
      </Paper>

      {/* Dojo Statuses */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Dojo Statuses ({testData.dojoStatuses.length})
        </Typography>
        {testData.dojoStatuses.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {testData.dojoStatuses.map((dojo, index) => (
              <Box
                key={index}
                sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}
              >
                <Typography variant="body2">
                  Dojo {dojo.id}: {dojo.status}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Controller: {dojo.controller} | Influence: {dojo.influence}% |
                  Players: {dojo.players}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No dojo statuses received yet
          </Typography>
        )}
      </Paper>

      {/* Game Events */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Game Events ({testData.gameEvents.length})
        </Typography>
        {testData.gameEvents.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {testData.gameEvents.map((event, index) => (
              <Box
                key={index}
                sx={{ p: 1, border: '1px solid #ddd', borderRadius: 1 }}
              >
                <Typography variant="body2">
                  {event.type} -{' '}
                  {new Date(event.timestamp).toLocaleTimeString()}
                </Typography>
                {event.dojoId && (
                  <Typography variant="caption" color="text.secondary">
                    Dojo: {event.dojoId}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No game events received yet
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default TestWebSocketPage;
