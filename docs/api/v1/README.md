# DojoPool API v1 Documentation

## Overview
This document describes the DojoPool API v1 endpoints, authentication, and usage examples.

## Authentication
All API requests require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication
- [POST /api/v1/auth/register](../../../src/dojopool/routes/auth/register.md)
- [POST /api/v1/auth/login](../../../src/dojopool/routes/auth/login.md)
- [POST /api/v1/auth/verify-email](../../../src/dojopool/routes/auth/verify-email.md)
- [POST /api/v1/auth/reset-password](../../../src/dojopool/routes/auth/reset-password.md)

### Users
- [GET /api/v1/users/me](../../../src/dojopool/routes/users/me.md)
- [PUT /api/v1/users/me](../../../src/dojopool/routes/users/update.md)
- [GET /api/v1/users/{id}](../../../src/dojopool/routes/users/get.md)
- [GET /api/v1/users/{id}/stats](../../../src/dojopool/routes/users/stats.md)

### Games
- [POST /api/v1/games](./endpoints/games/create.md)
- [GET /api/v1/games/{id}](./endpoints/games/get.md)
- [PUT /api/v1/games/{id}](./endpoints/games/update.md)
- [GET /api/v1/games/active](./endpoints/games/active.md)

### Matches
- [POST /api/v1/matches](./endpoints/matches/create.md)
- [GET /api/v1/matches/{id}](./endpoints/matches/get.md)
- [PUT /api/v1/matches/{id}](./endpoints/matches/update.md)
- [GET /api/v1/matches/upcoming](./endpoints/matches/upcoming.md)

### Locations
- [GET /api/v1/locations](./endpoints/locations/list.md)
- [POST /api/v1/locations](./endpoints/locations/create.md)
- [GET /api/v1/locations/{id}](./endpoints/locations/get.md)
- [PUT /api/v1/locations/{id}](./endpoints/locations/update.md)

### AI Features
- [POST /api/v1/ai/analyze-style](./endpoints/ai/analyze-style.md)
- [POST /api/v1/ai/generate-story](./endpoints/ai/generate-story.md)
- [POST /api/v1/ai/get-commentary](./endpoints/ai/get-commentary.md)

## Error Response Format

All endpoints follow a consistent error response format:

```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {
            "field": "Additional error details"
        }
    }
}
```

## Rate Limiting
API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated users
- AI feature endpoints are limited to 10 requests per minute

## Versioning
This API follows semantic versioning. Breaking changes will result in a new major version.