import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
    data: string;
    type: string;
    target: string;
}

interface UseWebSocketReturn {
    lastMessage: WebSocketMessage | null;
    sendMessage: (message: string) => void;
    readyState: number;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
    const ws = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        // Ensure we're using WSS in production
        const wsUrl = process.env.NODE_ENV === 'production'
            ? `wss://${window.location.host}${url}`
            : `ws://${window.location.host}${url}`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('WebSocket Connected');
            setReadyState(WebSocket.OPEN);
        };

        ws.current.onclose = () => {
            console.log('WebSocket Disconnected');
            setReadyState(WebSocket.CLOSED);
            // Attempt to reconnect after 3 seconds
            setTimeout(() => {
                connect();
            }, 3000);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                setLastMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }, [url]);

    useEffect(() => {
        connect();

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((message: string) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        } else {
            console.warn('WebSocket is not connected');
        }
    }, []);

    return {
        lastMessage,
        sendMessage,
        readyState,
    };
}; 