'use client';

import { LocationOn, People, Star } from '@mui/icons-material';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import {
  DojoStatusUpdate,
  GameUpdate,
  PlayerPosition,
  websocketService,
} from '../../frontend/services/services/network/WebSocketService';

interface DojoData {
  id: string;
  name: string;
  status: 'controlled' | 'rival' | 'neutral';
  controller: string;
  influence: number;
  players: number;
  distance: string;
  color: string;
  x: number;
  y: number;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface WorldHubMapProps {
  height?: string | number;
}

// Initial dojo data structure - will be updated via WebSocket
const initialDojos: DojoData[] = [
  {
    id: '1',
    name: 'Downtown Dojo',
    status: 'controlled',
    controller: 'Phoenix Warriors',
    influence: 85,
    players: 12,
    distance: '0.2 km',
    color: '#00ff9d',
    x: 20,
    y: 30,
    coordinates: { lat: -27.4698, lng: 153.0251 },
  },
  {
    id: '2',
    name: 'Pool Masters Arena',
    status: 'rival',
    controller: 'Shadow Clan',
    influence: 72,
    players: 8,
    distance: '0.8 km',
    color: '#ff6b6b',
    x: 70,
    y: 40,
    coordinates: { lat: -27.47, lng: 153.0255 },
  },
  {
    id: '3',
    name: 'Elite Pool Club',
    status: 'neutral',
    controller: 'None',
    influence: 45,
    players: 15,
    distance: '1.2 km',
    color: '#00a8ff',
    x: 40,
    y: 70,
    coordinates: { lat: -27.4695, lng: 153.0248 },
  },
  {
    id: '4',
    name: 'Championship Hall',
    status: 'controlled',
    controller: 'Phoenix Warriors',
    influence: 93,
    players: 6,
    distance: '2.1 km',
    color: '#00ff9d',
    x: 80,
    y: 80,
    coordinates: { lat: -27.4702, lng: 153.0258 },
  },
];

const WorldHubMap: React.FC<WorldHubMapProps> = ({ height = '100%' }) => {
  const [selectedDojo, setSelectedDojo] = useState<DojoData | null>(null);
  const [dojos, setDojos] = useState<DojoData[]>(initialDojos);
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'controlled':
        return '#00ff9d';
      case 'rival':
        return '#ff6b6b';
      case 'neutral':
        return '#00a8ff';
      default:
        return '#888';
    }
  };

  // WebSocket connection and event handling
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        setConnectionStatus('connecting');
        await websocketService.connect();
        setIsConnected(true);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    // Subscribe to player position updates
    const unsubscribePlayerPositions =
      websocketService.subscribeToPlayerPositions(
        (positions: PlayerPosition[]) => {
          setPlayerPositions(positions);
        }
      );

    // Subscribe to dojo status updates
    const unsubscribeDojoUpdates = websocketService.subscribe(
      'dojo_status_update',
      (data: DojoStatusUpdate['data']) => {
        if (data && data.dojos) {
          setDojos((prevDojos) => {
            return prevDojos.map((dojo) => {
              const updatedDojo = data.dojos.find((d) => d.id === dojo.id);
              if (updatedDojo) {
                return {
                  ...dojo,
                  status: updatedDojo.status,
                  controller: updatedDojo.controller,
                  influence: updatedDojo.influence,
                  players: updatedDojo.players,
                };
              }
              return dojo;
            });
          });
        }
      }
    );

    // Subscribe to general game updates
    const unsubscribeGameUpdates = websocketService.subscribe(
      'game_update',
      (data: GameUpdate['data']) => {
        if (data && data.type === 'dojo_captured') {
          // Handle dojo capture events
          setDojos((prevDojos) => {
            return prevDojos.map((dojo) => {
              if (dojo.id === data.dojoId) {
                return {
                  ...dojo,
                  status: data.newStatus,
                  controller: data.newController,
                  influence: data.newInfluence,
                };
              }
              return dojo;
            });
          });
        }
      }
    );

    // Request initial data
    websocketService.requestPlayerPositions();

    // Cleanup function
    return () => {
      unsubscribePlayerPositions();
      unsubscribeDojoUpdates();
      unsubscribeGameUpdates();
      websocketService.disconnect();
    };
  }, []);

  // Handle player position updates
  const handlePlayerPositionUpdate = useCallback(
    (position: Omit<PlayerPosition, 'timestamp'>) => {
      websocketService.updatePlayerPosition(position);
    },
    []
  );

  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#00ff9d';
      case 'connecting':
        return '#ffaa00';
      case 'disconnected':
        return '#ff6b6b';
      default:
        return '#888';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Updates Active';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Connection Lost';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {/* Connection Status Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: 1,
          borderRadius: 1,
          border: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: getConnectionStatusColor(),
            animation:
              connectionStatus === 'connecting' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <Typography variant="caption" sx={{ color: '#fff', fontSize: '10px' }}>
          {getConnectionStatusText()}
        </Typography>
        <Typography variant="caption" sx={{ color: '#888', fontSize: '10px' }}>
          {playerPositions.length} players online
        </Typography>
      </Box>

      {/* Mock Map Background */}
      <Paper
        sx={{
          height: '100%',
          width: '100%',
          background:
            'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid Lines */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Dojo Markers */}
        {dojos.map((dojo) => (
          <Box
            key={dojo.id}
            sx={{
              position: 'absolute',
              left: `${dojo.x}%`,
              top: `${dojo.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 2,
            }}
            onClick={() => setSelectedDojo(dojo)}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                backgroundColor: dojo.color,
                border: '2px solid #fff',
                boxShadow: `0 0 10px ${dojo.color}`,
                position: 'relative',
              }}
            />

            {/* Dojo Name Label */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.7)',
                padding: '2px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              {dojo.name}
            </Typography>
          </Box>
        ))}

        {/* Player Position Markers */}
        {playerPositions.map((player) => (
          <Box
            key={player.playerId}
            sx={{
              position: 'absolute',
              left: `${((player.lng - 153.024) / 0.002) * 100}%`,
              top: `${((player.lat + 27.4705) / 0.001) * 100}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'pointer',
              zIndex: 3,
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: player.clan ? '#ffaa00' : '#00a8ff',
                border: '2px solid #fff',
                boxShadow: '0 0 8px rgba(255,170,0,0.6)',
                position: 'relative',
              }}
            />

            {/* Player Name Label */}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#fff',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '1px 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
                fontSize: '8px',
                fontWeight: 'bold',
              }}
            >
              {player.playerName}
            </Typography>
          </Box>
        ))}

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 2,
            borderRadius: 2,
            border: '1px solid #333',
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#fff', fontWeight: 'bold', mb: 1, display: 'block' }}
          >
            Territory Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#00ff9d',
                mr: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Controlled
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ff6b6b',
                mr: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Rival
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#00a8ff',
                mr: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Neutral
            </Typography>
          </Box>

          {/* Player Legend */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 2,
              pt: 2,
              borderTop: '1px solid #333',
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: '#ffaa00',
                mr: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#ccc' }}>
              Players
            </Typography>
          </Box>
        </Box>

        {/* Info Panel */}
        {selectedDojo && (
          <Paper
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              width: 300,
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: `2px solid ${selectedDojo.color}`,
              borderRadius: 2,
              padding: 2,
              zIndex: 3,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Typography
                variant="h6"
                sx={{ color: selectedDojo.color, fontWeight: 'bold' }}
              >
                {selectedDojo.name}
              </Typography>
              <Button
                size="small"
                onClick={() => setSelectedDojo(null)}
                sx={{ color: '#888', minWidth: 'auto', p: 0.5 }}
              >
                ✕
              </Button>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationOn
                sx={{ color: selectedDojo.color, fontSize: 16, mr: 0.5 }}
              />
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                {selectedDojo.distance}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <People
                sx={{ color: selectedDojo.color, fontSize: 16, mr: 0.5 }}
              />
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                {selectedDojo.players} players
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Star sx={{ color: selectedDojo.color, fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2" sx={{ color: '#ccc' }}>
                {selectedDojo.influence}% influence
              </Typography>
            </Box>

            <Chip
              label={selectedDojo.status.toUpperCase()}
              sx={{
                backgroundColor: getStatusColor(selectedDojo.status),
                color: '#000',
                fontWeight: 'bold',
                fontSize: '0.7rem',
              }}
            />

            {selectedDojo.controller !== 'None' && (
              <Typography
                variant="caption"
                sx={{ color: '#888', display: 'block', mt: 1 }}
              >
                Controlled by: {selectedDojo.controller}
              </Typography>
            )}
          </Paper>
        )}
      </Paper>

      {/* CSS Animation for connection status */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default WorldHubMap;
