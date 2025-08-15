# Feature Spec: Video Highlight Generation (Wan 2.1 Integration)

## Overview
Implement backend support for automated post-game video highlight generation using the Wan 2.1 AI system. This will enable users to generate, view, share, and download video highlights of their games and tournaments.

## Requirements
- Expose a REST API endpoint: `POST /api/highlights/generate`
- Accept parameters: tournamentId, userId, gameType, highlights[]
- Integrate with Wan 2.1 or similar AI service to generate video highlights
- Store generated highlight metadata and video URLs in the database
- Expose endpoints to fetch, share, and download highlights
- Ensure highlights are associated with the correct tournament, user, and game
- Provide error handling and status updates for highlight generation

## API Design
- `POST /api/highlights/generate` — Trigger highlight generation
- `GET /api/highlights/tournament/<tournamentId>` — List highlights for a tournament
- `POST /api/highlights/<highlightId>/share` — Share a highlight
- `GET /api/highlights/<highlightId>/download` — Download a highlight

## Integration Points
- Frontend: VideoHighlights component, useVideoHighlights hook
- Backend: New highlights API endpoints, database models for highlights
- AI Service: Wan 2.1 or similar for video generation

## Next Steps
- Implement backend highlights API and database models
- Integrate with AI video generation service
- Connect frontend to new backend endpoints 