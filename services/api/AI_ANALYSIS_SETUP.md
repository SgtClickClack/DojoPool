# AI-Powered Post-Match Analysis Setup

## Overview

The Post-Match Analysis feature uses Google's Gemini AI to automatically generate insightful analysis of completed pool matches.

## Setup Steps

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Environment Variables

Create a `.env` file in the `services/api` directory with:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
DATABASE_URL="file:./dev.db"
JWT_SECRET_KEY=your_jwt_secret_here
NODE_ENV=development
```

### 3. Database Migration

The database schema has been updated with the `aiAnalysisJson` field. Run:

```bash
npx prisma migrate dev
```

### 4. Test the Feature

#### Finalize a Match

```bash
PUT /api/v1/matches/:matchId/finalize
{
  "winnerId": "player-id",
  "scoreA": 7,
  "scoreB": 5
}
```

#### Get Match with Analysis

```bash
GET /api/v1/matches/:matchId/analysis
```

## How It Works

1. **Match Finalization**: When a match is finalized via the API, it automatically triggers AI analysis generation
2. **AI Processing**: The Gemini API analyzes match data and generates structured insights
3. **Storage**: Analysis is stored as JSON in the `aiAnalysisJson` field
4. **Retrieval**: Analysis can be retrieved alongside match details

## AI Analysis Structure

The AI generates analysis in this format:

```json
{
  "keyMoments": ["Key moments from the match"],
  "strategicInsights": ["Strategic observations"],
  "playerPerformance": {
    "playerA": "Assessment of Player A",
    "playerB": "Assessment of Player B"
  },
  "overallAssessment": "Overall match summary",
  "recommendations": ["Improvement suggestions"]
}
```

## Error Handling

- If Gemini API is unavailable, fallback analysis is generated
- Failed analysis generation doesn't prevent match finalization
- All errors are logged for debugging

## Dependencies

- `@google/generative-ai`: Google's official Gemini client
- `@nestjs/config`: Configuration management
- Prisma: Database operations
