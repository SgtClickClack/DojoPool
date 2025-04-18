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
- [POST /api/v1/auth/refresh](auth/refresh.md)
- [POST /api/v1/auth/logout](auth/logout.md)

### Users

- [GET /api/v1/users/me](users/me.md)
- [GET /api/v1/users/{id}](users/get.md)
- [PUT /api/v1/users/{id}](users/update.md)
- [DELETE /api/v1/users/{id}](users/delete.md)

### Games

- [POST /api/v1/games](games/create.md)
- [GET /api/v1/games/{id}](games/get.md)
- [PUT /api/v1/games/{id}](games/update.md)
- [GET /api/v1/games/active](games/active.md)

### Matches

- [POST /api/v1/matches](games/matches/create.md)
- [GET /api/v1/matches/{id}](games/matches/get.md)
- [PUT /api/v1/matches/{id}](games/matches/update.md)
- [GET /api/v1/matches/upcoming](games/matches/upcoming.md)

### Locations

- [GET /api/v1/locations](venues/list.md)
- [POST /api/v1/locations](venues/create.md)
- [GET /api/v1/locations/{id}](venues/get.md)
- [PUT /api/v1/locations/{id}](venues/update.md)

### AI Features

- [POST /api/v1/ai/analyze-style](narrative/analyze-style.md)
- [POST /api/v1/ai/generate-story](narrative/generate-story.md)
- [GET /api/v1/ai/get-commentary](narrative/get-commentary.md)

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
