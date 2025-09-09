# Avatar System Data Structures & Business Logic

## Overview

This document provides comprehensive technical details about the Avatar System's data structures, business logic, validation rules, and integration patterns. The system is designed to provide rich player customization while maintaining security, performance, and scalability.

## Core Data Models

### Avatar Model

```typescript
interface Avatar {
  id: string; // UUID primary key
  userId: string; // Unique foreign key to User
  configuration: Json; // AvatarConfiguration object
  skinTone: string; // Hex color, default "#F5DEB3"
  bodyType: string; // "slim" | "athletic" | "muscular" | "heavy"
  height: number; // 0.5 to 2.5, default 1.0
  unlockedFeatures: string[]; // Array of unlocked feature names
  createdAt: DateTime;
  updatedAt: DateTime;

  // Relations
  user: User;
}
```

**Database Schema:**

```sql
CREATE TABLE "Avatar" (
  "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "configuration" JSONB NOT NULL DEFAULT '{}',
  "skinTone" TEXT NOT NULL DEFAULT '#F5DEB3',
  "bodyType" TEXT NOT NULL DEFAULT 'athletic',
  "height" DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  "unlockedFeatures" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AvatarAsset Model

```typescript
interface AvatarAsset {
  id: string; // UUID primary key
  name: string; // Display name
  description?: string; // Optional description
  type: AvatarAssetType; // Asset category
  rarity: AvatarAssetRarity; // Rarity tier
  assetUrl2D?: string; // 2D asset URL
  assetUrl3D?: string; // 3D asset URL (future)
  thumbnailUrl?: string; // Thumbnail URL
  price: number; // DojoCoin cost, default 0
  isPremium: boolean; // Premium content flag
  isActive: boolean; // Active status, default true
  statBonuses: Json; // Gameplay bonuses object
  tags: string[]; // Search/filter tags
  createdAt: DateTime;
  updatedAt: DateTime;

  // Relations
  ownedBy: UserAvatarAsset[];
}
```

### UserAvatarAsset Model (Join Table)

```typescript
interface UserAvatarAsset {
  id: string;              // UUID primary key
  userId: string;          // Foreign key to User
  assetId: string;         // Foreign key to AvatarAsset
  acquiredAt: DateTime;    // Acquisition timestamp
  acquiredVia: string;     // "purchase" | "reward" | "unlock"
  isEquipped: boolean;     // Equipment status, default false

  // Relations
  user: User;
  asset: AvatarAsset;

