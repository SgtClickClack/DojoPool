# Living World API Documentation

## Overview

The Living World API provides the backend infrastructure for DojoPool's immersive 3D world and real-time multiplayer experience. This system enables players to share their location, see nearby players, and interact in a persistent virtual environment that mirrors the real world.

## Core Architecture

### System Components

1. **Geolocation Service** - Handles secure location tracking and privacy controls
2. **World Gateway** - WebSocket server for real-time multiplayer communication
3. **Player Location Model** - Temporary storage of player positions with TTL
4. **World Events System** - Tracks interactions and events in the 3D world

### Security & Privacy

The system prioritizes user privacy with:

- **Temporary Storage**: Location data expires after 24 hours by default
- **User Control**: Players can disable location sharing at any time
- **Data Minimization**: Only essential location data is stored
- **Rate Limiting**: Prevents location spam and abuse
- **IP Hashing**: Sensitive network data is hashed for security monitoring

## API Endpoints

### Authentication

All endpoints require JWT authentication via Bearer token:

```bash
Authorization: Bearer <jwt_token>
```

---

## 1. Location Update

**POST** `/api/v1/location/update`

Updates the player's current location with comprehensive privacy controls.

### Request Body

```json
{
  "latitude": 40.7128,
  "longitude": -74.006,
  "accuracy": 10,
  "altitude": 100,
  "heading": 90,
  "speed": 5,
  "isPrecise": true,
  "isSharing": true,
  "deviceId": "device_123"
}
```

### Parameters

| Field       | Type    | Required | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| `latitude`  | number  | Yes      | Latitude (-90 to 90)                       |
| `longitude` | number  | Yes      | Longitude (-180 to 180)                    |
| `accuracy`  | number  | No       | Accuracy in meters                         |
| `altitude`  | number  | No       | Altitude in meters                         |
| `heading`   | number  | No       | Device heading (0-360°)                    |
| `speed`     | number  | No       | Speed in m/s                               |
| `isPrecise` | boolean | No       | Use precise location (default: true)       |
| `isSharing` | boolean | No       | Share location with others (default: true) |
| `deviceId`  | string  | No       | Anonymous device identifier                |

### Response

```json
{
  "success": true,
  "data": {
    "playerId": "user_123",
    "latitude": 40.7128,
    "longitude": -74.006,
    "accuracy": 10,
    "altitude": 100,
    "heading": 90,
    "speed": 5,
    "isPrecise": true,
    "isSharing": true,
    "lastUpdated": "2025-01-10T10:30:00Z",
    "expiresAt": "2025-01-11T10:30:00Z"
  },
  "message": "Location updated successfully"
}
```

### Error Responses

- **400**: Invalid location data or validation error
- **401**: Unauthorized
- **429**: Rate limit exceeded
- **500**: Internal server error

---

## 2. Get Nearby Players

**GET** `/api/v1/location/nearby-players`

Retrieves a list of players within a specified radius.

### Query Parameters

| Parameter   | Type   | Required | Default | Description                        |
| ----------- | ------ | -------- | ------- | ---------------------------------- |
| `latitude`  | number | Yes      | -       | Center latitude                    |
| `longitude` | number | Yes      | -       | Center longitude                   |
| `radius`    | number | No       | 1000    | Search radius in meters (10-10000) |
| `limit`     | number | No       | 50      | Max players to return (1-100)      |

### Example Request

```bash
GET /api/v1/location/nearby-players?latitude=40.7128&longitude=-74.0060&radius=2000&limit=25
```

### Response

```json
{
  "success": true,
  "data": {
    "center": {
      "latitude": 40.7128,
      "longitude": -74.006
    },
    "radius": 2000,
    "players": [
      {
        "playerId": "user_456",
        "username": "NearbyPlayer",
        "avatarUrl": "https://example.com/avatar.jpg",
        "clanTag": "EliteClan",
        "latitude": 40.7129,
        "longitude": -74.0061,
        "accuracy": 8,
        "distance": 150,
        "heading": 45,
        "speed": 1.2,
        "lastUpdated": "2025-01-10T10:30:00Z"
      }
    ],
    "totalCount": 1,
    "lastUpdated": "2025-01-10T10:30:00Z"
  }
}
```

---

## 3. Update Privacy Settings

**POST** `/api/v1/location/privacy`

Updates the player's location privacy preferences.

### Request Body

```json
{
  "locationSharing": true,
  "preciseLocation": false,
  "dataRetentionHours": 12,
  "showToFriendsOnly": false
}
```

