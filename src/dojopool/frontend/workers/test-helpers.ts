/**
 * Helper functions for shot detection worker tests
 */

interface FrameProcessingStats {
  averageProcessingTime: number;
  maxProcessingTime: number;
  minProcessingTime: number;
  stdDeviation: number;
}

interface ProcessFramesOptions {
  fps?: number;
  batchSize?: number;
}

/**
 * Creates a test frame with the specified dimensions
 */
export async function createTestFrame(
  width: number,
  height: number,
): Promise<ImageData> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Create a gradient pattern to simulate a realistic frame
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#000000");
  gradient.addColorStop(1, "#FFFFFF");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some random shapes to simulate movement
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(
      Math.random() * width,
      Math.random() * height,
      Math.random() * 50,
      0,
      2 * Math.PI,
    );
    ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
    ctx.fill();
  }

  return ctx.getImageData(0, 0, width, height);
}

/**
 * Sends a frame to the worker and returns the processing result
 */
export function sendFrameToWorker(
  worker: Worker,
  frame: ImageData,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageHandler = (event: MessageEvent) => {
      worker.removeEventListener("message", messageHandler);
      worker.removeEventListener("error", errorHandler);
      resolve(event.data);
    };

    const errorHandler = (error: ErrorEvent) => {
      worker.removeEventListener("message", messageHandler);
      worker.removeEventListener("error", errorHandler);
      reject(error);
    };

    worker.addEventListener("message", messageHandler);
    worker.addEventListener("error", errorHandler);

    worker.postMessage({
      type: "processFrame",
      frame: frame,
      timestamp: Date.now(),
    });
  });
}

/**
 * Processes multiple frames and returns statistics about the processing
 */
export async function processFrames(
  worker: Worker,
  frames: ImageData[],
  options: ProcessFramesOptions = {},
): Promise<FrameProcessingStats> {
  const { fps = 30, batchSize = 10 } = options;
  const frameInterval = 1000 / fps;
  const processingTimes: number[] = [];

  // Process frames in batches to avoid memory issues
  for (let i = 0; i < frames.length; i += batchSize) {
    const batch = frames.slice(i, i + batchSize);
    const batchStart = Date.now();

    for (const frame of batch) {
      const startTime = performance.now();
      await sendFrameToWorker(worker, frame);
      processingTimes.push(performance.now() - startTime);

      // Maintain frame rate
      const elapsed = Date.now() - batchStart;
      const expectedTime = processingTimes.length * frameInterval;
      if (elapsed < expectedTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, expectedTime - elapsed),
        );
      }
    }
  }

  const stats = calculateStats(processingTimes);
  return {
    averageProcessingTime: stats.mean,
    maxProcessingTime: Math.max(...processingTimes),
    minProcessingTime: Math.min(...processingTimes),
    stdDeviation: stats.stdDev,
  };
}

/**
 * Calculates statistical measures from an array of numbers
 */
export function calculateStats(data: number[]): {
  mean: number;
  stdDev: number;
} {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;

  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}
