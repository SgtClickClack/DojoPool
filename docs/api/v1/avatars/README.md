# Avatars API

## Endpoints

### List Avatars

```http
GET /avatars
Authorization: Bearer <access_token>
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `user_id` (optional): Filter by user
- `style` (optional): Filter by avatar style (pixel, realistic, anime, etc.)

**Response** (200 OK)

```json
{
  "avatars": [
    {
      "id": 1,
      "user_id": 101,
      "name": "Pool Master",
      "style": "pixel",
      "image_url": "https://api.dojopool.com/avatars/1.png",
      "created_at": "2024-01-17T12:00:00Z",
      "attributes": {
        "level": 5,
        "experience": 1200,
        "achievements": ["first_win", "tournament_champion"],
        "customizations": {
          "hat": "fedora",
          "outfit": "tuxedo",
          "cue": "golden_dragon"
        }
      }
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

### Get Avatar Details

```http
GET /avatars/{avatar_id}
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "id": 1,
  "user_id": 101,
  "name": "Pool Master",
  "style": "pixel",
  "image_url": "https://api.dojopool.com/avatars/1.png",
  "created_at": "2024-01-17T12:00:00Z",
  "updated_at": "2024-01-17T13:00:00Z",
  "attributes": {
    "level": 5,
    "experience": 1200,
    "achievements": ["first_win", "tournament_champion"],
    "customizations": {
      "hat": "fedora",
      "outfit": "tuxedo",
      "cue": "golden_dragon"
    }
  },
  "stats": {
    "games_played": 50,
    "games_won": 35,
    "tournaments_won": 2,
    "highest_break": 50,
    "accuracy": 75.5
  },
  "inventory": {
    "hats": ["fedora", "cap", "crown"],
    "outfits": ["tuxedo", "casual", "sports"],
    "cues": ["golden_dragon", "classic", "flame"]
  }
}
```

### Create Avatar

```http
POST /avatars
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Pool Master",
    "style": "pixel",
    "customizations": {
        "hat": "fedora",
        "outfit": "tuxedo",
        "cue": "golden_dragon"
    }
}
```

**Response** (201 Created)

```json
{
  "id": 1,
  "user_id": 101,
  "name": "Pool Master",
  "style": "pixel",
  "image_url": "https://api.dojopool.com/avatars/1.png",
  "created_at": "2024-01-17T12:00:00Z",
  "attributes": {
    "level": 1,
    "experience": 0,
    "achievements": [],
    "customizations": {
      "hat": "fedora",
      "outfit": "tuxedo",
      "cue": "golden_dragon"
    }
  }
}
```

### Update Avatar

```http
PUT /avatars/{avatar_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Pool Champion",
    "customizations": {
        "hat": "crown",
        "outfit": "sports",
        "cue": "flame"
    }
}
```

**Response** (200 OK)

```json
{
  "id": 1,
  "name": "Pool Champion",
  "customizations": {
    "hat": "crown",
    "outfit": "sports",
    "cue": "flame"
  },
  "updated_at": "2024-01-17T13:00:00Z"
}
```

### Add Experience

```http
POST /avatars/{avatar_id}/experience
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "amount": 100,
    "reason": "game_won"
}
```

**Response** (200 OK)

```json
{
  "avatar_id": 1,
  "previous_level": 5,
  "current_level": 6,
  "previous_experience": 1200,
  "current_experience": 1300,
  "level_up": true,
  "unlocked_items": [
    {
      "type": "hat",
      "id": "crown",
      "name": "Champion's Crown"
    }
  ]
}
```

### Unlock Achievement

```http
POST /avatars/{avatar_id}/achievements
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "achievement_id": "tournament_champion",
    "tournament_id": 1
}
```

**Response** (200 OK)

```json
{
  "avatar_id": 1,
  "achievement": {
    "id": "tournament_champion",
    "name": "Tournament Champion",
    "description": "Won first tournament",
    "unlocked_at": "2024-01-17T14:00:00Z"
  },
  "rewards": {
    "experience": 500,
    "items": [
      {
        "type": "outfit",
        "id": "champion_robe",
        "name": "Champion's Robe"
      }
    ]
  }
}
```

## Error Responses

### Avatar Not Found (404 Not Found)

```json
{
  "error": "Avatar not found",
  "code": "AVATAR_NOT_FOUND"
}
```

### Invalid Customization (400 Bad Request)

```json
{
  "error": "Invalid customization options",
  "code": "AVATAR_INVALID_CUSTOMIZATION",
  "details": {
    "hat": "Item not unlocked",
    "cue": "Invalid item ID"
  }
}
```

### Achievement Already Unlocked (409 Conflict)

```json
{
  "error": "Achievement already unlocked",
  "code": "AVATAR_ACHIEVEMENT_EXISTS"
}
```

### Invalid Achievement (400 Bad Request)

```json
{
  "error": "Invalid achievement",
  "code": "AVATAR_INVALID_ACHIEVEMENT",
  "details": "Achievement requirements not met"
}
```

### Unauthorized Access (403 Forbidden)

```json
{
  "error": "Insufficient permissions to modify avatar",
  "code": "AVATAR_UNAUTHORIZED"
}
```
