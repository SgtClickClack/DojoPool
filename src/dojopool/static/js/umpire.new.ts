const metricsCollector = require("../../scripts/collect-metrics");
const alertManager = require("../../scripts/alert-manager");

// Types and interfaces
interface Frame {
  width: number;
  height: number;
  data: ImageData;
  bitmap?: ImageBitmap;
  offscreenCanvas?: OffscreenCanvas;
}

interface WorkerMessage {
  type: "process" | "result" | "error" | "init";
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

interface ShotDetectionResult {
  confidence: number;
  processingTime: number;
  verified: boolean;
}

interface CustomWorker extends Worker {
  activeTaskCount: number;
  maxTasks: number;
}

interface PerformanceMetrics {
  captureTime: number;
  processingTime: number;
  totalTime: number;
  fps: number;
  memoryUsage?: {
    jsHeapSize: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

interface UmpireState {
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

interface UmpireOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

interface UmpireConfig {
  videoElement: HTMLVideoElement;
  width: number;
  height: number;
  brightnessThreshold?: number;
  motionThreshold?: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  frameTime: number;
  gpuTime: number;
  memoryStats: any;
  workerUtilization: number;
}

interface MemoryPoolStats {
  allocated: number;
  available: number;
  peakUsage: number;
}

interface MemoryPool<T = any> {
  size: number;
  available: number;
  allocate: () => T;
  free: (item: T) => void;
  gc: () => void;
  stats: () => MemoryPoolStats;
}

interface WebGLContextState {
  lostCount: number;
  lastLostTime: number;
  qualityLevel: number;
  isContextLost: boolean;
  recoveryAttempts: number;
}

interface WebGLResources {
  gl: WebGLRenderingContext | null;
  program: WebGLProgram | null;
  vertexBuffer: WebGLBuffer | null;
  textureCoordBuffer: WebGLBuffer | null;
  texture: WebGLTexture | null;
}

interface GPUCapabilities {
  maxTextureSize: number;
  maxViewportDims: number[];
  maxRenderbufferSize: number;
}

interface KalmanState {
  x: number; // State (position)
  v: number; // Velocity
  P: [number, number, number, number]; // Covariance matrix
}

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const SOCKET_URL = window.location.origin;
const STATUS_UPDATE_DEBOUNCE = 100; // ms
const FRAME_DROP_THRESHOLD = FRAME_INTERVAL * 2; // Drop frames if processing takes too long
const CONTEXT_RECOVERY_DELAY = 1000; // 1 second
const MAX_CONTEXT_RECOVERY_ATTEMPTS = 3;
const QUALITY_REDUCTION_STEP = 0.2;
const MIN_QUALITY_LEVEL = 0.4;

// Performance marks
const MARKS = {
  FRAME_START: "frame_start",
  CAPTURE_END: "capture_end",
  PROCESS_END: "process_end",
};

// Feature detection
const SUPPORTS_OFFSCREEN_CANVAS = "OffscreenCanvas" in window;
const SUPPORTS_TRANSFER_CONTROL =
  "transferControlToOffscreen" in HTMLCanvasElement.prototype;

// Constants for Kalman filter
const KF = {
  Q: 0.001, // Process noise
  R: 0.1, // Measurement noise
  dt: 1 / TARGET_FPS, // Time step
};

// WebGL shader source code
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
  }
`;

// Global state variables
let captureCanvas: HTMLCanvasElement | null = null;
let captureContext: CanvasRenderingContext2D | null = null;
const lastBitmap: ImageBitmap | null = null;
const offscreenCanvas: OffscreenCanvas | null = null;
const lastFrameTime = performance.now();
const frameProcessingId: number | null = null;
const statusAnimationId: number | null = null;
const statusUpdateTimer: number | null = null;
const isProcessingFrame = false;
const reconnectAttempts = 0;
const socket: Socket | null = null;
const frameWorker: CustomWorker | null = null;

// Initialize WebGL state
const webglState: WebGLContextState = {
  lostCount: 0,
  lastLostTime: 0,
  qualityLevel: 1.0, // Full quality
  isContextLost: false,
  recoveryAttempts: 0,
};

const glResources: WebGLResources = {
  gl: null,
  program: null,
  vertexBuffer: null,
  textureCoordBuffer: null,
  texture: null,
};

// Kalman filter state
const kalmanStateX: KalmanState = {
  x: 0,
  v: 0,
  P: [1, 0, 0, 1],
};

const kalmanStateY: KalmanState = {
  x: 0,
  v: 0,
  P: [1, 0, 0, 1],
};

const umpireState: UmpireState = {
  isProcessingFrame: false,
  lastProcessedFrame: 0,
  errorCount: 0,
  isConnected: false,
  lastError: null,
  lastFrameTime: 0,
  metrics: {
    captureTime: 0,
    processingTime: 0,
    totalTime: 0,
    fps: 0,
  },
  stats: {
    totalFrames: 0,
    processedFrames: 0,
    detectedShots: 0,
    droppedFrames: 0,
  },
};

// Cache DOM elements
const domElements = {
  gameVideo: null as HTMLVideoElement | null,
  gameArea: null as HTMLElement | null,
  statusElements: {
    connection: null as HTMLElement | null,
    processing: null as HTMLElement | null,
    frames: null as HTMLElement | null,
    shots: null as HTMLElement | null,
    accuracy: null as HTMLElement | null,
  },
};

// Class declarations
class GenericMemoryPool<T> implements MemoryPool<T> {
  private items: T[] = [];
  private _size: number = 0;
  private _available: number = 0;
  private _allocated: number = 0;
  private _peakUsage: number = 0;

  constructor(initialSize: number = 0) {
    this._size = initialSize;
    this._available = initialSize;
  }

  get size(): number {
    return this._size;
  }

  get available(): number {
    return this._available;
  }

  allocate(): T {
    if (this._available === 0) {
      this.grow();
    }
    const item = this.items.pop()!;
    this._available--;
    this._allocated++;
    this._peakUsage = Math.max(this._peakUsage, this._allocated);
    return item;
  }

  free(item: T): void {
    this.items.push(item);
    this._available++;
    this._allocated--;
  }

  gc(): void {
    // Implement garbage collection logic
    this.items = this.items.filter(
      (item) => item !== null && item !== undefined,
    );
    this._size = this.items.length;
    this._available = this._size - this._allocated;
  }

  stats(): MemoryPoolStats {
    return {
      allocated: this._allocated,
      available: this._available,
      peakUsage: this._peakUsage,
    };
  }

  private grow(): void {
    const growthFactor = 1.5;
    const newSize = Math.max(10, Math.ceil(this._size * growthFactor));
    this._size = newSize;
    this._available = newSize - this._allocated;
  }
}

class MemoryManager {
  private static instance: MemoryManager;
  private pools: Map<string, MemoryPool<any>>;
  private stats: {
    totalAllocated: number;
    peakUsage: number;
    currentUsage: number;
  };

  private constructor() {
    this.pools = new Map();
    this.stats = {
      totalAllocated: 0,
      peakUsage: 0,
      currentUsage: 0,
    };
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  registerPool(name: string, pool: MemoryPool<any>): void {
    this.pools.set(name, pool);
  }

  monitorMemorySpikes(): void {
    if ("memory" in performance) {
      const memoryInfo = (performance as any).memory;
      this.stats.currentUsage = memoryInfo.usedJSHeapSize;
      this.stats.peakUsage = Math.max(
        this.stats.peakUsage,
        this.stats.currentUsage,
      );
    }
  }

  getStats() {
    return {
      ...this.stats,
      pools: Array.from(this.pools.entries()).map(([name, pool]) => ({
        name,
        ...pool.stats(),
      })),
    };
  }
}

class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private recoveryStrategies: Map<string, () => Promise<boolean>>;
  private errorPatterns: Map<string, RegExp>;
  private recoveryHistory: {
    timestamp: number;
    error: string;
    success: boolean;
  }[];

  private constructor() {
    this.recoveryStrategies = new Map();
    this.errorPatterns = new Map();
    this.recoveryHistory = [];
  }

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  registerStrategy(name: string, strategy: () => Promise<boolean>): void {
    this.recoveryStrategies.set(name, strategy);
  }

  addErrorPattern(name: string, pattern: RegExp): void {
    this.errorPatterns.set(name, pattern);
  }

  async handleError(error: Error): Promise<boolean> {
    const errorString = error.toString();
    let handled = false;

    for (const [name, pattern] of this.errorPatterns) {
      if (pattern.test(errorString)) {
        const strategy = this.recoveryStrategies.get(name);
        if (strategy) {
          handled = await strategy();
          this.recoveryHistory.push({
            timestamp: Date.now(),
            error: errorString,
            success: handled,
          });
          break;
        }
      }
    }

    return handled;
  }

  getRecoveryHistory() {
    return [...this.recoveryHistory];
  }
}

class PerformanceProfiler {
  private static instance: PerformanceProfiler;
  private snapshots: PerformanceSnapshot[] = [];
  private readonly maxSnapshots = 100;
  private lastSnapshotTime: number;
  private readonly snapshotInterval = 1000; // 1 second

  private constructor() {
    this.lastSnapshotTime = performance.now();
  }

  static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler();
    }
    return PerformanceProfiler.instance;
  }

  takeSnapshot(frameTime: number, gpuTime: number): void {
    const now = performance.now();
    if (now - this.lastSnapshotTime < this.snapshotInterval) {
      return;
    }

    const snapshot: PerformanceSnapshot = {
      timestamp: now,
      fps: 1000 / frameTime,
      frameTime,
      gpuTime,
      memoryStats: memoryManager.getStats(),
      workerUtilization: frameWorker
        ? frameWorker.activeTaskCount / frameWorker.maxTasks
        : 0,
    };

    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    this.lastSnapshotTime = now;
  }

  getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  getLatestSnapshot(): PerformanceSnapshot | null {
    return this.snapshots[this.snapshots.length - 1] || null;
  }
}

// Initialize managers
const memoryManager = MemoryManager.getInstance();
const errorRecoveryManager = ErrorRecoveryManager.getInstance();
const performanceProfiler = PerformanceProfiler.getInstance();

// Initialize memory pools
const framePool = new GenericMemoryPool<any>(100);
const bufferPool = new GenericMemoryPool<any>(100);

// Register memory pools
memoryManager.registerPool("frame", framePool);
memoryManager.registerPool("buffer", bufferPool);

// Functions
function initializeDOMElements(): void {
  domElements.gameVideo = document.getElementById(
    "game-video",
  ) as HTMLVideoElement;
  domElements.gameArea = document.getElementById("game-area");
  domElements.statusElements = {
    connection: document.getElementById("connection-status"),
    processing: document.getElementById("processing-status"),
    frames: document.getElementById("frame-count"),
    shots: document.getElementById("shot-count"),
    accuracy: document.getElementById("accuracy-display"),
  };
}

function initializeCaptureCanvas(): void {
  if (!captureCanvas) {
    captureCanvas = document.createElement("canvas");
    captureContext = captureCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });

    if (captureContext) {
      captureContext.imageSmoothingEnabled = false;
      captureContext.imageSmoothingQuality = "low";
    }
  }
}

function getQualityAdjustedShader(): string {
  // Adjust shader complexity based on quality level
  const quality = webglState.qualityLevel;

  if (quality < 0.6) {
    // Minimal shader for low-end devices
    return `
      precision lowp float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `;
  } else if (quality < 0.8) {
    // Medium quality shader
    return `
      precision mediump float;
      uniform sampler2D u_image;
      varying vec2 v_texCoord;
      void main() {
        vec4 color = texture2D(u_image, v_texCoord);
        gl_FragColor = color;
      }
    `;
  } else {
    // Full quality shader with all features
    return fragmentShaderSource;
  }
}

// ... rest of the functions ...
