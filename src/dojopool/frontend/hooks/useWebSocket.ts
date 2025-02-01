import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

export const useWebSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const newSocket = io(process.env.REACT_APP_WS_URL || 'ws://localhost:8000', {
                auth: {
                    token: user.token
                },
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            newSocket.on('connect', () => {
                console.log('WebSocket connected');
                setConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                setConnected(false);
            });

            newSocket.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
                setConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.close();
            };
        }
    }, [user]);

    return { socket, connected };
}; 