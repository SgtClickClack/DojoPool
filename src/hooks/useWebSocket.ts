import { useEffect, useState } from 'react';
import { WebSocketService } from '../frontend/services/services/network/WebSocketService';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocketService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const webSocketService = new WebSocketService();

      webSocketService
        .connect()
        .then(() => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setSocket(webSocketService);
        })
        .catch((error) => {
          console.error('WebSocket connection error:', error);
          setIsConnected(false);
        });

      return () => {
        if (webSocketService) {
          webSocketService.disconnect();
        }
      };
    }
  }, [user]);

  return { socket, isConnected };
};
