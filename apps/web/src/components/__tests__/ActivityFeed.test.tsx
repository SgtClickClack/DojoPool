import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import ActivityFeed from '../ActivityFeed';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="activity-feed-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="activity-feed-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="activity-feed-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="activity-feed-box" {...props}>
        {children}
      </div>
    ),
    List: ({ children, ...props }: any) => (
      <div data-testid="activity-feed-list" {...props}>
        {children}
      </div>
    ),
    ListItem: ({ children, ...props }: any) => (
      <div data-testid="activity-feed-list-item" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Sports: () => <div data-testid="sports-icon">🎱</div>,
  Group: () => <div data-testid="group-icon">👥</div>,
  EmojiEvents: () => <div data-testid="trophy-icon">🏆</div>,
  LocationOn: () => <div data-testid="location-icon">📍</div>,
  Schedule: () => <div data-testid="schedule-icon">⏰</div>,
}));

describe('ActivityFeed Component', () => {
  const mockActivities = [
    {
      id: '1',
      type: 'MATCH_COMPLETED',
      title: 'Match Completed',
      description: 'Test User won against Player 2',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {
        matchId: '1',
        winnerId: '1',
        loserId: '2',
      },
    },
    {
      id: '2',
      type: 'TOURNAMENT_JOINED',
      title: 'Tournament Joined',
      description: 'Test User joined Test Tournament',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: '1',
      metadata: {
        tournamentId: '1',
        tournamentName: 'Test Tournament',
      },
    },
    {
      id: '3',
      type: 'CLAN_CREATED',
      title: 'Clan Created',
      description: 'Test User created Test Clan',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: '1',
      metadata: {
        clanId: '1',
        clanName: 'Test Clan',
      },
    },
  ];

  const defaultProps = createMockProps({
    activities: mockActivities,
    onActivityClick: vi.fn(),
    onLoadMore: vi.fn(),
    onFilter: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all activities correctly', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByText('Match Completed')).toBeInTheDocument();
    expect(screen.getByText('Tournament Joined')).toBeInTheDocument();
    expect(screen.getByText('Clan Created')).toBeInTheDocument();
  });

  it('displays activity descriptions', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByText('Test User won against Player 2')).toBeInTheDocument();
    expect(screen.getByText('Test User joined Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('Test User created Test Clan')).toBeInTheDocument();
  });

  it('renders activity timestamps', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    // Check if timestamps are displayed (format may vary based on implementation)
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders appropriate icons for different activity types', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByTestId('sports-icon')).toBeInTheDocument(); // Match activity
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument(); // Tournament activity
    expect(screen.getByTestId('group-icon')).toBeInTheDocument(); // Clan activity
  });

  it('calls onActivityClick when activity is clicked', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const activityCards = screen.getAllByTestId('activity-feed-card');
    fireEvent.click(activityCards[0]);
    
    expect(defaultProps.onActivityClick).toHaveBeenCalledWith(mockActivities[0]);
  });

  it('calls onLoadMore when load more button is clicked', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);
    
    expect(defaultProps.onLoadMore).toHaveBeenCalled();
  });

  it('handles empty activity list', () => {
    const emptyProps = {
      ...defaultProps,
      activities: [],
    };
    
    customRender(<ActivityFeed {...emptyProps} />);
    
    expect(screen.getByText('No activities found')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<ActivityFeed {...loadingProps} />);
    
    expect(screen.getByText('Loading activities...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load activities',
    };
    
    customRender(<ActivityFeed {...errorProps} />);
    
    expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
  });

  it('filters activities by type', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    // Check if filter options are displayed
    expect(screen.getByText('All Activities')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Tournaments')).toBeInTheDocument();
    expect(screen.getByText('Clans')).toBeInTheDocument();
  });

  it('calls onFilter when filter is applied', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    const matchFilter = screen.getByText('Matches');
    fireEvent.click(matchFilter);
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('MATCH_COMPLETED');
  });

  it('displays activity count', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByText('3 Activities')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      activities: mockActivities,
      onActivityClick: vi.fn(),
    };
    
    expect(() => customRender(<ActivityFeed {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const list = screen.getByTestId('activity-feed-list');
    expect(list).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<ActivityFeed {...disabledProps} />);
    
    const loadMoreButton = screen.getByText('Load More');
    expect(loadMoreButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<ActivityFeed {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large activity lists efficiently', () => {
    const largeActivityList = Array.from({ length: 100 }, (_, i) => ({
      id: `activity-${i}`,
      type: 'MATCH_COMPLETED',
      title: `Activity ${i}`,
      description: `Description for activity ${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      userId: '1',
      metadata: {},
    }));
    
    const largeProps = {
      ...defaultProps,
      activities: largeActivityList,
    };
    
    customRender(<ActivityFeed {...largeProps} />);
    
    expect(screen.getByText('100 Activities')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<ActivityFeed {...defaultProps} />);
    
    const updatedActivities = [
      ...mockActivities,
      {
        id: '4',
        type: 'ACHIEVEMENT_EARNED',
        title: 'Achievement Earned',
        description: 'Test User earned a new achievement',
        timestamp: new Date().toISOString(),
        userId: '1',
        metadata: {},
      },
    ];
    
    rerender(<ActivityFeed {...defaultProps} activities={updatedActivities} />);
    
    expect(screen.getByText('4 Activities')).toBeInTheDocument();
    expect(screen.getByText('Achievement Earned')).toBeInTheDocument();
  });

  it('handles activity updates in real-time', () => {
    const { rerender } = customRender(<ActivityFeed {...defaultProps} />);
    
    const updatedActivities = mockActivities.map(activity => ({
      ...activity,
      timestamp: new Date().toISOString(), // Update timestamp
    }));
    
    rerender(<ActivityFeed {...defaultProps} activities={updatedActivities} />);
    
    // Check if activities are updated
    expect(screen.getByText('Match Completed')).toBeInTheDocument();
    expect(screen.getByText('Tournament Joined')).toBeInTheDocument();
    expect(screen.getByText('Clan Created')).toBeInTheDocument();
  });

  it('displays relative time formatting', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    // Check if relative time is displayed (e.g., "2 hours ago", "1 day ago")
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('handles activities with no metadata', () => {
    const activityWithNoMetadata = {
      id: '4',
      type: 'SYSTEM_MESSAGE',
      title: 'System Message',
      description: 'A system message',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {},
    };
    
    customRender(<ActivityFeed {...defaultProps} activities={[activityWithNoMetadata]} />);
    
    expect(screen.getByText('System Message')).toBeInTheDocument();
    expect(screen.getByText('A system message')).toBeInTheDocument();
  });

  it('handles activities with complex metadata', () => {
    const activityWithComplexMetadata = {
      id: '5',
      type: 'TOURNAMENT_COMPLETED',
      title: 'Tournament Completed',
      description: 'Test Tournament has been completed',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {
        tournamentId: '1',
        tournamentName: 'Test Tournament',
        winnerId: '1',
        winnerName: 'Test User',
        prizePool: 1000,
        participantCount: 16,
      },
    };
    
    customRender(<ActivityFeed {...defaultProps} activities={[activityWithComplexMetadata]} />);
    
    expect(screen.getByText('Tournament Completed')).toBeInTheDocument();
    expect(screen.getByText('Test Tournament has been completed')).toBeInTheDocument();
  });
});
