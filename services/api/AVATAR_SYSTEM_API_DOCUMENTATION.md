# Avatar System API Documentation

## Overview

The Avatar System API provides comprehensive endpoints for managing player avatar customization, asset management, and personalization features. This system allows players to express their unique style through customizable avatar components while maintaining secure ownership validation and purchase mechanics.

## Base URL

```
/api/v1/avatar
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Protected endpoints require user authentication. Admin endpoints require ADMIN role.

## Avatar Data Structures

### Avatar Configuration

```json
{
  "hair": "string | null",
  "face": "string | null",
  "clothesTop": "string | null",
  "clothesBottom": "string | null",
  "shoes": "string | null",
  "accessoryHead": "string | null",
  "accessoryNeck": "string | null",
  "accessoryBack": "string | null",
  "weapon": "string | null",
  "pet": "string | null",
  "effect": "string | null",
  "skinTone": "string",
  "bodyType": "string",
  "height": "number"
}
```

### Avatar Asset Types

- **HAIR**: Hair styles and colors
- **FACE**: Facial expressions and features
- **CLOTHES_TOP**: Shirts, jackets, tops
- **CLOTHES_BOTTOM**: Pants, skirts, shorts
- **SHOES**: Footwear items
- **ACCESSORY_HEAD**: Hats, headbands, helmets
- **ACCESSORY_NECK**: Necklaces, scarves
- **ACCESSORY_BACK**: Backpacks, capes, wings
- **WEAPON**: Combat items and tools
- **PET**: Companion creatures
- **EFFECT**: Special visual effects

### Avatar Asset Rarity

- **COMMON**: Basic items (gray)
- **UNCOMMON**: Standard items (blue)
- **RARE**: Premium items (orange)
- **EPIC**: High-value items (red)
- **LEGENDARY**: Ultra-rare items (green)

## Public Endpoints

### Get All Avatar Assets

**GET** `/api/v1/avatar/assets`

Retrieve all available avatar customization assets.

**Query Parameters:**

- `type` (optional): Filter by asset type (e.g., "HAIR", "CLOTHES_TOP")

**Response (200):**

```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "type": "AvatarAssetType",
    "rarity": "AvatarAssetRarity",
    "assetUrl2D": "string | null",
    "assetUrl3D": "string | null",
    "thumbnailUrl": "string | null",
    "price": "number",
    "isPremium": "boolean",
    "isActive": "boolean",
    "statBonuses": "object",
    "tags": "string[]",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Player Avatar

**GET** `/api/v1/avatar/player/:playerId`

Retrieve a specific player's avatar configuration.

**Parameters:**

- `playerId` (path): Player's user ID

**Response (200):**

```json
{
  "id": "string",
  "userId": "string",
  "user": {
    "id": "string",
    "username": "string",
    "profile": {
      "avatarUrl": "string | null",
      "displayName": "string | null"
    }
  },
  "configuration": "AvatarConfiguration",
  "skinTone": "string",
  "bodyType": "string",
  "height": "number",
  "unlockedFeatures": "string[]",
  "createdAt": "string",
  "updatedAt": "string"
}
```

## Protected Endpoints

### Get My Avatar

**GET** `/api/v1/avatar/me`

Retrieve the authenticated user's avatar configuration.

**Response (200):** Same as Get Player Avatar

### Customize Avatar

**POST** `/api/v1/avatar/customize`

Update the authenticated user's avatar configuration.

**Request Body:**

```json
{
  "hair": "asset-id | null",
  "face": "asset-id | null",
  "clothesTop": "asset-id | null",
  "clothesBottom": "asset-id | null",
  "shoes": "asset-id | null",
  "accessoryHead": "asset-id | null",
  "accessoryNeck": "asset-id | null",
  "accessoryBack": "asset-id | null",
  "weapon": "asset-id | null",
  "pet": "asset-id | null",
  "effect": "asset-id | null",
  "skinTone": "#HEX_COLOR",
  "bodyType": "athletic | slim | muscular | heavy",
  "height": "number (0.5-2.5)"
}
```

**Response (200):**

```json
{
  "success": true,
  "avatar": "AvatarData",
  "message": "Avatar customized successfully"
}
```

**Error Responses:**

- `400`: Invalid customization data or unowned assets
- `403`: Asset ownership validation failed

### Get My Assets

**GET** `/api/v1/avatar/my-assets`

Retrieve the authenticated user's owned avatar assets.

**Response (200):**

