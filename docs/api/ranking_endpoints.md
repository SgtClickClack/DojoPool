# DojoPool Ranking API Documentation

## Global Rankings

### Get Global Rankings

```http
GET /api/rankings/global
```

Retrieves the global rankings list with detailed player statistics.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| per_page | integer | Items per page (default: 20, max: 100) |
| sort_by | string | Sort field (rating, games_won, tournament_wins) |
| order | string | Sort order (asc, desc) |
| tier | string | Filter by tier (optional) |
| min_rating | integer | Minimum rating filter (optional) |
| max_rating | integer | Maximum rating filter (optional) |

#### Response

```json
{
  "rankings": [
    {
      "user_id": "string",
      "username": "string",
      "rating": integer,
      "rank": integer,
      "tier": "string",
      "tier_color": "string",
      "rank_movement": integer,
      "rank_streak": integer,
      "rank_streak_type": "string",
      "total_games": integer,
      "games_won": integer,
      "win_rate": float,
      "tournament_wins": integer,
      "last_active": "string (ISO date)",
      "country": "string"
    }
  ],
  "meta": {
    "total_players": integer,
    "total_pages": integer,
    "current_page": integer,
    "per_page": integer
  }
}
```

#### Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Invalid parameters |
| 429 | Rate limit exceeded |

---

### Get Player Ranking Details

```http
GET /api/rankings/player/{user_id}
```

Retrieves detailed ranking information for a specific player.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string | Unique identifier of the player |

#### Response

```json
{
  "user_id": "string",
  "username": "string",
  "current_rating": integer,
  "peak_rating": integer,
  "tier": "string",
  "tier_color": "string",
  "global_rank": integer,
  "rank_movement": integer,
  "rank_streak": integer,
  "rank_streak_type": "string",
  "stats": {
    "total_games": integer,
    "games_won": integer,
    "win_rate": float,
    "tournament_wins": integer,
    "tournament_placements": [
      {
        "tournament_id": "string",
        "name": "string",
        "date": "string (ISO date)",
        "placement": integer,
        "participants": integer
      }
    ]
  },
  "rating_history": [
    {
      "date": "string (ISO date)",
      "rating": integer,
      "rank": integer,
      "tier": "string"
    }
  ],
  "recent_games": [
    {
      "game_id": "string",
      "opponent": "string",
      "opponent_rating": integer,
      "result": "string",
      "rating_change": integer,
      "date": "string (ISO date)"
    }
  ]
}
```

#### Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 404 | Player not found |
| 429 | Rate limit exceeded |

---

### Update Global Rankings

```http
POST /api/rankings/update
```

Triggers a manual update of the global rankings. Admin access required.

#### Request Headers

| Header | Value |
|--------|--------|
| Authorization | Bearer {admin_token} |

#### Response

```json
{
  "status": "string",
  "updated_players": integer,
  "timestamp": "string (ISO date)"
}
```

#### Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Rankings updated successfully |
| 401 | Unauthorized |
| 403 | Forbidden (non-admin user) |
| 429 | Rate limit exceeded |

---

## Rate Limits

- Global rankings: 60 requests per minute
- Player details: 120 requests per minute
- Manual updates: 2 requests per hour

## Error Responses

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Common Error Codes

| Code | Description |
|------|-------------|
| INVALID_PARAMETERS | Invalid query parameters |
| PLAYER_NOT_FOUND | Player ID not found |
| UNAUTHORIZED | Missing or invalid token |
| FORBIDDEN | Insufficient permissions |
| RATE_LIMITED | Too many requests |

## Caching

- Global rankings are cached for 1 hour
- Player details are cached for 15 minutes
- Cache is invalidated on ranking updates

## Best Practices

1. Use pagination for large result sets
2. Cache responses on the client side
3. Handle rate limits gracefully
4. Implement exponential backoff for retries
5. Monitor API usage and response times 