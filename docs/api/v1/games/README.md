# Games API

## Endpoints

### List Games

```http
GET /games
Authorization: Bearer <access_token>
```

Query Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `venue_id` (optional): Filter by venue
- `status` (optional): Filter by game status (active, completed, cancelled)
- `game_type` (optional): Filter by game type (8ball, 9ball, etc.)
- `player_id` (optional): Filter by player participation

**Response** (200 OK)
```json
{
    "games": [
        {
            "id": 1,
            "venue_id": 1,
            "game_type": "8ball",
            "status": "active",
            "created_at": "2024-01-17T12:00:00Z",
            "players": [
                {
                    "id": 101,
                    "username": "player1",
                    "score": 0
                },
                {
                    "id": 102,
                    "username": "player2",
                    "score": 0
                }
            ],
            "current_player_id": 101,
            "table_number": 3
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

### Get Game Details

```http
GET /games/{game_id}
Authorization: Bearer <access_token>
```

**Response** (200 OK)
```json
{
    "id": 1,
    "venue_id": 1,
    "game_type": "8ball",
    "status": "active",
    "created_at": "2024-01-17T12:00:00Z",
    "started_at": "2024-01-17T12:05:00Z",
    "players": [
        {
            "id": 101,
            "username": "player1",
            "score": 0,
            "balls_pocketed": [],
            "fouls": 0
        },
        {
            "id": 102,
            "username": "player2",
            "score": 0,
            "balls_pocketed": [],
            "fouls": 0
        }
    ],
    "current_player_id": 101,
    "table_number": 3,
    "game_state": {
        "remaining_balls": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        "player1_type": "stripes",
        "player2_type": "solids",
        "last_shot": {
            "player_id": 101,
            "type": "break",
            "result": "legal_break",
            "timestamp": "2024-01-17T12:05:00Z"
        }
    }
}
```

### Create Game

```http
POST /games
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "venue_id": 1,
    "game_type": "8ball",
    "table_number": 3,
    "players": [
        {"id": 101},
        {"id": 102}
    ]
}
```

**Response** (201 Created)
```json
{
    "id": 1,
    "venue_id": 1,
    "game_type": "8ball",
    "status": "pending",
    "created_at": "2024-01-17T12:00:00Z",
    "players": [
        {
            "id": 101,
            "username": "player1",
            "score": 0
        },
        {
            "id": 102,
            "username": "player2",
            "score": 0
        }
    ],
    "table_number": 3
}
```

### Start Game

```http
POST /games/{game_id}/start
Authorization: Bearer <access_token>
```

**Response** (200 OK)
```json
{
    "id": 1,
    "status": "active",
    "started_at": "2024-01-17T12:05:00Z",
    "current_player_id": 101,
    "game_state": {
        "remaining_balls": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        "next_shot": "break"
    }
}
```

### Record Shot

```http
POST /games/{game_id}/shots
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "shot_type": "power",
    "result": "made",
    "difficulty": 0.8,
    "speed": 15.5,
    "angle": 45.0,
    "position_data": {
        "cue_ball": {"x": 100, "y": 200},
        "target_ball": {"x": 300, "y": 400}
    }
}
```

**Response** (201 Created)
```json
{
    "id": 1,
    "game_id": 1,
    "player_id": 101,
    "shot_type": "power",
    "result": "made",
    "timestamp": "2024-01-17T12:06:00Z",
    "difficulty": 0.8,
    "speed": 15.5,
    "angle": 45.0,
    "position_data": {
        "cue_ball": {"x": 100, "y": 200},
        "target_ball": {"x": 300, "y": 400}
    }
}
```

### End Game

```http
POST /games/{game_id}/end
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "winner_id": 101,
    "reason": "8_ball_win"
}
```

**Response** (200 OK)
```json
{
    "id": 1,
    "status": "completed",
    "winner_id": 101,
    "end_reason": "8_ball_win",
    "ended_at": "2024-01-17T12:30:00Z",
    "final_score": {
        "player1": 1,
        "player2": 0
    }
}
```

### Get Game Events

```http
GET /games/{game_id}/events
Authorization: Bearer <access_token>
```

Query Parameters:
- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 50)
- `type` (optional): Filter by event type

**Response** (200 OK)
```json
{
    "events": [
        {
            "id": 1,
            "game_id": 1,
            "event_type": "game_started",
            "player_id": null,
            "timestamp": "2024-01-17T12:05:00Z",
            "data": {}
        },
        {
            "id": 2,
            "game_id": 1,
            "event_type": "shot_taken",
            "player_id": 101,
            "timestamp": "2024-01-17T12:06:00Z",
            "data": {
                "shot_type": "power",
                "result": "made"
            }
        }
    ],
    "pagination": {
        "current_page": 1,
        "total_pages": 1,
        "total_items": 2,
        "per_page": 50
    }
}
```

## Error Responses

### Game Not Found (404 Not Found)
```json
{
    "error": "Game not found",
    "code": "GAME_NOT_FOUND"
}
```

### Invalid Game State (400 Bad Request)
```json
{
    "error": "Invalid game state transition",
    "code": "GAME_INVALID_STATE",
    "details": "Cannot start an already active game"
}
```

### Invalid Shot (400 Bad Request)
```json
{
    "error": "Invalid shot data",
    "code": "GAME_INVALID_SHOT",
    "details": {
        "speed": "Speed must be a positive number",
        "angle": "Angle must be between 0 and 360"
    }
}
```

### Not Player's Turn (403 Forbidden)
```json
{
    "error": "Not player's turn",
    "code": "GAME_WRONG_TURN"
}
``` 