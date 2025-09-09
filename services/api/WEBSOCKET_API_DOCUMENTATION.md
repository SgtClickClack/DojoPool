# WebSocket API Documentation

## Overview

The Dojo Pool platform uses WebSocket connections to provide real-time updates for activity events and notifications. This enables live social feed updates, instant notifications, and real-time multiplayer features.

## Connection Details

### Base URL

```
ws://localhost:3002
wss://your-domain.com (production)
```

### Authentication

WebSocket connections require JWT authentication. Include the JWT token as a query parameter:

```
ws://localhost:3002?token=<jwt_token>
```

### Connection Status

The WebSocket service provides connection status monitoring:

```javascript
websocketService.getConnectionStatus(); // Returns: 'connected' | 'connecting' | 'disconnected'
```

## Namespaces

The platform uses multiple Socket.IO namespaces for different features:

### Activity Events (`/activity`)

Handles real-time activity feed updates and social events.

#### Client Events

##### `subscribe_to_feed`

Subscribe to activity feed updates.

**Parameters:**

```json
{
  "filter": "global" | "friends"
}
```

**Example:**

```javascript
socket.emit('subscribe_to_feed', { filter: 'global' });
```

##### `unsubscribe_from_feed`

Unsubscribe from activity feed updates.

**Example:**

```javascript
socket.emit('unsubscribe_from_feed');
```

#### Server Events

##### `new_activity_event`

Broadcast when a new activity event occurs.

**Payload:**

```json
{
  "type": "new_activity_event",
  "data": {
    "id": "string",
    "type": "GAME_COMPLETED | TOURNAMENT_WON | ...",
    "title": "string",
    "description": "string",
    "username": "string",
    "userAvatar": "string",
    "createdAt": "ISO 8601 timestamp",
    "isPublic": "boolean",
    "venue": {
      "id": "string",
      "name": "string"
    },
    "match": {
      "id": "string",
      "winnerId": "string"
    },
    "tournament": {
      "id": "string",
      "name": "string"
    },
    "clan": {
      "id": "string",
      "name": "string"
    }
  }
}
```

### Notifications (`/notifications`)

Handles real-time personal notifications.

#### Server Events

##### `new_notification`

Broadcast when a new notification is created for the user.

**Payload:**

```json
{
  "type": "new_notification",
  "data": {
    "id": "string",
    "type": "challenge_received | match_result | ...",
    "title": "string",
    "message": "string",
    "isRead": "boolean",
    "createdAt": "ISO 8601 timestamp",
    "userId": "string"
  }
}
```

### Chat (`/chat`)

Handles real-time messaging (if implemented).

#### Client Events

##### `join_room`

Join a chat room.

**Parameters:**

```json
{
  "roomId": "string"
}
```

##### `leave_room`

Leave a chat room.

**Parameters:**

```json
{
  "roomId": "string"
}
```

##### `send_message`

Send a message to a room.

**Parameters:**

```json
{
  "roomId": "string",
  "message": "string",
  "messageType": "text" | "emoji" | "system"
}
```

#### Server Events

##### `message_received`

Broadcast when a new message is received in a room.

**Payload:**

```json
{
  "type": "message_received",
  "data": {
    "id": "string",
    "roomId": "string",
    "senderId": "string",
    "senderUsername": "string",
    "message": "string",
    "messageType": "text" | "emoji" | "system",
    "timestamp": "ISO 8601 timestamp"
  }
}
```

##### `user_joined`

Broadcast when a user joins a room.

##### `user_left`

Broadcast when a user leaves a room.

### Match Updates (`/matches`)

Handles real-time match updates and live game events.

#### Client Events

##### `join_match`

Join a match room for live updates.

**Parameters:**

```json
{
  "matchId": "string"
}
```

##### `leave_match`

Leave a match room.

**Parameters:**

```json
{
  "matchId": "string"
}
```

#### Server Events

##### `match_update`

Broadcast when match state changes.

**Payload:**

