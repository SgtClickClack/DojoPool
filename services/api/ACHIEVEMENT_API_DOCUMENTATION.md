# Achievements & Rewards System API Documentation

## Overview

The Achievements & Rewards System provides a comprehensive framework for tracking player progress, unlocking achievements, and distributing rewards. This system incentivizes real-world actions and enhances player engagement through gamification.

## Architecture

### Components

- **AchievementService**: Core business logic for achievement tracking and progress management
- **RewardService**: Handles reward distribution and claiming functionality
- **AchievementEventsService**: Event-driven achievement unlocking system
- **AchievementSeederService**: Database seeding for initial achievements and rewards
- **AchievementsController**: REST API endpoints for frontend integration

### Key Features

- **Progress Tracking**: Real-time progress updates for multi-step achievements
- **Automatic Unlocking**: Event-driven achievement unlocks based on player actions
- **Reward Distribution**: Secure reward claiming with atomic transactions
- **Achievement Categories**: Organized achievements by type (venue visits, matches, trading, etc.)
- **Hidden Achievements**: Surprise achievements that unlock under special conditions

## API Endpoints

### Achievement Management

#### GET `/api/v1/achievements`

Retrieve all achievements with user's current progress status.

**Response:**

```json
[
  {
    "achievementId": "string",
    "userId": "string",
    "currentProgress": 5,
    "maxProgress": 10,
    "status": "LOCKED" | "UNLOCKED" | "CLAIMED",
    "unlockedAt": "2024-01-15T10:30:00Z",
    "claimedAt": "2024-01-15T11:00:00Z"
  }
]
```

**Response Codes:**

- `200`: Success
- `500`: Internal server error

#### GET `/api/v1/achievements/:id`

Get detailed information about a specific achievement with user's progress.

**Parameters:**

- `id`: Achievement ID

**Response:**

```json
{
  "achievementId": "string",
  "userId": "string",
  "currentProgress": 3,
  "maxProgress": 5,
  "status": "LOCKED",
  "unlockedAt": null,
  "claimedAt": null
}
```

**Response Codes:**

- `200`: Success
- `404`: Achievement not found
- `500`: Internal server error

#### GET `/api/v1/achievements/stats`

Get user's achievement statistics.

**Response:**

```json
{
  "totalAchievements": 25,
  "unlockedAchievements": 8,
  "claimedRewards": 6
}
```

**Response Codes:**

- `200`: Success
- `500`: Internal server error

#### GET `/api/v1/achievements/category/:category`

Get achievements filtered by category.

**Parameters:**

- `category`: Achievement category (VENUE_VISITS, MATCHES_WON, etc.)

**Response:**

```json
[
  {
    "id": "string",
    "key": "first_venue_visit",
    "name": "First Steps",
    "description": "Visit your first Dojo venue",
    "category": "VENUE_VISITS",
    "iconUrl": "/icons/achievements/first-visit.png",
    "isHidden": false,
    "criteriaType": "VENUE_CHECK_INS",
    "criteriaValue": 1,
    "reward": {
      "id": "string",
      "name": "Welcome Bonus",
      "type": "DOJO_COINS",
      "dojoCoinAmount": 100
    }
  }
]
```

**Response Codes:**

- `200`: Success
- `500`: Internal server error

### Reward Management

#### POST `/api/v1/achievements/:id/claim-reward`

Claim reward for an unlocked achievement.

**Parameters:**

- `id`: Achievement ID

**Response:**

```json
{
  "success": true,
  "rewardType": "DOJO_COINS",
  "rewardDetails": {
    "dojoCoins": 100
  },
  "message": "Received 100 DojoCoins!"
}
```

**Error Responses:**

```json
{
  "statusCode": 400,
  "message": "Achievement not unlocked",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Reward already claimed",
  "error": "Bad Request"
}
```

**Response Codes:**

- `200`: Success
- `400`: Achievement not unlocked or reward already claimed
- `404`: Achievement not found
- `500`: Internal server error

#### GET `/api/v1/achievements/rewards/claimed`

Get list of rewards claimed by the user.

**Response:**

```json
[
  {
    "id": "string",
    "name": "Welcome Bonus",
    "type": "DOJO_COINS",
    "dojoCoinAmount": 100,
    "claimedAt": "2024-01-15T11:00:00Z"
  }
]
```

**Response Codes:**

- `200`: Success
- `500`: Internal server error

#### GET `/api/v1/achievements/rewards/stats`

Get reward distribution statistics.

**Response:**

```json
{
  "totalRewards": 15,
  "rewardsByType": {
    "DOJO_COINS": 8,
    "AVATAR_ASSET": 4,
    "EXCLUSIVE_TITLE": 2,
    "CLAN_POINTS": 1,
    "SPECIAL_BADGE": 0
  },
  "mostClaimedRewards": [
    {
      "rewardId": "string",
      "name": "Welcome Bonus",
      "claimCount": 45
    }
  ]
}
```

