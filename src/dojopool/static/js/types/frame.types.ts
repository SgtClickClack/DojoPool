export interface Frame {
    width: number;
    height: number;
    data: ImageData;
    bitmap?: ImageBitmap;
    offscreenCanvas?: OffscreenCanvas;
}

export interface ShotDetectionResult {
    confidence: number;
    processingTime: number;
    verified: boolean;
}

export interface UmpireConfig {
    videoElement: HTMLVideoElement;
    width: number;
    height: number;
    brightnessThreshold?: number;
    motionThreshold?: number;
}

export interface UmpireOptions {
    url?: string;
    reconnectAttempts?: number;
    reconnectDelay?: number;
    debug?: boolean;
}

export interface UmpireState {
    isProcessingFrame: boolean;
    lastProcessedFrame: number;
    errorCount: number;
    isConnected: boolean;
    lastError: string | null;
    lastFrameTime: number;
    metrics: PerformanceMetrics;
    stats: {
        totalFrames: number;
        processedFrames: number;
        detectedShots: number;
        droppedFrames: number;
    };
} 