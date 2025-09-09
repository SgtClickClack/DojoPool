# Achievement Criteria Documentation

## Overview

This document outlines all achievement criteria types, their evaluation logic, and implementation details for the DojoPool Achievements & Rewards System.

## Achievement Criteria Types

### Venue Visit Achievements

#### VENUE_CHECK_INS

**Description**: Tracks the number of venue check-ins by a player.
**Evaluation**: Incremented each time a player checks into any venue.
**Implementation**:

```typescript
// Called from venue check-in event
await achievementService.updateProgress(userId, 'VENUE_CHECK_INS', 1, {
  venueId: venueId,
});
```

#### UNIQUE_VENUES_VISITED

**Description**: Tracks the number of distinct venues a player has visited.
**Evaluation**: Counts unique venue IDs from player's check-in history.
**Implementation**:

```typescript
// Called after each venue check-in
const uniqueVenues = await this.prisma.checkIn.findMany({
  where: { userId },
  select: { venueId: true },
});
const uniqueCount = [...new Set(uniqueVenues.map((c) => c.venueId))].length;
await achievementService.updateProgress(
  userId,
  'UNIQUE_VENUES_VISITED',
  uniqueCount
);
```

#### CONSECUTIVE_DAILY_VISITS

**Description**: Tracks the longest streak of consecutive daily venue visits.
**Evaluation**: Analyzes check-in timestamps to find consecutive day streaks.
**Implementation**:

```typescript
// Called after each venue check-in
const recentCheckIns = await this.prisma.checkIn.findMany({
  where: { userId },
  orderBy: { createdAt: 'desc' },
  take: 30, // Last 30 days
});

let consecutiveDays = 0;
let currentDate = new Date(recentCheckIns[0]?.createdAt);

for (const checkIn of recentCheckIns) {
  const checkInDate = new Date(checkIn.createdAt);
  const dayDifference = Math.floor(
    (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (dayDifference === 1) {
    consecutiveDays++;
    currentDate = checkInDate;
  } else if (dayDifference > 1) {
    break;
  }
}

await achievementService.updateProgress(
  userId,
  'CONSECUTIVE_DAILY_VISITS',
  consecutiveDays
);
```

#### VENUE_LOYALTY

**Description**: Tracks visits to the same venue.
**Evaluation**: Counts check-ins to a specific venue.
**Metadata Required**: `venueId` to specify which venue.
**Implementation**:

```typescript
// Achievement definition includes venueId in metadata
{
  criteriaType: 'VENUE_LOYALTY',
  criteriaValue: 10,
  criteriaMetadata: { venueId: 'specific-venue-id' }
}
```

### Match Achievements

#### MATCHES_PLAYED

**Description**: Tracks the total number of matches played.
**Evaluation**: Incremented for every completed match (win or loss).
**Implementation**:

```typescript
// Called after each match completion
await achievementService.updateProgress(userId, 'MATCHES_PLAYED', 1, {
  venueId: matchData.venueId,
});
```

#### MATCHES_WON

**Description**: Tracks the total number of matches won.
**Evaluation**: Incremented only when the player wins a match.
**Implementation**:

```typescript
// Called after each match completion
if (isWinner) {
  await achievementService.updateProgress(userId, 'MATCHES_WON', 1, {
    venueId: matchData.venueId,
  });
}
```

#### WIN_STREAK

**Description**: Tracks the current winning streak.
**Evaluation**: Analyzes recent matches to count consecutive wins.
**Implementation**:

```typescript
// Called after each match completion
const recentMatches = await this.prisma.match.findMany({
  where: {
    OR: [{ playerAId: userId }, { playerBId: userId }],
  },
  orderBy: { createdAt: 'desc' },
  take: 20,
});

let currentStreak = 0;
for (const match of recentMatches) {
  if (match.winnerId === userId) {
    currentStreak++;
  } else if (match.winnerId && match.winnerId !== userId) {
    break;
  }
}

await achievementService.updateProgress(userId, 'WIN_STREAK', currentStreak);
```

