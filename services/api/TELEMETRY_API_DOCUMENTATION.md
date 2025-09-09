# Telemetry & Analytics API Documentation

## Overview

The Telemetry & Analytics API provides comprehensive tools for collecting, processing, and analyzing user behavior and system performance data in the Dojo Pool platform. This system enables real-time monitoring, data-driven decision making, and performance optimization.

## Architecture

### Components

1. **TelemetryService** - Core service for processing telemetry events
2. **TelemetryController** - REST API endpoints for event submission
3. **AnalyticsController** - REST API endpoints for dashboard data
4. **TelemetryEvent Model** - Database schema for storing events
5. **AnalyticsCache Model** - Caching layer for aggregated data

### Data Flow

```
Client → Telemetry API → TelemetryService → Database
                                      ↓
Analytics Dashboard ← Analytics API ← Cache Layer
```

## Authentication & Authorization

### Telemetry Events (Public)

- **Endpoint**: `POST /api/v1/telemetry/event`
- **Authentication**: Optional (anonymous events allowed)
- **Purpose**: Collect user interaction data

### Analytics Data (Admin Only)

- **Endpoint**: `GET /api/v1/analytics/*`
- **Authentication**: Required (JWT token)
- **Authorization**: Admin role required
- **Purpose**: Access dashboard analytics

## Telemetry API

### POST /api/v1/telemetry/event

Submit a single telemetry event.

#### Request

```http
POST /api/v1/telemetry/event
Content-Type: application/json
Authorization: Bearer <optional-jwt-token>

{
  "eventName": "user_login",
  "userId": "user-123",
  "sessionId": "session-456",
  "data": {
    "source": "web",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Parameters

| Field       | Type   | Required | Description                                         |
| ----------- | ------ | -------- | --------------------------------------------------- |
| `eventName` | string | Yes      | Name of the event (e.g., "user_login", "page_view") |
| `userId`    | string | No       | User identifier (if authenticated)                  |
| `sessionId` | string | No       | Session identifier for tracking                     |
| `data`      | object | No       | Additional event data (JSON)                        |

#### Response

```json
{
  "status": "accepted"
}
```

#### Status Codes

- `202` - Event accepted for processing
- `400` - Invalid request data
- `500` - Server error

### POST /api/v1/telemetry/events

Submit multiple telemetry events in batch.

#### Request

```http
POST /api/v1/telemetry/events
Content-Type: application/json

