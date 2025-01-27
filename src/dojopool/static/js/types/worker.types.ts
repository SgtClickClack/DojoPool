export interface CustomWorker extends Worker {
    activeTaskCount: number;
    maxTasks: number;
}

export interface WorkerMessage {
    type: 'process' | 'result' | 'error' | 'init';
    frame?: {
        width: number;
        height: number;
        bitmap?: ImageBitmap;
        offscreenCanvas?: OffscreenCanvas;
    };
    timestamp?: number;
    error?: string;
    result?: {
        shotDetected: boolean;
        position?: { x: number; y: number };
        confidence?: number;
        processingTime: number;
    };
    config?: {
        width: number;
        height: number;
        brightnessThreshold: number;
        motionThreshold: number;
    };
    stats?: {
        totalFrames: number;
        processedFrames: number;
        detectedShots: number;
        droppedFrames: number;
    };
} 