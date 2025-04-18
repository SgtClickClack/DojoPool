import { PerformanceProfiler } from "../managers/performance-profiler";
import { MemoryReporter } from "./memory-reporter";

// Constants for memory management
const FRAME_BUFFER_SIZE = 2; // Only keep last 2 frames
const MAX_FRAME_SIZE = 3840 * 2160 * 4; // Max 4K frame size
const MEMORY_PRESSURE_THRESHOLD = 0.7; // 70% memory usage triggers cleanup
const METRICS_BATCH_SIZE = 100; // Aggregate metrics every 100 frames

// Performance optimization constants
const CHUNK_SIZE = 1024; // Process frames in chunks
const MIN_FRAME_INTERVAL = 16; // ~60fps
const USE_SIMD = "simd" in WebAssembly;

// Message types
interface BaseWorkerMessage {
  readonly type: string;
}

interface ProcessFrameMessage extends BaseWorkerMessage {
  readonly type: "processFrame";
  readonly frameData: ImageData;
}

interface SetThresholdMessage extends BaseWorkerMessage {
  readonly type: "setThreshold";
  readonly threshold: number;
}

interface CleanupMessage extends BaseWorkerMessage {
  readonly type: "cleanup";
}

type WorkerIncomingMessage =
  | ProcessFrameMessage
  | SetThresholdMessage
  | CleanupMessage;

interface BaseWorkerResponse {
  readonly type: string;
}

interface ShotDetectionResponse extends BaseWorkerResponse {
  readonly type: "shotDetected";
  readonly detected: boolean;
  readonly confidence: number;
  readonly processingTime: number;
  readonly shotDetectionTime: number;
}

interface MemoryStatsResponse extends BaseWorkerResponse {
  readonly type: "memoryStats";
  readonly stats: MemoryStats;
}

type WorkerOutgoingMessage = ShotDetectionResponse | MemoryStatsResponse;

class ShotDetectionWorker {
  private static readonly DEFAULT_THRESHOLD = 30;
  private static readonly MEMORY_CHECK_INTERVAL = 500; // Check memory every 500ms
  private static readonly MIN_PIXEL_DIFF = 10;
  private static readonly CONFIDENCE_SCALE = 100;

  private readonly memoryReporter: MemoryReporter;
  private readonly profiler: PerformanceProfiler;
  private readonly framePool: ImageData[];
  private readonly processingQueue: ImageData[] = [];
  private readonly transferBuffers: ArrayBuffer[] = [];
  private threshold: number;
  private lastFrame: ImageData | null = null;
  private memoryCheckerId: number | null = null;
  private frameCount: number = 0;
  private metricsBuffer: {
    processingTime: number;
    detectionTime: number;
    confidence: number;
  }[] = [];
  private lastProcessingTime: number = 0;
  private isProcessing: boolean = false;

  public constructor() {
    this.memoryReporter = new MemoryReporter();
    this.threshold = ShotDetectionWorker.DEFAULT_THRESHOLD;
    this.profiler = PerformanceProfiler.getInstance();
    this.framePool = [];
    this.setupMemoryChecks();
    this.setupMessageHandler();
    this.initializeTransferBuffers();
  }

  private initializeTransferBuffers(): void {
    // Pre-allocate transfer buffers for frame data
    for (let i = 0; i < FRAME_BUFFER_SIZE; i++) {
      this.transferBuffers.push(new ArrayBuffer(MAX_FRAME_SIZE));
    }
  }

