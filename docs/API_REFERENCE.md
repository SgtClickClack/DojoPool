# DojoPool API Reference

## Overview

The DojoPool API is a RESTful service that provides access to all DojoPool functionality. The API uses JSON for request and response bodies, and standard HTTP methods and status codes.

## Base URL

```
Production: https://api.dojopool.com/v1
Development: http://localhost:5000/v1
```

## Authentication

### Bearer Token

All API requests must include an Authorization header:

```
Authorization: Bearer <your_token>
```

### Getting a Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

## Rate Limiting

- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- Rate limit headers included in responses:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1640995200
  ```

## Endpoints

### User Management

#### Create User

```http
POST /users
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secure_password",
  "profile": {
    "full_name": "John Doe",
    "skill_level": "intermediate"
  }
}
```

Response:

```json
{
  "id": 123,
  "username": "johndoe",
  "email": "john@example.com",
  "created_at": "2024-01-03T12:00:00Z",
  "profile": {
    "full_name": "John Doe",
    "skill_level": "intermediate"
  }
}
```

#### Get User Profile

```http
GET /users/{user_id}
```

Response:

```json
{
  "id": 123,
  "username": "johndoe",
  "profile": {
    "full_name": "John Doe",
    "skill_level": "intermediate",
    "ranking": 1500,
    "matches_played": 50,
    "win_rate": 0.65
  }
}
```

### Game Management

#### Create Game

```http
POST /games
Content-Type: application/json

{
  "type": "8_ball",
  "mode": "ranked",
  "venue_id": 456,
  "players": [
    {"user_id": 123, "role": "host"},
    {"user_id": 124, "role": "guest"}
  ]
}
```

Response:

```json
{
  "id": 789,
  "type": "8_ball",
  "mode": "ranked",
  "status": "pending",
  "created_at": "2024-01-03T12:00:00Z",
  "venue": {
    "id": 456,
    "name": "Downtown Pool Hall"
  },
  "players": [
    {
      "user_id": 123,
      "username": "johndoe",
      "role": "host"
    },
    {
      "user_id": 124,
      "username": "janedoe",
      "role": "guest"
    }
  ]
}
```

#### Get Game Details

```http
GET /games/{game_id}
```

Response:

```json
{
  "id": 789,
  "type": "8_ball",
  "mode": "ranked",
  "status": "in_progress",
  "created_at": "2024-01-03T12:00:00Z",
  "started_at": "2024-01-03T12:05:00Z",
  "venue": {
    "id": 456,
    "name": "Downtown Pool Hall"
  },
  "players": [...],
  "current_frame": {
    "player_turn": 123,
    "balls_remaining": ["1", "2", "3"],
    "last_shot": {
      "player_id": 124,
      "ball": "4",
      "timestamp": "2024-01-03T12:10:00Z"
    }
  }
}
```

### Tournament Management

#### Create Tournament

```http
POST /tournaments
Content-Type: application/json

{
  "name": "Winter Championship 2024",
  "type": "single_elimination",
  "start_date": "2024-02-01T00:00:00Z",
  "entry_fee": 50.00,
  "max_players": 32,
  "venue_id": 456
}
```

Response:

```json
{
  "id": 321,
  "name": "Winter Championship 2024",
  "type": "single_elimination",
  "status": "registration_open",
  "start_date": "2024-02-01T00:00:00Z",
  "entry_fee": 50.0,
  "registered_players": 0,
  "max_players": 32,
  "venue": {
    "id": 456,
    "name": "Downtown Pool Hall"
  }
}
```

### Venue Management

#### List Venues

```http
GET /venues?latitude=40.7128&longitude=-74.0060&radius=10
```

Response:

```json
{
  "venues": [
    {
      "id": 456,
      "name": "Downtown Pool Hall",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.006,
      "distance": 0.5,
      "tables_available": 5,
      "operating_hours": {
        "monday": { "open": "10:00", "close": "22:00" },
        "tuesday": { "open": "10:00", "close": "22:00" }
      }
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}
```

### WebSocket Events

#### Connection

```javascript
// Connect to WebSocket
const socket = io("wss://api.dojopool.com", {
  auth: { token: "your_token" },
});

// Connection events
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("error", (error) => {
  console.error("Connection error:", error);
});
```

#### Game Events

```javascript
// Subscribe to game updates
socket.on("game:update", (data) => {
  console.log("Game update:", data);
});

// Send game action
socket.emit("game:action", {
  game_id: 789,
  action: "shot",
  data: {
    ball: "8",
    pocket: "bottom_right",
  },
});
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "invalid_request",
    "message": "The request was invalid",
    "details": ["Field 'email' is required"]
  }
}
```

### Common Error Codes

- `invalid_request`: Request validation failed
- `not_found`: Resource not found
- `unauthorized`: Authentication required
- `forbidden`: Permission denied
- `rate_limited`: Too many requests

### HTTP Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Pagination

### Request Parameters

- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)

### Response Format

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "total_pages": 5
}
```

## Versioning

- Current version: v1
- Version specified in URL path
- Breaking changes trigger version increment
- Deprecation notices sent via response headers

## SDK Support

### Official SDKs

- [Python SDK](https://github.com/dojopool/python-sdk)
- [JavaScript SDK](https://github.com/dojopool/js-sdk)
- [Mobile SDK](https://github.com/dojopool/mobile-sdk)

### Example SDK Usage

```python
from dojopool import Client

client = Client('your_api_key')
games = client.games.list(venue_id=456)
```

## Testing

### Sandbox Environment

- Base URL: `https://sandbox.api.dojopool.com/v1`
- Test credentials provided upon request
- Reset daily at 00:00 UTC

### Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- No Funds: `4000 0000 0000 9995`

## Support

### Getting Help

- API Support: api-support@dojopool.com
- Documentation: https://docs.dojopool.com
- Status Page: https://status.dojopool.com

### Best Practices

1. Implement exponential backoff
2. Cache responses when possible
3. Use compression for large requests
4. Monitor rate limits
5. Handle errors gracefully

```

```
