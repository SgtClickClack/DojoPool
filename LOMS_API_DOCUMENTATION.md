# Live Operations Management System (LOMS) API Documentation

## Overview

The Live Operations Management System (LOMS) provides a comprehensive set of APIs for managing dynamic in-game content, events, promotions, news, and asset bundles. This system empowers live operations teams to manage game content without requiring code deployments.

## Authentication

All LOMS endpoints require JWT authentication. Admin-only endpoints require users with `ADMIN` role.

```http
Authorization: Bearer <jwt_token>
```

## Base URL

```
/api/v1/loms
```

## Endpoints

### Live Content

#### GET /loms/live

Retrieves all active live content for client consumption.

**Authentication:** Optional (public access)

**Response:**

```json
{
  "events": [
    {
      "id": "string",
      "contentId": "string",
      "eventType": "string",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T18:00:00Z",
      "isActive": true,
      "priority": 1,
      "targetAudience": ["ALL", "VIP"],
      "rewards": {
        "coins": 100,
        "experience": 50
      },
      "requirements": {
        "minLevel": 1
      },
      "content": {
        "id": "string",
        "title": "string",
        "description": "string",
        "tags": ["string"]
      }
    }
  ],
  "promotions": [
    {
      "id": "string",
      "contentId": "string",
      "code": "string",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "minPurchase": 50,
      "maxUses": 100,
      "usedCount": 23,
      "isActive": true,
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-12-31T23:59:59Z",
      "targetUsers": ["ALL"],
      "applicableItems": ["ALL"],
      "content": {
        "id": "string",
        "title": "string",
        "description": "string",
        "tags": ["string"]
      }
    }
  ],
  "news": [
    {
      "id": "string",
      "contentId": "string",
      "category": "UPDATE",
      "priority": 1,
      "isPublished": true,
      "publishTime": "2024-01-01T00:00:00Z",
      "expiryTime": "2024-12-31T23:59:59Z",
      "readCount": 0,
      "targetPlatform": ["WEB", "MOBILE"],
      "content": {
        "id": "string",
        "title": "string",
        "description": "string",
        "tags": ["string"]
      }
    }
  ],
  "lastUpdated": "2024-01-01T12:00:00Z"
}
```

### Events Management

#### POST /loms/events

