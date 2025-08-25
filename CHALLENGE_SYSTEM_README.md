# Real-time Player Challenge System

## Overview

The Real-time Player Challenge System allows players to challenge friends to pool matches with real-time notifications and response handling. Players can send challenges, receive instant notifications, and respond with accept/decline actions.

## Features

- **Real-time Challenge Creation**: Send challenges to other players instantly
- **Live Notifications**: Receive toast notifications for new challenges
- **Accept/Decline Actions**: Respond to challenges directly from notifications
- **Challenge Status Tracking**: Monitor challenge status (Pending, Accepted, Declined, Expired)
- **Stake-based System**: Set coin stakes for challenges
- **Challenge History**: View all incoming and outgoing challenges
- **WebSocket Integration**: Real-time updates across all connected clients

## Architecture

### Backend (Express + Socket.io)

- **Challenge Endpoints**:
  - `POST /api/v1/challenges` - Create new challenge
  - `PATCH /api/v1/challenges/:id` - Respond to challenge
  - `GET /api/v1/challenges` - Get user challenges

- **WebSocket Events**:
  - `new_challenge` - Sent to challenged player
  - `challenge_response` - Sent to challenger
  - `register_user` - Register user for targeted notifications

### Frontend (React + Next.js)

- **ChallengeContext**: Global state management for challenges
- **ChallengeNotification**: Toast component with accept/decline buttons
- **Player Profile**: Challenge button for friend profiles
- **Challenges Page**: Management interface for all challenges
- **Demo Page**: Testing and demonstration interface

## Usage

### 1. Send a Challenge

```typescript
import { sendChallenge } from '../services/APIService';

const handleChallenge = async () => {
  try {
    const challenge = await sendChallenge('player-id', 100);
    console.log('Challenge sent:', challenge);
  } catch (error) {
    console.error('Failed to send challenge:', error);
  }
};
```

### 2. Listen for Challenge Events

```typescript
import { useChallenge } from '../contexts/ChallengeContext';

const { challenges, currentChallenge } = useChallenge();

// Challenges will automatically update via WebSocket
useEffect(() => {
  if (currentChallenge) {
    // Handle new challenge notification
    console.log('New challenge received:', currentChallenge);
  }
}, [currentChallenge]);
```

### 3. Respond to Challenges

The system automatically shows challenge notifications with accept/decline buttons. Users can respond directly from the toast notification.

### 4. View Challenge History

```typescript
import { getUserChallenges } from '../services/APIService';

const loadChallenges = async () => {
  const userChallenges = await getUserChallenges('user-id');
  console.log('User challenges:', userChallenges);
};
```

## Testing

### Backend Testing

1. Start the backend server: `npm run start`
2. Test challenge creation:

   ```bash
   curl -X POST http://localhost:3002/api/v1/challenges \
     -H "Content-Type: application/json" \
     -d '{"challengerId":"user1","defenderId":"user2","stakeCoins":100}'
   ```

3. Test challenge response:
   ```bash
   curl -X PATCH http://localhost:3002/api/v1/challenges/challenge-id \
     -H "Content-Type: application/json" \
     -d '{"status":"ACCEPTED"}'
   ```

### Frontend Testing

1. Start the frontend: `npm run dev:next`
2. Navigate to `/challenge-demo` to test the challenge system
3. Use the demo page to send challenges and see real-time updates

## WebSocket Events

### Client to Server

- `register_user`: Register user for targeted notifications
  ```typescript
  socket.emit('register_user', { userId: 'user-123' });
  ```

### Server to Client

- `new_challenge`: New challenge notification

  ```typescript
  {
    challengeId: 'challenge-123',
    challengerId: 'user1',
    defenderId: 'user2',
    stakeCoins: 100,
    createdAt: '2024-12-19T12:00:00Z'
  }
  ```

- `challenge_response`: Challenge response notification
  ```typescript
  {
    challengeId: 'challenge-123',
    status: 'ACCEPTED',
    updatedAt: '2024-12-19T12:05:00Z'
  }
  ```

## Configuration

### Environment Variables

- `API_PORT`: Backend server port (default: 3002)
- `CORS_ORIGIN`: Allowed CORS origin (default: http://localhost:3000)

### WebSocket Configuration

- **Port**: 3002 (same as HTTP server)
- **Transports**: WebSocket, polling fallback
- **CORS**: Enabled with configurable origin
- **Reconnection**: Automatic with exponential backoff

## Future Enhancements

1. **Friend System Integration**: Implement actual friend validation
2. **Challenge Expiration**: Automatic status updates for expired challenges
3. **Match Scheduling**: Coordinate match times and venues
4. **Challenge Rules**: Customizable challenge requirements
5. **Tournament Integration**: Challenge-based tournament entry
6. **Analytics**: Challenge statistics and performance metrics

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend is running on port 3002
   - Verify CORS configuration
   - Check browser console for connection errors

2. **Challenges Not Updating**
   - Ensure user is registered with WebSocket
   - Check WebSocket connection status
   - Verify event listeners are properly set up

3. **API Calls Failing**
   - Check backend server status
   - Verify API endpoint URLs
   - Check request/response format

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=* npm run start
```

## Dependencies

- **Backend**: Express, Socket.io, CORS
- **Frontend**: React, Next.js, Material-UI, Socket.io-client
- **State Management**: React Context, Zustand
- **Styling**: Material-UI, Emotion

## Contributing

When adding new challenge features:

1. Update the Challenge interface in `ChallengeContext.tsx`
2. Add corresponding API endpoints in `src/backend/index.ts`
3. Update WebSocket event handling in `WebSocketService.ts`
4. Add UI components for new functionality
5. Update tests and documentation

## License

This system is part of the DojoPool platform and follows the project's licensing terms.
