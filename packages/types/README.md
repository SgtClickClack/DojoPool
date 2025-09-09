# @dojopool/types

Shared TypeScript types and interfaces for the DojoPool platform. This package provides unified type definitions across the entire monorepo, ensuring type safety and consistency between frontend and backend applications.

## 📦 Installation

This package is automatically available in the monorepo. No additional installation is required.

```bash
# From the monorepo root
pnpm install
```

## 📋 Type Categories

### Analytics Types (`types/analytics.ts`)

Real-time analytics and dashboard data types.

```typescript
import { AnalyticsData, RealtimeMetrics, AnalyticsSSEEvent, AnalyticsFilter } from '@dojopool/types';

// Analytics dashboard data
interface AnalyticsData {
  dau: number;                    // Daily active users
  mau: number;                    // Monthly active users
  totalUsers: number;             // Total registered users
  totalEvents: number;            // Total events recorded
  topEvents: Array<{              // Most frequent events
    eventName: string;
    count: number;
  }>;
  userEngagement: Array<{         // User engagement metrics
    date: string;
    activeUsers: number;
    sessions: number;
    avgSessionLength: number;
  }>;
  featureUsage: Array<{           // Feature usage statistics
    feature: string;
    usageCount: number;
    uniqueUsers: number;
  }>;
  systemPerformance: {            // System performance metrics
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  economyMetrics: {               // Economic metrics
    totalTransactions: number;
    totalVolume: number;
    avgTransactionValue: number;
  };
}

// Real-time metrics (subset of AnalyticsData)
interface RealtimeMetrics {
  dau: number;
  totalEvents: number;
  topEvents: Array<{ eventName: string; count: number }>;
  systemPerformance: { ... };
  economyMetrics: { ... };
}

// Server-Sent Events for real-time updates
interface AnalyticsSSEEvent {
  type: 'analytics_update' | 'realtime_update' | 'error';
  data: AnalyticsData | RealtimeMetrics | { message: string; timestamp: string };
  timestamp: string;
}

// Analytics query filters
interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  timeRange: '7d' | '30d' | '90d';
}
```

### Dashboard Types (`types/dashboard.ts`)

User dashboard and statistics types.

```typescript
import { DashboardStats, CdnCostResponse } from '@dojopool/types';

// User dashboard statistics
interface DashboardStats {
  dojoCoinBalance: number;
  matches: {
    wins: number;
    losses: number;
    total: number;
  };
  tournaments: {
    joined: number;
  };
}

// CDN cost tracking
interface CdnCostResponse {
  period: string; // e.g., "Last 30 Days"
  totalBandwidthGB: number;
  totalCostUSD: number;
  dailyBreakdown: Array<{
    date: string; // YYYY-MM-DD
    gb: number; // Bandwidth in GB
    cost: number; // Cost in USD
  }>;
}
```

### Feedback Types (`types/feedback.ts`)

User feedback and content moderation types.

```typescript
import {
  Feedback,
  CreateFeedbackRequest,
  FeedbackFilter,
  FeedbackListResponse,
  ModerateContentRequest,
} from '@dojopool/types';

// Feedback types (inherited from existing feedback system)
```

### Content Types (`types/content.ts`)

Content management and sharing types.

```typescript
import {
  Content,
  ContentFilter,
  ContentListResponse,
  CreateContentRequest,
  UpdateContentRequest,
} from '@dojopool/types';

// Content types (inherited from existing content system)
```

## 🔧 Usage Examples

### Frontend Usage

```typescript
// In React components
import { AnalyticsData, DashboardStats } from '@dojopool/types';
import { useState, useEffect } from 'react';

function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    // Fetch analytics data with proper typing
    fetchAnalytics().then(setData);
    fetchDashboardStats().then(setStats);
  }, []);

  return (
    <div>
      {data && (
        <div>
          <h3>Daily Active Users: {data.dau}</h3>
          <h3>Monthly Active Users: {data.mau}</h3>
        </div>
      )}
      {stats && (
        <div>
          <h3>DojoCoin Balance: {stats.dojoCoinBalance}</h3>
          <h3>Matches Won: {stats.matches.wins}</h3>
        </div>
      )}
    </div>
  );
}
```

### Backend Usage

```typescript
// In NestJS controllers
import { AnalyticsData, DashboardStats } from '@dojopool/types';
import { Controller, Get } from '@nestjs/common';

@Controller('dashboard')
export class DashboardController {
  @Get('analytics')
  async getAnalytics(): Promise<AnalyticsData> {
    // Return properly typed analytics data
    return this.analyticsService.getAnalyticsData();
  }

  @Get('stats')
  async getStats(): Promise<DashboardStats> {
    // Return properly typed dashboard stats
    return this.dashboardService.getUserStats();
  }
}
```

