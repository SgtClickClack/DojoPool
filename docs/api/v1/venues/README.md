# Venues API

## Endpoints

### List Venues

```http
GET /venues
Authorization: Bearer <access_token>
```

Query Parameters:

- `page` (optional): Page number for pagination (default: 1)
- `per_page` (optional): Items per page (default: 20)
- `city` (optional): Filter by city
- `state` (optional): Filter by state
- `active` (optional): Filter by active status (true/false)

**Response** (200 OK)

```json
{
  "venues": [
    {
      "id": 1,
      "name": "Downtown Billiards",
      "address": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip_code": "94105",
      "phone": "415-555-0123",
      "active": true,
      "created_at": "2024-01-17T12:00:00Z",
      "tables_count": 8,
      "current_games": 3
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

### Get Venue Details

```http
GET /venues/{venue_id}
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "id": 1,
  "name": "Downtown Billiards",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94105",
  "phone": "415-555-0123",
  "active": true,
  "created_at": "2024-01-17T12:00:00Z",
  "tables_count": 8,
  "current_games": 3,
  "features": ["tournaments", "leagues", "training"],
  "operating_hours": {
    "monday": { "open": "10:00", "close": "22:00" },
    "tuesday": { "open": "10:00", "close": "22:00" },
    "wednesday": { "open": "10:00", "close": "22:00" },
    "thursday": { "open": "10:00", "close": "23:00" },
    "friday": { "open": "10:00", "close": "00:00" },
    "saturday": { "open": "11:00", "close": "00:00" },
    "sunday": { "open": "11:00", "close": "21:00" }
  }
}
```

### Create Venue

```http
POST /venues
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Downtown Billiards",
    "address": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip_code": "94105",
    "phone": "415-555-0123",
    "tables_count": 8,
    "features": ["tournaments", "leagues", "training"],
    "operating_hours": {
        "monday": {"open": "10:00", "close": "22:00"},
        "tuesday": {"open": "10:00", "close": "22:00"},
        "wednesday": {"open": "10:00", "close": "22:00"},
        "thursday": {"open": "10:00", "close": "23:00"},
        "friday": {"open": "10:00", "close": "00:00"},
        "saturday": {"open": "11:00", "close": "00:00"},
        "sunday": {"open": "11:00", "close": "21:00"}
    }
}
```

**Response** (201 Created)

```json
{
  "id": 1,
  "name": "Downtown Billiards",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94105",
  "phone": "415-555-0123",
  "active": true,
  "created_at": "2024-01-17T12:00:00Z",
  "tables_count": 8
}
```

### Update Venue

```http
PUT /venues/{venue_id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "name": "Downtown Billiards & Pool",
    "phone": "415-555-0124",
    "tables_count": 10,
    "active": true
}
```

**Response** (200 OK)

```json
{
  "id": 1,
  "name": "Downtown Billiards & Pool",
  "address": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94105",
  "phone": "415-555-0124",
  "active": true,
  "tables_count": 10,
  "updated_at": "2024-01-17T13:00:00Z"
}
```

### Delete Venue

```http
DELETE /venues/{venue_id}
Authorization: Bearer <access_token>
```

**Response** (204 No Content)

### Get Venue Statistics

```http
GET /venues/{venue_id}/stats
Authorization: Bearer <access_token>
```

**Response** (200 OK)

```json
{
  "total_games": 1250,
  "active_games": 3,
  "total_tournaments": 25,
  "active_tournaments": 1,
  "total_players": 500,
  "current_players": 12,
  "popular_hours": [
    { "hour": 18, "count": 150 },
    { "hour": 19, "count": 200 },
    { "hour": 20, "count": 180 }
  ],
  "table_utilization": {
    "daily": 75.5,
    "weekly": 68.2,
    "monthly": 70.1
  }
}
```

## Error Responses

### Venue Not Found (404 Not Found)

```json
{
  "error": "Venue not found",
  "code": "VENUE_NOT_FOUND"
}
```

### Invalid Input (400 Bad Request)

```json
{
  "error": "Invalid input data",
  "code": "VENUE_INVALID_INPUT",
  "details": {
    "name": "Name is required",
    "phone": "Invalid phone number format"
  }
}
```

### Unauthorized Access (403 Forbidden)

```json
{
  "error": "Insufficient permissions to manage venue",
  "code": "VENUE_UNAUTHORIZED"
}
```
