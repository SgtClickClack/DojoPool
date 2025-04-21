# DojoPool API Reference – Tournament & Match Endpoints

## Authentication
All endpoints require authentication (user must be logged in).

---

## Tournament Endpoints

### Create Tournament
- **POST** `/api/tournaments`
- **Body:**
```json
{
  "name": "Spring Cup",
  "organizer_id": 1,
  "tournament_type": "single_elimination", // or double_elimination, round_robin, swiss
  "game_type": "eight_ball", // or nine_ball, ten_ball, straight_pool
  "format": "bracket"
}
```
- **Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Spring Cup",
  ...
}
```

### List Tournaments
- **GET** `/api/tournaments`
- **Response:** `200 OK`
```json
[
  { "id": 1, "name": "Spring Cup", ... },
  ...
]
```

### Get Tournament Details
- **GET** `/api/tournaments/<tournament_id>`
- **Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Spring Cup",
  "tournament_type": "single_elimination",
  "game_type": "eight_ball",
  "format": "bracket",
  "status": "open", // or running, completed
  ...,
  "participants": [
    { "id": 2, "username": "alice", "status": "joined" },
    { "id": 3, "username": "bob", "status": "eliminated" },
    ...
  ],
  "matches": [
    {
      "id": 1,
      "round": 1,
      "match_number": 1,
      "player1_id": 2,
      "player2_id": 3,
      "status": "scheduled", // or completed
      "score": "2-1",
      "winner_id": 2
    },
    ...
  ]
}
// `participants` is an array of all users in the tournament with their status.
// `matches` is an array of match objects, each with player IDs, status, score, and winner.
```

### Join Tournament
- **POST** `/api/tournaments/<tournament_id>/join`
- **Response:** `200 OK`
```json
{ "message": "User 2 joined tournament 1" }
```

### Start Tournament
- **POST** `/api/tournaments/<tournament_id>/start`
- **Response:** `200 OK`
```json
{
  "message": "Tournament started.",
  "matches": [ { "id": 1, ... }, ... ]
}
```

### Advance Tournament Round
- **POST** `/api/tournaments/<tournament_id>/advance`
- **Response:** `200 OK`
```json
{
  "message": "Next round created.",
  "matches": [ { "id": 5, ... }, ... ]
}
```
- **If completed:**
```json
{
  "message": "Tournament completed.",
  "winner_id": 2
}
```

---

## Match Endpoints

### Get Match Details
- **GET** `/api/matches/<match_id>`
- **Response:** `200 OK`
```json
{ "id": 1, "player1_id": 2, "player2_id": 3, ... }
```

### Submit Match Result
- **POST** `/api/matches/<match_id>/result`
- **Body:**
```json
{
  "status": "completed",
  "score": "5-3",
  "winner_id": 2,
  "loser_id": 3
}
```
- **Response:** `200 OK`
```json
{ "id": 1, "status": "completed", ... }
```

---

## Error Handling
- All errors return JSON with an `error` key and details if available.
- Example:
```json
{ "error": "Missing required fields: status, score, winner_id" }
```

---

**For additional endpoints or details, see the source code in `src/dojopool/api/tournament.py`.**