[
  {
    "eventName": "page_view",
    "userId": "user-123",
    "data": { "page": "/dashboard" }
  },
  {
    "eventName": "button_click",
    "userId": "user-123",
    "data": { "button": "start_match" }
  }
]
```

#### Response

```json
{
  "status": "accepted",
  "count": 2
}
```

## Analytics API

### GET /api/v1/analytics/dashboard

Get comprehensive analytics dashboard data.

#### Request

```http
GET /api/v1/analytics/dashboard?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z
Authorization: Bearer <admin-jwt-token>
```

#### Query Parameters

| Parameter   | Type     | Required | Default      | Description              |
| ----------- | -------- | -------- | ------------ | ------------------------ |
| `startDate` | ISO 8601 | No       | 30 days ago  | Start date for analytics |
| `endDate`   | ISO 8601 | No       | Current date | End date for analytics   |

#### Response

```json
{
  "dau": 1250,
  "mau": 4200,
  "totalUsers": 8500,
  "totalEvents": 45678,
  "topEvents": [
    {
      "eventName": "user_login",
      "count": 1250
    }
  ],
  "userEngagement": [
    {
      "date": "2024-01-15",
      "activeUsers": 1100,
      "sessions": 1350,
      "avgSessionLength": 1650
    }
  ],
  "featureUsage": [
    {
      "feature": "Matches",
      "usageCount": 5200,
      "uniqueUsers": 850
    }
  ],
  "systemPerformance": {
    "avgResponseTime": 145,
    "errorRate": 0.8,
    "uptime": 99.7
  },
  "economyMetrics": {
    "totalTransactions": 1250,
    "totalVolume": 50000,
    "avgTransactionValue": 40
  }
}
```

### GET /api/v1/analytics/realtime

Get real-time metrics for live dashboard updates.

#### Request

```http
GET /api/v1/analytics/realtime?hours=24
Authorization: Bearer <admin-jwt-token>
```

#### Response

```json
{
  "dau": 1180,
  "totalEvents": 42350,
  "topEvents": [
    {
      "eventName": "user_login",
      "count": 1180
    }
  ],
  "systemPerformance": {
    "avgResponseTime": 138,
    "errorRate": 0.7,
    "uptime": 99.8
  },
  "economyMetrics": {
    "totalTransactions": 1180,
    "totalVolume": 47200,
    "avgTransactionValue": 40
  },
  "lastUpdated": "2024-01-21T14:30:00.000Z"
}
```

### GET /api/v1/analytics/engagement

Get user engagement data for charts.

#### Response

```json
{
  "userEngagement": [
    {
      "date": "2024-01-15",
      "activeUsers": 1100,
      "sessions": 1350,
      "avgSessionLength": 1650
    }
  ],
  "dau": 1250,
  "mau": 4200
}
```

### GET /api/v1/analytics/features

Get feature usage analytics.

#### Response

```json
{
  "featureUsage": [
    {
      "feature": "Matches",
      "usageCount": 5200,
      "uniqueUsers": 850
    }
  ],
  "topEvents": [
    {
      "eventName": "user_login",
      "count": 1250
    }
  ]
}
```

### GET /api/v1/analytics/performance

Get system performance metrics.

#### Response

```json
{
  "systemPerformance": {
    "avgResponseTime": 145,
    "errorRate": 0.8,
    "uptime": 99.7
  },
  "userEngagement": [...]
}
```

### GET /api/v1/analytics/economy

Get economy and transaction metrics.

#### Response

```json
{
  "economyMetrics": {
    "totalTransactions": 1250,
    "totalVolume": 50000,
    "avgTransactionValue": 40
  },
  "totalUsers": 8500
}
```

## Event Types

### User Events

| Event Name       | Description          | Data Fields          |
| ---------------- | -------------------- | -------------------- |
| `user_login`     | User authentication  | `source`, `method`   |
| `user_register`  | User registration    | `source`, `referrer` |
| `user_logout`    | User logout          | `sessionDuration`    |
| `profile_update` | Profile modification | `fields`             |

### Navigation Events

| Event Name     | Description      | Data Fields                    |
| -------------- | ---------------- | ------------------------------ |
| `page_view`    | Page navigation  | `page`, `referrer`, `loadTime` |
| `menu_click`   | Menu interaction | `menuItem`, `section`          |
| `search_query` | Search usage     | `query`, `results`, `filters`  |

### Game Events

| Event Name        | Description        | Data Fields                   |
| ----------------- | ------------------ | ----------------------------- |
| `match_start`     | Match initiation   | `gameMode`, `opponentId`      |
| `match_end`       | Match completion   | `winner`, `duration`, `score` |
| `tournament_join` | Tournament entry   | `tournamentId`, `entryFee`    |
| `tournament_win`  | Tournament victory | `prize`, `rank`               |

### Social Events

| Event Name       | Description         | Data Fields           |
| ---------------- | ------------------- | --------------------- |
| `friend_request` | Friend request sent | `targetUserId`        |
| `clan_join`      | Clan membership     | `clanId`, `role`      |
| `message_send`   | Message sent        | `recipientId`, `type` |

### Feature Events

| Event Name             | Description       | Data Fields                   |
| ---------------------- | ----------------- | ----------------------------- |
| `avatar_customization` | Avatar editing    | `changes`, `timeSpent`        |
| `territory_claim`      | Territory capture | `territoryId`, `cost`         |
| `marketplace_purchase` | Item purchase     | `itemId`, `price`, `currency` |

### System Events

| Event Name           | Description        | Data Fields                          |
| -------------------- | ------------------ | ------------------------------------ |
| `api_request`        | API call made      | `endpoint`, `method`, `responseTime` |
| `api_error`          | API error occurred | `endpoint`, `errorCode`, `message`   |
| `performance_metric` | Performance data   | `metric`, `value`, `context`         |

## Client Integration

### JavaScript/TypeScript

```javascript
// Send single event
const sendEvent = async (eventName, data) => {
  try {
    await fetch('/api/v1/telemetry/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include JWT token if authenticated
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        eventName,
        userId: currentUser?.id,
        sessionId: sessionId,
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      }),
    });
  } catch (error) {
    console.error('Failed to send telemetry event:', error);
  }
};

