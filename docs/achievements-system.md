# DojoPool Achievements System

## Overview

The Achievements System in DojoPool provides a comprehensive framework for rewarding players based on their gameplay accomplishments. It automatically tracks player progress and awards achievements when specific criteria are met.

## Architecture

### Database Models

#### Achievement Model
```prisma
model Achievement {
  id          String   @id @default(uuid())
  name        String
  description String?
  icon        String?
  points      Int      @default(0)
  category    String?  // game, tournament, social, milestone, territory
  criteria    String   @default("{}") // JSON string of unlock conditions
  rarity      Float    @default(0.0) // Percentage of users who have this
  isSecret    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  playerAchievements PlayerAchievement[]
}
```

#### PlayerAchievement Model
```prisma
model PlayerAchievement {
  id            String      @id @default(uuid())
  playerId      String
  player        User        @relation("PlayerAchievements", fields: [playerId], references: [id], onDelete: Cascade)
  achievementId String
  achievement   Achievement @relation("PlayerAchievements", fields: [achievementId], references: [id], onDelete: Cascade)
  dateUnlocked  DateTime    @default(now())
  progress      Int?        // Current progress towards achievement
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([playerId, achievementId])
}
```

### Core Services

#### AchievementService
- **Location**: `src/dojopool/services/achievement_service.py`
- **Purpose**: Core achievement management (CRUD operations, progress tracking)
- **Key Methods**:
  - `create_achievement()`
  - `track_achievement_progress()`
  - `get_user_achievements()`
  - `get_achievement_stats()`

#### AchievementIntegrationService
- **Location**: `src/dojopool/services/achievement_integration.py`
- **Purpose**: Integrates achievements with game events
- **Key Methods**:
  - `check_and_award_achievements()`
  - `check_match_completion_achievements()`
  - `check_tournament_completion_achievements()`

### API Endpoints

#### Achievement Management
- `GET /api/achievements/` - List all achievements
- `POST /api/achievements/` - Create new achievement (admin only)
- `GET /api/achievements/{id}/` - Get achievement details
- `PUT /api/achievements/{id}/` - Update achievement (admin only)
- `DELETE /api/achievements/{id}/` - Delete achievement (admin only)

#### Achievement Actions
- `GET /api/achievements/categories/` - Get achievement categories
- `GET /api/achievements/leaderboard/` - Get achievement leaderboard
- `POST /api/achievements/check_and_award/` - Check and award achievements
- `POST /api/achievements/{id}/check_progress/` - Check specific achievement progress

#### User Achievements
- `GET /api/user-achievements/` - Get current user's achievements
- `GET /api/user-achievements/stats/` - Get achievement statistics
- `GET /api/user-achievements/recent/` - Get recently unlocked achievements
- `POST /api/user-achievements/{id}/share/` - Share achievement

## Achievement Categories

### Game Achievements
- **First Victory**: Win your first pool match
- **Win Streak**: Win 5 matches in a row
- **Unstoppable**: Win 10 matches in a row
- **Century Club**: Win 100 matches
- **Perfect Game**: Win without opponent scoring

### Tournament Achievements
- **Tournament Champion**: Win your first tournament
- **Tournament Master**: Win 5 tournaments
- **Social Butterfly**: Participate in 10 tournaments

### Territory Achievements
- **Territory Controller**: Control your first venue
- **Empire Builder**: Control 5 venues

## Achievement Criteria System

Achievements use a flexible criteria system defined as JSON:

```json
{
  "type": "matches_won",
  "value": 10,
  "operator": ">=",
  "metadata": {}
}
```

### Supported Criteria Types
- `matches_won` - Total matches won
- `win_streak` - Current win streak
- `tournaments_won` - Tournaments won
- `tournaments_entered` - Tournaments participated in
- `territories_controlled` - Venues controlled
- `perfect_game` - Perfect game wins

### Supported Operators
- `>=` - Greater than or equal to (default)
- `=` - Exactly equal to
- `>` - Greater than

