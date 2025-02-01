import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import pako from 'pako';  // For handling zlib compression

interface RankingUpdate {
    type: string;
    data: any;
    timestamp: string;
}

interface ConnectionFeatures {
    compression: boolean;
    batching: boolean;
    batch_size: number;
}

interface UseRankingWebSocketOptions {
    userId?: number;
    onMessage?: (data: RankingUpdate) => void;
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    batchSize?: number;
}

export const useRankingWebSocket = ({
    userId,
    onMessage,
    autoReconnect = true,
    maxReconnectAttempts = 5,
    batchSize = 100
}: UseRankingWebSocketOptions) => {
    const ws = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();
    const { enqueueSnackbar } = useSnackbar();
    const [isConnected, setIsConnected] = useState(false);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
    const reconnectTokenRef = useRef<string>();
    const featuresRef = useRef<ConnectionFeatures>();

    const handleMessage = useCallback((message: RankingUpdate) => {
        switch (message.type) {
            case 'connection_token':
                reconnectTokenRef.current = message.data.token;
                break;

            case 'connection_info':
                featuresRef.current = message.data.features;
                break;

            case 'ping':
                ws.current?.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;

            case 'ranking_update':
                queryClient.invalidateQueries(['playerRanking', userId]);
                onMessage?.(message);
                break;

            case 'global_update':
                queryClient.invalidateQueries('globalRankings');
                onMessage?.(message);
                break;

            case 'significant_change':
                const change = message.data.change;
                const direction = change > 0 ? 'up' : 'down';
                enqueueSnackbar(
                    `Ranking changed by ${Math.abs(change)} positions ${direction}!`,
                    { variant: direction === 'up' ? 'success' : 'warning' }
                );
                onMessage?.(message);
                break;

            case 'batch':
                // Handle batched messages
                if (Array.isArray(message.messages)) {
                    message.messages.forEach(msg => handleMessage(msg));
                }
                break;
        }
    }, [userId, queryClient, enqueueSnackbar, onMessage]);

    const processWebSocketMessage = useCallback((event: MessageEvent) => {
        try {
            let data: RankingUpdate;

            if (event.data instanceof Blob) {
                // Handle compressed binary data
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const arrayBuffer = reader.result as ArrayBuffer;
                        const uint8Array = new Uint8Array(arrayBuffer);
                        const decompressed = pako.inflate(uint8Array, { to: 'string' });
                        const message = JSON.parse(decompressed);
                        handleMessage(message);
                    } catch (error) {
                        console.error('Error processing compressed message:', error);
                    }
                };
                reader.readAsArrayBuffer(event.data);
            } else {
                // Handle regular JSON messages
                data = JSON.parse(event.data);
                handleMessage(data);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
        }
    }, [handleMessage]);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = userId
            ? `/api/ws/rankings/${userId}${reconnectTokenRef.current ? `?token=${reconnectTokenRef.current}` : ''}`
            : '/api/ws/rankings/global';

        ws.current = new WebSocket(`ws://${window.location.host}${wsUrl}`);

        ws.current.onopen = () => {
            setIsConnected(true);
            setReconnectAttempts(0);
            enqueueSnackbar('Connected to ranking updates', { variant: 'success' });
        };

        ws.current.onclose = () => {
            setIsConnected(false);
            clearInterval(heartbeatIntervalRef.current);

            if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
                const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
                reconnectTimeoutRef.current = setTimeout(() => {
                    setReconnectAttempts(prev => prev + 1);
                    connect();
                }, timeout);
            }
        };

        ws.current.onerror = () => {
            enqueueSnackbar('Connection error occurred', { variant: 'error' });
        };

        ws.current.onmessage = processWebSocketMessage;

        // Start heartbeat interval
        heartbeatIntervalRef.current = setInterval(() => {
            if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
            }
        }, 30000);

    }, [userId, autoReconnect, maxReconnectAttempts, reconnectAttempts, enqueueSnackbar, processWebSocketMessage]);

    useEffect(() => {
        connect();

        return () => {
            clearTimeout(reconnectTimeoutRef.current);
            clearInterval(heartbeatIntervalRef.current);
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [connect]);

    const disconnect = useCallback(() => {
        clearTimeout(reconnectTimeoutRef.current);
        clearInterval(heartbeatIntervalRef.current);
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
        setIsConnected(false);
    }, []);

    return {
        isConnected,
        reconnectAttempts,
        connect,
        disconnect,
        features: featuresRef.current
    };
}; 