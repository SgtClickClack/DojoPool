# Player Skill Progression & Mastery System - API Documentation

## Overview

The Player Skill Progression & Mastery System provides a comprehensive framework for tracking player skill development in DojoPool. The system analyzes match performance data using AI-powered insights to award skill points across 10 distinct skill categories, creating a meaningful progression path that rewards real gameplay achievements.

## Core Concepts

### Skill Categories

The system tracks 10 fundamental pool skills:

- **AIMING_ACCURACY**: Precision in potting balls
- **POSITIONING**: Cue ball positioning and angle control
- **DEFENSIVE_PLAY**: Safety play and defensive strategies
- **OFFENSIVE_STRATEGY**: Attacking gameplay and shot selection
- **BANKING_SHOTS**: Bank shots and cushion play
- **BREAK_SHOTS**: Break shot execution and control
- **SAFETY_PLAY**: Safety shot techniques
- **CONSISTENCY**: Consistent performance across matches
- **MENTAL_GAME**: Psychological aspects and pressure handling
- **PHYSICAL_STAMINA**: Endurance and physical performance

### Skill Progression

Each skill follows a level-based progression system:

- **Base Points**: Starting points required for each skill
- **Points Per Level**: Points needed to advance each level
- **Max Level**: Maximum achievable level (default: 100)
- **Proficiency Score**: Percentage completion (0-100%)

## API Endpoints

### Authentication

All endpoints require JWT authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## 1. Get Player Skill Profile

**GET** `/api/v1/skills/player/:playerId`

Retrieves a comprehensive skill profile for a specific player, including overall statistics, top skills, and category breakdowns.

### Parameters

| Parameter  | Type   | Required | Description        |
| ---------- | ------ | -------- | ------------------ |
| `playerId` | string | Yes      | UUID of the player |

### Response

```json
{
  "playerId": "string",
  "username": "string",
  "totalSkills": 5,
  "averageLevel": 7.2,
  "totalPoints": 1250,
  "topSkills": [
    {
      "skillId": "string",
      "skillName": "Aiming Accuracy",
      "category": "AIMING_ACCURACY",
      "currentLevel": 12,
      "currentPoints": 150,
      "proficiencyScore": 85.5,
      "recentPoints": 25,
      "lastActivity": "2025-01-10T10:30:00Z"
    }
  ],
  "recentActivity": [
    {
      "id": "string",
      "skillId": "string",
      "skillName": "Positioning",
      "points": 15,
      "reason": "Excellent positioning in defensive play",
      "matchId": "string",
      "createdAt": "2025-01-10T10:30:00Z",
      "metadata": {
        "matchContext": "Match vs opponent (won)",
        "playerPerformance": "Strong positioning throughout the match",
        "analysisSource": "AI Match Analysis"
      }
    }
  ],
  "skillCategories": [
    {
      "category": "AIMING_ACCURACY",
      "totalSkills": 1,
      "averageLevel": 12,
      "totalPoints": 450,
      "highestSkill": {
        "skillId": "string",
        "skillName": "Aiming Accuracy",
        "category": "AIMING_ACCURACY",
        "currentLevel": 12,
        "currentPoints": 150,
        "proficiencyScore": 85.5,
        "recentPoints": 25,
        "lastActivity": "2025-01-10T10:30:00Z"
      }
    }
  ]
}
```

### Error Responses

- **404**: Player not found
- **401**: Unauthorized
- **500**: Internal server error

---

## 2. Get Current User Skill Profiles

**GET** `/api/v1/skills/me`

Retrieves all skill profiles for the authenticated user with detailed progression information.

### Response

```json
[
  {
    "id": "string",
    "skillId": "string",
    "skillName": "Aiming Accuracy",
    "skillDescription": "Precision in potting balls",
    "category": "AIMING_ACCURACY",
    "iconUrl": "string",
    "currentLevel": 12,
    "currentPoints": 150,
    "totalPoints": 450,
    "proficiencyScore": 85.5,
    "maxLevel": 100,
    "pointsToNextLevel": 50,
    "unlockedAt": "2025-01-08T15:20:00Z",
    "lastUpdated": "2025-01-10T10:30:00Z"
  }
]
```

---

## 3. Get Skill Profile Details

