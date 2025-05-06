# Feature Spec: Dashboard Component

## Overview
The Dashboard provides users with a central hub for accessing analytics, notifications, active games, tournaments, wallet, profile, and social feed. It supports both player and admin views, with real-time updates and integration with core services.

## Requirements
- Display personalized analytics (games played, win rate, average score, etc.)
- Show notifications and real-time alerts
- List active games and allow game creation
- Display tournaments and allow registration
- Integrate wallet and Dojo Coins balance
- Show user profile and social feed
- Support admin view for aggregated analytics
- Real-time updates via WebSocket or similar
- Error handling and loading states

## Integration Points
- Analytics service (metrics, summaries)
- Game service (active games, creation)
- Tournament service (list, registration)
- Wallet service (balance, transactions)
- Profile service (user data)
- Notification service (alerts, messages)
- WebSocket/Socket service (real-time updates)

## Prompt Example
```
Create a dashboard that:
- Shows personalized analytics and notifications.
- Lists active games and tournaments.
- Integrates wallet, profile, and social feed.
- Supports real-time updates and admin analytics.
``` 