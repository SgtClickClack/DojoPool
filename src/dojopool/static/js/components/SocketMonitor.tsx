import React, { useCallback, useEffect, useState } from 'react';
import { socketManager } from '../socket_manager';
import { ConnectionState, ConnectionStatus } from '../socket_types';

interface SocketStats {
    messagesSent: number;
    messagesReceived: number;
    reconnectAttempts: number;
    averageLatency: number;
    lastMessageTime: Date | null;
    connectionDuration: number;
}

const UPDATE_INTERVAL = 2000; // Reduce update frequency to 2 seconds

const SocketMonitor: React.FC = () => {
    const [status, setStatus] = useState<ConnectionStatus>({
        state: ConnectionState.INITIALIZING,
        lastError: null,
        lastEventTime: new Date().toISOString()
    });

    const [stats, setStats] = useState<SocketStats>({
        messagesSent: 0,
        messagesReceived: 0,
        reconnectAttempts: 0,
        averageLatency: 0,
        lastMessageTime: null,
        connectionDuration: 0
    });

    // Memoize update function
    const updateStats = useCallback(() => {
        const newStats = socketManager.getMetrics();
        const newStatus = socketManager.getConnectionState();

        // Only update if values have changed
        setStats(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newStats)) {
                return newStats;
            }
            return prev;
        });

        setStatus(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(newStatus)) {
                return newStatus;
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        // Initial update
        updateStats();

        // Set up interval with reduced frequency
        const updateInterval = setInterval(updateStats, UPDATE_INTERVAL);

        // Subscribe to important events for immediate updates
        const onStateChange = () => {
            const newStatus = socketManager.getConnectionState();
            setStatus(newStatus);
        };

        socketManager.subscribe('connect', onStateChange);
        socketManager.subscribe('disconnect', onStateChange);
        socketManager.subscribe('error', onStateChange);

        return () => {
            clearInterval(updateInterval);
            socketManager.unsubscribe('connect', onStateChange);
            socketManager.unsubscribe('disconnect', onStateChange);
            socketManager.unsubscribe('error', onStateChange);
        };
    }, [updateStats]);

    const getStatusColor = (state: ConnectionState): string => {
        switch (state) {
            case ConnectionState.CONNECTED:
                return 'bg-green-500';
            case ConnectionState.DISCONNECTED:
                return 'bg-red-500';
            case ConnectionState.ERROR:
                return 'bg-yellow-500';
            default:
                return 'bg-gray-100';
        }
    };

    const formatDuration = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">WebSocket Monitor</h2>

            {/* Connection Status */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
                <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(status.state)}`} />
                    <span>{status.state}</span>
                </div>
                {status.lastError && (
                    <div className="text-red-500 mt-1">
                        Error: {status.lastError}
                    </div>
                )}
                <div className="text-sm text-gray-500">
                    Last Event: {new Date(status.lastEventTime).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                    Connection Duration: {formatDuration(stats.connectionDuration)}
                </div>
            </div>

            {/* Message Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-100 rounded">
                    <div className="text-sm text-gray-600">Messages Sent</div>
                    <div className="text-xl font-bold">{stats.messagesSent}</div>
                </div>
                <div className="p-3 bg-gray-100 rounded">
                    <div className="text-sm text-gray-600">Messages Received</div>
                    <div className="text-xl font-bold">{stats.messagesReceived}</div>
                </div>
                <div className="p-3 bg-gray-100 rounded">
                    <div className="text-sm text-gray-600">Reconnect Attempts</div>
                    <div className="text-xl font-bold">{stats.reconnectAttempts}</div>
                </div>
                <div className="p-3 bg-gray-100 rounded">
                    <div className="text-sm text-gray-600">Average Latency</div>
                    <div className="text-xl font-bold">{stats.averageLatency.toFixed(2)}ms</div>
                </div>
            </div>

            {/* Last Message */}
            {stats.lastMessageTime && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Last Message</h3>
                    <div className="text-sm text-gray-500">
                        {stats.lastMessageTime.toLocaleString()}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => socketManager.connect()}
                    disabled={status.state === ConnectionState.CONNECTED}
                    className={`px-4 py-2 rounded ${status.state === ConnectionState.CONNECTED
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                >
                    Connect
                </button>
                <button
                    onClick={() => socketManager.disconnect()}
                    disabled={status.state === ConnectionState.DISCONNECTED}
                    className={`px-4 py-2 rounded ${status.state === ConnectionState.DISCONNECTED
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                >
                    Disconnect
                </button>
            </div>
        </div>
    );
};

export default SocketMonitor; 