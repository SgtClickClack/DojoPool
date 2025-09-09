# Content Sharing API

## Create Content

- POST `/api/v1/content`
- Auth: Bearer
- Body: multipart/form-data with fields from `CreateContentDto` and optional `file`
- Returns: `Content`

## Get Feed

- GET `/api/v1/content/feed`
- Query: filters (contentType, userId, dateFrom, dateTo, search), page, limit
- Returns: `ContentListResponse`

## Get User Content

- GET `/api/v1/content/user/:userId`
- Auth: Bearer
- Returns: `ContentListResponse`

## Get Content by Id

- GET `/api/v1/content/:id`
- Auth: Bearer
- Returns: `Content`

## Update Content

- PUT `/api/v1/content/:id`
- Auth: Bearer
- Body: `UpdateContentDto`
- Returns: `Content`

## Delete Content

- DELETE `/api/v1/content/:id`
- Auth: Bearer
- Returns: 204

## Like Content

- POST `/api/v1/content/:id/like`
- Auth: Bearer
- Returns: `{ liked: boolean }`

## Share Content

- POST `/api/v1/content/:id/share`
- Auth: Bearer
- Body: `{ sharedWithIds: string[] }`
- Side-effects: Notifies recipients via notifications service
- Returns: `{ success: true }`

## Admin: All Content

- GET `/api/v1/content/admin/all`
- Auth: Bearer (ADMIN)
- Query: filters, page, limit
- Returns: Moderation list with pagination and pending count

## Admin: Stats

- GET `/api/v1/content/admin/stats`
- Auth: Bearer (ADMIN)
- Returns: totals for content, likes, shares, views

## Admin: Moderate

- PUT `/api/v1/content/admin/:id/moderate`
- Auth: Bearer (ADMIN)
- Body: `ModerateContentDto`
- Side-effects: Notifies content owner of decision
- Returns: `Content`
