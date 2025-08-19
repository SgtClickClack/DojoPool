# Feature Spec: Tournament Registration & Discovery UI

## Overview

The tournament registration and discovery UI allows users to browse, search, and register for upcoming tournaments. It provides filtering, registration workflows, and real-time updates on tournament status.

## Requirements

- List and search upcoming tournaments
- Filter tournaments by type, state, and search term
- View tournament details (name, description, type, state, prize pool, player count, etc.)
- Register for tournaments with multi-step workflow (details, rules, payment)
- Show registration status and handle errors
- Real-time updates on tournament availability and registration
- Admin/organizer view for managing tournaments
- Error handling and loading states

## Integration Points

- Tournament service (list, details, registration)
- User profile (registration status)
- Payment service (entry fees)
- Notification service (registration updates)
- WebSocket/Socket service (real-time updates)

## Prompt Example

```
Create a tournament registration and discovery UI that:
- Lists and filters upcoming tournaments.
- Allows users to register with a multi-step workflow.
- Shows real-time updates and handles errors.
- Supports admin/organizer management features.
```
