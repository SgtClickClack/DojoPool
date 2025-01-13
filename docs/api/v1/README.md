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
- [POST /api/v1/auth/register](./endpoints/auth/register.md)
- [POST /api/v1/auth/login](./endpoints/auth/login.md)
- [POST /api/v1/auth/refresh](./endpoints/auth/refresh.md)
- [POST /api/v1/auth/logout](./endpoints/auth/logout.md)

### Users
- [GET /api/v1/users/me](./endpoints/users/me.md)
- [GET /api/v1/users/{id}](./endpoints/users/get.md)
- [PUT /api/v1/users/{id}](./endpoints/users/update.md)
- [DELETE /api/v1/users/{id}](./endpoints/users/delete.md)

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
- [GET /api/v1/ai/get-commentary](./endpoints/ai/get-commentary.md)

### Error Response Format
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