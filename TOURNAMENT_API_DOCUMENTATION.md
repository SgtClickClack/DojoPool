# Tournament & Matchmaking System API Documentation

## Overview

The Tournament & Matchmaking System provides a comprehensive framework for organizing competitive pool tournaments and automated matchmaking for ranked matches. This system enables players to participate in structured competitions while ensuring fair match pairings through an ELO-based ranking algorithm.

## Architecture

### Components

- **Tournament Service**: Manages tournament lifecycle, registration, and progression
- **Matchmaking Service**: Handles automated match pairing using ELO algorithm
- **Tournament Controller**: REST API endpoints for tournament management
- **Database Models**: Extended Prisma models for tournaments, matches, and brackets

### Key Features

- **Tournament Management**: Create, configure, and manage tournaments
- **Automated Matchmaking**: ELO-based ranking system for fair match pairing
- **Bracket Generation**: Automatic bracket creation for tournament formats
- **Real-time Updates**: WebSocket support for live tournament progression
- **Prize Distribution**: Automated prize pool management and distribution

## Authentication

All tournament endpoints require JWT authentication. Admin operations require admin role.

```http
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/v1/tournaments
```

## Tournament Management

### Create Tournament

**Endpoint:** `POST /api/v1/tournaments`

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "name": "Cyber Slam Championship 2024",
  "description": "The ultimate cyberpunk pool championship",
  "eventId": "event-uuid", // Optional: Link to LOMS Event
  "venueId": "venue-uuid", // Optional: Venue hosting the tournament
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T22:00:00Z",
  "maxParticipants": 32,
  "entryFee": 500, // DojoCoins
  "prizePool": 16000, // DojoCoins
  "format": "SINGLE_ELIMINATION",
  "rules": {
    "maxScore": 11,
    "gamesToWin": 3,
    "timeLimit": 1800, // seconds
    "foulLimit": 3
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "tournament-uuid",
  "name": "Cyber Slam Championship 2024",
  "description": "The ultimate cyberpunk pool championship",
  "status": "UPCOMING",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T22:00:00Z",
  "maxPlayers": 32,
  "currentParticipants": 0,
  "entryFee": 500,
  "prizePool": 16000,
  "format": "SINGLE_ELIMINATION",
  "rules": "{\"maxScore\":11,\"gamesToWin\":3}",
  "createdBy": "admin-uuid",
  "venue": {
    "id": "venue-uuid",
    "name": "Cyber Arena",
    "address": "123 Cyber Street"
  },
  "event": {
    "content": {
      "title": "Cyber Slam Event",
      "description": "Major tournament event"
    }
  }
}
```

### Get Tournaments List

**Endpoint:** `GET /api/v1/tournaments`

**Authentication:** Required

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `status` (string): Filter by status (`UPCOMING`, `REGISTRATION_OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `venueId` (string): Filter by venue

**Response:** `200 OK`

