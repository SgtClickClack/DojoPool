import { useCallback, useEffect, useState } from 'react';
import { DojoData, PlayerData, dojoService } from '../services/dojoService';
import {
  PlayerPosition,
  websocketService,
} from '../services/services/network/WebSocketService';

export interface MapData {
  dojos: DojoData[];
  playerData: PlayerData | null;
  playerPositions: PlayerPosition[];
  isLoading: boolean;
  error: string | null;
  isWebSocketConnected: boolean;
  messageActivity: boolean; // Track when messages are received for heartbeat
}

export const useMapData = (
  centerLat: number,
  centerLng: number,
  radius: number = 10000
) => {
  const [dojos, setDojos] = useState<DojoData[]>([]);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [playerPositions, setPlayerPositions] = useState<PlayerPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [messageActivity, setMessageActivity] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch player data to get clan information
      const player = await dojoService.getPlayerData();
      setPlayerData(player);

      // Fetch dojos in the specified area
      const dojosData = await dojoService.getDojos(
        centerLat,
        centerLng,
        radius
      );
      setDojos(dojosData);
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch map data');
    } finally {
      setIsLoading(false);
    }
  }, [centerLat, centerLng, radius]);

  // Initialize WebSocket connection and subscribe to player position updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let messageActivityUnsubscribe: (() => void) | null = null;

    const initializeWebSocket = async () => {
      try {
        // Connect to WebSocket service
        await websocketService.connect();
        setIsWebSocketConnected(true);

        // Subscribe to general message activity for heartbeat
        messageActivityUnsubscribe =
          websocketService.subscribeToMessageActivity(() => {
            setMessageActivity(true);
            setTimeout(() => setMessageActivity(false), 1000);
          });

        // Subscribe to player position updates
        unsubscribe = websocketService.subscribeToPlayerPositions(
          (positions) => {
            console.log('Received player position updates:', positions);
            setPlayerPositions(positions);
          }
        );

        // Subscribe to dojo status updates
        const dojoUnsubscribe = websocketService.subscribe(
          'dojo_status_update',
          (data) => {
            console.log('Received dojo status update:', data);
          }
        );

        // Subscribe to game updates
        const gameUnsubscribe = websocketService.subscribe(
          'game_update',
          (data) => {
            console.log('Received game update:', data);
          }
        );

        // Request initial player positions
        websocketService.requestPlayerPositions();

        // Join the world map room for real-time updates
        websocketService.joinRoom('world_map');

        // Return cleanup function that unsubscribes from all events
        return () => {
          if (unsubscribe) unsubscribe();
          if (messageActivityUnsubscribe) messageActivityUnsubscribe();
          dojoUnsubscribe();
          gameUnsubscribe();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
        setError('Failed to connect to real-time service');
      }
    };

    const cleanup = initializeWebSocket();

    // Cleanup function
    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn();
      });
      websocketService.leaveRoom('world_map');
      websocketService.disconnect();
      setIsWebSocketConnected(false);
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to update player position
  const updatePlayerPosition = useCallback(
    (position: Omit<PlayerPosition, 'timestamp'>) => {
      if (isWebSocketConnected) {
        websocketService.updatePlayerPosition(position);
      }
    },
    [isWebSocketConnected]
  );

  // Function to refresh data
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    dojos,
    playerData,
    playerPositions,
    isLoading,
    error,
    isWebSocketConnected,
    messageActivity,
    updatePlayerPosition,
    refreshData,
  };
};