### Parameters

| Field                | Type    | Required | Default | Description                        |
| -------------------- | ------- | -------- | ------- | ---------------------------------- |
| `locationSharing`    | boolean | Yes      | -       | Enable/disable location sharing    |
| `preciseLocation`    | boolean | No       | true    | Use precise GPS vs approximate     |
| `dataRetentionHours` | number  | No       | 24      | Hours to keep location data (1-24) |
| `showToFriendsOnly`  | boolean | No       | false   | Share only with friends            |

### Response

```json
{
  "success": true,
  "message": "Privacy settings updated successfully"
}
```

---

## 4. Get Current Location

**GET** `/api/v1/location/me`

Retrieves the player's current stored location.

### Response

```json
{
  "success": true,
  "data": {
    "playerId": "user_123",
    "latitude": 40.7128,
    "longitude": -74.006,
    "accuracy": 10,
    "isSharing": true,
    "lastUpdated": "2025-01-10T10:30:00Z",
    "expiresAt": "2025-01-11T10:30:00Z"
  }
}
```

---

## 5. Get Location Statistics

**GET** `/api/v1/location/stats`

Retrieves system-wide location statistics (admin/debugging).

### Response

```json
{
  "success": true,
  "data": {
    "totalActivePlayers": 1250,
    "playersInRadius": 45,
    "averageAccuracy": 12.5,
    "lastCleanup": "2025-01-10T09:00:00Z",
    "privacyCompliant": true
  }
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket server at `/world`:

```javascript
const socket = io('/world', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

### Authentication

Send authentication message after connecting:

```javascript
socket.emit('authenticate', {
  token: 'your-jwt-token',
});
```

### Events

#### Outgoing Events (Client → Server)

##### Update Location

```javascript
socket.emit('update_location', {
  latitude: 40.7128,
  longitude: -74.006,
  accuracy: 10,
  altitude: 100,
  heading: 90,
  speed: 5,
  timestamp: Date.now(),
});
```

##### Request Nearby Players

```javascript
socket.emit('get_nearby_players', {
  latitude: 40.7128,
  longitude: -74.006,
  radius: 2000,
  includeAvatars: true,
});
```

##### Ping (Connection Health)

```javascript
socket.emit('ping');
```

#### Incoming Events (Server → Client)

##### Authentication Success

```javascript
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  // { success: true, playerId: 'user_123', timestamp: 1234567890 }
});
```

##### Location Update Confirmation

```javascript
socket.on('location_updated', (data) => {
  console.log('Location updated:', data);
  // { success: true, timestamp: 1234567890 }
});
```

##### Nearby Players Update

```javascript
socket.on('nearby_players', (data) => {
  console.log('Nearby players:', data.players);
  // { players: [...], center: {...}, radius: 2000, timestamp: 1234567890 }
});
```

##### Real-time Player Movements

```javascript
socket.on('location_update', (data) => {
  console.log('Player moved:', data);
  // { playerId: 'user_456', latitude: 40.7129, longitude: -74.0061, ... }
});
```

##### Player Join/Leave Events

```javascript
socket.on('player_joined', (data) => {
  console.log('Player joined:', data);
  // { playerId: 'user_456', username: 'NewPlayer', ... }
});

socket.on('player_left', (data) => {
  console.log('Player left:', data);
  // { playerId: 'user_456', lastSeen: '2025-01-10T10:30:00Z' }
});
```

##### Connection Health

```javascript
socket.on('pong', (data) => {
  console.log('Pong received:', data);
  // { timestamp: 1234567890 }
});
```

##### Error Handling

```javascript
socket.on('location_error', (error) => {
  console.error('Location error:', error.message);
});

socket.on('nearby_players_error', (error) => {
  console.error('Nearby players error:', error.message);
});
```

---

## Privacy & Security Policies

### Data Collection Principles

1. **Data Minimization**: Only collect essential location data
2. **Purpose Limitation**: Location data used only for world features
3. **Storage Limitation**: Data automatically deleted after TTL expires
4. **Security Measures**: Data encrypted in transit and at rest

### User Controls

- **Location Sharing Toggle**: Users can disable location sharing at any time
- **Precision Control**: Choose between precise GPS and approximate location
- **Data Retention**: Customize how long location data is kept (1-24 hours)
- **Friend-Only Sharing**: Option to share location only with friends

### Technical Safeguards

- **Rate Limiting**: Maximum 1 location update per second per user
- **Input Validation**: Strict validation of location coordinates and parameters
- **IP Hashing**: Sensitive network data is hashed using SHA-256
- **Device Fingerprinting**: Anonymous device identification for fraud prevention

### Data Lifecycle

1. **Collection**: Location data collected via browser Geolocation API
2. **Processing**: Data validated, rate-limited, and stored temporarily
3. **Storage**: Encrypted storage with automatic TTL-based cleanup
4. **Deletion**: Automatic deletion after configured retention period
5. **Audit**: All access logged for security monitoring

---

## Rate Limiting

### Location Updates

- **Limit**: 1 update per second per user
- **Window**: Sliding window of 1 second
- **Response**: HTTP 429 (Too Many Requests)

### API Requests

- **Nearby Players**: 10 requests per minute per user
- **Privacy Updates**: 5 requests per minute per user
- **Statistics**: 1 request per minute per user

---

## Error Handling

### HTTP Status Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **401**: Unauthorized (invalid/missing JWT)
- **403**: Forbidden (privacy settings prevent access)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### WebSocket Error Events

```javascript
// Location validation error
{
  "type": "location_error",
  "message": "Invalid location data"
}

// Permission denied
{
  "type": "location_error",
  "message": "Location sharing disabled"
}

// Rate limit exceeded
{
  "type": "location_error",
  "message": "Update rate limit exceeded"
}
```

---

## Performance Optimization

### Broadcasting Strategy

- **Geographic Partitioning**: Players grouped by location for efficient broadcasting
- **Radius-Based Filtering**: Only broadcast to players within relevant radius
- **Connection Pooling**: Efficient WebSocket connection management
- **Message Compression**: Minimize bandwidth usage for location updates

### Database Optimization

- **TTL Indexes**: Automatic cleanup of expired location data
- **Geospatial Queries**: Optimized queries for nearby player searches
- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis caching for frequently accessed location data

### Monitoring

- **Real-time Metrics**: Active connections, location update frequency
- **Performance Monitoring**: Response times, error rates, bandwidth usage
- **Privacy Compliance**: Audit logs for data access and retention
- **Geographic Distribution**: Player density and coverage analytics

---

## Integration Examples

### Frontend Integration

```javascript
// Initialize geolocation tracking
const initGeolocation = () => {
  if (!navigator.geolocation) {
    console.error('Geolocation not supported');
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Send to backend
      try {
        await fetch('/api/v1/location/update', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy,
            isPrecise: true,
            isSharing: true,
          }),
        });
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    },
    (error) => {
      console.error('Geolocation error:', error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
};

// WebSocket connection
const initWebSocket = () => {
  const socket = io('/world', {
    auth: { token: localStorage.getItem('auth_token') },
  });

  socket.on('authenticated', () => {
    console.log('Connected to world server');
  });

  socket.on('nearby_players', (data) => {
    console.log('Nearby players:', data.players);
    // Update 3D world with nearby players
  });

  socket.on('location_update', (data) => {
    // Update player position in 3D world
    updatePlayerPosition(data.playerId, data.latitude, data.longitude);
  });

  return socket;
};
```

### Backend Integration

```javascript
// Location update endpoint
@Post('update')
async updateLocation(
  @Body() locationData: LocationUpdateDto,
  @Request() req: any,
  @Ip() ipAddress: string
) {
  return this.geolocationService.updateLocation(
    req.user.id,
    locationData,
    ipAddress
  );
}

// WebSocket event handling
@SubscribeMessage('update_location')
async handleLocationUpdate(
  @MessageBody() data: LocationUpdateData,
  @ConnectedSocket() client: AuthenticatedSocket
) {
  await this.geolocationService.updateLocation(client.userId!, {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    // ... other fields
  });

  // Broadcast to nearby players
  this.broadcastToNearbyPlayers(client.userId!, 'location_update', data);
}
```

---

## Monitoring & Analytics

### Key Metrics

- **Active Connections**: Number of WebSocket connections
- **Location Updates**: Frequency and volume of location updates
- **Nearby Searches**: Performance of geospatial queries
- **Privacy Compliance**: Audit logs and retention tracking
- **Error Rates**: Failed requests and connection drops

### Health Checks

- **Database Connectivity**: Location data storage availability
- **WebSocket Health**: Connection stability and message throughput
- **Geospatial Performance**: Query response times for nearby players
- **Privacy Compliance**: Automated checks for data retention policies

This documentation provides comprehensive coverage of the Living World API, including security measures, performance optimizations, and integration patterns for building immersive location-based multiplayer experiences.