```json
[
  {
    "id": "string",
    "userId": "string",
    "assetId": "string",
    "asset": "AvatarAsset",
    "acquiredAt": "string",
    "acquiredVia": "string",
    "isEquipped": "boolean"
  }
]
```

### Purchase Asset

**POST** `/api/v1/avatar/purchase`

Purchase an avatar asset using DojoCoins.

**Request Body:**

```json
{
  "assetId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "ownership": "UserAvatarAsset",
  "message": "Asset purchased successfully"
}
```

**Error Responses:**

- `400`: Insufficient funds or asset unavailable
- `404`: Asset not found
- `409`: Asset already owned

### Reset Avatar

**POST** `/api/v1/avatar/reset`

Reset the authenticated user's avatar to default configuration.

**Response (200):**

```json
{
  "success": true,
  "avatar": "AvatarData",
  "message": "Avatar reset to default successfully"
}
```

### Unlock Feature

**POST** `/api/v1/avatar/unlock-feature`

Unlock a new avatar customization feature.

**Request Body:**

```json
{
  "feature": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "avatar": "AvatarData",
  "message": "Feature unlocked successfully"
}
```

## Administrative Endpoints

Requires ADMIN role.

### Award Asset

**POST** `/api/v1/avatar/award`

Award an avatar asset to a user (admin only).

**Request Body:**

```json
{
  "userId": "string (required)",
  "assetId": "string (required)",
  "reason": "string (optional)"
}
```

**Response (200):** Same as Purchase Asset

## Validation Rules

### Asset Ownership Validation

- Users can only equip assets they own
- System validates ownership before customization
- Attempting to equip unowned assets returns 403 Forbidden

### Customization Data Validation

- **skinTone**: Must be valid hex color
- **bodyType**: Must be one of: "slim", "athletic", "muscular", "heavy"
- **height**: Must be between 0.5 and 2.5
- **assetIds**: Must reference valid, active assets

### Purchase Validation

- Asset must exist and be active
- Asset must not already be owned by user
- User must have sufficient DojoCoins
- Premium assets may have additional restrictions

## Business Logic

### Asset Acquisition Methods

- **Purchase**: Using DojoCoins
- **Reward**: From achievements, events, or admin grants
- **Unlock**: Through gameplay progression
- **Gift**: From other players or system events

### Stat Bonuses

Assets can provide gameplay bonuses:

```json
{
  "luck": 5,
  "skill": 10,
  "focus": 3,
  "stamina": 8,
  "speed": 4
}
```

### Feature Unlocking

New customization features unlock progressively:

- `basic_customization`: Basic appearance options
- `advanced_hair`: Premium hair styles
- `special_effects`: Visual effects
- `pet_system`: Companion pets
- `rare_items`: High-rarity assets

## Rate Limiting

- Asset browsing: 100 requests per minute
- Customization: 20 requests per minute per user
- Purchase: 10 requests per minute per user
- Administrative actions: 50 requests per hour

## Error Responses

### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "Invalid skinTone format",
    "bodyType must be one of: slim, athletic, muscular, heavy",
    "Height must be between 0.5 and 2.5",
    "Asset hair-123 not found or inactive"
  ],
  "error": "Bad Request"
}
```

### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "You do not own the following assets: hair-123, shirt-456",
  "error": "Forbidden"
}
```

### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Avatar asset not found",
  "error": "Not Found"
}
```

### 409 Conflict

```json
{
  "statusCode": 409,
  "message": "Asset already owned",
  "error": "Conflict"
}
```

## Integration Points

### User Profile System

- Avatar URL integration with existing profile
- Display name and username consistency
- Profile completion tracking

### Economy System

- DojoCoin integration for purchases
- Transaction history tracking
- Balance validation

### Achievement System

- Asset rewards for accomplishments
- Feature unlocks based on progress
- Collection completion bonuses

### Social System

- Avatar visibility in social features
- Friend avatar comparisons
- Clan avatar themes

## Data Retention

- Avatar configurations: Retained indefinitely
- Asset ownership records: Retained indefinitely
- Transaction history: Retained for 2 years
- Unlocked features: Retained indefinitely

## Future Extensions

### Planned Features

- **3D Avatar Support**: WebGL-based 3D avatar rendering
- **Animation System**: Dynamic avatar animations
- **Social Avatars**: Clan-themed avatar collections
- **Seasonal Content**: Limited-time avatar items
- **Trading System**: Player-to-player asset trading

This comprehensive avatar system provides the foundation for rich player expression and personalization within the DojoPool ecosystem.
