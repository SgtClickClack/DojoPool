# DojoPool API Reference - CMS Endpoints

## Content Management System (CMS)

The CMS provides administrators with tools to manage dynamic content including events, news articles, and system messages.

### Authentication

All CMS endpoints require:

- JWT authentication
- ADMIN role
- `Authorization: Bearer <token>` header

---

## Event Management

### Create Event

```http
POST /api/v1/cms/events
Content-Type: application/json

{
  "title": "Championship Tournament 2025",
  "description": "Annual championship tournament",
  "eventDate": "2025-02-15T14:00:00Z",
  "location": "The Jade Tiger",
  "venueId": "venue-uuid",
  "maxAttendees": "64",
  "registrationDeadline": "2025-02-10T23:59:59Z",
  "eventType": "TOURNAMENT",
  "tags": ["tournament", "championship"],
  "metadata": {
    "prizePool": "$10,000",
    "format": "Double Elimination"
  }
}
```

### Get Events

```http
GET /api/v1/cms/events?page=1&limit=20
```

### Update Event

```http
PUT /api/v1/cms/events/{eventId}
Content-Type: application/json

{
  "title": "Updated Event Title",
  "description": "Updated description"
}
```

### Delete Event

```http
DELETE /api/v1/cms/events/{eventId}
```

---

## News Article Management

### Create News Article

```http
POST /api/v1/cms/news
Content-Type: application/json

{
  "title": "Platform Update v2.1",
  "description": "Exciting new features released",
  "content": "<h2>New Features</h2><p>Rich text content...</p>",
  "summary": "Brief summary for previews",
  "category": "UPDATE",
  "featuredImage": "/images/update-banner.jpg",
  "isFeatured": true,
  "author": "DojoPool Team",
  "publishDate": "2025-01-15T10:00:00Z",
  "tags": ["update", "features"],
  "metadata": {
    "version": "2.1",
    "priority": "high"
  }
}
```

### Get News Articles

```http
GET /api/v1/cms/news?page=1&limit=20&status=APPROVED&category=UPDATE
```

### Update News Article

```http
PUT /api/v1/cms/news/{articleId}
```

### Delete News Article

```http
DELETE /api/v1/cms/news/{articleId}
```

---

## System Message Management

### Create System Message

```http
POST /api/v1/cms/messages
Content-Type: application/json

{
  "title": "Scheduled Maintenance",
  "message": "Platform maintenance from 2-4 AM EST",
  "messageType": "MAINTENANCE",
  "priority": "HIGH",
  "expiresAt": "2025-01-16T04:00:00Z",
  "isActive": true,
  "targetAudience": "ALL_USERS",
  "targetUserIds": [],
  "tags": ["maintenance", "downtime"],
  "metadata": {
    "duration": "2 hours",
    "affectedServices": ["tournaments", "chat"]
  }
}
```

### Get System Messages

```http
GET /api/v1/cms/messages?page=1&limit=20&active=true
```

### Update System Message

```http
PUT /api/v1/cms/messages/{messageId}
```

### Delete System Message

```http
DELETE /api/v1/cms/messages/{messageId}
```

---

## Preview System

### Preview Event

```http
POST /api/v1/cms/preview/event
Content-Type: application/json

{
  "title": "Preview Event",
  "description": "This is a preview"
}
```

### Preview News Article

```http
POST /api/v1/cms/preview/news
Content-Type: application/json

{
  "title": "Preview Article",
  "content": "<p>Preview content</p>"
}
```

### Preview System Message

```http
POST /api/v1/cms/preview/message
Content-Type: application/json

{
  "title": "Preview Message",
  "message": "Preview message content"
}
```

---

## Bulk Operations

### Bulk Publish Content

```http
POST /api/v1/cms/bulk-publish
Content-Type: application/json

{
  "contentIds": ["content-id-1", "content-id-2", "content-id-3"]
}
```

### Bulk Archive Content

```http
POST /api/v1/cms/bulk-archive
Content-Type: application/json

{
  "contentIds": ["content-id-1", "content-id-2"]
}
```

---

## Content Types

### Event Types

- `TOURNAMENT` - Tournament events
- `SOCIAL` - Social gatherings
- `MAINTENANCE` - Maintenance periods
- `ANNOUNCEMENT` - General announcements

### News Categories

