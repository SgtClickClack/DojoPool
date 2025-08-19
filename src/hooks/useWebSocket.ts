import { useState, useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io(
        process.env.REACT_APP_WS_URL || 'http://localhost:8080',
        {
          auth: {
            token: user.token,
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 120000, // Match backend ping_timeout
        }
      );

      newSocket.on('connect', () => {
        console.log('WebSocket connected');
        setConnected(true);
      });

      newSocket.on('connect_error', (error: Error) => {
        console.error('WebSocket connection error:', error);
        setConnected(false);
      });

      newSocket.on('disconnect', (reason: string) => {
        console.log('WebSocket disconnected:', reason);
        setConnected(false);
      });

      newSocket.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket.connected) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  return { socket, connected };
};
