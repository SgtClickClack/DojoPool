// State management for umpire system
export interface UmpireState {
  isProcessingFrame: boolean;
  lastProcessedFrame: number;
  errorCount: number;
  isConnected: boolean;
  lastError: string | null;
  lastFrameTime: number;
  stats: {
    totalFrames: number;
    processedFrames: number;
    detectedShots: number;
  };
}

export interface UmpireOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectionDelay?: number;
  debug?: boolean;
}

export const createInitialState = (): UmpireState => ({
  isProcessingFrame: false,
  lastProcessedFrame: 0,
  errorCount: 0,
  isConnected: false,
  lastError: null,
  lastFrameTime: 0,
  stats: {
    totalFrames: 0,
    processedFrames: 0,
    detectedShots: 0,
  },
});
