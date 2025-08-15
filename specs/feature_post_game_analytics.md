# Feature Spec: Post-Game Analytics

## Overview
The post-game analytics system provides players and organizers with detailed insights, statistics, and highlights after each match. It leverages AI and data visualization to deliver actionable feedback, performance trends, and shareable content.

## Requirements
- Generate detailed match reports and statistics (scores, accuracy, shot selection, etc.)
- Provide player-specific feedback and improvement recommendations
- Visualize key moments and performance trends
- Integrate with AI for narrative summaries and highlight generation
- Support sharing of analytics and highlights (social, email, etc.)
- Store analytics for historical review and progression tracking
- Admin/organizer access to aggregated analytics and reports
- Error handling and fallback for data gaps or processing failures

## Integration Points
- Game tracking service (match data)
- AI analytics/narrative service (summaries, highlights)
- User profile (historical analytics)
- Social/sharing service
- Admin dashboard (aggregated analytics)

## Prompt Example
```
Create a post-game analytics system that:
- Generates detailed match reports, feedback, and highlights.
- Visualizes performance trends and key moments.
- Supports sharing and historical review for players and admins.
``` 