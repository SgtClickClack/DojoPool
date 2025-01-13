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
- [POST /api/v1/auth/register](auth/register.md)
- [POST /api/v1/auth/login](auth/login.md)
- [POST /api/v1/auth/verify-email](auth/verify-email.md)
- [POST /api/v1/auth/reset-password](auth/reset-password.md)

### Users
- [GET /api/v1/users/me](users/me.md)
- [PUT /api/v1/users/me](users/update.md)
- [GET /api/v1/users/{id}](users/get.md)
- [GET /api/v1/users/{id}/stats](users/stats.md)

### Games
- [POST /api/v1/games](games/create.md)
- [GET /api/v1/games/{id}](games/get.md)
- [PUT /api/v1/games/{id}](games/update.md)
- [GET /api/v1/games/active](games/active.md)

### Matches
- [POST /api/v1/matches](matches/create.md)
- [GET /api/v1/matches/{id}](matches/get.md)
- [PUT /api/v1/matches/{id}](matches/update.md)
- [GET /api/v1/matches/upcoming](matches/upcoming.md)

### Locations
- [GET /api/v1/locations](locations/list.md)
- [POST /api/v1/locations](locations/create.md)
- [GET /api/v1/locations/{id}](locations/get.md)
- [PUT /api/v1/locations/{id}](locations/update.md)

### AI Features
- [POST /api/v1/ai/analyze-style](ai/analyze-style.md)
- [POST /api/v1/ai/generate-story](ai/generate-story.md)
- [POST /api/v1/ai/get-commentary](ai/get-commentary.md)

## Error Handling
All endpoints follow a consistent error response format:
```json
{
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable error message",
        "details": {}
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