**GET** `/api/v1/skills/profile/:profileId`

Retrieves detailed information about a specific skill profile.

### Parameters

| Parameter   | Type   | Required | Description               |
| ----------- | ------ | -------- | ------------------------- |
| `profileId` | string | Yes      | UUID of the skill profile |

### Response

```json
{
  "id": "string",
  "skillId": "string",
  "skillName": "Aiming Accuracy",
  "skillDescription": "Precision in potting balls",
  "category": "AIMING_ACCURACY",
  "iconUrl": "string",
  "currentLevel": 12,
  "currentPoints": 150,
  "totalPoints": 450,
  "proficiencyScore": 85.5,
  "maxLevel": 100,
  "pointsToNextLevel": 50,
  "unlockedAt": "2025-01-08T15:20:00Z",
  "lastUpdated": "2025-01-10T10:30:00Z"
}
```

---

## 4. Calculate Skill Points for Match

**POST** `/api/v1/skills/calculate/:matchId`

Triggers skill point calculation for a specific match. This endpoint analyzes the match's AI-generated insights and awards skill points to the requesting player.

### Parameters

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `matchId` | string | Yes      | UUID of the match to analyze |

### Response

```json
{
  "playerId": "string",
  "matchId": "string",
  "skillPoints": [
    {
      "skillId": "string",
      "skillName": "aiming accuracy",
      "category": "AIMING_ACCURACY",
      "points": 18,
      "reason": "Match performance: Excellent pot shot execution",
      "confidence": 85,
      "metadata": {
        "matchContext": "Match vs opponent (won)",
        "playerPerformance": "Strong potting accuracy throughout",
        "analysisSource": "AI Match Analysis"
      }
    },
    {
      "skillId": "string",
      "skillName": "positioning",
      "category": "POSITIONING",
      "points": 12,
      "reason": "Match performance: Excellent cue ball positioning",
      "confidence": 78,
      "metadata": {
        "matchContext": "Match vs opponent (won)",
        "playerPerformance": "Consistent positioning after shots",
        "analysisSource": "AI Match Analysis"
      }
    }
  ],
  "totalPointsAwarded": 30,
  "calculationTimestamp": "2025-01-10T10:30:00Z"
}
```

### Error Responses

- **404**: Match analysis not found
- **403**: Unauthorized to calculate skills for this match
- **401**: Unauthorized
- **500**: Internal server error

---

## 5. Get Skills with Achievements Linkage

**GET** `/api/v1/skills/achievements`

Retrieves skill profiles with linked achievement information for unified progression display.

### Response

```json
{
  "skills": [
    {
      "id": "string",
      "skillId": "string",
      "skillName": "Aiming Accuracy",
      "currentLevel": 12,
      "totalPoints": 450,
      "proficiencyScore": 85.5
    }
  ],
  "linkedAchievements": [],
  "unifiedProgress": {
    "totalSkillPoints": 1250,
    "averageProficiency": 78.3
  }
}
```

---

## Skill Point Calculation Algorithm

### Base Point Values

Each skill category has a base point value that serves as the foundation for point awards:

```javascript
const SKILL_BASE_POINTS = {
  AIMING_ACCURACY: 15,
  POSITIONING: 12,
  DEFENSIVE_PLAY: 14,
  OFFENSIVE_STRATEGY: 16,
  BANKING_SHOTS: 18,
  BREAK_SHOTS: 20,
  SAFETY_PLAY: 13,
  CONSISTENCY: 11,
  MENTAL_GAME: 10,
  PHYSICAL_STAMINA: 9,
};
```

### Multipliers

- **Win Multiplier**: 1.5x points for match victories
- **Loss Multiplier**: 0.75x points for match defeats
- **Perfect Multiplier**: 2.0x points for exceptional performance

### Analysis-Based Point Awards

The system analyzes AI-generated match insights to identify relevant skills:

#### Key Insight Patterns

**Aiming Accuracy Skills**:

- Keywords: "pot", "potted", "pocket", "precision"
- Example: "Excellent pot shot" → +15-30 points

**Positioning Skills**:

- Keywords: "position", "angle", "cue ball", "placement"
- Example: "Perfect positioning" → +12-24 points