#### VENUE_MATCHES_WON

**Description**: Tracks wins at a specific venue.
**Evaluation**: Counts wins at a particular venue.
**Metadata Required**: `venueId` to specify which venue.
**Implementation**:

```typescript
// Achievement definition includes venueId in metadata
{
  criteriaType: 'VENUE_MATCHES_WON',
  criteriaValue: 10,
  criteriaMetadata: { venueId: 'specific-venue-id' }
}
```

### Territory Achievements

#### TERRITORIES_CLAIMED

**Description**: Tracks the number of territories claimed.
**Evaluation**: Incremented each time a player successfully claims a territory.
**Implementation**:

```typescript
// Called after territory claim
await achievementService.updateProgress(userId, 'TERRITORIES_CLAIMED', 1, {
  venueId: territoryData.venueId,
  clanId: territoryData.clanId,
});
```

#### UNIQUE_TERRITORIES_CONTROLLED

**Description**: Tracks the number of distinct territories controlled.
**Evaluation**: Counts unique territories currently controlled by the player.
**Implementation**:

```typescript
// Called after territory claim/defense
const controlledTerritories = await this.prisma.territory.findMany({
  where: { ownerId: userId },
  select: { id: true },
});

await achievementService.updateProgress(
  userId,
  'UNIQUE_TERRITORIES_CONTROLLED',
  controlledTerritories.length
);
```

#### TERRITORY_DEFENSES

**Description**: Tracks successful territory defenses.
**Evaluation**: Incremented when a player successfully defends their territory.
**Implementation**:

```typescript
// Called after territory defense
await achievementService.updateProgress(userId, 'TERRITORY_DEFENSES', 1, {
  territoryId: territoryData.territoryId,
});
```

### Trading Achievements

#### TRADES_COMPLETED

**Description**: Tracks the number of completed trades.
**Evaluation**: Incremented for each successful trade completion.
**Implementation**:

```typescript
// Called after trade completion
await achievementService.updateProgress(userId, 'TRADES_COMPLETED', 1, {
  tradeValue: tradeData.tradeValue,
});
```

#### TOTAL_TRADE_VALUE

**Description**: Tracks the total value of trades in DojoCoins.
**Evaluation**: Accumulates the DojoCoin value of all completed trades.
**Implementation**:

```typescript
// Called after trade completion
await achievementService.updateProgress(
  userId,
  'TOTAL_TRADE_VALUE',
  tradeData.tradeValue
);
```

### Social Achievements

#### FRIENDS_MADE

**Description**: Tracks the number of friends made.
**Evaluation**: Incremented when a friendship is established.
**Implementation**:

```typescript
// Called after friendship creation
await achievementService.updateProgress(userId, 'FRIENDS_MADE', 1);
```

#### CLANS_JOINED

**Description**: Tracks the number of clans joined.
**Evaluation**: Incremented when a player joins a clan.
**Implementation**:

```typescript
// Called after clan join
await achievementService.updateProgress(userId, 'CLANS_JOINED', 1, {
  clanId: clanData.clanId,
});
```

#### CLAN_LEADER

**Description**: Tracks clan leadership roles.
**Evaluation**: Unlocked when a player becomes a clan leader.
**Implementation**:

```typescript
// Called after clan leadership change
await achievementService.updateProgress(userId, 'CLAN_LEADER', 1, {
  clanId: clanData.clanId,
});
```

#### CLAN_ACTIVITIES

**Description**: Tracks participation in clan activities.
**Evaluation**: Incremented for various clan-related activities.
**Implementation**:

```typescript
// Called after clan activities (territory claims, matches, etc.)
await achievementService.updateProgress(userId, 'CLAN_ACTIVITIES', 1, {
  activityType: 'territory_claim' | 'match_win' | 'trade_complete',
});
```

### Tournament Achievements

#### TOURNAMENTS_PARTICIPATED

