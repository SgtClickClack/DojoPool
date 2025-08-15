# Umpire System Module Documentation

## Overview
The Umpire system is a WebSocket-based game monitoring system that handles real-time frame processing and shot detection. The system is built with TypeScript and follows a modular architecture for better maintainability and performance.

## Module Structure

### Core Modules

#### `state.ts`
- Manages application state
- Defines state interfaces
- Provides state initialization functions

#### `ui.ts`
- Handles UI updates and DOM manipulation
- Manages alerts and notifications
- Handles animation and status updates

#### `frame-capture.ts`
- Manages video frame capture
- Handles canvas operations
- Provides frame validation

#### `socket-handlers.ts`
- Socket event handlers
- Connection management
- Error handling

#### `shot-detection.ts`
- Shot detection logic
- Game statistics updates
- Visual feedback for shots

#### `index.ts`
- Main entry point
- Module coordination
- System initialization

### Supporting Files

#### `frame-worker.ts`
- Web Worker for frame processing
- Optimized with TypedArrays
- Parallel processing capabilities

#### `socket-pool.ts`
- WebSocket connection pooling
- Message compression
- Connection management

## Key Features

### Performance Optimizations
- Memory pooling for frame processing
- Connection pooling for WebSockets
- Message compression
- Parallel processing for large frames

### Error Handling
- Comprehensive error states
- Automatic reconnection
- Graceful degradation

### UI Updates
- Debounced status updates
- Efficient DOM manipulation
- Smooth animations

## Usage

### Initialization
```typescript
import { initUmpireSystem } from './umpire';

document.addEventListener('DOMContentLoaded', async () => {
    await initUmpireSystem();
});
```

### State Management
```typescript
import { umpireState } from './umpire';

// Access state
console.log(umpireState.stats.totalFrames);
```

### Cleanup
```typescript
import { cleanup } from './umpire';

// Clean up resources
cleanup();
```

## Testing
Unit tests are available for all modules:
```bash
npm test
```

## Development

### Prerequisites
- Node.js 14+
- TypeScript 4.5+
- Jest for testing

### Build
```bash
npm run build
```

### Development Server
```bash
npm run dev
```

## Best Practices

### Code Organization
- Keep modules focused and single-responsibility
- Use TypeScript for type safety
- Follow consistent naming conventions

### Performance
- Reuse canvas elements
- Implement proper cleanup
- Use Web Workers for heavy processing
- Pool connections and resources

### Testing
- Write unit tests for all modules
- Mock external dependencies
- Test error conditions 