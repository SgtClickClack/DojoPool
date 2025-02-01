# DojoPool Frontend Ranking Components

## Overview

The DojoPool frontend includes several React components for displaying and interacting with the ranking system. These components provide a rich, interactive user experience for viewing global rankings, player statistics, and tournament results.

## Components

### GlobalRankings

The main component for displaying the global rankings table.

#### Props

```typescript
interface GlobalRankingsProps {
  pageSize?: number;
  initialSort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  filters?: {
    tier?: string;
    minRating?: number;
    maxRating?: number;
  };
  onPlayerClick?: (userId: string) => void;
}
```

#### Features

- Sortable columns
- Pagination controls
- Tier filtering
- Rating range filtering
- Real-time updates
- Visual tier indicators
- Rank movement arrows
- Win/loss streak display

#### Example Usage

```tsx
import { GlobalRankings } from '@/components/rankings';

function RankingsPage() {
  return (
    <GlobalRankings
      pageSize={20}
      initialSort={{ field: 'rating', direction: 'desc' }}
      filters={{ tier: 'Master' }}
      onPlayerClick={(userId) => {
        // Handle player click
      }}
    />
  );
}
```

### PlayerStatsModal

Modal component for displaying detailed player statistics.

#### Props

```typescript
interface PlayerStatsModalProps {
  playerId: string;
  onClose: () => void;
}
```

#### Features

- Rating history chart
- Performance metrics
- Recent games list
- Tournament results
- Tier progression
- Rank movement tracking
- Achievement display

#### Example Usage

```tsx
import { PlayerStatsModal } from '@/components/rankings';

function PlayerProfile({ playerId }: { playerId: string }) {
  const [showStats, setShowStats] = useState(false);

  return (
    <>
      <button onClick={() => setShowStats(true)}>
        View Stats
      </button>
      {showStats && (
        <PlayerStatsModal
          playerId={playerId}
          onClose={() => setShowStats(false)}
        />
      )}
    </>
  );
}
```

### RatingHistoryChart

Chart component for visualizing rating progression.

#### Props

```typescript
interface RatingHistoryChartProps {
  data: {
    date: string;
    rating: number;
    rank: number;
    tier: string;
  }[];
  width?: number;
  height?: number;
  showTiers?: boolean;
}
```

#### Features

- Line chart with rating progression
- Tier zone highlighting
- Tooltips with detailed information
- Zoom and pan controls
- Date range selection

#### Example Usage

```tsx
import { RatingHistoryChart } from '@/components/rankings';

function PlayerStats({ ratingHistory }) {
  return (
    <RatingHistoryChart
      data={ratingHistory}
      width={800}
      height={400}
      showTiers={true}
    />
  );
}
```

### TierBadge

Component for displaying player tiers with appropriate styling.

#### Props

```typescript
interface TierBadgeProps {
  tier: string;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}
```

#### Features

- Tier-specific colors
- Optional tier icon
- Multiple size variants
- Hover effects
- Accessibility support

#### Example Usage

```tsx
import { TierBadge } from '@/components/rankings';

function PlayerCard({ tier }) {
  return (
    <div className="player-info">
      <TierBadge
        tier={tier}
        size="medium"
        showIcon={true}
      />
    </div>
  );
}
```

## Hooks

### useGlobalRankings

Custom hook for fetching and managing global rankings data.

```typescript
const useGlobalRankings = (options: {
  page: number;
  pageSize: number;
  sort?: {
    field: string;
    direction: string;
  };
  filters?: {
    tier?: string;
    minRating?: number;
    maxRating?: number;
  };
}) => {
  // Returns
  return {
    rankings: Ranking[];
    loading: boolean;
    error: Error | null;
    totalPages: number;
    refresh: () => void;
  };
};
```

### usePlayerStats

Custom hook for fetching and managing player statistics.

```typescript
const usePlayerStats = (playerId: string) => {
  // Returns
  return {
    stats: PlayerStats;
    loading: boolean;
    error: Error | null;
    refresh: () => void;
  };
};
```

## Styling

### Theme Configuration

```typescript
const rankingTheme = {
  colors: {
    tier: {
      poolGod: '#FFD700',
      divine: '#FF69B4',
      mythic: '#9400D3',
      // ... other tier colors
    },
    movement: {
      up: '#32CD32',
      down: '#FF4500',
      neutral: '#808080',
    },
  },
  typography: {
    tierBadge: {
      fontFamily: 'Roboto',
      fontWeight: 600,
      // ... other typography settings
    },
  },
};
```

### CSS Modules

Each component has its own CSS module for styling:

- `GlobalRankings.module.css`
- `PlayerStatsModal.module.css`
- `RatingHistoryChart.module.css`
- `TierBadge.module.css`

## Best Practices

1. Data Management
   - Implement proper loading states
   - Handle errors gracefully
   - Cache responses appropriately
   - Use optimistic updates

2. Performance
   - Virtualize large lists
   - Lazy load components
   - Memoize expensive calculations
   - Debounce frequent updates

3. Accessibility
   - Use semantic HTML
   - Include ARIA labels
   - Support keyboard navigation
   - Maintain proper contrast

4. Responsive Design
   - Mobile-first approach
   - Flexible layouts
   - Appropriate touch targets
   - Responsive typography

5. State Management
   - Use appropriate React hooks
   - Implement proper prop drilling
   - Handle side effects correctly
   - Maintain clean component hierarchy

## Testing

### Unit Tests

```typescript
describe('GlobalRankings', () => {
  it('renders rankings table', () => {
    // Test implementation
  });

  it('handles sorting', () => {
    // Test implementation
  });

  it('handles pagination', () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
describe('PlayerStatsModal', () => {
  it('loads player statistics', () => {
    // Test implementation
  });

  it('updates chart on date range change', () => {
    // Test implementation
  });
});
```

## Error Handling

1. Loading States
   - Show appropriate loading indicators
   - Maintain layout stability
   - Provide feedback for long operations

2. Error States
   - Display user-friendly error messages
   - Offer retry options
   - Maintain partial functionality

3. Empty States
   - Show helpful empty state messages
   - Provide guidance for next steps
   - Maintain visual consistency

## Future Improvements

1. Real-time Updates
   - WebSocket integration
   - Live ranking changes
   - Instant notifications

2. Advanced Filtering
   - Custom date ranges
   - Complex search queries
   - Advanced statistics

3. Data Visualization
   - Additional chart types
   - Interactive visualizations
   - Performance insights

4. Social Features
   - Player comparisons
   - Share statistics
   - Challenge system 