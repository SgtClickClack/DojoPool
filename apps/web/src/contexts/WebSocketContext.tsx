import { useAuth } from '@/hooks/useAuth';
import webSocketService, {
  ChatMessage,
  MatchUpdate,
  NotificationData,
  TournamentUpdate,
} from '@/services/websocket/WebSocketService';
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface WebSocketContextType {
  // Connection state
  isConnected: boolean;
  connectionState: string;
  socketId: string | undefined;

  // Tournament methods
  joinTournament: (tournamentId: string) => void;
  leaveTournament: (tournamentId: string) => void;

  // Match methods
  joinMatch: (matchId: string, spectator?: boolean) => void;
  leaveMatch: (matchId: string) => void;

  // Chat methods
  joinChat: (roomId: string, username: string) => void;
  leaveChat: (roomId: string) => void;
  sendChatMessage: (roomId: string, message: string) => void;
  sendTypingIndicator: (roomId: string, isTyping: boolean) => void;

  // Event listeners
  onTournamentUpdate: (
    callback: (data: TournamentUpdate) => void
  ) => () => void;
  onMatchUpdate: (callback: (data: MatchUpdate) => void) => () => void;
  onChatMessage: (callback: (data: ChatMessage) => void) => () => void;
  onNotification: (callback: (data: NotificationData) => void) => () => void;
  onConnectionChange: (callback: (connected: boolean) => void) => () => void;
  onSystemMessage: (callback: (data: any) => void) => () => void;

  // Battle pass
  onBattlePassProgress: (callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [socketId, setSocketId] = useState<string | undefined>();

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        if (user && token) {
          await webSocketService.connect(token);
        }
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initializeWebSocket();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, [user, token]);

  // Update connection state
  useEffect(() => {
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      setConnectionState(webSocketService.getConnectionState());
      setSocketId(webSocketService.getSocketId());
    };

    const onConnected = () => handleConnectionChange(true);
    const onDisconnected = () => handleConnectionChange(false);
    const onReconnecting = () => setConnectionState('reconnecting');

    webSocketService.on('connected', onConnected);
    webSocketService.on('disconnected', onDisconnected);
    webSocketService.on('reconnecting', onReconnecting);

    // Initial state
    handleConnectionChange(webSocketService.isConnected());

    return () => {
      webSocketService.off('connected', onConnected);
      webSocketService.off('disconnected', onDisconnected);
      webSocketService.off('reconnecting', onReconnecting);
    };
  }, []);

  // Tournament methods
  const joinTournament = (tournamentId: string) => {
    webSocketService.joinTournament(tournamentId);
  };

  const leaveTournament = (tournamentId: string) => {
    webSocketService.leaveTournament(tournamentId);
  };

  // Match methods
  const joinMatch = (matchId: string, spectator: boolean = false) => {
    webSocketService.joinMatch(matchId, spectator);
  };

  const leaveMatch = (matchId: string) => {
    webSocketService.leaveMatch(matchId);
  };

  // Chat methods
  const joinChat = (roomId: string, username: string) => {
    webSocketService.joinChat(roomId, username);
  };

  const leaveChat = (roomId: string) => {
    webSocketService.leaveChat(roomId);
  };

  const sendChatMessage = (roomId: string, message: string) => {
    webSocketService.sendChatMessage(roomId, message);
  };

  const sendTypingIndicator = (roomId: string, isTyping: boolean) => {
    webSocketService.sendTypingIndicator(roomId, isTyping);
  };

  // Event listener methods
  const onTournamentUpdate = (callback: (data: TournamentUpdate) => void) => {
    webSocketService.on('tournament_update', callback);
    return () => webSocketService.off('tournament_update', callback);
  };

  const onMatchUpdate = (callback: (data: MatchUpdate) => void) => {
    webSocketService.on('match_update', callback);
    return () => webSocketService.off('match_update', callback);
  };

  const onChatMessage = (callback: (data: ChatMessage) => void) => {
    webSocketService.on('chat_message', callback);
    return () => webSocketService.off('chat_message', callback);
  };

  const onNotification = (callback: (data: NotificationData) => void) => {
    webSocketService.on('notification', callback);
    return () => webSocketService.off('notification', callback);
  };

  const onConnectionChange = (callback: (connected: boolean) => void) => {
    webSocketService.on('connected', () => callback(true));
    webSocketService.on('disconnected', () => callback(false));
    return () => {
      webSocketService.off('connected');
      webSocketService.off('disconnected');
    };
  };

  const onSystemMessage = (callback: (data: any) => void) => {
    webSocketService.on('system_message', callback);
    return () => webSocketService.off('system_message', callback);
  };

  const onBattlePassProgress = (callback: (data: any) => void) => {
    webSocketService.on('battle_pass_progress', callback);
    return () => webSocketService.off('battle_pass_progress', callback);
  };

  const value: WebSocketContextType = {
    isConnected,
    connectionState,
    socketId,
    joinTournament,
    leaveTournament,
    joinMatch,
    leaveMatch,
    joinChat,
    leaveChat,
    sendChatMessage,
    sendTypingIndicator,
    onTournamentUpdate,
    onMatchUpdate,
    onChatMessage,
    onNotification,
    onConnectionChange,
    onSystemMessage,
    onBattlePassProgress,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
