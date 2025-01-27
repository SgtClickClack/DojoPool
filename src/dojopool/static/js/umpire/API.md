# Umpire System API Documentation

## State Module (`state.ts`)

### Interfaces

#### `UmpireState`
Main state interface for the umpire system.
```typescript
interface UmpireState {
    isProcessingFrame: boolean;    // Whether a frame is currently being processed
    lastProcessedFrame: number;    // Timestamp of last processed frame
    errorCount: number;           // Number of errors encountered
    isConnected: boolean;         // WebSocket connection status
    lastError: string | null;     // Last error message
    lastFrameTime: number;        // Timestamp of last frame capture
    stats: {
        totalFrames: number;      // Total frames captured
        processedFrames: number;  // Successfully processed frames
        detectedShots: number;    // Number of shots detected
    };
}
```

### Functions

#### `createInitialState()`
Creates and returns a new UmpireState object with default values.
```typescript
function createInitialState(): UmpireState
```

## UI Module (`ui.ts`)

### Interfaces

#### `DOMElements`
Cache for frequently accessed DOM elements.
```typescript
interface DOMElements {
    gameVideo: HTMLVideoElement | null;
    gameArea: HTMLElement | null;
    statusElements: {
        connection: HTMLElement | null;
        processing: HTMLElement | null;
        frames: HTMLElement | null;
        shots: HTMLElement | null;
        accuracy: HTMLElement | null;
    }
}
```

### Functions

#### `showError(message: string)`
Displays an error message to the user.
```typescript
function showError(message: string): void
```

#### `showSuccess(message: string)`
Displays a success message to the user.
```typescript
function showSuccess(message: string): void
```

#### `animateNumber(element: HTMLElement, start: number, end: number)`
Smoothly animates a number change in the UI.
```typescript
function animateNumber(element: HTMLElement, start: number, end: number): number
```

## Frame Capture Module (`frame-capture.ts`)

### Constants
```typescript
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
```

### Functions

#### `captureFrame()`
Captures a frame from the video element.
```typescript
async function captureFrame(): Promise<ImageData | null>
```

#### `validateFrame(imageData: ImageData | null)`
Validates captured frame data.
```typescript
async function validateFrame(imageData: ImageData | null): Promise<ImageData | null>
```

## Socket Handlers Module (`socket-handlers.ts`)

### Constants
```typescript
const MAX_RECONNECT_ATTEMPTS = 5;
```

### Functions

#### `handleConnect(state: UmpireState)`
Handles successful WebSocket connections.
```typescript
function handleConnect(state: UmpireState): void
```

#### `handleConnectionError(state: UmpireState, error: Error)`
Handles WebSocket connection errors.
```typescript
function handleConnectionError(state: UmpireState, error: Error): void
```

## Shot Detection Module (`shot-detection.ts`)

### Functions

#### `handleShotDetection(domElements: DOMElements, data: ShotData)`
Processes and visualizes detected shots.
```typescript
function handleShotDetection(
    domElements: DOMElements,
    data: {
        position: { x: number; y: number },
        confidence?: number;
        timestamp: number
    }
): void
```

#### `handleCalibrationComplete(data: CalibrationData)`
Handles completion of system calibration.
```typescript
function handleCalibrationComplete(data: { stats: any }): void
```

## Frame Worker Module (`frame-worker.ts`)

### Constants
```typescript
const PROCESSING_CHUNK_SIZE = 1024;
const BRIGHTNESS_THRESHOLD = 200;
const MAX_CONFIDENCE = 55;
```

### Types

#### `FrameMessage`
```typescript
interface FrameMessage {
    type: 'process';
    imageData: ImageData;
    timestamp: number;
}
```

#### `ProcessedResult`
```typescript
interface ProcessedResult {
    type: 'result';
    shotDetected: boolean;
    position?: { x: number; y: number };
    confidence?: number;
    timestamp: number;
}
```

## Socket Pool Module (`socket-pool.ts`)

### Classes

#### `SocketPool`
Manages a pool of WebSocket connections.

##### Constructor
```typescript
constructor(maxSize = 5, maxAge = 300000)
```

##### Methods
```typescript
async getSocket(): Promise<Socket>
releaseSocket(socket: Socket): void
disconnectAll(): void
```

### Usage Examples

#### Initializing the System
```typescript
import { initUmpireSystem } from './umpire';

document.addEventListener('DOMContentLoaded', async () => {
    await initUmpireSystem();
});
```

#### Handling Shot Detection
```typescript
import { handleShotDetection } from './umpire/shot-detection';

const shotData = {
    position: { x: 100, y: 200 },
    confidence: 0.85,
    timestamp: Date.now()
};

handleShotDetection(domElements, shotData);
```

#### Managing WebSocket Connections
```typescript
import { socketPool } from './socket-pool';

const socket = await socketPool.getSocket();
// Use socket...
socketPool.releaseSocket(socket);
``` 