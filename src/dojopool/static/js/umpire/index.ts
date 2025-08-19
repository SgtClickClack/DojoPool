// Re-export all modules
export * from './frame-capture';
export * from './shot-detection';
export * from './socket-handlers';
export * from './state';
export * from './ui';

import { type Socket } from 'socket.io-client';
import { socketPool } from '../socket-pool';
import { cleanup as cleanupFrameCapture } from './frame-capture';
import * as shotDetection from './shot-detection';
import * as handlers from './socket-handlers';
import { createInitialState } from './state';
import { initializeDOMElements } from './ui';

// Main state
let frameProcessingId: number | null = null;
let statusAnimationId: number | null = null;
let isProcessingFrame = false;
let socket: Socket | null = null;
let frameWorker: Worker | null = null;

export const umpireState = createInitialState();
export const domElements = initializeDOMElements();

// Initialize system
export async function initUmpireSystem(): Promise<void> {
  cleanup();
  initializeWorker();
  await initializeSocket();
  startMonitoring();
}

function initializeWorker(): void {
  if (frameWorker) {
    frameWorker.terminate();
  }

  frameWorker = new Worker(new URL('./frame-worker.ts', import.meta.url));
  frameWorker.onmessage = (e: MessageEvent) => {
    if (e.data.type === 'result') {
      handleFrameProcessingResult(e.data);
    }
  };

  frameWorker.onerror = (error) => {
    console.error('Worker error:', error);
    umpireState.lastError = 'Frame processing error';
  };
}

async function initializeSocket(): Promise<void> {
  try {
    socket = await socketPool.getSocket();
    if (!socket) {
      throw new Error('Failed to initialize socket');
    }

    socket.on('connect', () => handlers.handleConnect(umpireState));
    socket.on('connect_error', (error) =>
      handlers.handleConnectionError(umpireState, error)
    );
    socket.on('disconnect', (reason) =>
      handlers.handleDisconnect(umpireState, socket, reason)
    );
    socket.on('error', (error) =>
      handlers.handleSocketError(umpireState, error)
    );
    socket.on('reconnect_attempt', handlers.handleReconnectAttempt);
    socket.on('reconnect_failed', () =>
      handlers.handleReconnectFailed(umpireState)
    );
  } catch (error) {
    if (error instanceof Error) {
      umpireState.lastError = `Socket initialization error: ${error.message}`;
    }
  }
}

function handleFrameProcessingResult(data: any): void {
  umpireState.stats.processedFrames++;

  if (data.shotDetected) {
    umpireState.stats.detectedShots++;
    shotDetection.handleShotDetection(domElements, data);
  }

  if (data.calibrationComplete) {
    shotDetection.handleCalibrationComplete(data);
  }

  shotDetection.updateMonitoringStatus(umpireState, data);
}

export function cleanup(): void {
  if (frameProcessingId) {
    cancelAnimationFrame(frameProcessingId);
    frameProcessingId = null;
  }

  if (statusAnimationId) {
    cancelAnimationFrame(statusAnimationId);
    statusAnimationId = null;
  }

  if (frameWorker) {
    frameWorker.terminate();
    frameWorker = null;
  }

  if (socket) {
    socketPool.releaseSocket(socket);
    socket = null;
  }

  cleanupFrameCapture();
  umpireState.isProcessingFrame = false;
  isProcessingFrame = false;
}