  private setupMemoryChecks(): void {
    this.memoryCheckerId = self.setInterval(() => {
      try {
        const stats = this.memoryReporter.getMemoryStats();
        const memoryUsage = stats.heapUsed / stats.heapTotal;

        // Check memory pressure and cleanup if needed
        if (memoryUsage > MEMORY_PRESSURE_THRESHOLD) {
          this.cleanupMemory(true); // Force cleanup
        }

        self.postMessage({
          type: "memoryStats",
          stats,
        });
      } catch (error) {
        console.error(
          "Memory check failed:",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }, ShotDetectionWorker.MEMORY_CHECK_INTERVAL);
  }

  private setupMessageHandler(): void {
    self.addEventListener(
      "message",
      (event: MessageEvent<WorkerIncomingMessage>) => {
        try {
          this.handleMessage(event.data);
        } catch (error) {
          console.error(
            "Message handling failed:",
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      },
    );
  }

  private async handleMessage(message: WorkerIncomingMessage): Promise<void> {
    switch (message.type) {
      case "processFrame": {
        const { frameData } = message as ProcessFrameMessage;

        if (frameData.data.length > MAX_FRAME_SIZE) {
          throw new Error("Frame size exceeds maximum allowed size");
        }

        // Add to processing queue
        this.processingQueue.push(frameData);
        await this.processNextFrame();
        break;
      }
      case "setThreshold": {
        const { threshold } = message as SetThresholdMessage;
        this.threshold = threshold;
        break;
      }
      case "cleanup": {
        this.cleanup();
        break;
      }
      default: {
        const _exhaustiveCheck: never = message;
        throw new Error(
          `Unhandled message type: ${(message as BaseWorkerMessage).type}`,
        );
      }
    }
  }

  private async processNextFrame(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;

    this.isProcessing = true;
    const now = performance.now();
    const timeSinceLastProcess = now - this.lastProcessingTime;

    // Rate limiting
    if (timeSinceLastProcess < MIN_FRAME_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_FRAME_INTERVAL - timeSinceLastProcess),
      );
    }

    try {
      const frame = this.processingQueue.shift()!;
      const startTime = performance.now();
      const result = await this.detectShot(frame);
      const processingTime = performance.now() - startTime;

      this.metricsBuffer.push({
        processingTime,
        detectionTime: result.detectionTime,
        confidence: result.confidence,
      });

      this.frameCount++;
      if (this.frameCount % METRICS_BATCH_SIZE === 0) {
        this.cleanupMemory(false);
      }

      self.postMessage({
        type: "shotDetected",
        ...result,
        processingTime,
      } as ShotDetectionResponse);

      this.lastProcessingTime = performance.now();
    } finally {
      this.isProcessing = false;
      if (this.processingQueue.length > 0) {
        await this.processNextFrame();
      }
    }
  }

  private async detectShot(
    frame: ImageData,
  ): Promise<{ detected: boolean; confidence: number; detectionTime: number }> {
    const startTime = performance.now();

    if (!this.lastFrame) {
      // Reuse frame from pool or create new one
      this.lastFrame = this.getFrameFromPool(frame);
      return { detected: false, confidence: 0, detectionTime: 0 };
    }

    let totalDifference = 0;
    let significantPixels = 0;

    const currentData = frame.data;
    const lastData = this.lastFrame.data;

    if (USE_SIMD) {
      // Use SIMD for faster processing
      const result = await this.processSIMD(currentData, lastData);
      totalDifference = result.totalDifference;
      significantPixels = result.significantPixels;
    } else {
      // Process in chunks for better performance
      for (let offset = 0; offset < currentData.length; offset += CHUNK_SIZE) {
        const end = Math.min(offset + CHUNK_SIZE, currentData.length);
        const current32 = new Uint32Array(
          currentData.buffer,
          offset,
          (end - offset) / 4,
        );
        const last32 = new Uint32Array(
          lastData.buffer,
          offset,
          (end - offset) / 4,
        );

        for (let i = 0; i < current32.length; i++) {
          const diff = Math.abs((current32[i] & 0xff) - (last32[i] & 0xff));
          if (diff > ShotDetectionWorker.MIN_PIXEL_DIFF) {
            totalDifference += diff;
            significantPixels++;
          }
        }
      }
    }

    // Update last frame using pool
    this.returnFrameToPool(this.lastFrame);
    this.lastFrame = this.getFrameFromPool(frame);

    const averageDifference =
      significantPixels > 0 ? totalDifference / significantPixels : 0;
    const detected = averageDifference > this.threshold;
    const confidence = Math.min(
      (averageDifference / ShotDetectionWorker.CONFIDENCE_SCALE) * 100,
      100,
    );

    const detectionTime = performance.now() - startTime;

    return { detected, confidence, detectionTime };
  }

  private async processSIMD(
    currentData: Uint8ClampedArray,
    lastData: Uint8ClampedArray,
  ): Promise<{ totalDifference: number; significantPixels: number }> {
    // WebAssembly SIMD implementation
    const module = await WebAssembly.compile(`
            (module
                (func $process_chunk (param $current i32) (param $last i32) (param $length i32) 
                    (result i32 i32)
                (local $diff v128) (local $count i32) (local $sum i32)
                ;; SIMD implementation
                (loop $process
                    ;; Load SIMD vectors
                    (local.set $diff 
                        (i8x16.sub_sat_u
                            (v128.load (local.get $current))
                            (v128.load (local.get $last))))
                    ;; Count significant differences
                    (local.set $count 
                        (i32.add 
                            (local.get $count)
                            (i32x4.extract_lane 0 
                                (v128.gt_u 
                                    (local.get $diff)
                                    (v128.const i32x4 10 10 10 10)))))
                    ;; Sum differences
                    (local.set $sum
                        (i32.add
                            (local.get $sum)
                            (i32x4.extract_lane 0
                                (i32x4.add
                                    (i32x4.shr_u
                                        (local.get $diff)
                                        (i32.const 24))
                                    (i32x4.shr_u
                                        (local.get $diff)
                                        (i32.const 16))))))
                    ;; Loop control
                    (br_if $process
                        (i32.lt_u
                            (local.get $current)
                            (i32.sub
                                (local.get $length)
                                (i32.const 16))))
                )
                ;; Return results
                (return (tuple.make
                    (local.get $sum)
                    (local.get $count)))
            )
        `);

    const instance = await WebAssembly.instantiate(module);
    return {
      totalDifference: 0, // Replace with actual SIMD results
      significantPixels: 0,
    };
  }

  private getFrameFromPool(frame: ImageData): ImageData {
    let pooledFrame = this.framePool.pop();
    if (
      !pooledFrame ||
      pooledFrame.width !== frame.width ||
      pooledFrame.height !== frame.height
    ) {
      pooledFrame = new ImageData(
        new Uint8ClampedArray(frame.data),
        frame.width,
        frame.height,
      );
    } else {
      pooledFrame.data.set(frame.data);
    }
    return pooledFrame;
  }

  private returnFrameToPool(frame: ImageData): void {
    if (this.framePool.length < FRAME_BUFFER_SIZE) {
      this.framePool.push(frame);
    }
  }

  private cleanupMemory(force: boolean): void {
    // Clear processing queue if forced
    if (force) {
      this.processingQueue.length = 0;
    }

    // Clear excess frames from pool
    while (this.framePool.length > FRAME_BUFFER_SIZE) {
      this.framePool.shift();
    }

    // Aggregate metrics
    if (this.metricsBuffer.length > 0) {
      const metrics = this.metricsBuffer.reduce((acc, m) => ({
        processingTime: acc.processingTime + m.processingTime,
        detectionTime: acc.detectionTime + m.detectionTime,
        confidence: acc.confidence + m.confidence,
      }));

      const count = this.metricsBuffer.length;
      this.profiler.recordAggregatedMetrics(
        metrics.processingTime / count,
        metrics.detectionTime / count,
        metrics.confidence / count,
      );
      this.metricsBuffer = [];
    }

    // Request garbage collection
    this.memoryReporter.requestGarbageCollection(force);
  }

  private cleanup(): void {
    if (this.memoryCheckerId !== null) {
      self.clearInterval(this.memoryCheckerId);
      this.memoryCheckerId = null;
    }

    // Clear all buffers
    this.framePool.length = 0;
    this.processingQueue.length = 0;
    this.transferBuffers.length = 0;
    this.lastFrame = null;
    this.metricsBuffer = [];
    this.frameCount = 0;

    this.profiler.cleanup();
  }
}

// Initialize worker
new ShotDetectionWorker();