Create a new in-game event.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "title": "Cyber Slam Tournament",
  "description": "Weekly tournament for skilled players",
  "eventType": "TOURNAMENT",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T18:00:00Z",
  "priority": 1,
  "targetAudience": ["ALL", "VIP"],
  "rewards": {
    "coins": 1000,
    "experience": 500,
    "nft": "tournament_winner_badge"
  },
  "requirements": {
    "minLevel": 5,
    "minSkillRating": 1500
  },
  "tags": ["tournament", "weekly", "competitive"]
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "contentId": "string",
  "eventType": "TOURNAMENT",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T18:00:00Z",
  "isActive": true,
  "priority": 1,
  "targetAudience": ["ALL", "VIP"],
  "rewards": {
    "coins": 1000,
    "experience": 500,
    "nft": "tournament_winner_badge"
  },
  "requirements": {
    "minLevel": 5,
    "minSkillRating": 1500
  },
  "createdBy": "admin-user-id",
  "content": {
    "id": "string",
    "title": "Cyber Slam Tournament",
    "description": "Weekly tournament for skilled players",
    "tags": ["tournament", "weekly", "competitive"],
    "user": {
      "id": "string",
      "username": "string"
    }
  }
}
```

#### GET /loms/events

Retrieve paginated list of events.

**Authentication:** Required (Admin only)

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `isActive` (boolean): Filter by active status
- `eventType` (string): Filter by event type

**Response:** `200 OK`

```json
{
  "events": [...],
  "totalCount": 25,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### GET /loms/events/:id

Retrieve a specific event by ID.

**Authentication:** Required (Admin only)

**Response:** `200 OK`

```json
{
  "id": "string",
  "contentId": "string",
  "eventType": "TOURNAMENT",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T18:00:00Z",
  "isActive": true,
  "priority": 1,
  "targetAudience": ["ALL", "VIP"],
  "rewards": {...},
  "requirements": {...},
  "content": {...}
}
```

#### PUT /loms/events/:id

Update an existing event.

**Authentication:** Required (Admin only)

**Request Body:** (Same as POST, all fields optional)

**Response:** `200 OK`

```json
{
  "id": "string",
  "contentId": "string",
  "eventType": "SPECIAL_EVENT",
  "startTime": "2024-01-02T10:00:00Z",
  "endTime": "2024-01-02T18:00:00Z",
  "isActive": false,
  "priority": 2,
  "updatedBy": "admin-user-id",
  "content": {...}
}
```

#### DELETE /loms/events/:id

Delete an event.

**Authentication:** Required (Admin only)

**Response:** `204 No Content`

### Promotions Management

#### POST /loms/promotions

Create a new promotion.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "title": "New Player Welcome Bonus",
  "description": "Get 20% off your first purchase",
  "code": "WELCOME20",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minPurchase": 100,
  "maxUses": 500,
  "isActive": true,
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-31T23:59:59Z",
  "targetUsers": ["ALL"],
  "applicableItems": ["ALL"],
  "tags": ["welcome", "discount", "new-player"]
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "contentId": "string",
  "code": "WELCOME20",
  "discountType": "PERCENTAGE",
  "discountValue": 20,
  "minPurchase": 100,
  "maxUses": 500,
  "usedCount": 0,
  "isActive": true,
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-31T23:59:59Z",
  "targetUsers": ["ALL"],
  "applicableItems": ["ALL"],
  "createdBy": "admin-user-id",
  "content": {...}
}
```

#### GET /loms/promotions

Retrieve paginated list of promotions.

**Authentication:** Required (Admin only)

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `isActive` (boolean): Filter by active status
- `code` (string): Filter by promotion code

#### GET /loms/promotions/:id

Retrieve a specific promotion by ID.

**Authentication:** Required (Admin only)

#### PUT /loms/promotions/:id

Update an existing promotion.

**Authentication:** Required (Admin only)

#### DELETE /loms/promotions/:id

Delete a promotion.

**Authentication:** Required (Admin only)

### News Management

#### POST /loms/news

Create a new news item.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "title": "New Cyberpunk Theme Released",
  "description": "Experience the future with our latest visual update",
  "category": "FEATURE",
  "priority": 1,
  "isPublished": true,
  "publishTime": "2024-01-01T09:00:00Z",
  "expiryTime": "2024-01-31T23:59:59Z",
  "targetPlatform": ["WEB", "MOBILE"],
  "tags": ["update", "theme", "cyberpunk"]
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "contentId": "string",
  "category": "FEATURE",
  "priority": 1,
  "isPublished": true,
  "publishTime": "2024-01-01T09:00:00Z",
  "expiryTime": "2024-01-31T23:59:59Z",
  "readCount": 0,
  "targetPlatform": ["WEB", "MOBILE"],
  "createdBy": "admin-user-id",
  "content": {...}
}
```

#### GET /loms/news

Retrieve paginated list of news items.

**Authentication:** Required (Admin only)

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `isPublished` (boolean): Filter by published status
- `category` (string): Filter by category

#### GET /loms/news/:id

Retrieve a specific news item by ID.

**Authentication:** Required (Admin only)

#### PUT /loms/news/:id

Update an existing news item.

**Authentication:** Required (Admin only)

#### DELETE /loms/news/:id

Delete a news item.

**Authentication:** Required (Admin only)

### Asset Bundles Management

#### POST /loms/assets

Create a new asset bundle.

**Authentication:** Required (Admin only)

**Request Body:**

