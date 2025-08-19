import { MemoryReporter } from './memory-reporter';

interface WorkerMessage {
  type:
    | 'processFrame'
    | 'setThreshold'
    | 'cleanup'
    | 'getMemoryStats'
    | 'requestGC';
  frame?: ImageData;
  threshold?: number;
}

class ShotDetectionWorker {
  private static readonly MEMORY_CHECK_INTERVAL = 1000; // 1 second
  private lastFrame: ImageData | null = null;
  private threshold: number = 30;
  private memoryReporter: MemoryReporter;
  private memoryCheckerId: number | null = null;

  constructor() {
    this.memoryReporter = new MemoryReporter();
    this.startMemoryChecker();
  }

  private startMemoryChecker(): void {
    this.memoryCheckerId = self.setInterval(() => {
      const stats = this.memoryReporter.getMemoryStats();
      self.postMessage({
        type: 'memoryStats',
        stats,
      });
    }, ShotDetectionWorker.MEMORY_CHECK_INTERVAL);
  }

  private stopMemoryChecker(): void {
    if (this.memoryCheckerId !== null) {
      self.clearInterval(this.memoryCheckerId);
      this.memoryCheckerId = null;
    }
  }

  public processFrame(frame: ImageData): void {
    const result = this.detectShot(frame);
    if (result.detected) {
      self.postMessage({
        type: 'shotDetected',
        confidence: result.confidence,
        timestamp: Date.now(),
      });
    }
    this.lastFrame = frame;
  }

  private detectShot(currentFrame: ImageData): {
    detected: boolean;
    confidence: number;
  } {
    if (!this.lastFrame) {
      return { detected: false, confidence: 0 };
    }

    const diff = this.calculateFrameDifference(currentFrame, this.lastFrame);
    const detected = diff > this.threshold;
    const confidence = Math.min(100, (diff / this.threshold) * 100);

    return { detected, confidence };
  }

  private calculateFrameDifference(
    frame1: ImageData,
    frame2: ImageData
  ): number {
    const data1 = frame1.data;
    const data2 = frame2.data;
    let totalDiff = 0;
    const pixelCount = data1.length / 4;

    for (let i = 0; i < data1.length; i += 4) {
      const r1 = data1[i];
      const g1 = data1[i + 1];
      const b1 = data1[i + 2];
      const r2 = data2[i];
      const g2 = data2[i + 1];
      const b2 = data2[i + 2];

      const pixelDiff =
        Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      totalDiff += pixelDiff;
    }

    return totalDiff / pixelCount;
  }

  public setThreshold(value: number): void {
    this.threshold = value;
  }

  public cleanup(): void {
    this.lastFrame = null;
    this.stopMemoryChecker();
  }
}

const worker = new ShotDetectionWorker();

self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  switch (event.data.type) {
    case 'processFrame':
      if (event.data.frame) {
        worker.processFrame(event.data.frame);
      }
      break;
    case 'setThreshold':
      if (typeof event.data.threshold === 'number') {
        worker.setThreshold(event.data.threshold);
      }
      break;
    case 'cleanup':
      worker.cleanup();
      break;
    case 'getMemoryStats':
      // Memory stats are automatically sent by the memory checker
      break;
    case 'requestGC':
      worker.memoryReporter.requestGarbageCollection();
      break;
  }
});
