# AI-Powered Match Analysis System

This document describes the AI-powered match analysis system that provides detailed insights and performance analytics for Dojo Pool matches.

## Overview

The match analysis system uses AI (Google Gemini) to analyze match data and provide players with detailed performance insights, strategic recommendations, and personalized feedback. The system processes match data asynchronously using a Redis-based queue system to ensure scalability and responsiveness.

## Architecture

### Components

1. **InsightsService** - Main service handling API requests and coordinating analysis
2. **MatchAnalysisProcessor** - Processes individual match analysis jobs
3. **MatchAnalysisQueueService** - Manages Redis-based job queue
4. **InsightsController** - REST API endpoints
5. **Frontend Components** - React components for visualization

### Data Flow

```
Match Played → Queue Job → AI Analysis → Store Results → Cache → API Response → Frontend Display
```

## API Endpoints

### GET `/api/v1/insights/match/:matchId`

Retrieves detailed AI analysis for a specific match.

**Response Format:**

```typescript
{
  id: string;
  matchId: string;
  provider: string; // "gemini" | "openai"
  fallback: boolean;
  keyMoments: string[];
  strategicInsights: string[];
  playerPerformanceA: string | null;
  playerPerformanceB: string | null;
  overallAssessment: string | null;
  recommendations: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  match?: {
    id: string;
    scoreA: number | null;
    scoreB: number | null;
    winnerId: string | null;
    tournament?: { name: string };
    venue?: { name: string };
    playerA?: { username: string };
    playerB?: { username: string };
  };
}
```

### GET `/api/v1/insights/player/:playerId`

Retrieves performance summary and insights for a specific player.

**Response Format:**

```typescript
{
  playerId: string;
  summary: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  trends?: {
    recentPerformance: number[];
    skillProgression: number[];
    venuePerformance: Record<string, number>;
  };
  strengths?: string[];
  areasForImprovement?: string[];
}
```

## Asynchronous Processing Workflow

### Queue System

The system uses Redis for job queuing with the following features:

- **Priority-based processing**: High, Normal, Low priority jobs
- **Automatic cleanup**: Removes old completed/failed jobs
- **Background processing**: Jobs processed every 2 seconds
- **Error handling**: Failed jobs are logged and cleaned up
- **Caching**: Results cached for 1 hour to reduce database load

### Job Data Structure

```typescript
interface MatchAnalysisJobData {
  jobId: string;
  matchId: string;
  playerAId: string;
  playerBId: string;
  priority: 'low' | 'normal' | 'high';
  createdAt: number;
}
```

### Queue Management

Jobs are stored in Redis sorted sets with priority scoring:

- High priority: score > 100
- Normal priority: score 50-100
- Low priority: score < 50

## AI Analysis Process

### Input Data

The AI receives match data including:

- Player names and IDs
- Final scores
- Winner determination
- Venue information
- Round number
- Shot data (if available)

### AI Prompt Structure

The system constructs detailed prompts for the AI model including:

- Match context and players
- Performance metrics
- Strategic analysis requirements
- Recommendation guidelines

### Output Analysis

The AI provides:

- **Key Moments**: Critical points in the match
- **Strategic Insights**: Tactical observations
- **Player Performance**: Individual assessments
- **Overall Assessment**: Match summary
- **Recommendations**: Improvement suggestions

## Database Schema

### MatchAnalysis Model

```sql
model MatchAnalysis {
  id                 String   @id @default(uuid())
  matchId            String   @unique
  match              Match    @relation(fields: [matchId], references: [id], onDelete: Cascade)
  playerId           String?
  player             User?    @relation(fields: [playerId], references: [id])
  provider           String   @default("gemini")
  fallback           Boolean  @default(false)
  keyMoments         String[] @default([])
  strategicInsights  String[] @default([])
  playerPerformanceA String?
  playerPerformanceB String?
  overallAssessment  String?
  recommendations    String[] @default([])
  metadata           Json?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## Frontend Components

### InsightsOverview

Displays comprehensive player performance metrics with:

- Win rate visualization
- Performance trends
- Key strengths and areas for improvement
- Interactive charts using Recharts

### MatchAnalysis

Provides detailed match breakdown with:

- Score visualization
- Performance radar chart
- AI-generated insights
- Strategic recommendations
- Player comparisons

## Error Handling

### Queue Errors

- Redis connection failures are logged but don't break the system
- Failed jobs are cleaned up automatically
- Queue statistics provide monitoring capabilities

### AI Analysis Errors

- Fallback to basic analysis if AI fails
- Error logging for debugging
- Graceful degradation to cached results

### API Errors

- Proper HTTP status codes
- Detailed error messages
- NotFoundException for missing resources

## Caching Strategy

### Redis Cache Keys

- `match-analysis:{matchId}` - Individual match analysis (1 hour TTL)
- `match-analysis-queue` - Job queue
- `match-analysis-processing:{jobId}` - Processing status (5 min TTL)

### Cache Invalidation

- Automatic expiration after TTL
- Manual invalidation on data updates
- Cache warming for frequently accessed data

## Performance Considerations

### Optimization Techniques

- Asynchronous processing prevents blocking
- Redis caching reduces database load
- Priority queuing for important matches
- Background job cleanup

### Monitoring

- Queue statistics endpoint
- Job processing metrics
- Cache hit/miss ratios
- AI response times

## Configuration

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Queue Configuration

- Processing interval: 2 seconds
- Job timeout: 5 minutes
- Max completed jobs: 50
- Max failed jobs: 20
- Cache TTL: 1 hour

## Future Enhancements

### Planned Features

- Real-time match analysis during games
- Historical trend analysis
- Advanced player comparison tools
- Tournament insights and predictions
- Video analysis integration
- Social sharing of insights

### Scalability Improvements

- Distributed job processing
- Multiple AI model support
- Advanced caching strategies
- Real-time notifications
- Batch processing capabilities
