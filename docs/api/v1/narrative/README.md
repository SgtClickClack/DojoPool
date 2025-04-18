# Narrative System API

## Endpoints

### List Stories

```http
GET /narrative/stories
Authorization: Bearer <access_token>
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `player_id` (optional): Filter by player
- `status` (optional): Filter by story status (active, completed)
- `type` (optional): Filter by story type (quest, challenge, journey)

**Response** (200 OK)

```json
{
  "stories": [
    {
      "id": 1,
      "player_id": 101,
      "title": "The Path to Mastery",
      "type": "journey",
      "status": "active",
      "current_chapter": 3,
      "total_chapters": 10,
      "started_at": "2024-01-17T12:00:00Z",
      "last_updated": "2024-01-17T14:00:00Z",
      "completion": 30,
      "rewards": {
        "experience": 1000,
        "items": ["master_cue", "champion_outfit"],
        "achievements": ["journey_master"]
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

### Get Story Details

```http
GET /narrative/stories/{story_id}
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "id": 1,
  "player_id": 101,
  "title": "The Path to Mastery",
  "type": "journey",
  "status": "active",
  "description": "Embark on a journey to become a pool master...",
  "current_chapter": 3,
  "total_chapters": 10,
  "started_at": "2024-01-17T12:00:00Z",
  "last_updated": "2024-01-17T14:00:00Z",
  "chapters": [
    {
      "number": 1,
      "title": "First Steps",
      "status": "completed",
      "completion_date": "2024-01-17T13:00:00Z",
      "objectives": [
        {
          "id": "win_first_game",
          "description": "Win your first game",
          "status": "completed"
        }
      ]
    },
    {
      "number": 2,
      "title": "Building Skills",
      "status": "completed",
      "completion_date": "2024-01-17T14:00:00Z",
      "objectives": [
        {
          "id": "make_power_shots",
          "description": "Successfully make 5 power shots",
          "status": "completed",
          "progress": {
            "current": 5,
            "required": 5
          }
        }
      ]
    },
    {
      "number": 3,
      "title": "Tournament Ready",
      "status": "active",
      "objectives": [
        {
          "id": "join_tournament",
          "description": "Join your first tournament",
          "status": "pending"
        }
      ]
    }
  ],
  "rewards": {
    "experience": 1000,
    "items": ["master_cue", "champion_outfit"],
    "achievements": ["journey_master"]
  }
}
```

### Start Story

```http
POST /narrative/stories
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "story_type": "journey",
    "title": "The Path to Mastery"
}
```

**Response** (201 Created)

```json
{
  "id": 1,
  "player_id": 101,
  "title": "The Path to Mastery",
  "type": "journey",
  "status": "active",
  "current_chapter": 1,
  "total_chapters": 10,
  "started_at": "2024-01-17T12:00:00Z",
  "chapters": [
    {
      "number": 1,
      "title": "First Steps",
      "status": "active",
      "objectives": [
        {
          "id": "win_first_game",
          "description": "Win your first game",
          "status": "pending"
        }
      ]
    }
  ]
}
```

### Update Story Progress

```http
POST /narrative/stories/{story_id}/progress
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "objective_id": "win_first_game",
    "status": "completed",
    "game_id": 123
}
```

**Response** (200 OK)

```json
{
  "story_id": 1,
  "chapter_number": 1,
  "objective_id": "win_first_game",
  "status": "completed",
  "completed_at": "2024-01-17T13:00:00Z",
  "chapter_completed": true,
  "rewards": {
    "experience": 100,
    "items": ["beginner_cue"],
    "achievements": ["first_victory"]
  },
  "next_objective": {
    "id": "make_power_shots",
    "description": "Successfully make 5 power shots",
    "chapter_number": 2
  }
}
```

### Generate Story Branch

```http
POST /narrative/stories/{story_id}/branches
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "context": {
        "player_style": "aggressive",
        "recent_achievements": ["tournament_winner"],
        "skill_level": "intermediate"
    }
}
```

**Response** (200 OK)

```json
{
  "story_id": 1,
  "new_branch": {
    "id": "tournament_champion_path",
    "title": "Champion's Journey",
    "description": "A new path opens after your tournament victory...",
    "chapters": [
      {
        "number": 1,
        "title": "Fame and Challenge",
        "objectives": [
          {
            "id": "defend_title",
            "description": "Successfully defend your title in the next tournament"
          }
        ]
      }
    ],
    "requirements": {
      "achievements": ["tournament_winner"],
      "level": 10
    }
  }
}
```

### Get Story Analytics

```http
GET /narrative/stories/{story_id}/analytics
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "story_id": 1,
  "completion_rate": 75.5,
  "time_spent": {
    "total_hours": 12.5,
    "average_per_chapter": 4.2
  },
  "player_choices": [
    {
      "chapter": 1,
      "choice": "aggressive_path",
      "outcome": "success"
    }
  ],
  "achievement_rate": {
    "story_achievements": 8,
    "total_achievements": 10,
    "rate": 80.0
  },
  "difficulty_analysis": {
    "perceived_difficulty": "medium",
    "completion_attempts": {
      "average_per_objective": 2.3,
      "hardest_objective": "tournament_victory"
    }
  }
}
```

## Error Responses

### Story Not Found (404 Not Found)

```json
{
  "error": "Story not found",
  "code": "NARRATIVE_STORY_NOT_FOUND"
}
```

### Invalid Story Type (400 Bad Request)

```json
{
  "error": "Invalid story type",
  "code": "NARRATIVE_INVALID_TYPE",
  "details": "Story type must be one of: quest, challenge, journey"
}
```

### Invalid Progress Update (400 Bad Request)

```json
{
  "error": "Invalid progress update",
  "code": "NARRATIVE_INVALID_PROGRESS",
  "details": {
    "objective_id": "Objective not found in current chapter",
    "status": "Invalid status transition"
  }
}
```

### Story Generation Failed (500 Internal Server Error)

```json
{
  "error": "Failed to generate story branch",
  "code": "NARRATIVE_GENERATION_FAILED",
  "details": "AI service unavailable"
}
```

### Requirements Not Met (403 Forbidden)

```json
{
  "error": "Story requirements not met",
  "code": "NARRATIVE_REQUIREMENTS_NOT_MET",
  "details": {
    "level": "Player level too low",
    "achievements": "Missing required achievement: tournament_winner"
  }
}
```