**Defensive Skills**:

- Keywords: "safety", "defensive", "blocking", "protection"
- Example: "Strong defensive play" → +14-28 points

**Strategic Skills**:

- Keywords: "strategy", "planning", "tactical", "approach"
- Example: "Excellent strategic decisions" → +16-32 points

#### Confidence Scoring

Point awards are adjusted based on AI confidence in the analysis:

```javascript
confidence = base_confidence + modifiers;
// Range: 60-95
// Higher confidence = more reliable skill awards
```

#### Perfect Performance Detection

Automatic 2x multiplier for exceptional performance indicators:

- "perfect", "flawless", "masterful", "exceptional"
- "brilliant", "phenomenal", "outstanding", "extraordinary"

### Skill Level Progression

```javascript
// Level calculation
currentLevel = floor(totalPoints / pointsPerLevel) + 1;

// Proficiency calculation
maxPointsForMaxLevel = maxLevel * pointsPerLevel;
proficiencyScore = (totalPoints / maxPointsForMaxLevel) * 100;

// Points to next level
currentLevelPoints = (currentLevel - 1) * pointsPerLevel;
nextLevelPoints = currentLevel * pointsPerLevel;
pointsToNextLevel = nextLevelPoints - totalPoints;
```

---

## Database Schema

### Skill Model

```sql
model Skill {
  id          String        @id @default(uuid())
  name        String        @unique
  description String?
  category    SkillCategory
  iconUrl     String?
  isActive    Boolean       @default(true)

  maxLevel      Int         @default(100)
  basePoints    Int         @default(0)
  pointsPerLevel Int        @default(100)

  profiles    SkillProfile[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([isActive])
}
```

### SkillProfile Model

```sql
model SkillProfile {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)

  currentLevel   Int      @default(0)
  currentPoints  Int      @default(0)
  totalPoints    Int      @default(0)
  proficiencyScore Decimal @default(0) @db.Decimal(5,2)

  unlockedAt     DateTime?
  lastUpdated    DateTime @updatedAt

  pointLogs      SkillPointLog[]

  createdAt DateTime @default(now())

  @@unique([userId, skillId])
  @@index([userId])
  @@index([skillId])
  @@index([currentLevel])
}
```

### SkillPointLog Model

```sql
model SkillPointLog {
  id          String   @id @default(uuid())
  skillProfileId String
  skillProfile SkillProfile @relation(fields: [skillProfileId], references: [id], onDelete: Cascade)

  points      Int
  reason      String
  matchId     String?
  match       Match?   @relation(fields: [matchId], references: [id])

  metadata    Json?

  createdAt DateTime @default(now())

  @@index([skillProfileId])
  @@index([matchId])
  @@index([createdAt])
}
```

---

## Integration with Match System

### Automatic Skill Calculation

Skill points are automatically calculated when matches are completed:

1. **Match Finalization**: `finalizeMatch()` in `MatchesService`
2. **AI Analysis Generation**: `generateAndStoreAnalysis()` creates insights
3. **MatchAnalysis Record**: Upsert operation creates/updates analysis record
4. **Skill Calculation**: `calculateSkillsForMatch()` processes insights
5. **Point Awards**: Skills identified and points awarded to both players

### Event Flow

```mermaid
graph TD
    A[Match Completed] --> B[finalizeMatch()]
    B --> C[generateAndStoreAnalysis()]
    C --> D[create MatchAnalysis]
    D --> E[calculateSkillsForMatch()]
    E --> F[extractSkillsFromInsight()]
    F --> G[calculateSkillPoints()]
    G --> H[saveSkillPoints()]
    H --> I[create SkillPointLog]
```

---

## Frontend Integration

### Skill Dashboard Components

The frontend provides a comprehensive skill dashboard at `/profile/skills`:

#### Overview Tab

- Overall mastery statistics
- Top skills ranking
- Skill category breakdowns
- Recent activity feed

#### Skill Tree Tab

- Visual skill progression
- Category-based organization
- Level and point displays
- Progress bars and proficiency scores

#### Progress History Tab

- Detailed activity log
- Point award history
- Match-specific insights
- Timestamp tracking

#### Achievements Tab

- Skill-based achievements
- Title unlocks
- Special abilities
- Reward claiming

