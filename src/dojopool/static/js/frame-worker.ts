// Frame processing worker
const PROCESSING_CHUNK_SIZE = 1024;
const BRIGHTNESS_THRESHOLD = 200;
const MAX_CONFIDENCE = 55;
const MAX_POOLED_FRAMES = 3;

interface FrameMessage {
  type: 'process';
  imageData: ImageData;
  timestamp: number;
}

interface ProcessedResult {
  type: 'result';
  shotDetected: boolean;
  position?: { x: number; y: number };
  confidence?: number;
  timestamp: number;
}

// Memory pools
class MemoryPool {
  private uint32Buffers: Uint32Array[] = [];
  private float64Buffers: Float64Array[] = [];
  private poolSize = 0;

  initialize(frameSize: number): void {
    const requiredUint32Size = frameSize / 4;
    const requiredFloat64Size = Math.ceil(
      requiredUint32Size / PROCESSING_CHUNK_SIZE
    );

    while (this.poolSize < MAX_POOLED_FRAMES) {
      this.uint32Buffers.push(new Uint32Array(requiredUint32Size));
      this.float64Buffers.push(new Float64Array(requiredFloat64Size));
      this.poolSize++;
    }
  }

  acquire(): { uint32View: Uint32Array; brightnessSums: Float64Array } | null {
    if (this.uint32Buffers.length === 0 || this.float64Buffers.length === 0) {
      return null;
    }

    return {
      uint32View: this.uint32Buffers.pop()!,
      brightnessSums: this.float64Buffers.pop()!,
    };
  }

  release(buffers: {
    uint32View: Uint32Array;
    brightnessSums: Float64Array;
  }): void {
    if (this.poolSize < MAX_POOLED_FRAMES) {
      this.uint32Buffers.push(buffers.uint32View);
      this.float64Buffers.push(buffers.brightnessSums);
    }
  }

  clear(): void {
    this.uint32Buffers = [];
    this.float64Buffers = [];
    this.poolSize = 0;
  }
}

const memoryPool = new MemoryPool();

self.onmessage = async (e: MessageEvent<FrameMessage>) => {
  if (e.data.type === 'process') {
    const result = await processFrame(e.data.imageData);
    self.postMessage({
      type: 'result',
      ...result,
      timestamp: e.data.timestamp,
    } as ProcessedResult);
  }
};

async function processFrame(
  imageData: ImageData
): Promise<Partial<ProcessedResult>> {
  const { data, width, height } = imageData;

  // Initialize or get pooled memory
  if (memoryPool.poolSize === 0) {
    memoryPool.initialize(data.length);
  }

  const buffers = memoryPool.acquire();
  if (!buffers) {
    // Fallback to regular processing if pool is exhausted
    return processFrameWithoutPool(imageData);
  }

  const { uint32View, brightnessSums } = buffers;

  try {
    // Process image data in chunks for better performance
    const chunks = Math.ceil(data.length / 4 / PROCESSING_CHUNK_SIZE);
    const maxBrightness = 0;
    const maxBrightnessX = 0;
    const maxBrightnessY = 0;

    // Convert to Uint32Array for faster processing
    const bytes = new Uint8Array(data.buffer);
    uint32View.set(new Uint32Array(bytes.buffer));

    // Use parallel processing for large frames
    if (chunks > 4) {
      await processChunksParallel(uint32View, brightnessSums, chunks, width);
    } else {
      processChunksSequential(uint32View, brightnessSums, chunks, width);
    }

    const result = calculateResults(uint32View, brightnessSums, width);
    return result;
  } finally {
    // Return buffers to pool
    memoryPool.release(buffers);
  }
}

function processChunksSequential(
  uint32View: Uint32Array,
  brightnessSums: Float64Array,
  chunks: number,
  width: number
): void {
  const maxBrightness = 0;
  const maxBrightnessX = 0;
  const maxBrightnessY = 0;

  for (let i = 0; i < chunks; i++) {
    const start = i * PROCESSING_CHUNK_SIZE;
    const end = Math.min(start + PROCESSING_CHUNK_SIZE, uint32View.length);
    processChunk(uint32View, brightnessSums, i, start, end, width);
  }
}

async function processChunksParallel(
  uint32View: Uint32Array,
  brightnessSums: Float64Array,
  chunks: number,
  width: number
): Promise<void> {
  const chunkPromises = [];
  const chunkSize = Math.ceil(chunks / 4); // Process in 4 parallel chunks

  for (let i = 0; i < 4; i++) {
    const start = i * chunkSize * PROCESSING_CHUNK_SIZE;
    const end = Math.min(
      start + chunkSize * PROCESSING_CHUNK_SIZE,
      uint32View.length
    );
    chunkPromises.push(
      processChunkRange(uint32View, brightnessSums, start, end, width)
    );
  }

  await Promise.all(chunkPromises);
}

function processChunk(
  uint32View: Uint32Array,
  brightnessSums: Float64Array,
  chunkIndex: number,
  start: number,
  end: number,
  width: number
): void {
  let chunkBrightness = 0;
  let localMaxBrightness = 0;
  let localMaxX = 0;
  let localMaxY = 0;

  for (let j = start; j < end; j++) {
    const pixel = uint32View[j];
    const r = pixel & 0xff;
    const g = (pixel >> 8) & 0xff;
    const b = (pixel >> 16) & 0xff;
    const brightness = (r + g + b) / 3;

    if (brightness > localMaxBrightness) {
      localMaxBrightness = brightness;
      localMaxX = j % width;
      localMaxY = Math.floor(j / width);
    }

    chunkBrightness += brightness;
  }

  brightnessSums[chunkIndex] = chunkBrightness;
}

async function processChunkRange(
  uint32View: Uint32Array,
  brightnessSums: Float64Array,
  start: number,
  end: number,
  width: number
): Promise<void> {
  const chunks = Math.ceil((end - start) / PROCESSING_CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const chunkStart = start + i * PROCESSING_CHUNK_SIZE;
    const chunkEnd = Math.min(chunkStart + PROCESSING_CHUNK_SIZE, end);
    processChunk(
      uint32View,
      brightnessSums,
      Math.floor(chunkStart / PROCESSING_CHUNK_SIZE),
      chunkStart,
      chunkEnd,
      width
    );
  }
}

function calculateResults(
  uint32View: Uint32Array,
  brightnessSums: Float64Array,
  width: number
): Partial<ProcessedResult> {
  const avgBrightness =
    brightnessSums.reduce((a, b) => a + b, 0) / uint32View.length;
  const maxBrightness = Math.max(...Array.from(brightnessSums));
  const shotDetected = maxBrightness > BRIGHTNESS_THRESHOLD;

  // Find position of maximum brightness
  let maxIndex = 0;
  if (shotDetected) {
    maxIndex = Array.from(uint32View).findIndex((val, idx) => {
      const r = val & 0xff;
      const g = (val >> 8) & 0xff;
      const b = (val >> 16) & 0xff;
      return (r + g + b) / 3 === maxBrightness;
    });
  }

  return {
    shotDetected,
    position: shotDetected
      ? {
          x: maxIndex % width,
          y: Math.floor(maxIndex / width),
        }
      : undefined,
    confidence: shotDetected
      ? (maxBrightness - BRIGHTNESS_THRESHOLD) / MAX_CONFIDENCE
      : 0,
  };
}