**Description**: Tracks tournament participation.
**Evaluation**: Incremented for each tournament entered.
**Implementation**:

```typescript
// Called after tournament registration
await achievementService.updateProgress(userId, 'TOURNAMENTS_PARTICIPATED', 1);
```

#### TOURNAMENTS_WON

**Description**: Tracks tournament victories.
**Evaluation**: Incremented when a player wins a tournament.
**Implementation**:

```typescript
// Called after tournament completion
if (tournamentData.placement === 1) {
  await achievementService.updateProgress(userId, 'TOURNAMENTS_WON', 1);
}
```

#### TOURNAMENT_TOP_3

**Description**: Tracks top 3 tournament finishes.
**Evaluation**: Incremented for 1st, 2nd, or 3rd place finishes.
**Implementation**:

```typescript
// Called after tournament completion
if (tournamentData.placement <= 3) {
  await achievementService.updateProgress(userId, 'TOURNAMENT_TOP_3', 1);
}
```

### Progression Achievements

#### FIRST_GAME_PLAYED

**Description**: Tracks the first game played.
**Evaluation**: Unlocked after completing the first match.
**Implementation**:

```typescript
// Called after first match completion
await achievementService.updateProgress(userId, 'FIRST_GAME_PLAYED', 1);
```

#### SOCIAL_INTERACTION

**Description**: Tracks various social interactions.
**Evaluation**: Incremented for different types of social activities.
**Metadata Required**: `interactionType` to specify the type of interaction.
**Implementation**:

```typescript
// Called after social interactions
await achievementService.updateProgress(userId, 'SOCIAL_INTERACTION', 1, {
  interactionType: 'friend_request' | 'clan_invite' | 'trade_offer',
});
```

#### LEGENDARY_STATUS

**Description**: Special legendary achievement for dedicated players.
**Evaluation**: Requires meeting multiple criteria (hidden achievement).
**Implementation**:

```typescript
// Complex criteria checking multiple achievements
const legendaryCriteria = {
  uniqueVenuesVisited: 50,
  matchesWon: 100,
  territoriesControlled: 25,
  friendsMade: 20,
  clansJoined: 5,
};

// Check if all criteria are met
// This would be implemented as a special case in the achievement service
```

## Achievement Categories

### VENUE_VISITS

Achievements related to visiting and interacting with Dojo venues.

- First Steps (1 check-in)
- Dojo Explorer (5 unique venues)
- Dojo Master (25 unique venues)
- Loyal Visitor (10 visits to same venue)
- Daily Warrior (7 consecutive days)

### MATCHES_WON

Achievements for competitive success in pool matches.

- First Victory (1 win)
- Hot Streak (3 wins in a row)
- Unstoppable (10 wins in a row)
- Experienced Player (50 matches played)
- Veteran Player (200 matches played)

### MATCHES_PLAYED

Achievements for overall match participation.

- First Game (1 match played)
- Dedicated Player (30 consecutive days)
- Match Master (500 matches played)

### TERRITORY_CONTROL

Achievements for territory conquest and defense.

- Land Owner (1 territory claimed)
- Empire Builder (5 territories controlled)
- Territory Master (20 territories controlled)
- Defensive Specialist (5 successful defenses)

### SOCIAL_INTERACTION

Achievements for social engagement and relationships.

- Social Butterfly (1 friend made)
- Clan Member (1 clan joined)
- Clan Leader (became clan leader)
- Team Player (10 clan activities)

### TRADING

Achievements for marketplace trading activities.

- Merchant (1 trade completed)
- Experienced Trader (25 trades)
- Trade Master (100 trades)
- Wealth Accumulator (10,000 DojoCoins traded)

### CLAN_ACTIVITY

Achievements specifically for clan participation.

- Clan Recruit (joined first clan)
- Clan Officer (promoted to officer)
- Clan Champion (won clan tournament)

### PROGRESSION

General progression and milestone achievements.

