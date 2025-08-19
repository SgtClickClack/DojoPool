import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
} from 'react';
import { SocketIOService } from '../services/network/WebSocketService';
// import { type GameTable } from '../../core/game/GameState'; // Import GameTable type - temporarily disabled

// Stub GameTable type - temporarily created to resolve build issues
type GameTable = any;

// Define an interface matching the Python backend's get_game_details structure
export interface BackendGameDetails {
  id: number; // Assuming integer ID from Python model
  player1: string; // Username
  player2: string; // Username
  game_type: string;
  game_mode: string;
  status: string; // e.g., "pending", "in_progress", "completed"
  winner: string | null; // Username
  score: string | null; // e.g., "5-3"
  created_at: string; // ISO date string
  started_at: string | null; // ISO date string
  completed_at: string | null; // ISO date string
  // NOTE: This lacks ball positions, current turn details needed for full LiveGameDisplay
}

interface SocketContextState {
  isConnected: boolean;
  lastError: Error | null;
  // Store the potentially simpler backend game details
  backendGameDetails: BackendGameDetails | null;
  // Keep GameTable for potential future use with TS service?
  gameTable: GameTable | null;
  connect: () => void;
  disconnect: () => void;
  subscribeToGame: (gameId: string) => void; // Example function to join a game room/namespace
  // Add other relevant methods like sendChatMessage, makeMove etc. later
}

const SocketContext = createContext<SocketContextState | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [currentGameTable, setCurrentGameTable] = useState<GameTable | null>(
    null
  );
  const [currentBackendGameDetails, setCurrentBackendGameDetails] =
    useState<BackendGameDetails | null>(null);
  const socketService = SocketIOService;

  // Define connect/disconnect before useEffect that uses them
  const connect = useCallback(() => {
    socketService.reconnect();
  }, [socketService]);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, [socketService]);

  const handleConnectionStatus = useCallback(
    (data: { status: string; error?: Error; reason?: string }) => {
      console.log('Socket connection status:', data.status);
      setIsConnected(data.status === 'connected');
      if (data.status === 'error' && data.error) {
        setLastError(data.error);
      } else if (data.status === 'disconnected') {
        console.log('Disconnected due to:', data.reason);
      } else {
        setLastError(null);
      }
    },
    []
  );

  // Updated handler for receiving game state updates from Python backend
  const handleGameStateUpdate = useCallback((data: unknown) => {
    console.log('Received game update/state data:', data);
    // Expecting { game: BackendGameDetails } based on events.py
    if (typeof data === 'object' && data !== null && 'game' in data) {
      const gameDetails = (data as { game: BackendGameDetails }).game;
      // TODO: Add validation/type guard for gameDetails shape
      if (
        typeof gameDetails === 'object' &&
        gameDetails !== null &&
        'id' in gameDetails
      ) {
        console.log('Updating backend game details state:', gameDetails.id);
        setCurrentBackendGameDetails(gameDetails);
        // TODO: Map BackendGameDetails to GameTable if needed for LiveGameDisplay?
        // This will be lossy as BackendGameDetails lacks real-time info.
      } else {
        console.warn(
          'Received game_update/game_state with unexpected game data structure:',
          gameDetails
        );
      }
    } else {
      console.warn(
        'Received game_update/game_state with unexpected payload structure:',
        data
      );
    }
  }, []);

  // Subscribe to notifications and game updates
  useEffect(() => {
    const unsubNotifications = socketService.subscribe(
      'notifications',
      handleConnectionStatus
    );
    const unsubGameUpdate = socketService.subscribe(
      'game_update',
      handleGameStateUpdate
    );
    const unsubGameState = socketService.subscribe(
      'game_state',
      handleGameStateUpdate
    );

    connect();

    return () => {
      unsubNotifications();
      unsubGameUpdate();
      unsubGameState();
      // disconnect(); // Optional
    };
  }, [socketService, handleConnectionStatus, handleGameStateUpdate, connect]);

  const subscribeToGame = useCallback(
    (gameId: string) => {
      console.log(`Joining game room: ${gameId}`);
      // No send() method, so use subscribe for game-specific events if needed
      socketService.subscribe(`game_${gameId}`, handleGameStateUpdate);
    },
    [socketService, handleGameStateUpdate]
  );

  const value = {
    isConnected,
    lastError,
    backendGameDetails: currentBackendGameDetails,
    gameTable: currentGameTable,
    connect,
    disconnect,
    subscribeToGame,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextState => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