- `NEWS` - General news
- `ANNOUNCEMENT` - Important announcements
- `UPDATE` - Platform updates
- `FEATURE` - New features
- `GUIDE` - How-to guides
- `INTERVIEW` - User interviews

### System Message Types

- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error notifications
- `MAINTENANCE` - Maintenance notifications
- `ANNOUNCEMENT` - System announcements

### Priorities

- `LOW` - Low priority
- `NORMAL` - Normal priority
- `HIGH` - High priority
- `CRITICAL` - Critical priority

---

## Community Content System

The Community Content System allows players to submit their own cosmetic item designs for review and potential inclusion in the marketplace.

### Authentication

All community endpoints require:

- JWT authentication
- `Authorization: Bearer <token>` header

Admin-only endpoints require:

- ADMIN role

---

## Public Community Endpoints

### Get Public Cosmetic Items

```http
GET /api/v1/community/cosmetic-items?category=CUE_SKIN&search=blue&page=1&limit=20&sortBy=newest
```

**Query Parameters:**

- `category` (optional): Filter by cosmetic category
- `search` (optional): Search by title or description
- `sortBy` (optional): `newest`, `popular`, or `likes`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### Get Cosmetic Item Details

```http
GET /api/v1/community/cosmetic-items/{id}
```

### Like/Unlike Cosmetic Item

```http
POST /api/v1/community/cosmetic-items/{id}/like
```

---

## Creator Endpoints

### Submit Cosmetic Item

```http
POST /api/v1/community/cosmetic-items
Content-Type: multipart/form-data

# Form Data:
title=Custom Cue Skin Design
description=Beautiful blue cue skin with gold accents
category=CUE_SKIN
tags=blue,gold,premium
metadata={"colors": ["blue", "gold"], "style": "modern"}
files=(design.zip file)
files=(preview.png file)
```

### Get My Submissions

```http
GET /api/v1/community/my-submissions?page=1&limit=20
```

### Update Submission

```http
PUT /api/v1/community/cosmetic-items/{id}
Content-Type: multipart/form-data

# Can update title, description, tags, metadata, and files
```

---

## Admin Endpoints

### Get Submissions for Review

```http
GET /api/v1/community/admin/submissions?status=PENDING&category=CUE_SKIN&page=1&limit=20
```

### Review Submission

```http
PUT /api/v1/community/admin/cosmetic-items/{id}/review
Content-Type: application/json

{
  "status": "APPROVED",
  "approvedPrice": 150,
  "rejectionReason": "Optional feedback for creator"
}
```

### Bulk Operations

```http
POST /api/v1/community/admin/bulk-approve
POST /api/v1/community/admin/bulk-reject
```

### Get Statistics

```http
GET /api/v1/community/admin/stats
```

---

## Cosmetic Categories

- `CUE_SKIN`: Custom cue stick designs
- `BALL_SET`: Custom ball designs and patterns
- `TABLE_THEME`: Complete table visual themes
- `TABLE_CLOTH`: Custom table cloth patterns
- `AVATAR_FRAME`: Profile picture frames
- `PARTICLE_EFFECT`: Visual effects and animations
- `SOUND_PACK`: Custom audio effects
- `OTHER`: Miscellaneous cosmetic items

---

## File Upload Requirements

**Design Files:**

- Format: ZIP, PNG, JPG, JPEG, GIF
- Max Size: 10MB
- Purpose: Source files for the cosmetic design

**Preview Images:**

- Format: PNG, JPG, JPEG, GIF
- Max Size: 10MB
- Purpose: Visual preview of the final design

## Security Features

- **HTML Sanitization**: All rich text content is sanitized to prevent XSS attacks
- **Input Validation**: Comprehensive validation using class-validator
- **Role-Based Access**: ADMIN role required for all CMS operations
- **Content Filtering**: Automatic filtering of malicious content
- **Audit Logging**: All CMS operations are logged for security monitoring

---

## Response Format

All endpoints return data in the following format:

```json
{
  "id": "content-uuid",
  "title": "Content Title",
  "description": "Content description",
  "contentType": "EVENT|NEWS_ARTICLE|SYSTEM_MESSAGE",
  "status": "PENDING|APPROVED|REJECTED|ARCHIVED",
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "user": {
    "id": "user-uuid",
    "username": "admin",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

## Error Handling

Standard HTTP status codes are used:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include detailed error messages:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": ["title must be a string", "description is required"]
}
```