- Welcome Player (account created)
- Active Player (7 days active)
- Dedicated Player (30 consecutive days)
- Legendary Player (multiple criteria met)

### SPECIAL_EVENTS

Achievements tied to special events or promotions.

- Event Participant (joined special event)
- Event Winner (won special event)
- Community Contributor (special recognition)

### MISCELLANEOUS

Miscellaneous achievements that don't fit other categories.

- Bug Reporter (reported system issue)
- Beta Tester (participated in beta)
- Ambassador (recruited multiple friends)

## Reward Distribution Logic

### DojoCoins Rewards

- **Validation**: Check if user balance can be updated
- **Distribution**: Add coins to user's balance
- **Transaction Logging**: Create transaction record
- **Rollback**: Remove coins if distribution fails

### Avatar Asset Rewards

- **Validation**: Check if user already owns the asset
- **Ownership Grant**: Create UserAvatarAsset record
- **Equipping**: Optionally auto-equip the asset
- **Notification**: Alert user of new asset availability

### Exclusive Title Rewards

- **Validation**: Check if title is already owned
- **Profile Update**: Update user's profile with new title
- **Display**: Title appears in user profile and leaderboards

### Clan Points Rewards

- **Validation**: Check if user is in a clan
- **Clan Update**: Add points to clan's experience
- **Level Check**: Check if clan levels up from points
- **Notification**: Notify clan members of point gain

### Special Badge Rewards

- **Validation**: Check badge uniqueness
- **Storage**: Store badge data in user profile/metadata
- **Display**: Show badge in achievements and profile
- **Effects**: Apply any special badge effects

## Achievement Unlock Triggers

### Automatic Triggers

- **Venue Check-in**: Triggers VENUE_CHECK_INS, UNIQUE_VENUES_VISITED, CONSECUTIVE_DAILY_VISITS
- **Match Completion**: Triggers MATCHES_PLAYED, MATCHES_WON, WIN_STREAK
- **Territory Claim**: Triggers TERRITORIES_CLAIMED, UNIQUE_TERRITORIES_CONTROLLED
- **Trade Completion**: Triggers TRADES_COMPLETED, TOTAL_TRADE_VALUE
- **Friend Addition**: Triggers FRIENDS_MADE
- **Clan Join**: Triggers CLANS_JOINED
- **Tournament Join**: Triggers TOURNAMENTS_PARTICIPATED

### Manual Triggers

- **Admin Achievement Grant**: Admin can manually unlock achievements
- **Special Event Triggers**: Custom events can trigger specific achievements
- **Time-based Triggers**: Achievements based on account age or activity streaks

## Criteria Metadata Examples

### Venue-Specific Achievements

```json
{
  "criteriaType": "VENUE_LOYALTY",
  "criteriaValue": 10,
  "criteriaMetadata": {
    "venueId": "dojo-123",
    "consecutive": false
  }
}
```

### Clan-Specific Achievements

```json
{
  "criteriaType": "CLAN_ACTIVITIES",
  "criteriaValue": 25,
  "criteriaMetadata": {
    "clanId": "clan-456",
    "activityTypes": ["territory_claim", "match_win", "trade_complete"]
  }
}
```

### Time-Based Achievements

```json
{
  "criteriaType": "CONSECUTIVE_DAILY_VISITS",
  "criteriaValue": 30,
  "criteriaMetadata": {
    "calendarDays": true,
    "includeWeekends": true
  }
}
```

### Complex Criteria Achievements

```json
{
  "criteriaType": "MULTIPLE_CRITERIA",
  "criteriaValue": 1,
  "criteriaMetadata": {
    "requirements": [
      { "type": "MATCHES_WON", "value": 100 },
      { "type": "UNIQUE_VENUES_VISITED", "value": 25 },
      { "type": "FRIENDS_MADE", "value": 10 }
    ],
    "allRequired": true
  }
}
```

This comprehensive criteria documentation provides the foundation for implementing and extending the achievement system with new types of achievements and reward structures.
