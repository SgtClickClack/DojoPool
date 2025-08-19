# WebSocket Manager

A unified WebSocket manager for real-time game events, frame processing, and client communication.

## Features

- Room-based message broadcasting
- Event subscription/unsubscription
- Automatic reconnection
- Error recovery
- Message queuing during disconnection
- Connection state management
- TypeScript support

## Installation

```bash
npm install socket.io-client
```

## Usage

### Basic Example

```typescript
import { socketManager } from './socket_manager';

// Connect to the server
socketManager
  .connect()
  .then(() => {
    console.log('Connected to server');

    // Subscribe to events
    socketManager.subscribe('game_state', (state) => {
      console.log('Game state:', state);
    });

    // Send a message
    socketManager.send('shot', {
      power: 0.8,
      angle: 45.0,
    });
  })
  .catch(console.error);
```

### Room Management

```typescript
// Join a room
socketManager.send('join_room', {
  room: `game_123`,
});

// Leave a room
socketManager.send('leave_room', {
  room: `game_123`,
});
```

### Event Subscription

```typescript
// Subscribe to events
const onGameState = (state) => {
  console.log('Game state:', state);
};
socketManager.subscribe('game_state', onGameState);

// Unsubscribe when done
socketManager.unsubscribe('game_state', onGameState);
```

### Error Handling

```typescript
// Subscribe to error events
socketManager.subscribe('error', (error) => {
  console.error('Socket error:', error);
});

// Check connection state
const state = socketManager.getConnectionState();
console.log('Connection state:', state);
```

### Cleanup

```typescript
// Disconnect when done
socketManager.disconnect();
```

## Message Format

All messages follow this format:

```typescript
interface Message<T = any> {
  type: string; // Event type
  payload: T; // Event data
  timestamp: string; // ISO format timestamp
}
```

## Event Types

- `ready`: Client is ready to receive messages
- `shot`: Player took a shot
- `game_state`: Game state update
- `error`: Error occurred
- `monitoring_status`: Frame processing status
- `frame_result`: Frame processing result

## Configuration

```typescript
const options = {
  url: 'ws://localhost:8000',
  reconnectAttempts: 15,
  reconnectDelay: 1000,
  debug: true,
  timeout: 60000,
};

const manager = SocketManager.getInstance(options);
```

## Connection States

- `INITIALIZING`: Initial setup
- `CONNECTED`: Successfully connected
- `DISCONNECTED`: Connection lost
- `ERROR`: Error occurred

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT
