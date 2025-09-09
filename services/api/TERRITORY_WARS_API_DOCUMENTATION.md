# Territory Wars System API Documentation

## Overview

The Territory Wars System transforms real-world pool halls into strategic territories that players and clans can conquer, manage, and defend. This system introduces competitive gameplay where players can claim unclaimed territories, challenge existing owners, and engage in persistent clan conflicts.

## Base URL

```
/api/v1/territories
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Some endpoints require specific roles (ADMIN, MODERATOR) for maintenance operations.

## Territory Status Types

- **UNCLAIMED**: Available for claiming by any player
- **CLAIMED**: Owned by a player or clan
- **CONTESTED**: Currently being challenged by another player
- **DEFENDED**: Recently defended (temporary status)

## Territory Data Structure

```json
{
  "id": "string",
  "name": "string",
  "venueId": "string",
  "venue": {
    "id": "string",
    "name": "string",
    "lat": "number",
    "lng": "number"
  },
  "owner": {
    "id": "string",
    "username": "string"
  } | null,
  "clan": {
    "id": "string",
    "name": "string",
    "tag": "string"
  } | null,
  "contestedBy": {
    "id": "string",
    "username": "string"
  } | null,
  "level": "number",
  "defenseScore": "number",
  "strategicValue": "number",
  "resources": {
    "gold": "number",
    "wood": "number",
    "iron": "number"
  },
  "status": "UNCLAIMED | CLAIMED | CONTESTED | DEFENDED",
  "contestDeadline": "2024-01-01T00:00:00.000Z | null",
  "lastOwnershipChange": "2024-01-01T00:00:00.000Z | null",
  "lastActivity": "2024-01-01T00:00:00.000Z",
  "coordinates": {
    "lat": "number",
    "lng": "number"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Public Endpoints

### Get All Territories

**GET** `/api/v1/territories`

Retrieve all territories with basic information.

**Response (200):**

```json
[
  {
    "id": "string",
    "name": "string",
    "strategicValue": "number",
    "resources": "object",
    "venue": {
      "id": "string",
      "name": "string",
      "controllingClanId": "string"
    }
  }
]
```

### Get Territories by Clan

**GET** `/api/v1/territories/clan/:clanId`

Retrieve all territories owned by a specific clan.

**Parameters:**

- `clanId` (path): Clan ID

**Response (200):** Array of territory objects

### Get Territories by Venue

**GET** `/api/v1/territories/venue/:venueId`

Retrieve all territories associated with a specific venue.

**Parameters:**

- `venueId` (path): Venue ID

**Response (200):** Array of territory objects

### Get Strategic Map Data

**GET** `/api/v1/territories/map?bbox=minLng,minLat,maxLng,maxLat`

Retrieve territory data for map visualization with optional viewport filtering.

**Query Parameters:**

- `bbox` (optional): Bounding box as "minLng,minLat,maxLng,maxLat"

**Response (200):**

```json
[
  {
    "id": "string",
    "name": "string",
    "venueId": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    },
    "owner": {
      "id": "string",
      "username": "string"
    } | null,
    "clan": {
      "id": "string",
      "name": "string"
    } | null,
    "contestedBy": {
      "id": "string",
      "username": "string"
    } | null,
    "level": "number",
    "defenseScore": "number",
    "strategicValue": "number",
    "resources": "object",
    "status": "string",
    "contestDeadline": "2024-01-01T00:00:00.000Z | null",
    "lastOwnershipChange": "2024-01-01T00:00:00.000Z | null",
    "lastActivity": "2024-01-01T00:00:00.000Z"
  }
]
```

## Protected Endpoints

### Claim Territory

**POST** `/api/v1/territories/claim`

Claim an unclaimed territory for the authenticated user.

**Request Body:**

```json
{
  "territoryId": "string (required)",
  "playerId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "territory": "TerritoryData",
  "message": "Territory claimed successfully"
}
```

**Error Responses:**

- `400`: Territory is already claimed
- `404`: Territory not found
- `403`: Insufficient permissions

### Challenge Territory

**POST** `/api/v1/territories/challenge`

Challenge an existing territory owner.

**Request Body:**

```json
{
  "territoryId": "string (required)",
  "challengerId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "challengeId": "string",
  "territory": "TerritoryData",
  "message": "Challenge issued successfully",
  "defenderId": "string",
  "challengerId": "string"
}
```

**Error Responses:**

- `400`: Cannot challenge own territory or territory is unclaimed
- `404`: Territory not found
- `403`: Insufficient permissions

### Scout Territory

**POST** `/api/v1/territories/:territoryId/scout`

Gather intelligence about a territory's defenses and ownership.

**Parameters:**

- `territoryId` (path): Territory ID

**Request Body:**

```json
{
  "playerId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "territory": "TerritoryData",
  "intelligence": {
    "owner": {
      "id": "string",
      "username": "string"
    } | null,
    "clan": {
      "id": "string",
      "name": "string"
    } | null,
    "defenseScore": "number",
    "recentActivity": "string[]",
    "vulnerabilities": "string[]"
  },
  "message": "Intelligence gathered successfully"
}
```

### Manage Territory

**POST** `/api/v1/territories/:territoryId/manage`

Manage territory resources and upgrades (owner only).

**Parameters:**

- `territoryId` (path): Territory ID

**Request Body:**

```json
{
  "action": "upgrade_defense | allocate_resources | transfer_ownership",
  "payload": "object (optional)"
}
```

**Actions:**

- `upgrade_defense`: Increase territory defense score
- `allocate_resources`: Add resources to territory
- `transfer_ownership`: Transfer ownership to another player

**Response (200):**

```json
{
  "success": true,
  "territoryId": "string",
  "action": "string",
  "result": "object"
}
```

## Administrative Endpoints

Requires ADMIN or MODERATOR role.

### Process Territory Decay

**POST** `/api/v1/territories/process-decay`

Process automatic territory decay for inactive territories.

**Response (200):**

```json
{
  "success": true,
  "processed": "number",
  "results": [
    {
      "territoryId": "string",
      "action": "DECAYED | DECAYED_DEFENSE",
      "previousOwner": "string | null",
      "newDefenseScore": "number | null",
      "daysSinceChange": "number"
    }
  ]
}
```

### Resolve Expired Contests

**POST** `/api/v1/territories/resolve-expired-contests`

Resolve contests that have exceeded their deadline.

**Response (200):**

```json
{
  "success": true,
  "processed": "number",
  "results": [
    {
      "territoryId": "string",
      "action": "CONTEST_EXPIRED",
      "winner": "string",
      "loser": "string"
    }
  ]
}
```

## Territory Events

The system generates events for all territory-related activities:

### Event Types

- **CLAIM**: Territory claimed by player
- **CHALLENGE**: Territory challenged by another player
- **DEFEND**: Territory successfully defended
- **LOSE**: Territory lost to challenger
- **UPGRADE**: Territory upgraded or resources allocated
- **CONTEST_START**: Contest period begins
- **CONTEST_END**: Contest period ends
- **DECAY_WARNING**: Territory decay warning issued
- **DECAY_COMPLETE**: Territory completely decayed

### Event Structure

```json
{
  "id": "string",
  "territoryId": "string",
  "type": "TerritoryEventType",
  "metadata": "string (JSON)",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Game Mechanics

### Territory Decay

Territories decay over time if not actively managed:

- **30-44 days**: Defense score reduced by 1 point
- **45-59 days**: Defense score reduced by 2 points
- **60+ days**: Territory becomes unclaimed

### Contest System

When challenging a territory:

- Contest period lasts 24 hours
- During contest, territory status is "CONTESTED"
- If contest expires, original owner retains control
- Winner takes all resources and ownership

### Defense System

- Territories have a defense score (0-20)
- Higher defense makes territory harder to challenge
- Defense can be upgraded through management actions
- Defense decays over time without activity

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": "Territory is already claimed" | "Cannot challenge own territory" | "Invalid action",
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
  "message": "Admin privileges required" | "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Territory not found"
}
```

## Rate Limiting

- Territory actions: 20 requests per hour per user
- Scout actions: 10 requests per hour per user
- Administrative endpoints: 50 requests per hour

## Notifications

The system generates notifications for:

- Territory ownership changes
- Incoming challenges
- Contest deadlines approaching
- Territory decay warnings
- Successful defenses and captures

## Data Retention

- Territory events: Retained for 1 year
- Contest data: Retained for 30 days after resolution
- Territory ownership history: Retained indefinitely

## Integration Points

### Venue System

Territories are linked to venues and update venue ownership when claimed.

### Clan System

Territories can be owned by clans and contribute to clan reputation and resources.

### Tournament System

Territory contests can trigger tournaments or matches between players.

### Notification System

All territory events generate notifications for relevant players and clans.