### Real-time Analytics with SSE

```typescript
// Using Server-Sent Events for real-time updates
import { AnalyticsSSEEvent, AnalyticsFilter } from '@dojopool/types';

class AnalyticsService {
  private eventSource: EventSource | null = null;

  startRealTimeUpdates(filter: AnalyticsFilter): void {
    this.eventSource = new EventSource(`/api/analytics/stream`);

    this.eventSource.onmessage = (event) => {
      const sseEvent: AnalyticsSSEEvent = JSON.parse(event.data);

      switch (sseEvent.type) {
        case 'analytics_update':
          console.log('Analytics updated:', sseEvent.data);
          break;
        case 'error':
          console.error('Analytics error:', sseEvent.data);
          break;
      }
    };
  }

  stopRealTimeUpdates(): void {
    this.eventSource?.close();
  }
}
```

## 🏗️ Architecture

### Type Organization

```
packages/types/
├── src/
│   ├── index.ts                 # Main exports
│   └── types/
│       ├── analytics.ts         # Analytics & real-time data types
│       ├── dashboard.ts         # Dashboard & statistics types
│       ├── feedback.ts          # Feedback system types
│       └── content.ts           # Content management types
├── package.json                 # Package configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This documentation
```

### Build Process

```bash
# Build the types package
npm run build

# Development build with watch mode
npm run dev

# Clean build artifacts
npm run clean
```

## 🔗 Integration Points

### Frontend Integration

- **Next.js Apps**: Import types directly from `@dojopool/types`
- **API Calls**: Use typed interfaces for request/response data
- **State Management**: Type-safe Redux/Zustand stores
- **Real-time Updates**: SSE event handling with proper typing

### Backend Integration

- **NestJS Controllers**: Return properly typed responses
- **Services**: Use shared types for method signatures
- **DTOs**: Validate requests with shared type definitions
- **WebSocket Events**: Type-safe event payloads

### Shared Benefits

- **Type Safety**: Compile-time error checking across the monorepo
- **Consistency**: Unified data shapes between frontend and backend
- **Documentation**: Self-documenting code with TypeScript
- **Developer Experience**: IntelliSense and auto-completion
- **Maintainability**: Single source of truth for all types

## 🚀 Best Practices

### Type Definition Guidelines

1. **Descriptive Names**: Use clear, descriptive interface names
2. **Optional Fields**: Mark optional fields with `?` when appropriate
3. **Union Types**: Use union types for polymorphic data
4. **Generic Types**: Leverage TypeScript generics for reusable patterns
5. **Documentation**: Add JSDoc comments to complex interfaces

### Usage Guidelines

1. **Import Selectively**: Import only the types you need
2. **Type Guards**: Use type guards for runtime type checking
3. **Extensibility**: Design types to be easily extensible
4. **Validation**: Use types with validation libraries (class-validator, zod)
5. **Testing**: Include types in your test files for better test coverage

### Maintenance Guidelines

1. **Version Control**: Update types in feature branches
2. **Breaking Changes**: Document breaking changes clearly
3. **Deprecation**: Mark deprecated types with `@deprecated` comments
4. **Migration**: Provide migration guides for major updates
5. **Review Process**: Require code review for type changes

## 📊 Metrics & Monitoring

Track the effectiveness of the shared types package:

- **Type Coverage**: Percentage of codebase using shared types
- **Error Reduction**: Reduction in type-related runtime errors
- **Developer Productivity**: Time saved through better IntelliSense
- **API Consistency**: Reduction in frontend-backend data mismatches

## 🔐 Security Considerations

- **Data Validation**: Always validate data at runtime, even with TypeScript
- **Input Sanitization**: Sanitize user inputs before processing
- **Access Control**: Use types in conjunction with authorization checks
- **Audit Logging**: Log type validation failures for security monitoring

## 📚 Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [JSON Schema](https://json-schema.org/)

## 🤝 Contributing

When adding new types to this package:

1. **Create**: Add new interfaces to appropriate type files
2. **Export**: Update `src/index.ts` to export new types
3. **Document**: Update this README with usage examples
4. **Test**: Ensure types work correctly in both frontend and backend
5. **Review**: Get approval from team members before merging

---

**DojoPool** - _The Ultimate Pool Gaming Platform_