```json
{
  "type": "match_update",
  "data": {
    "matchId": "string",
    "status": "SCHEDULED | IN_PROGRESS | COMPLETED | ...",
    "currentPlayer": "string",
    "score": {
      "playerA": "number",
      "playerB": "number"
    },
    "lastShot": {
      "playerId": "string",
      "result": "success | foul | miss",
      "timestamp": "ISO 8601 timestamp"
    }
  }
}
```

##### `shot_taken`

Broadcast when a shot is taken in a live match.

##### `foul_committed`

Broadcast when a foul is committed.

##### `rack_completed`

Broadcast when a rack is completed.

## Activity Event Types

### Game Events

| Event Type       | Description      | Triggers          |
| ---------------- | ---------------- | ----------------- |
| `GAME_COMPLETED` | Match finished   | When a match ends |
| `SHOT_ANALYZED`  | AI analyzed shot | After AI analysis |
| `RACK_START`     | New rack begins  | Match progression |
| `RACK_END`       | Rack completed   | Match progression |

### Tournament Events

| Event Type          | Description        | Triggers                          |
| ------------------- | ------------------ | --------------------------------- |
| `TOURNAMENT_WON`    | Tournament victory | Tournament completion             |
| `TOURNAMENT_JOINED` | Player joined      | Tournament registration           |
| `TOURNAMENT_UPDATE` | Tournament changes | Bracket updates, schedule changes |

### Social Events

| Event Type     | Description        | Triggers                   |
| -------------- | ------------------ | -------------------------- |
| `FRIEND_ADDED` | Friendship created | Friend request acceptance  |
| `CLAN_JOINED`  | Clan membership    | Clan invitation acceptance |
| `CLAN_LEFT`    | Clan departure     | Clan membership removal    |

### Achievement Events

| Event Type               | Description          | Triggers                       |
| ------------------------ | -------------------- | ------------------------------ |
| `ACHIEVEMENT_EARNED`     | Achievement unlocked | Achievement criteria met       |
| `ACHIEVEMENT_PROGRESSED` | Achievement progress | Partial achievement completion |

### Territory Events

| Event Type            | Description          | Triggers                     |
| --------------------- | -------------------- | ---------------------------- |
| `TERRITORY_CAPTURED`  | Territory claimed    | Successful territory contest |
| `TERRITORY_CONTESTED` | Territory challenged | Territory contest initiated  |
| `TERRITORY_DEFENDED`  | Territory defended   | Successful territory defense |

### Venue Events

| Event Type                | Description    | Triggers                |
| ------------------------- | -------------- | ----------------------- |
| `VENUE_VISITED`           | Venue check-in | Player QR code scan     |
| `VENUE_SPECIAL_ACTIVATED` | Special event  | Venue special triggered |

## Notification Types

| Notification Type      | Description          | Priority |
| ---------------------- | -------------------- | -------- |
| `CHALLENGE_RECEIVED`   | Challenge invitation | HIGH     |
| `MATCH_RESULT`         | Match completion     | HIGH     |
| `TOURNAMENT_UPDATE`    | Tournament changes   | MEDIUM   |
| `ACHIEVEMENT_UNLOCKED` | Achievement earned   | MEDIUM   |
| `CLAN_INVITE`          | Clan invitation      | MEDIUM   |
| `FRIEND_REQUEST`       | Friend request       | LOW      |
| `SYSTEM`               | System messages      | LOW      |
| `DOJO_COIN_RECEIVED`   | Coin earnings        | LOW      |

## Client Implementation

### JavaScript/TypeScript Example

```javascript
import io from 'socket.io-client';

// Connect to activity namespace
const activitySocket = io('/activity', {
  query: { token: localStorage.getItem('jwt_token') },
});

// Listen for activity events
activitySocket.on('new_activity_event', (data) => {
  console.log('New activity:', data);
  // Update UI with new activity
  updateActivityFeed(data);
});

// Connect to notifications namespace
const notificationSocket = io('/notifications', {
  query: { token: localStorage.getItem('jwt_token') },
});

// Listen for notifications
notificationSocket.on('new_notification', (data) => {
  console.log('New notification:', data);
  // Show notification to user
  showNotification(data);
});

// Handle connection errors
activitySocket.on('connect_error', (error) => {
  console.error('WebSocket connection error:', error);
  // Implement reconnection logic
});
```

