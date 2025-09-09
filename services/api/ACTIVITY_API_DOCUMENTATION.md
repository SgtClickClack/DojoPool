# Activity Events API Documentation

## Overview

The Activity Events API provides endpoints for retrieving real-time social feed data and managing in-game activity events in the Dojo Pool platform.

## Base URL

```
/api/v1/activity
```

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### GET /activity

Retrieves the activity feed for the authenticated user.

#### Query Parameters

| Parameter | Type   | Required | Default    | Description                            |
| --------- | ------ | -------- | ---------- | -------------------------------------- |
| `filter`  | string | No       | `"global"` | Filter type: `"global"` or `"friends"` |
| `page`    | number | No       | `1`        | Page number for pagination             |
| `limit`   | number | No       | `20`       | Number of items per page (max: 50)     |

#### Response

```json
{
  "entries": [
    {
      "id": "string",
      "type": "GAME_COMPLETED | TOURNAMENT_WON | TERRITORY_CAPTURED | ACHIEVEMENT_EARNED | FRIEND_ADDED | CLAN_JOINED | ...",
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
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

#### Status Codes

- `200` - Success
- `401` - Unauthorized (invalid or missing JWT token)
- `500` - Internal server error

#### Example Request

```bash
GET /api/v1/activity?page=1&limit=20&filter=global
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Example Response

```json
{
  "entries": [
    {
      "id": "activity-123",
      "type": "GAME_COMPLETED",
      "title": "Victory Achieved!",
      "description": "PlayerX defeated CyberNinja in an intense pool match at Neon Arena",
      "username": "PlayerX",
      "userAvatar": "/avatars/playerx.jpg",
      "createdAt": "2024-01-15T10:30:00Z",
      "isPublic": true,
      "venue": {
        "id": "venue-456",
        "name": "Neon Arena"
      },
      "match": {
        "id": "match-789",
        "winnerId": "user-123"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Activity Event Types

The following event types are supported:

| Event Type           | Description                      | Icon |
| -------------------- | -------------------------------- | ---- |
| `GAME_COMPLETED`     | A match has been completed       | ⚔️   |
| `TOURNAMENT_WON`     | A player won a tournament        | 🏆   |
| `TERRITORY_CAPTURED` | A territory has been claimed     | 🏰   |
| `ACHIEVEMENT_EARNED` | A player unlocked an achievement | 🎯   |
| `FRIEND_ADDED`       | Two players became friends       | 🤝   |
| `CLAN_JOINED`        | A player joined a clan           | ⚔️   |
| `CLAN_LEFT`          | A player left a clan             | 🚪   |
| `CHALLENGE_SENT`     | A challenge was sent             | 📨   |
| `CHALLENGE_ACCEPTED` | A challenge was accepted         | ✅   |
| `CHALLENGE_DECLINED` | A challenge was declined         | ❌   |
| `PROFILE_UPDATED`    | A player's profile was updated   | ✏️   |
| `SHOT_ANALYZED`      | AI analyzed a shot               | 📊   |
| `VENUE_VISITED`      | A player visited a venue         | 📍   |

## WebSocket Integration

The Activity Events API integrates with WebSocket for real-time updates.

### WebSocket Namespace

```
/activity
```

### Events

#### Client Events

- `subscribe_to_feed` - Subscribe to activity feed updates
- `unsubscribe_from_feed` - Unsubscribe from activity feed updates

#### Server Events

- `new_activity_event` - Broadcast when a new activity event occurs

```json
{
  "type": "new_activity_event",
  "data": {
    "id": "activity-123",
    "type": "GAME_COMPLETED",
    "title": "Victory Achieved!",
    "description": "PlayerX defeated CyberNinja in an intense pool match",
    "username": "PlayerX",
    "userAvatar": "/avatars/playerx.jpg",
    "createdAt": "2024-01-15T10:30:00Z",
    "isPublic": true
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

## Rate Limiting

- General rate limit: 100 requests per minute
- Authentication endpoints: 10 requests per minute
- Token refresh: 30 requests per minute

## Caching

Activity feed responses are cached for 60 seconds to improve performance. Cache keys are based on user ID, page, and limit parameters.

## Database Schema

### ActivityEvent Model

```sql
CREATE TABLE ActivityEvent (
  id          String   @id @default(uuid())
  userId      String
  type        String
  message     String?
  data        Json
  venueId     String?
  matchId     String?
  tournamentId String?
  clanId      String?
  metadata    Json?
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User?    @relation(fields: [userId], references: [id])
  venue       Venue?   @relation(fields: [venueId], references: [id])
  match       Match?   @relation(fields: [matchId], references: [id])
  tournament  Tournament? @relation(fields: [tournamentId], references: [id])
  clan        Clan?    @relation(fields: [clanId], references: [id])
)
```

## Related Services

- **ActivityEventsService** - Core service for managing activity events
- **ActivityEventsGateway** - WebSocket gateway for real-time events
- **ActivityEventsController** - REST API controller
- **NotificationsService** - Manages personal notifications (separate system)

## Testing

Unit tests and integration tests are provided in:

- `src/activity-events/activity-events.service.spec.ts`
- `src/__tests__/activity-events.e2e.spec.ts`

## Future Enhancements

- Advanced filtering options (by venue, clan, date range)
- Activity event reactions and comments
- Push notifications for mobile devices
- Activity event analytics and insights