```json
{
  "tournaments": [
    {
      "id": "tournament-uuid",
      "name": "Cyber Slam Championship 2024",
      "status": "UPCOMING",
      "startTime": "2024-01-15T14:00:00Z",
      "maxPlayers": 32,
      "currentParticipants": 15,
      "entryFee": 500,
      "prizePool": 7500,
      "venue": {
        "id": "venue-uuid",
        "name": "Cyber Arena"
      },
      "_count": {
        "participants": 15,
        "matches": 0
      }
    }
  ],
  "totalCount": 25,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Tournament Details

**Endpoint:** `GET /api/v1/tournaments/:id`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "id": "tournament-uuid",
  "name": "Cyber Slam Championship 2024",
  "description": "The ultimate cyberpunk pool championship",
  "status": "IN_PROGRESS",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T22:00:00Z",
  "maxPlayers": 32,
  "currentParticipants": 32,
  "entryFee": 500,
  "prizePool": 16000,
  "format": "SINGLE_ELIMINATION",
  "rules": "{\"maxScore\":11,\"gamesToWin\":3}",
  "venue": {
    "id": "venue-uuid",
    "name": "Cyber Arena",
    "address": "123 Cyber Street"
  },
  "participants": [
    {
      "id": "participant-uuid",
      "seed": 1,
      "status": "ACTIVE",
      "joinedAt": "2024-01-10T10:00:00Z",
      "user": {
        "id": "user-uuid",
        "username": "cyberchamp",
        "profile": {
          "avatarUrl": "avatar.jpg",
          "skillRating": 1850
        }
      }
    }
  ],
  "matches": [
    {
      "id": "match-uuid",
      "playerAId": "player-a-uuid",
      "playerBId": "player-b-uuid",
      "winnerId": "player-a-uuid",
      "status": "COMPLETED",
      "scoreA": 11,
      "scoreB": 8,
      "bracketRound": 1,
      "bracketMatch": 1,
      "playerA": {
        "username": "cyberchamp"
      },
      "playerB": {
        "username": "poolmaster"
      },
      "winner": {
        "username": "cyberchamp"
      }
    }
  ],
  "bracket": {
    "id": "bracket-uuid",
    "structure": "{\"rounds\":[...]}",
    "currentRound": 2,
    "totalRounds": 5,
    "status": "IN_PROGRESS"
  },
  "_count": {
    "participants": 32,
    "matches": 31
  }
}
```

### Update Tournament

**Endpoint:** `PUT /api/v1/tournaments/:id`

**Authentication:** Required (Admin only)

**Request Body:** (Same as create, all fields optional)

**Response:** `200 OK`

```json
{
  "id": "tournament-uuid",
  "name": "Updated Tournament Name",
  "description": "Updated description"
  // ... other tournament fields
}
```

### Delete Tournament

**Endpoint:** `DELETE /api/v1/tournaments/:id`

**Authentication:** Required (Admin only)

**Response:** `204 No Content`

## Tournament Participation

### Join Tournament

**Endpoint:** `POST /api/v1/tournaments/:id/join`

**Authentication:** Required

**Request Body:**

```json
{
  "notes": "Excited to participate!" // Optional
}
```

**Response:** `201 Created`

```json
{
  "id": "participant-uuid",
  "tournamentId": "tournament-uuid",
  "userId": "user-uuid",
  "seed": null,
  "status": "REGISTERED",
  "joinedAt": "2024-01-10T10:00:00Z",
  "tournament": {
    "id": "tournament-uuid",
    "name": "Cyber Slam Championship",
    "entryFee": 500
  },
  "user": {
    "id": "user-uuid",
    "username": "cyberchamp"
  }
}
```

### Leave Tournament

**Endpoint:** `POST /api/v1/tournaments/:id/leave`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true
}
```

## Tournament Brackets

### Get Tournament Bracket

**Endpoint:** `GET /api/v1/tournaments/:id/bracket`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "tournament": {
    "id": "tournament-uuid",
    "name": "Cyber Slam Championship",
    "format": "SINGLE_ELIMINATION",
    "currentRound": 2,
    "totalRounds": 5,
    "status": "IN_PROGRESS"
  },
  "bracket": {
    "id": "bracket-uuid",
    "structure": "{\"rounds\":[{\"round\":1,\"matches\":[...]}]}",
    "currentRound": 2,
    "totalRounds": 5,
    "status": "IN_PROGRESS"
  },
  "matches": [
    {
      "id": "match-uuid",
      "playerAId": "player-a-uuid",
      "playerBId": "player-b-uuid",
      "winnerId": "player-a-uuid",
      "status": "COMPLETED",
      "scoreA": 11,
      "scoreB": 8,
      "bracketRound": 1,
      "bracketMatch": 1,
      "playerA": {
        "username": "cyberchamp",
        "profile": {
          "avatarUrl": "avatar.jpg"
        }
      },
      "playerB": {
        "username": "poolmaster",
        "profile": {
          "avatarUrl": "avatar2.jpg"
        }
      },
      "winner": {
        "username": "cyberchamp"
      }
    }
  ]
}
```