## Integration Points

### Match Completion
When a match is completed, the system automatically:
1. Updates player statistics
2. Calls `check_match_completion_achievements()`
3. Awards relevant achievements to winner/loser

### Tournament Completion
When a tournament ends, the system:
1. Updates final standings
2. Calls `check_tournament_completion_achievements()`
3. Awards achievements to all participants

### Territory Control
When venue ownership changes:
1. Updates territory ownership
2. Triggers achievement checks for new owner
3. Updates territory-related achievements

## Usage Examples

### Checking Achievements After Match
```python
from dojopool.services.achievement_integration import get_achievement_integration_service

# After match completion
match_data = {
    'winner_id': 'player-123',
    'loser_id': 'player-456',
    'score': '7-3'
}

achievement_service = get_achievement_integration_service(prisma_client)
await achievement_service.check_match_completion_achievements(match_data)
```

### Manual Achievement Check
```python
# Check all achievements for a player
result = await achievement_service.check_and_award_achievements('player-123')
if result['success']:
    print(f"Awarded {result['total_awarded']} achievements!")
```

## Configuration

### Environment Variables
- `ACHIEVEMENT_NOTIFICATIONS_ENABLED` - Enable/disable achievement notifications
- `ACHIEVEMENT_POINTS_MULTIPLIER` - Multiplier for achievement points

### Achievement Settings
- **Points System**: Each achievement awards points that contribute to player ranking
- **Rarity Tracking**: System automatically calculates achievement rarity percentages
- **Secret Achievements**: Hidden achievements that are only revealed when unlocked
- **Progress Tracking**: Support for achievements with progress bars

## Testing

### Running Achievement Tests
```bash
# Run all achievement-related tests
python -m pytest tests/ -k "achievement"

# Run specific test file
python -m pytest tests/test_achievement_service.py

# Run with coverage
python -m pytest tests/ --cov=dojopool.services.achievement
```

### Seeding Test Data
```bash
# Seed initial achievements
python src/dojopool/scripts/seed_achievements.py

# Reset achievement data
python manage.py flush_achievements
```

## Monitoring and Analytics

### Achievement Metrics
- Total achievements unlocked per user
- Achievement completion rates
- Most/least common achievements
- Achievement unlock trends over time

### Performance Monitoring
- Achievement check response times
- Database query performance
- Cache hit rates for achievement data

## Future Enhancements

### Planned Features
- **Achievement Chains**: Sequential achievements that unlock progressively
- **Seasonal Achievements**: Time-limited achievements with special rewards
- **Community Achievements**: Group achievements requiring multiple players
- **Achievement Trading**: Allow players to trade achievement points
- **Custom Achievements**: Player-created achievements for tournaments

### Technical Improvements
- **Real-time Updates**: WebSocket notifications for achievement unlocks
- **Batch Processing**: Optimize achievement checks for multiple players
- **Machine Learning**: AI-powered achievement recommendations
- **Mobile Push Notifications**: Instant achievement alerts on mobile devices

## Troubleshooting

### Common Issues
1. **Achievements not unlocking**: Check criteria format and player statistics
2. **Performance issues**: Verify database indexes on achievement tables
3. **Missing notifications**: Check notification service configuration
4. **Data inconsistencies**: Run achievement data validation scripts

### Debug Commands
```python
# Check player statistics
stats = await achievement_service._get_player_stats('player-123')
print(json.dumps(stats, indent=2))

# Verify achievement criteria
achievement = await prisma.achievement.find_first(where={'name': 'First Victory'})
print(achievement.criteria)

# Test achievement unlocking
result = await achievement_service._should_award_achievement(
    'player-123', achievement, player_stats
)
print(f"Should award: {result}")
```

## Support

For technical support or questions about the achievements system:
- Check the logs in `logs/achievement.log`
- Review the achievement service tests
- Consult the API documentation
- Contact the development team