```json
{
  "title": "Neon City Sound Pack",
  "description": "Futuristic sound effects for enhanced gameplay",
  "bundleType": "SOUNDS",
  "version": "1.2.0",
  "isActive": true,
  "downloadUrl": "https://cdn.dojopool.com/bundles/neon-sounds-1.2.0.zip",
  "fileSize": 20971520,
  "checksum": "sha256:abc123def456...",
  "minAppVersion": "2.1.0",
  "targetPlatform": ["WEB", "MOBILE"],
  "dependencies": ["base-assets-1.0.0"],
  "tags": ["sounds", "neon", "futuristic"]
}
```

**Response:** `201 Created`

```json
{
  "id": "string",
  "contentId": "string",
  "bundleType": "SOUNDS",
  "version": "1.2.0",
  "isActive": true,
  "downloadUrl": "https://cdn.dojopool.com/bundles/neon-sounds-1.2.0.zip",
  "fileSize": 20971520,
  "checksum": "sha256:abc123def456...",
  "minAppVersion": "2.1.0",
  "targetPlatform": ["WEB", "MOBILE"],
  "dependencies": ["base-assets-1.0.0"],
  "createdBy": "admin-user-id",
  "content": {...}
}
```

#### GET /loms/assets

Retrieve paginated list of asset bundles.

**Authentication:** Required (Admin only)

**Query Parameters:**

- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `isActive` (boolean): Filter by active status
- `bundleType` (string): Filter by bundle type

#### GET /loms/assets/:id

Retrieve a specific asset bundle by ID.

**Authentication:** Required (Admin only)

#### PUT /loms/assets/:id

Update an existing asset bundle.

**Authentication:** Required (Admin only)

#### DELETE /loms/assets/:id

Delete an asset bundle.

**Authentication:** Required (Admin only)

## Data Structures

### Event Types

- `TOURNAMENT`: Competitive tournaments
- `SPECIAL_EVENT`: Limited-time special events
- `MAINTENANCE`: Scheduled maintenance periods
- `SEASON_START`: Season or chapter launches
- `HOLIDAY`: Holiday-themed events

### Promotion Discount Types

- `PERCENTAGE`: Percentage discount (e.g., 20% off)
- `FIXED_AMOUNT`: Fixed amount discount (e.g., 50 coins off)
- `FREE_ITEM`: Free item or bonus

### News Categories

- `GENERAL`: General announcements
- `UPDATE`: Game updates and patches
- `EVENT`: Event-related news
- `MAINTENANCE`: Maintenance notifications
- `FEATURE`: New feature announcements

### Asset Bundle Types

- `AVATAR_ITEMS`: Avatar customization items
- `THEME`: Visual themes and UI skins
- `SOUNDS`: Audio effects and music
- `EFFECTS`: Particle effects and animations

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": ["Validation failed"],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

## Rate Limiting

All LOMS endpoints are subject to rate limiting:

- Admin endpoints: 100 requests per minute
- Public endpoints: 1000 requests per minute

## Webhooks

The LOMS system supports webhooks for real-time notifications:

### Event Webhooks

Triggered when events are created, updated, or deleted:

```json
{
  "type": "event.created",
  "data": {
    "event": {...},
    "timestamp": "2024-01-01T10:00:00Z"
  }
}
```

### Content Status Webhooks

Triggered when content status changes:

```json
{
  "type": "content.status_changed",
  "data": {
    "contentId": "string",
    "oldStatus": "PENDING",
    "newStatus": "APPROVED",
    "timestamp": "2024-01-01T10:00:00Z"
  }
}
```

## Best Practices

1. **Content Scheduling**: Plan content schedules in advance to avoid conflicts
2. **Testing**: Always test new content in staging before production deployment
3. **Monitoring**: Monitor content performance and user engagement metrics
4. **Backup**: Maintain backups of all content configurations
5. **Versioning**: Use semantic versioning for asset bundles
6. **Security**: Regularly rotate promotion codes and monitor for abuse
7. **Localization**: Consider localization requirements for global content

## Support

For technical support or questions about the LOMS API, contact the development team or refer to the main API documentation.