### Generate Bracket

**Endpoint:** `POST /api/v1/tournaments/:id/bracket/generate`

**Authentication:** Required (Admin only)

**Response:** `201 Created`

```json
{
  "id": "bracket-uuid",
  "tournamentId": "tournament-uuid",
  "structure": "{\"rounds\":[...]}",
  "currentRound": 1,
  "totalRounds": 5,
  "status": "GENERATED"
}
```

### Start Tournament

**Endpoint:** `POST /api/v1/tournaments/:id/start`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

```json
{
  "success": true
}
```

### Advance Tournament Round

**Endpoint:** `POST /api/v1/tournaments/:id/advance`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

```json
{
  "success": true,
  "nextRound": 3
}
```

## Matchmaking System

### Join Matchmaking Queue

**Endpoint:** `POST /api/v1/tournaments/matchmaking/join`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true,
  "estimatedWaitTime": 180
}
```

### Leave Matchmaking Queue

**Endpoint:** `POST /api/v1/tournaments/matchmaking/leave`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "success": true
}
```

### Get Matchmaking Status

**Endpoint:** `GET /api/v1/tournaments/matchmaking/status`

**Authentication:** Required

**Response:** `200 OK`

```json
{
  "inQueue": true,
  "estimatedWaitTime": 120,
  "position": 5
}
```

### Submit Match Result

**Endpoint:** `POST /api/v1/tournaments/matches/:id/result`

**Authentication:** Required (Match participant only)

**Request Body:**

```json
{
  "winnerId": "winner-user-uuid",
  "scoreA": 11,
  "scoreB": 8
}
```

**Response:** `200 OK`

### Get Matchmaking Statistics

**Endpoint:** `GET /api/v1/tournaments/matchmaking/statistics`

**Authentication:** Required (Admin only)

**Response:** `200 OK`

```json
{
  "queueSize": 24,
  "averageWaitTime": 180,
  "matchesCreated": 156,
  "activeMatches": 12
}
```

## User Tournament History

### Get User Tournament History

**Endpoint:** `GET /api/v1/tournaments/user/history`

**Authentication:** Required

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page

**Response:** `200 OK`