// Usage examples
sendEvent('page_view', { page: '/dashboard' });
sendEvent('button_click', { button: 'start_match', section: 'game_lobby' });
sendEvent('match_start', { gameMode: 'ranked', opponentId: 'user-456' });
```

### React Hook

```javascript
import { useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const useTelemetry = () => {
  const { user } = useAuth();

  const sendEvent = useCallback(async (eventName: string, data: any = {}) => {
    try {
      const eventData = {
        eventName,
        userId: user?.id,
        sessionId: sessionStorage.getItem('sessionId'),
        data: {
          ...data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      };

      const response = await fetch('/api/v1/telemetry/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token && { 'Authorization': `Bearer ${user.token}` })
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        console.warn('Telemetry event not accepted:', response.status);
      }
    } catch (error) {
      console.error('Failed to send telemetry event:', error);
    }
  }, [user]);

  // Track page views automatically
  useEffect(() => {
    sendEvent('page_view', {
      page: window.location.pathname,
      referrer: document.referrer
    });
  }, []);

  // Track user interactions
  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.closest('button');
        const buttonText = button?.textContent?.trim() || 'unknown';
        sendEvent('button_click', {
          button: buttonText,
          elementId: button?.id,
          className: button?.className
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [sendEvent]);

  return { sendEvent };
};
```

### Automatic Event Tracking

```javascript
// Global event tracking
const trackEvent = (eventName, data = {}) => {
  // Queue events to prevent blocking
  setTimeout(async () => {
    try {
      const response = await fetch('/api/v1/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          data: {
            ...data,
            timestamp: new Date().toISOString(),
            sessionId: getSessionId(),
            url: window.location.href,
          },
        }),
      });
    } catch (error) {
      // Silently fail to avoid breaking user experience
      console.debug('Telemetry tracking failed:', error);
    }
  }, 0);
};

// Track performance metrics
const trackPerformance = () => {
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    trackEvent('page_performance', {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domReady:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      firstPaint: paint.find((entry) => entry.name === 'first-paint')
        ?.startTime,
      largestContentfulPaint: paint.find(
        (entry) => entry.name === 'largest-contentful-paint'
      )?.startTime,
    });
  }
};

