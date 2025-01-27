import { Socket } from 'socket.io-client';
import { socketPool } from '../socket-pool';
import { UmpireState } from './state';
import { showError, showSuccess } from './ui';

const MAX_RECONNECT_ATTEMPTS = 5;

export function handleConnect(state: UmpireState): void {
    state.isConnected = true;
    state.lastError = null;
    showSuccess('Connected to server');
}

export function handleConnectionError(state: UmpireState, error: Error): void {
    state.isConnected = false;
    state.lastError = `Connection error: ${error.message}`;
    showError(state.lastError);
}

export function handleDisconnect(state: UmpireState, socket: Socket | null, reason: string): void {
    state.isConnected = false;
    showError(`Disconnected: ${reason}`);
    if (socket) {
        socketPool.releaseSocket(socket);
    }
}

export function handleSocketError(state: UmpireState, error: Error): void {
    state.lastError = `Socket error: ${error.message}`;
    showError(state.lastError);
}

export function handleReconnectAttempt(attemptNumber: number): void {
    showError(`Reconnection attempt ${attemptNumber}/${MAX_RECONNECT_ATTEMPTS}`);
}

export function handleReconnectFailed(state: UmpireState): void {
    state.isConnected = false;
    state.lastError = 'Failed to reconnect to server';
    showError(state.lastError);
}

export { MAX_RECONNECT_ATTEMPTS };