**Response Codes:**

- `200`: Success
- `500`: Internal server error

### Administrative Endpoints

#### POST `/api/v1/achievements/create`

Create a new achievement (admin/development only).

**Request Body:**

```json
{
  "key": "custom_achievement",
  "name": "Custom Achievement",
  "description": "A custom achievement",
  "category": "MISCELLANEOUS",
  "criteriaType": "CUSTOM_EVENT",
  "criteriaValue": 1,
  "rewardId": "reward-id",
  "isHidden": false
}
```

**Response:**

```json
{
  "id": "string",
  "key": "custom_achievement",
  "name": "Custom Achievement",
  "description": "A custom achievement",
  "category": "MISCELLANEOUS",
  "criteriaType": "CUSTOM_EVENT",
  "criteriaValue": 1,
  "rewardId": "reward-id",
  "isHidden": false,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### POST `/api/v1/achievements/rewards/create`

Create a new reward (admin/development only).

**Request Body:**

```json
{
  "name": "Special Reward",
  "description": "A special reward",
  "type": "DOJO_COINS",
  "dojoCoinAmount": 500,
  "iconUrl": "/icons/rewards/special.png"
}
```

**Response:**

```json
{
  "id": "string",
  "name": "Special Reward",
  "description": "A special reward",
  "type": "DOJO_COINS",
  "dojoCoinAmount": 500,
  "iconUrl": "/icons/rewards/special.png",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

## Achievement Criteria Types

### Venue Visit Achievements

- `VENUE_CHECK_INS`: Track venue check-ins
- `UNIQUE_VENUES_VISITED`: Track unique venues visited
- `CONSECUTIVE_DAILY_VISITS`: Track consecutive daily visits
- `VENUE_LOYALTY`: Track visits to the same venue

### Match Achievements

- `MATCHES_PLAYED`: Track total matches played
- `MATCHES_WON`: Track matches won
- `WIN_STREAK`: Track consecutive wins
- `VENUE_MATCHES_WON`: Track wins at specific venues

### Territory Achievements

- `TERRITORIES_CLAIMED`: Track territories claimed
- `UNIQUE_TERRITORIES_CONTROLLED`: Track unique territories controlled
- `TERRITORY_DEFENSES`: Track successful territory defenses

### Trading Achievements

- `TRADES_COMPLETED`: Track completed trades
- `TOTAL_TRADE_VALUE`: Track total trade value in DojoCoins

### Social Achievements

- `FRIENDS_MADE`: Track friend connections
- `CLANS_JOINED`: Track clan memberships
- `CLAN_LEADER`: Track clan leadership roles
- `CLAN_ACTIVITIES`: Track clan activity participation

### Tournament Achievements

- `TOURNAMENTS_PARTICIPATED`: Track tournament participation
- `TOURNAMENTS_WON`: Track tournament wins
- `TOURNAMENT_TOP_3`: Track top 3 finishes

### Progression Achievements

- `FIRST_GAME_PLAYED`: Track first game
- `SOCIAL_INTERACTION`: Track social interactions
- `LEGENDARY_STATUS`: Special legendary status

## Reward Types

### DojoCoins (`DOJO_COINS`)

```json
{
  "type": "DOJO_COINS",
  "dojoCoinAmount": 100
}
```

### Avatar Asset (`AVATAR_ASSET`)

```json
{
  "type": "AVATAR_ASSET",
  "avatarAssetId": "asset-uuid"
}
```

### Exclusive Title (`EXCLUSIVE_TITLE`)

```json
{
  "type": "EXCLUSIVE_TITLE",
  "title": "Champion"
}
```

### Clan Points (`CLAN_POINTS`)

```json
{
  "type": "CLAN_POINTS",
  "clanPoints": 100
}
```

### Special Badge (`SPECIAL_BADGE`)

```json
{
  "type": "SPECIAL_BADGE",
  "badgeData": {
    "rarity": "legendary",
    "effect": "prestige"
  }
}
```

## Database Models

### Achievement Model

```typescript
model Achievement {
  id               String             @id @default(uuid())
  key              String             @unique
  name             String
  description      String?
  category         AchievementCategory
  iconUrl          String?
  isActive         Boolean            @default(true)
  isHidden         Boolean            @default(false)
  criteriaType     String
  criteriaValue    Int                @default(1)
  criteriaMetadata Json               @default("{}")
  rewardId         String?
  reward           Reward?            @relation(fields: [rewardId], references: [id])
  userAchievements UserAchievement[]
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
}
```

### Reward Model

```typescript
model Reward {
  id               String           @id @default(uuid())
  name             String
  description      String?
  type             RewardType
  iconUrl          String?
  dojoCoinAmount   Int?
  avatarAssetId    String?
  avatarAsset      AvatarAsset?     @relation(fields: [avatarAssetId], references: [id])
  title            String?
  clanPoints       Int?
  badgeData        Json?
  achievements     Achievement[]
  claimedBy        UserAchievement[]
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
}
```

### UserAchievement Model

```typescript
model UserAchievement {
  id             String            @id @default(uuid())
  userId         String
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievementId  String
  achievement    Achievement       @relation(fields: [achievementId], references: [id], onDelete: Cascade)
  status         AchievementStatus @default(LOCKED)
  progress       Int               @default(0)
  progressMax    Int               @default(1)
  unlockedAt     DateTime?
  claimedAt      DateTime?
  rewardClaimed  Boolean           @default(false)
  rewardId       String?
  reward         Reward?           @relation(fields: [rewardId], references: [id])
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
}
```

## Achievement Categories

- `VENUE_VISITS`: Achievements related to visiting Dojo venues
- `MATCHES_WON`: Achievements for winning pool matches
- `MATCHES_PLAYED`: Achievements for playing pool matches
- `TERRITORY_CONTROL`: Achievements for territory control and conquest
- `SOCIAL_INTERACTION`: Achievements for social features and interactions
- `TRADING`: Achievements for marketplace trading activities
- `CLAN_ACTIVITY`: Achievements for clan participation and leadership
- `PROGRESSION`: General progression and milestone achievements
- `SPECIAL_EVENTS`: Achievements tied to special events or promotions
- `MISCELLANEOUS`: Miscellaneous achievements

## Event-Driven Achievement Unlocking

The system includes automatic achievement unlocking through event listeners:

### Venue Events

```typescript
achievementEventsService.handleVenueCheckIn(userId, venueId);
```

### Match Events

```typescript
achievementEventsService.handleMatchCompleted(userId, {
  matchId,
  winnerId,
  venueId,
});
```

### Territory Events

```typescript
achievementEventsService.handleTerritoryClaimed(userId, {
  territoryId,
  venueId,
  clanId,
});
```

### Trade Events

```typescript
achievementEventsService.handleTradeCompleted(userId, {
  tradeId,
  traderId,
  tradeValue,
});
```

### Social Events

```typescript
achievementEventsService.handleClanJoined(userId, {
  clanId,
  clanName,
});
achievementEventsService.handleSocialInteraction(userId, interactionType);
```

### Tournament Events

```typescript
achievementEventsService.handleTournamentParticipation(userId, {
  tournamentId,
  placement,
  totalParticipants,
});
```

## Security Considerations

### Authentication

- All endpoints require JWT authentication
- User-specific data access through authenticated user context
- Admin endpoints protected with role-based access control

### Authorization

- Users can only access their own achievement data
- Reward claiming requires achievement ownership and unlock status
- Administrative endpoints require appropriate admin roles

### Data Validation

- Achievement criteria validated before progress updates
- Reward claiming validates achievement status and ownership
- Input sanitization for all user-provided data

### Atomic Operations

- Achievement unlocking and reward claiming use database transactions
- Rollback on failure prevents inconsistent states
- Concurrent access handled through optimistic locking

## Performance Optimization

### Database Indexing

- Indexes on `userId`, `achievementId`, and `status` fields
- Composite indexes for common query patterns
- Optimized queries for achievement progress retrieval

### Caching Strategy

- Redis caching for frequently accessed achievement data
- User achievement progress cached with short TTL
- Achievement metadata cached with longer TTL

### Query Optimization

- Efficient batch operations for multiple achievement updates
- Lazy loading of achievement metadata
- Pagination for large achievement lists

## Error Handling

### Common Error Patterns

```typescript
// Achievement not found
throw new NotFoundException('Achievement not found');

// Achievement not unlocked
throw new BadRequestException('Achievement not unlocked');

// Reward already claimed
throw new BadRequestException('Reward already claimed');

// Insufficient permissions
throw new ForbiddenException('Insufficient permissions');
```

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Achievement not unlocked",
  "error": "Bad Request"
}
```

## Testing Strategy

### Unit Tests

- AchievementService business logic validation
- RewardService reward distribution testing
- AchievementEventsService event handling verification
- Criteria evaluation and progress calculation testing

### Integration Tests

- API endpoint validation with authentication
- Database transaction integrity testing
- Event listener integration testing
- Cross-service communication verification

### E2E Tests

- Complete achievement unlock workflows
- Reward claiming user journeys
- Achievement dashboard functionality
- Real-time progress updates

## Monitoring and Analytics

### Key Metrics

- Achievement unlock rates by category
- Reward claiming conversion rates
- User engagement with achievements system
- Popular achievements and reward types

### Logging

- Achievement unlock events logged with context
- Reward claiming events tracked for analytics
- Error events logged with full stack traces
- Performance metrics for API response times

This comprehensive API documentation provides everything needed to integrate with and extend the Achievements & Rewards System.
