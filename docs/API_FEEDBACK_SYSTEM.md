# 📋 DojoPool Feedback & Reporting System API Documentation

## Overview

The Feedback & Reporting System allows users to submit feedback, bug reports, feature requests, and player reports with optional file attachments. This system is designed to help improve the DojoPool platform and maintain a safe gaming environment.

## Base URL

```
/api/v1
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📝 Feedback Endpoints

### Submit Feedback

**POST** `/feedback`

Submit new feedback, bug reports, feature requests, or player reports.

#### Request Body

```json
{
  "message": "string (required, 10-2000 characters)",
  "category": "string (required, enum)",
  "additionalContext": "string (optional, max 500 characters)",
  "attachments": ["string"] (optional, max 5 URLs)
}
```

#### Category Enum Values

- `BUG` - Bug Report
- `FEATURE_REQUEST` - Feature Request
- `GENERAL_FEEDBACK` - General Feedback
- `VENUE_ISSUE` - Venue Issue
- `TECHNICAL_SUPPORT` - Technical Support
- `UI_UX_IMPROVEMENT` - UI/UX Improvement
- `PERFORMANCE_ISSUE` - Performance Issue
- `PLAYER_REPORT` - Player Report

#### Example Request

```json
{
  "message": "The game crashes when I try to start a match on mobile devices. This happens consistently after the latest update.",
  "category": "BUG",
  "additionalContext": "Steps to reproduce: 1. Open app on mobile 2. Navigate to match 3. Click start match 4. App crashes immediately",
  "attachments": ["https://example.com/uploads/screenshot.png"]
}
```

#### Response

**201 Created**

```json
{
  "id": "feedback-uuid",
  "userId": "user-uuid",
  "message": "The game crashes when I try to start a match on mobile devices...",
  "category": "BUG",
  "status": "PENDING",
  "priority": "NORMAL",
  "adminNotes": null,
  "attachments": ["https://example.com/uploads/screenshot.png"],
  "createdAt": "2025-01-30T10:30:00Z",
  "updatedAt": "2025-01-30T10:30:00Z",
  "resolvedAt": null,
  "resolvedBy": null,
  "user": {
    "id": "user-uuid",
    "username": "player123",
    "email": "player@example.com"
  },
  "resolver": null
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message must be at least 10 characters long"
    }
  ]
}
```

**401 Unauthorized**

```json
{
  "message": "Authentication required"
}
```

---

### Get My Feedback

**GET** `/feedback/my`

Retrieve the current user's feedback submissions with pagination.

#### Query Parameters

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page

#### Example Request

```
GET /feedback/my?page=1&limit=10
```

#### Response

**200 OK**

```json
{
  "feedback": [
    {
      "id": "feedback-uuid",
      "userId": "user-uuid",
      "message": "Feedback message...",
      "category": "BUG",
      "status": "PENDING",
      "priority": "NORMAL",
      "adminNotes": null,
      "attachments": [],
      "createdAt": "2025-01-30T10:30:00Z",
      "updatedAt": "2025-01-30T10:30:00Z",
      "resolvedAt": null,
      "resolvedBy": null
    }
  ],
  "totalCount": 25,
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Get Feedback by ID

**GET** `/feedback/my/{id}`

Retrieve a specific feedback submission by the current user.

#### Path Parameters

- `id` (required) - Feedback UUID

#### Response

**200 OK**

```json
{
  "id": "feedback-uuid",
  "userId": "user-uuid",
  "message": "Feedback message...",
  "category": "BUG",
  "status": "PENDING",
  "priority": "NORMAL",
  "adminNotes": null,
  "attachments": [],
  "createdAt": "2025-01-30T10:30:00Z",
  "updatedAt": "2025-01-30T10:30:00Z",
  "resolvedAt": null,
  "resolvedBy": null
}
```

**404 Not Found**

```json
{
  "message": "Feedback not found"
}
```

---

### Delete My Feedback

**DELETE** `/feedback/my/{id}`

Delete a feedback submission (only if status is PENDING).

#### Path Parameters

- `id` (required) - Feedback UUID

#### Response

**204 No Content** - Successfully deleted

**404 Not Found**

```json
{
  "message": "Feedback not found"
}
```

**403 Forbidden**

```json
{
  "message": "Cannot delete feedback that has been processed"
}
```

---

## 📁 File Upload Endpoints

### Upload Feedback Attachments

**POST** `/upload/feedback-attachments`

Upload files to be attached to feedback submissions.

#### Request

**Content-Type:** `multipart/form-data`

**Form Data:**

- `files` (required) - One or more files (max 5 files, 10MB each)

#### Supported File Types

- Images: JPEG, PNG, GIF, WebP
- Videos: MP4, WebM
- Documents: PDF, TXT

#### Example Request

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "files=@screenshot1.png" \
  -F "files=@screenshot2.png" \
  /api/v1/upload/feedback-attachments
```

#### Response

**200 OK**

```json
{
  "message": "Files uploaded successfully",
  "files": [
    {
      "filename": "screenshot1_abc123.png",
      "url": "https://api.dojopool.com/uploads/screenshot1_abc123.png",
      "size": 1024000,
      "mimetype": "image/png"
    },
    {
      "filename": "screenshot2_def456.png",
      "url": "https://api.dojopool.com/uploads/screenshot2_def456.png",
      "size": 2048000,
      "mimetype": "image/png"
    }
  ],
  "uploadedBy": "user-uuid"
}
```

#### Error Responses

**400 Bad Request**

```json
{
  "message": "File type image/gif is not allowed"
}
```

**413 Payload Too Large**

```json
{
  "message": "File size exceeds maximum allowed size of 10MB"
}
```

---

## 🔧 Admin Endpoints

### Get All Feedback (Admin)

**GET** `/feedback/admin`

Retrieve all feedback submissions for admin review.

#### Query Parameters

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page
- `status` (optional) - Filter by status
- `category` (optional) - Filter by category
- `priority` (optional) - Filter by priority

#### Example Request

```
GET /feedback/admin?status=PENDING&category=BUG&page=1&limit=20
```

#### Response

**200 OK**

```json
{
  "feedback": [
    {
      "id": "feedback-uuid",
      "userId": "user-uuid",
      "message": "Bug report...",
      "category": "BUG",
      "status": "PENDING",
      "priority": "NORMAL",
      "adminNotes": null,
      "attachments": [],
      "createdAt": "2025-01-30T10:30:00Z",
      "updatedAt": "2025-01-30T10:30:00Z",
      "resolvedAt": null,
      "resolvedBy": null,
      "user": {
        "id": "user-uuid",
        "username": "player123",
        "email": "player@example.com"
      },
      "resolver": null
    }
  ],
  "totalCount": 150,
  "pendingCount": 25,
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

### Update Feedback (Admin)

**PUT** `/feedback/admin/{id}`

Update feedback status, priority, or add admin notes.

#### Path Parameters

- `id` (required) - Feedback UUID

#### Request Body

```json
{
  "status": "string (optional, enum)",
  "priority": "string (optional, enum)",
  "adminNotes": "string (optional, max 1000 characters)"
}
```

#### Status Enum Values

- `PENDING` - Awaiting review
- `IN_REVIEW` - Currently being reviewed
- `IN_PROGRESS` - Work in progress
- `RESOLVED` - Issue resolved
- `CLOSED` - Closed without resolution
- `REJECTED` - Rejected as invalid

#### Priority Enum Values

- `LOW` - Low priority
- `NORMAL` - Normal priority
- `HIGH` - High priority
- `CRITICAL` - Critical priority

#### Example Request

```json
{
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "adminNotes": "Reproducing the issue. Will investigate mobile-specific crash."
}
```

#### Response

**200 OK**

```json
{
  "id": "feedback-uuid",
  "userId": "user-uuid",
  "message": "Bug report...",
  "category": "BUG",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "adminNotes": "Reproducing the issue. Will investigate mobile-specific crash.",
  "attachments": [],
  "createdAt": "2025-01-30T10:30:00Z",
  "updatedAt": "2025-01-30T11:15:00Z",
  "resolvedAt": null,
  "resolvedBy": null,
  "user": {
    "id": "user-uuid",
    "username": "player123",
    "email": "player@example.com"
  },
  "resolver": {
    "id": "admin-uuid",
    "username": "admin"
  }
}
```

---

### Get Feedback Statistics (Admin)

**GET** `/feedback/admin/stats`

Get feedback statistics and metrics.

#### Response

**200 OK**

```json
{
  "total": 150,
  "pending": 25,
  "inReview": 15,
  "resolved": 80,
  "closed": 20,
  "rejected": 10,
  "averageResolutionTime": 2.5,
  "categoryBreakdown": {
    "BUG": 45,
    "FEATURE_REQUEST": 30,
    "GENERAL_FEEDBACK": 25,
    "VENUE_ISSUE": 15,
    "TECHNICAL_SUPPORT": 20,
    "UI_UX_IMPROVEMENT": 10,
    "PERFORMANCE_ISSUE": 5,
    "PLAYER_REPORT": 0
  },
  "priorityBreakdown": {
    "LOW": 20,
    "NORMAL": 80,
    "HIGH": 40,
    "CRITICAL": 10
  }
}
```

---

## 🔒 Security Considerations

### Rate Limiting

- Feedback submission: 10 requests per minute
- File upload: 5 requests per minute
- General API: 100 requests per minute

### File Upload Security

- Files are scanned for malware
- File types are strictly validated
- File size limits are enforced (10MB per file)
- Files are stored in a secure, isolated directory
- Direct file access is restricted

### Data Privacy

- User feedback is encrypted at rest
- Admin notes are logged for audit purposes
- Personal information is not exposed in public endpoints
- File attachments are only accessible to authorized users

---

## 📊 Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 400  | Bad Request - Invalid input data        |
| 401  | Unauthorized - Authentication required  |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource not found          |
| 413  | Payload Too Large - File size exceeded  |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error - Server error    |

---

## 🧪 Testing

### Test Data

For testing purposes, you can use these sample feedback submissions:

```json
{
  "message": "Test bug report for mobile crash issue",
  "category": "BUG",
  "additionalContext": "This is a test submission for development purposes"
}
```

```json
{
  "message": "Would love to see a tournament bracket view feature",
  "category": "FEATURE_REQUEST",
  "additionalContext": "Similar to how other gaming platforms show tournament progress"
}
```

```json
{
  "message": "Player 'toxicuser123' has been harassing other players in chat",
  "category": "PLAYER_REPORT",
  "additionalContext": "Multiple reports from different users about the same player"
}
```

---

## 📝 Changelog

### Version 1.0.0 (2025-01-30)

- Initial release of Feedback & Reporting System
- Support for 8 feedback categories including Player Reports
- File upload functionality with drag & drop
- Admin dashboard for feedback management
- Comprehensive validation and security measures
- Full test coverage with unit and E2E tests