```json
{
  "participations": [
    {
      "id": "participation-uuid",
      "tournamentId": "tournament-uuid",
      "status": "ACTIVE",
      "joinedAt": "2024-01-10T10:00:00Z",
      "tournament": {
        "id": "tournament-uuid",
        "name": "Cyber Slam Championship 2024",
        "status": "COMPLETED",
        "venue": {
          "name": "Cyber Arena"
        },
        "_count": {
          "participants": 32,
          "matches": 31
        }
      }
    }
  ],
  "totalCount": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Matchmaking Algorithm

### ELO Rating System

The matchmaking system uses a modified ELO rating algorithm to ensure fair match pairings:

#### Rating Calculation

- **Base Rating**: 1200 for new players
- **K-Factor**: 32 (standard ELO K-factor)
- **Expected Score Formula**:
  ```
  E_A = 1 / (1 + 10^((R_B - R_A) / 400))
  ```
- **Rating Change Formula**:
  ```
  ΔR_A = K × (S_A - E_A)
  ```

Where:

- `R_A`, `R_B`: Current ratings of players A and B
- `E_A`: Expected score for player A
- `S_A`: Actual score (1 for win, 0 for loss)
- `K`: K-factor (32)

#### Matchmaking Process

1. **Queue Entry**: Player joins matchmaking queue
2. **Skill Assessment**: System retrieves player's current ELO rating
3. **Opponent Search**:
   - Initial search range: ±100 ELO points
   - Expands by 50 points every minute if no match found
   - Maximum search range: ±500 ELO points
   - Timeout: 5 minutes maximum wait time
4. **Match Creation**: Creates ranked match when suitable opponent found
5. **Rating Update**: Updates ELO ratings after match completion

#### Fairness Features

- **Skill-Based Matching**: Prioritizes opponents within similar skill ranges
- **Dynamic Search**: Expands search criteria over time to reduce wait times
- **Anti-Cheating**: Validates match results and detects suspicious patterns
- **Rating Stability**: Prevents extreme rating swings with K-factor limits

## Tournament Formats

### Single Elimination

- Players compete in one-on-one matches
- Winner advances, loser is eliminated
- Continues until one player remains
- Requires power-of-2 number of participants

### Double Elimination

- Players must lose twice to be eliminated
- Winners bracket and losers bracket
- More matches but fairer competition
- Allows comeback opportunities

### Round Robin

- Every player competes against every other player
- Points awarded for wins
- Top players advance to playoffs
- Best for smaller tournaments

### Swiss System

- Players paired based on current standings
- Each round pairs similar-ranked players
- Continues for set number of rounds
- Efficient for large tournaments

## Bracket Generation

### Seeding Process

1. Sort participants by ELO rating (highest first)
2. Assign seeds based on ranking
3. For single elimination: Alternate high-low seeding
4. For other formats: Group similar skill levels

### Bracket Structure

```json
{
  "format": "SINGLE_ELIMINATION",
  "participantCount": 16,
  "totalRounds": 4,
  "rounds": [
    {
      "round": 1,
      "matches": 8,
      "status": "COMPLETED"
    },
    {
      "round": 2,
      "matches": 4,
      "status": "IN_PROGRESS"
    },
    {
      "round": 3,
      "matches": 2,
      "status": "PENDING"
    },
    {
      "round": 4,
      "matches": 1,
      "status": "PENDING"
    }
  ]
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Tournament registration is not open",
  "error": "Bad Request"
}
```

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Tournament not found",
  "error": "Not Found"
}
```

#### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "User is already registered for this tournament",
  "error": "Conflict"
}
```

## WebSocket Events

### Tournament Updates

- `tournament.started`: Tournament begins
- `tournament.round.advanced`: New round starts
- `tournament.completed`: Tournament ends
- `match.completed`: Individual match result

### Matchmaking Events

- `matchmaking.queued`: Player joins queue
- `matchmaking.matched`: Opponent found
- `matchmaking.match_ready`: Match can begin

## Rate Limiting

- Tournament endpoints: 100 requests per minute per user
- Matchmaking endpoints: 60 requests per minute per user
- Admin endpoints: 200 requests per minute

## Best Practices

### Tournament Organization

1. **Advance Planning**: Schedule tournaments 1-2 weeks in advance
2. **Clear Rules**: Define comprehensive tournament rules
3. **Fair Seeding**: Use ELO ratings for proper bracket seeding
4. **Prize Distribution**: Set competitive but sustainable prize pools

### Matchmaking Optimization

1. **Queue Management**: Monitor queue sizes and wait times
2. **Rating Accuracy**: Regularly validate and calibrate ELO ratings
3. **Anti-Abuse**: Implement measures against queue manipulation
4. **Performance Monitoring**: Track matchmaking success rates

### Player Experience

1. **Clear Communication**: Provide tournament updates and notifications
2. **Fair Competition**: Ensure balanced match pairings
3. **Quick Resolution**: Minimize wait times while maintaining fairness
4. **Progress Tracking**: Show tournament progress and standings

## Monitoring & Analytics

### Key Metrics

- **Tournament Participation**: Registration rates, completion rates
- **Matchmaking Efficiency**: Average wait times, match success rates
- **Player Retention**: Tournament participation frequency
- **Revenue Tracking**: Entry fees and prize pool distribution

### Performance Monitoring

- Queue processing times
- Match completion rates
- Tournament progression speed
- System response times

This documentation provides a comprehensive guide to the Tournament & Matchmaking System API. For technical support or questions, please contact the development team.
