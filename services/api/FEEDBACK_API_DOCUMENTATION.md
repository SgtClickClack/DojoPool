# Feedback & Reporting System API Documentation

## Overview

The Feedback & Reporting System allows users to submit feedback, bug reports, and feature requests while providing administrators with tools to manage and respond to user submissions.

## Base URL

```
/api/v1/feedback
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## User Endpoints

### Submit Feedback

**POST** `/api/v1/feedback`

Submit new feedback or report an issue.

**Request Body:**

```json
{
  "message": "string (required, max 2000 chars)",
  "category": "BUG | FEATURE_REQUEST | GENERAL_FEEDBACK | VENUE_ISSUE | TECHNICAL_SUPPORT | UI_UX_IMPROVEMENT | PERFORMANCE_ISSUE",
  "additionalContext": "string (optional, max 500 chars)"
}
```

**Response (201):**

```json
{
  "id": "string",
  "userId": "string",
  "message": "string",
  "category": "string",
  "status": "PENDING",
  "priority": "NORMAL",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "string",
    "username": "string",
    "email": "string"
  }
}
```

### Get My Feedback

**GET** `/api/v1/feedback/my?page=1&limit=10`

Retrieve the authenticated user's submitted feedback with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response (200):**

```json
{
  "feedback": [
    {
      "id": "string",
      "message": "string",
      "category": "string",
      "status": "string",
      "priority": "string",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "totalCount": 5,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### Get My Feedback by ID

**GET** `/api/v1/feedback/my/:id`

Retrieve a specific feedback item submitted by the authenticated user.

**Response (200):** Same as submit feedback response

### Delete My Feedback

## Moderation Endpoints

All endpoints require JWT and role `MODERATOR` or `ADMIN`.

Base path: `/api/v1/feedback/moderation`

- GET `/` — List feedback with pagination and filters (status, category, priority, userId, dateFrom, dateTo)
- GET `/:id` — Get single feedback including `user` and `resolver`
- PUT `/:id/status` — Update status/priority/notes. Body:

```json
{
  "status": "PENDING | IN_REVIEW | IN_PROGRESS | RESOLVED | CLOSED | REJECTED",
  "priority": "LOW | NORMAL | HIGH | CRITICAL",
  "moderatorNotes": "string"
}
```

Responses mirror admin endpoints and include `user` and optional `resolver`.

**DELETE** `/api/v1/feedback/my/:id`

Delete a feedback item submitted by the authenticated user.

**Response (204):** No content

## Admin Endpoints

### Get All Feedback (Admin)

**GET** `/api/v1/feedback/admin?page=1&limit=20`

Retrieve all feedback with admin controls. Requires ADMIN role.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `priority` (optional): Filter by priority
- `userId` (optional): Filter by user ID
- `dateFrom` (optional): Filter from date (ISO string)
- `dateTo` (optional): Filter to date (ISO string)

**Response (200):**

```json
{
  "feedback": [
    {
      "id": "string",
      "userId": "string",
      "message": "string",
      "category": "string",
      "status": "string",
      "priority": "string",
      "adminNotes": "string | null",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "resolvedAt": "2024-01-01T00:00:00.000Z | null",
      "resolvedBy": "string | null",
      "user": {
        "id": "string",
        "username": "string",
        "email": "string"
      },
      "resolver": {
        "id": "string",
        "username": "string"
      } | null
    }
  ],
  "totalCount": 25,
  "pendingCount": 5,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get Feedback Statistics (Admin)

**GET** `/api/v1/feedback/admin/stats`

Get feedback statistics overview. Requires ADMIN role.

**Response (200):**

```json
{
  "total": 100,
  "pending": 15,
  "inReview": 8,
  "resolved": 65,
  "closed": 10,
  "rejected": 2,
  "averageResolutionTime": 2.5
}
```

### Get Feedback by ID (Admin)

**GET** `/api/v1/feedback/admin/:id`

Retrieve a specific feedback item with full details. Requires ADMIN role.

**Response (200):** Same as admin feedback list item

### Update Feedback (Admin)

**PUT** `/api/v1/feedback/admin/:id`

Update feedback status, priority, and admin notes. Requires ADMIN role.

**Request Body:**

```json
{
  "status": "PENDING | IN_REVIEW | IN_PROGRESS | RESOLVED | CLOSED | REJECTED",
  "priority": "LOW | NORMAL | HIGH | CRITICAL",
  "adminNotes": "string (optional)"
}
```

**Response (200):** Updated feedback object

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "message must be shorter than or equal to 2000 characters",
    "category must be one of the following values: BUG, FEATURE_REQUEST, GENERAL_FEEDBACK, VENUE_ISSUE, TECHNICAL_SUPPORT, UI_UX_IMPROVEMENT, PERFORMANCE_ISSUE"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Admin privileges required"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Feedback not found"
}
```

## Categories

- **BUG**: Report bugs or errors
- **FEATURE_REQUEST**: Suggest new features
- **GENERAL_FEEDBACK**: General feedback about the platform
- **VENUE_ISSUE**: Issues with venues or location services
- **TECHNICAL_SUPPORT**: Technical problems or questions
- **UI_UX_IMPROVEMENT**: User interface or experience suggestions
- **PERFORMANCE_ISSUE**: Slow loading or performance problems

## Status Flow

```
PENDING → IN_REVIEW → IN_PROGRESS → RESOLVED
   ↓         ↓            ↓
REJECTED   CLOSED       CLOSED
```

## Rate Limiting

- User feedback submission: 10 requests per hour
- Admin endpoints: 100 requests per minute

## Notifications

- When feedback is submitted, all admin users receive a notification
- When feedback status changes to "RESOLVED", the user receives a notification
- Admins can view all notifications in their dashboard

## Data Retention

- Feedback is retained indefinitely
- Admin notes and resolution details are preserved
- User data is handled according to privacy policies