  // Composite unique constraint
  @@unique([userId, assetId])
}
```

## Enums & Constants

### AvatarAssetType Enum

```typescript
enum AvatarAssetType {
  HAIR = 'HAIR',
  FACE = 'FACE',
  CLOTHES_TOP = 'CLOTHES_TOP',
  CLOTHES_BOTTOM = 'CLOTHES_BOTTOM',
  SHOES = 'SHOES',
  ACCESSORY_HEAD = 'ACCESSORY_HEAD',
  ACCESSORY_NECK = 'ACCESSORY_NECK',
  ACCESSORY_BACK = 'ACCESSORY_BACK',
  WEAPON = 'WEAPON',
  PET = 'PET',
  EFFECT = 'EFFECT',
}
```

### AvatarAssetRarity Enum

```typescript
enum AvatarAssetRarity {
  COMMON = 'COMMON', // Gray, basic items
  UNCOMMON = 'UNCOMMON', // Blue, standard items
  RARE = 'RARE', // Orange, premium items
  EPIC = 'EPIC', // Red, high-value items
  LEGENDARY = 'LEGENDARY', // Green, ultra-rare items
}
```

### Validation Constants

```typescript
const AVATAR_VALIDATION = {
  SKIN_TONES: [
    '#F5DEB3',
    '#D2B48C',
    '#BC986A',
    '#A0522D',
    '#8B4513',
    '#654321',
    '#3D2817',
    '#000000',
    '#FFF8DC',
    '#FFE4B5',
  ],
  BODY_TYPES: ['slim', 'athletic', 'muscular', 'heavy'],
  HEIGHT_RANGE: { min: 0.5, max: 2.5 },
  MAX_EQUIPPED_ASSETS: 11, // One per slot
  FEATURE_NAMES: [
    'basic_customization',
    'advanced_hair',
    'special_effects',
    'pet_system',
    'rare_items',
  ],
};
```

## Business Logic Components

### AvatarService Methods

#### getUserAvatar(userId: string)

**Purpose:** Retrieve or create user's avatar configuration

**Logic Flow:**

1. Query Avatar table by userId
2. If not found, create default avatar with base configuration
3. Include user profile data for display
4. Return complete avatar object

**Edge Cases:**

- User has no avatar: Create default
- Invalid userId: Throw NotFoundException
- Database error: Log and rethrow

#### customizeAvatar(userId: string, customization: AvatarCustomizationData)

**Purpose:** Update user's avatar configuration with validation

**Logic Flow:**

1. Validate customization data format and ranges
2. Check asset ownership for all referenced assets
3. Retrieve current avatar or create default
4. Update avatar configuration
5. Update UserAvatarAsset equipped status
6. Return updated avatar

**Validation Steps:**

- Skin tone must be valid hex color
- Body type must be in allowed list
- Height must be within range
- All asset IDs must exist and be owned by user
- Maximum one asset per slot

#### purchaseAsset(userId: string, assetId: string)

**Purpose:** Handle asset purchase with coin deduction

**Transaction Flow:**

1. Validate asset exists and is active
2. Check user doesn't already own asset
3. Verify user's DojoCoin balance
4. Deduct coins and create ownership record
5. Return ownership confirmation

**Error Conditions:**

- Insufficient funds: BadRequestException
- Asset not found: NotFoundException
- Already owned: BadRequestException

#### awardAsset(userId: string, assetId: string, reason: string)

**Purpose:** Grant asset to user without payment

**Use Cases:**

- Achievement rewards
- Event participation
- Administrative grants
- System promotions

### Validation Logic

#### Asset Ownership Validation

```typescript
private async validateAssetOwnership(userId: string, customization: AvatarCustomizationData): Promise<void> {
  const assetIds = Object.values(customization)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  if (assetIds.length === 0) return;

  const ownedAssets = await this.prisma.userAvatarAsset.findMany({
    where: { userId, assetId: { in: assetIds } },
    select: { assetId: true }
  });

  const ownedAssetIds = ownedAssets.map(asset => asset.assetId);
  const missingAssets = assetIds.filter(id => !ownedAssetIds.includes(id));

  if (missingAssets.length > 0) {
    throw new ForbiddenException(
      `User does not own the following assets: ${missingAssets.join(', ')}`
    );
  }
}
```

#### Equipment Status Management

```typescript
private async updateEquippedAssets(userId: string, customization: AvatarCustomizationData): Promise<void> {
  const equippedAssetIds = Object.values(customization)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);

  // Unequip all currently equipped assets
  await this.prisma.userAvatarAsset.updateMany({
    where: { userId, isEquipped: true },
    data: { isEquipped: false }
  });

  // Equip new assets
  if (equippedAssetIds.length > 0) {
    await this.prisma.userAvatarAsset.updateMany({
      where: {
        userId,
        assetId: { in: equippedAssetIds }
      },
      data: { isEquipped: true }
    });
  }
}
```

## API Request/Response Structures

### AvatarCustomizationData Interface

```typescript
interface AvatarCustomizationData {
  hair?: string; // AvatarAsset ID
  face?: string; // AvatarAsset ID
  clothesTop?: string; // AvatarAsset ID
  clothesBottom?: string; // AvatarAsset ID
  shoes?: string; // AvatarAsset ID
  accessoryHead?: string; // AvatarAsset ID
  accessoryNeck?: string; // AvatarAsset ID
  accessoryBack?: string; // AvatarAsset ID
  weapon?: string; // AvatarAsset ID
  pet?: string; // AvatarAsset ID
  effect?: string; // AvatarAsset ID
  skinTone?: string; // Hex color
  bodyType?: string; // Body type enum
  height?: number; // Height value
}
```

### AvatarAsset Interface

```typescript
interface AvatarAsset {
  id: string;
  name: string;
  description?: string;
  type: AvatarAssetType;
  rarity: AvatarAssetRarity;
  assetUrl2D?: string;
  assetUrl3D?: string;
  thumbnailUrl?: string;
  price: number;
  isPremium: boolean;
  isActive: boolean;
  statBonuses: Record<string, number>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Frontend Component Architecture

### AvatarCustomization Component

**State Management:**

- Avatar data from API
- User assets from API
- Current customization state
- Loading and error states

**Key Methods:**

- `loadAvatarData()`: Fetch user's avatar and assets
- `handleCustomizationChange()`: Update local customization state
- `handleSaveCustomization()`: Save to backend
- `handlePurchaseAsset()`: Purchase new assets

### AvatarPreview Component

**Props:**

- `customization`: Current AvatarCustomizationData
- `avatarData`: Full Avatar object
- `size`: Display size variant

**Features:**

- Dynamic avatar rendering
- Equipment indicator
- Stat bonus display
- Rarity color coding

### AvatarAssetGallery Component

**Props:**

- `assets`: Array of available AvatarAsset
- `ownedAssets`: User's owned assets
- `customization`: Current customization state
- `onCustomizationChange`: Callback for changes
- `onPurchaseAsset`: Callback for purchases

**Features:**

- Asset filtering by type
- Ownership status indicators
- Purchase dialogs
- Rarity-based styling

## Security Considerations

### Authentication & Authorization

- All avatar endpoints require JWT authentication
- User can only modify their own avatar
- Admin endpoints require ADMIN role
- Asset ownership validation prevents unauthorized equipping

### Input Validation

- Asset IDs validated against ownership
- Customization data validated against allowed ranges
- SQL injection prevention through parameterized queries
- XSS prevention through input sanitization

### Rate Limiting

- Asset browsing: 100 requests/minute
- Customization: 20 requests/minute/user
- Purchase: 10 requests/minute/user
- Administrative: 50 requests/hour

## Performance Optimizations

### Database Indexing

```sql
-- Avatar table indexes
CREATE INDEX idx_avatar_user_id ON "Avatar"("userId");

-- AvatarAsset table indexes
CREATE INDEX idx_avatar_asset_type ON "AvatarAsset"("type");
CREATE INDEX idx_avatar_asset_active ON "AvatarAsset"("isActive");
CREATE INDEX idx_avatar_asset_rarity ON "AvatarAsset"("rarity");

-- UserAvatarAsset table indexes
CREATE INDEX idx_user_avatar_asset_user ON "UserAvatarAsset"("userId");
CREATE INDEX idx_user_avatar_asset_equipped ON "UserAvatarAsset"("isEquipped");
```

### Caching Strategy

- Avatar configurations cached for 5 minutes
- Available assets cached for 1 hour
- User assets cached for 10 minutes
- Redis integration for distributed caching

### Query Optimization

- Use of `select` to limit returned fields
- Batch operations for equipment updates
- Efficient ownership validation queries
- Pagination for large asset lists

## Error Handling

### Custom Exceptions

```typescript
export class AvatarValidationError extends BadRequestException {
  constructor(message: string, field?: string) {
    super({
      message,
      field,
      error: 'Avatar Validation Error',
    });
  }
}

export class InsufficientFundsError extends BadRequestException {
  constructor(required: number, available: number) {
    super({
      message: `Insufficient DojoCoins. Required: ${required}, Available: ${available}`,
      required,
      available,
      error: 'Insufficient Funds',
    });
  }
}
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid customization data",
  "field": "skinTone",
  "error": "Avatar Validation Error",
  "details": {
    "allowedValues": ["#F5DEB3", "#D2B48C", ...],
    "providedValue": "#INVALID"
  }
}
```

## Integration Patterns

### User Profile Integration

- Avatar URL sync with Profile model
- Display name consistency
- Profile completion percentage based on avatar customization

### Economy Integration

- DojoCoin balance checking
- Transaction logging
- Purchase history tracking

### Achievement Integration

- Asset rewards for achievements
- Feature unlocks based on progress
- Collection completion tracking

### Social Integration

- Avatar visibility in leaderboards
- Friend avatar comparisons
- Clan avatar themes

## Monitoring & Analytics

### Key Metrics

- Avatar customization completion rate
- Popular asset usage statistics
- Purchase conversion rates
- Feature unlock progression

### Logging

```typescript
// Avatar customization events
logger.log(`Avatar customized: User ${userId}, Assets: ${equippedCount}`);

// Purchase events
logger.log(`Asset purchased: User ${userId}, Asset ${assetId}, Cost ${price}`);

// Feature unlock events
logger.log(`Feature unlocked: User ${userId}, Feature ${featureName}`);
```

## Future Extensibility

### 3D Avatar Support

```typescript
interface AvatarAsset3D {
  modelUrl: string; // GLTF/GLB file URL
  textureUrl?: string; // Texture atlas URL
  animationClips: string[]; // Animation names
  boneStructure: Json; // Rigging data
}
```

### Animation System

```typescript
interface AvatarAnimation {
  id: string;
  name: string;
  assetId: string; // Linked AvatarAsset
  animationUrl: string; // Animation file
  triggerEvents: string[]; // When to play
  duration: number; // Length in seconds
}
```

### Social Features

```typescript
interface AvatarTheme {
  id: string;
  name: string;
  clanId?: string; // Clan-specific themes
  requiredAssets: string[]; // Theme completion requirements
  bonusEffects: Json; // Theme bonuses
}
```

This comprehensive system provides a solid foundation for player avatar customization while maintaining performance, security, and extensibility for future enhancements.
