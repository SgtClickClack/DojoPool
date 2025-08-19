# Tournaments API

## Endpoints

### List Tournaments

```http
GET /tournaments
Authorization: Bearer <access_token>
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `venue_id` (optional): Filter by venue
- `status` (optional): Filter by tournament status (upcoming, active, completed)
- `type` (optional): Filter by tournament type (single_elimination, double_elimination, round_robin)

**Response** (200 OK)

```json
{
  "tournaments": [
    {
      "id": 1,
      "name": "Winter Championship 2024",
      "venue_id": 1,
      "tournament_type": "single_elimination",
      "status": "upcoming",
      "start_date": "2024-02-01T10:00:00Z",
      "end_date": "2024-02-02T18:00:00Z",
      "max_participants": 32,
      "current_participants": 16,
      "entry_fee": 50.0,
      "prize_pool": 1000.0
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "per_page": 20
  }
}
```

### Get Tournament Details

```http
GET /tournaments/{tournament_id}
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "id": 1,
  "name": "Winter Championship 2024",
  "venue_id": 1,
  "tournament_type": "single_elimination",
  "status": "active",
  "start_date": "2024-02-01T10:00:00Z",
  "end_date": "2024-02-02T18:00:00Z",
  "max_participants": 32,
  "current_participants": 32,
  "entry_fee": 50.0,
  "prize_pool": 1000.0,
  "rules": {
    "game_type": "8ball",
    "race_to": 3,
    "time_per_game": 45,
    "fouls_limit": 3
  },
  "brackets": {
    "rounds": [
      {
        "round_number": 1,
        "matches": [
          {
            "match_id": 1,
            "player1_id": 101,
            "player2_id": 102,
            "winner_id": 101,
            "score": { "player1": 3, "player2": 1 },
            "status": "completed"
          }
        ]
      }
    ]
  },
  "prizes": [
    { "place": 1, "amount": 500.0 },
    { "place": 2, "amount": 300.0 },
    { "place": 3, "amount": 200.0 }
  ]
}
```

### Create Tournament

```http
POST /tournaments
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Winter Championship 2024",
    "venue_id": 1,
    "tournament_type": "single_elimination",
    "start_date": "2024-02-01T10:00:00Z",
    "end_date": "2024-02-02T18:00:00Z",
    "max_participants": 32,
    "entry_fee": 50.00,
    "rules": {
        "game_type": "8ball",
        "race_to": 3,
        "time_per_game": 45,
        "fouls_limit": 3
    },
    "prizes": [
        {"place": 1, "amount": 500.00},
        {"place": 2, "amount": 300.00},
        {"place": 3, "amount": 200.00}
    ]
}
```

**Response** (201 Created)

```json
{
  "id": 1,
  "name": "Winter Championship 2024",
  "venue_id": 1,
  "tournament_type": "single_elimination",
  "status": "upcoming",
  "start_date": "2024-02-01T10:00:00Z",
  "end_date": "2024-02-02T18:00:00Z",
  "max_participants": 32,
  "current_participants": 0,
  "entry_fee": 50.0,
  "prize_pool": 1000.0
}
```

### Register Player

```http
POST /tournaments/{tournament_id}/players
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "player_id": 101
}
```

**Response** (201 Created)

```json
{
  "tournament_id": 1,
  "player_id": 101,
  "registration_number": 16,
  "registered_at": "2024-01-17T12:00:00Z",
  "status": "confirmed"
}
```

### Start Tournament

```http
POST /tournaments/{tournament_id}/start
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "tournament_id": 1,
  "status": "active",
  "started_at": "2024-02-01T10:00:00Z",
  "brackets": {
    "rounds": [
      {
        "round_number": 1,
        "matches": [
          {
            "match_id": 1,
            "player1_id": 101,
            "player2_id": 102,
            "status": "pending"
          }
        ]
      }
    ]
  }
}
```

### Update Match Result

```http
PUT /tournaments/{tournament_id}/matches/{match_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "winner_id": 101,
    "score": {
        "player1": 3,
        "player2": 1
    }
}
```

**Response** (200 OK)

```json
{
  "match_id": 1,
  "tournament_id": 1,
  "round_number": 1,
  "player1_id": 101,
  "player2_id": 102,
  "winner_id": 101,
  "score": {
    "player1": 3,
    "player2": 1
  },
  "status": "completed",
  "completed_at": "2024-02-01T11:30:00Z",
  "next_match_id": 5
}
```

### Get Tournament Statistics

```http
GET /tournaments/{tournament_id}/stats
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "total_matches": 31,
  "completed_matches": 15,
  "total_games": 93,
  "average_games_per_match": 3.1,
  "longest_match": {
    "match_id": 3,
    "duration": "01:45:30",
    "score": { "player1": 3, "player2": 2 }
  },
  "player_stats": [
    {
      "player_id": 101,
      "matches_played": 3,
      "matches_won": 3,
      "total_games_won": 9,
      "average_points_per_game": 6.5
    }
  ]
}
```

## Error Responses

### Tournament Not Found (404 Not Found)

```json
{
  "error": "Tournament not found",
  "code": "TOURNAMENT_NOT_FOUND"
}
```

### Registration Closed (400 Bad Request)

```json
{
  "error": "Tournament registration is closed",
  "code": "TOURNAMENT_REGISTRATION_CLOSED"
}
```

### Tournament Full (400 Bad Request)

```json
{
  "error": "Tournament has reached maximum participants",
  "code": "TOURNAMENT_FULL"
}
```

### Invalid Match Update (400 Bad Request)

```json
{
  "error": "Invalid match update",
  "code": "TOURNAMENT_INVALID_MATCH",
  "details": "Match is already completed"
}
```

### Unauthorized Access (403 Forbidden)

```json
{
  "error": "Insufficient permissions to manage tournament",
  "code": "TOURNAMENT_UNAUTHORIZED"
}
```