### API Integration

The frontend integrates with the skills API through dedicated service functions:

```typescript
// Get player skill profile
const profile = await getPlayerSkillProfile(playerId);

// Get current user skills
const skills = await getUserSkillProfiles();

// Calculate skills for match
const result = await calculateSkillPointsForMatch(matchId);

// Get skills with achievements
const unified = await getSkillsWithAchievements();
```

---

## Error Handling

### Common Error Scenarios

1. **Missing Match Analysis**
   - Error: "Match analysis not found"
   - Cause: Match completed before AI analysis generation
   - Solution: Retry calculation after analysis is available

2. **Unauthorized Access**
   - Error: "Unauthorized to calculate skills for this match"
   - Cause: User not a participant in the match
   - Solution: Verify user is playerA or playerB

3. **Skill Profile Creation Failure**
   - Error: "Failed to create skill profile"
   - Cause: Database constraint violations
   - Solution: Check for duplicate skill assignments

### Error Response Format

```json
{
  "statusCode": 404,
  "message": "Match analysis not found",
  "error": "Not Found"
}
```

---

## Testing

### Unit Tests

- **SkillService**: Core calculation logic, insight extraction, proficiency scoring
- **Skill Calculation**: Point multipliers, confidence scoring, perfect performance detection
- **Level Progression**: Level calculation, proficiency percentage, points to next level

### Integration Tests

- **API Endpoints**: All REST endpoints with authentication
- **Database Operations**: Skill profile creation, point log generation
- **Match Integration**: End-to-end skill calculation from match completion

### E2E Tests

- **Skill Dashboard**: Complete user journey through skill interface
- **Data Loading**: Error states, loading states, empty states
- **Responsive Design**: Mobile and desktop layouts
- **Real-time Updates**: Live skill point updates and notifications

---

## Performance Considerations

### Database Optimization

- **Indexes**: Optimized indexes on frequently queried fields
- **Composite Indexes**: Multi-column indexes for complex queries
- **Connection Pooling**: Efficient database connection management

### Caching Strategy

- **Skill Profiles**: Redis caching for frequently accessed profiles
- **Category Summaries**: Cached skill category aggregations
- **Point Calculations**: Memoization of complex calculations

### Query Optimization

- **Batch Operations**: Bulk skill point calculations
- **Lazy Loading**: Progressive loading of large datasets
- **Pagination**: Efficient handling of activity logs

---

## Security Considerations

### Authentication & Authorization

- **JWT Validation**: All endpoints require valid JWT tokens
- **Role-based Access**: Proper RBAC for skill data access
- **Ownership Validation**: Users can only access their own skill data

### Data Validation

- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout
- **XSS Protection**: Proper escaping of user-generated content

### Rate Limiting

- **API Rate Limits**: Prevent abuse of calculation endpoints
- **Calculation Limits**: Reasonable limits on skill calculations per user
- **Caching**: Reduce database load through intelligent caching

---

## Monitoring & Analytics

### Key Metrics

- **Skill Point Distribution**: Track points awarded by category
- **User Engagement**: Monitor skill dashboard usage
- **Calculation Performance**: Track AI analysis and point calculation times
- **Level Progression**: Monitor user advancement through skill levels

### Logging

- **Calculation Events**: Detailed logging of skill point awards
- **Error Tracking**: Comprehensive error logging and alerting
- **Performance Metrics**: Response times and throughput monitoring
- **User Activity**: Track skill dashboard interactions

---

## Future Enhancements

### Planned Features

1. **Advanced Visualizations**: Radial charts and interactive skill trees
2. **Social Features**: Skill comparisons and leaderboards
3. **Achievement Integration**: Skill-based achievement unlocks
4. **Real-time Updates**: Live skill point notifications
5. **Mobile Optimization**: Enhanced mobile skill tracking

### API Extensions

1. **Bulk Calculations**: Calculate skills for multiple matches
2. **Skill Comparisons**: Compare skills between players
3. **Historical Trends**: Track skill progression over time
4. **Prediction Models**: Predict future skill development

This documentation provides a comprehensive overview of the Player Skill Progression & Mastery System, covering all aspects from core concepts to implementation details, API endpoints, and future development plans.