### React Hook Example

```javascript
import { useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export const useWebSocket = (namespace: string) => {
  const socketRef = useRef<Socket>();

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    socketRef.current = io(namespace, {
      query: { token }
    });

    socketRef.current.on('connect', () => {
      console.log(`${namespace} connected`);
    });

    socketRef.current.on('disconnect', () => {
      console.log(`${namespace} disconnected`);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [namespace]);

  return socketRef.current;
};
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Implement exponential backoff reconnection
  setTimeout(
    () => {
      socket.connect();
    },
    1000 * Math.pow(2, reconnectionAttempts)
  );
});
```

### Authentication Errors

```javascript
socket.on('unauthorized', (error) => {
  console.error('Authentication failed:', error.message);
  // Redirect to login or refresh token
  window.location.href = '/login';
});
```

## Performance Considerations

### Connection Limits

- Maximum 100 concurrent connections per user
- Automatic cleanup of inactive connections after 30 minutes
- Connection pooling for high-traffic scenarios

### Message Rate Limiting

- 10 messages per second per user
- 1000 messages per minute per room
- Automatic throttling for high-frequency events

### Payload Optimization

- Minified JSON payloads
- Compressed binary data for images/media
- Efficient event batching for bulk updates

## Security

### Authentication

- JWT token validation on connection
- Token refresh handling
- Secure token storage (httpOnly cookies recommended)

### Authorization

- User-specific room subscriptions
- Permission-based event filtering
- Rate limiting per user/room

### Encryption

- WSS (WebSocket Secure) in production
- End-to-end encryption for sensitive data
- Certificate-based authentication

## Monitoring and Debugging

### Connection Metrics

- Connection count per namespace
- Message throughput statistics
- Error rates and types
- Latency measurements

### Debugging Tools

```javascript
// Enable debug logging
localStorage.setItem('debug', 'socket.io-client:*');

// Monitor connection state
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('reconnect', () => console.log('Reconnected'));
```

## Testing

### Unit Tests

```javascript
describe('WebSocket Service', () => {
  it('should connect to activity namespace', () => {
    const socket = io('/activity');
    expect(socket.connected).toBe(true);
  });

  it('should handle activity events', (done) => {
    const socket = io('/activity');
    socket.on('new_activity_event', (data) => {
      expect(data.type).toBe('GAME_COMPLETED');
      done();
    });
    // Simulate event emission
  });
});
```

### Integration Tests

```javascript
describe('WebSocket Integration', () => {
  it('should broadcast activity events to subscribers', async () => {
    // Test full event lifecycle
    const user1 = createTestUser();
    const user2 = createTestUser();

    // User 1 subscribes
    const socket1 = connectAsUser(user1);

    // User 2 performs action that creates activity
    await performGameAction(user2);

    // User 1 should receive activity event
    await expect(socket1).toReceiveEvent('new_activity_event');
  });
});
```

## Deployment Considerations

### Production Setup

- Use Redis adapter for multi-server deployments
- Configure load balancer sticky sessions
- Set up monitoring and alerting
- Implement connection limits and rate limiting

### Scaling

- Horizontal scaling with Redis
- Message queue integration for high throughput
- Database connection pooling
- CDN integration for static assets

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check server URL and port
   - Verify CORS configuration
   - Check firewall settings

2. **Authentication Failed**
   - Verify JWT token validity
   - Check token expiration
   - Confirm user permissions

3. **Messages Not Received**
   - Check namespace configuration
   - Verify room subscription
   - Check client event listeners

4. **High Latency**
   - Monitor network conditions
   - Check server load
   - Optimize payload size
   - Consider message batching

### Debug Checklist

- [ ] WebSocket server running
- [ ] Correct namespace used
- [ ] Valid JWT token
- [ ] Client has proper permissions
- [ ] Network connectivity
- [ ] No firewall blocking connections
- [ ] CORS properly configured
- [ ] SSL/TLS certificates valid (production)