// Track errors
window.addEventListener('error', (event) => {
  trackEvent('javascript_error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  trackEvent('promise_rejection', {
    reason: event.reason?.toString(),
    stack: event.reason?.stack,
  });
});
```

## Data Processing

### Event Processing Pipeline

1. **Ingestion** - Events are received via HTTP POST
2. **Validation** - Event data is validated and sanitized
3. **Enrichment** - Additional metadata is added (IP, timestamp, etc.)
4. **Storage** - Events are stored in the database asynchronously
5. **Processing** - Background jobs process and aggregate events
6. **Caching** - Aggregated data is cached for fast dashboard access

### Background Processing

```javascript
// Process pending events (run as cron job)
const processPendingEvents = async () => {
  const pendingEvents = await prisma.telemetryEvent.findMany({
    where: { processed: false },
    take: 1000,
  });

  for (const event of pendingEvents) {
    // Process event (update aggregations, send alerts, etc.)
    await processEvent(event);

    // Mark as processed
    await prisma.telemetryEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    });
  }
};
```

## Privacy & Compliance

### Data Retention

- **Raw Events**: 90 days (configurable)
- **Aggregated Data**: 1 year
- **User-identifiable Data**: 30 days (GDPR compliance)

### Data Anonymization

- IP addresses are hashed before storage
- User agents are truncated to essential information
- Session IDs are rotated regularly

### User Consent

- Analytics tracking requires user consent
- Users can opt-out of tracking
- Anonymous tracking available for non-authenticated users

## Monitoring & Maintenance

### Health Checks

```javascript
// Telemetry system health check
const healthCheck = async () => {
  const metrics = {
    totalEvents: await prisma.telemetryEvent.count(),
    pendingEvents: await prisma.telemetryEvent.count({
      where: { processed: false },
    }),
    recentEvents: await prisma.telemetryEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    }),
  };

  return {
    status: metrics.pendingEvents < 1000 ? 'healthy' : 'degraded',
    metrics,
  };
};
```

### Cleanup Jobs

```javascript
// Cleanup old events (run daily)
const cleanupOldEvents = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days

  const deletedCount = await prisma.telemetryEvent.deleteMany({
    where: {
      timestamp: { lt: cutoffDate },
      processed: true,
    },
  });

  console.log(`Cleaned up ${deletedCount} old telemetry events`);
};
```

## Troubleshooting

### Common Issues

1. **High Event Volume**
   - Implement event sampling
   - Use batch endpoints for bulk events
   - Consider rate limiting per user

2. **Database Performance**
   - Add database indexes on frequently queried fields
   - Implement data partitioning by date
   - Use read replicas for analytics queries

3. **Memory Usage**
   - Process events in smaller batches
   - Implement streaming for large datasets
   - Monitor memory usage and implement limits

4. **Real-time Latency**
   - Use caching for frequently accessed data
   - Implement background processing for heavy computations
   - Consider using Redis for real-time aggregations

### Debug Mode

```javascript
// Enable debug logging
const DEBUG_TELEMETRY = process.env.NODE_ENV === 'development';

if (DEBUG_TELEMETRY) {
  console.log('Telemetry event:', {
    eventName,
    userId,
    data,
    timestamp: new Date().toISOString(),
  });
}
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_telemetry_event_name ON telemetry_event(event_name);
CREATE INDEX idx_telemetry_user_id ON telemetry_event(user_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry_event(timestamp);
CREATE INDEX idx_telemetry_processed ON telemetry_event(processed);

-- Partition by month for better performance
CREATE TABLE telemetry_event_y2024m01 PARTITION OF telemetry_event
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy

```javascript
// Cache frequently accessed analytics
const CACHE_TTL = 300; // 5 minutes

const getCachedAnalytics = async (key: string) => {
  let cached = await redis.get(`analytics:${key}`);
  if (cached) return JSON.parse(cached);

  const data = await calculateAnalytics(key);
  await redis.setex(`analytics:${key}`, CACHE_TTL, JSON.stringify(data));
  return data;
};
```

### Batch Processing

```javascript
// Process events in batches to reduce database load
const BATCH_SIZE = 100;

const processEventsBatch = async (events: TelemetryEvent[]) => {
  const batches = [];
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    batches.push(events.slice(i, i + BATCH_SIZE));
  }

  for (const batch of batches) {
    await prisma.telemetryEvent.createMany({ data: batch });
    await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
  }
};
```

## Security Considerations

### Input Validation

```javascript
const validateEventData = (data: any) => {
  if (!data.eventName || typeof data.eventName !== 'string') {
    throw new Error('Invalid event name');
  }

  if (data.userId && typeof data.userId !== 'string') {
    throw new Error('Invalid user ID');
  }

  // Sanitize data to prevent injection attacks
  if (data.data) {
    data.data = sanitizeObject(data.data);
  }

  return data;
};
```

### Rate Limiting

```javascript
const rateLimiter = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute per IP
  message: 'Too many telemetry events, please try again later',
};
```

### Audit Logging

```javascript
const logAuditEvent = (event: TelemetryEvent, action: string) => {
  console.log(`[AUDIT] ${action}: ${event.eventName} by ${event.userId || 'anonymous'}`);
};
```

This comprehensive telemetry system provides deep insights into user behavior while maintaining performance, privacy, and security standards.
