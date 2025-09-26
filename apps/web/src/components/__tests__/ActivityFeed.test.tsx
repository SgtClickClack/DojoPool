import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityFeed from '../ActivityFeed';

// Mock activity data
const mockActivities = [
  {
    id: 'activity-1',
    type: 'match_win',
    title: 'Player1 defeated Player2',
    description: 'Great match!',
    timestamp: '2024-01-01T10:00:00Z',
    userId: 'user1',
    metadata: {
      matchId: 'match-1',
      winnerId: 'player1',
      loserId: 'player2',
    },
  },
  {
    id: 'activity-2',
    type: 'tournament_win',
    title: 'Tournament Champion!',
    description: 'Won the monthly tournament',
    timestamp: '2024-01-01T12:00:00Z',
    userId: 'user1',
    metadata: {
      tournamentId: 'tournament-1',
      tournamentName: 'Monthly Pool Tournament',
    },
  },
  {
    id: 'activity-3',
    type: 'clan_join',
    title: 'Joined Test Clan',
    description: 'Welcome to the clan!',
    timestamp: '2024-01-01T14:00:00Z',
    userId: 'user1',
    metadata: {
      clanId: 'clan-1',
      clanName: 'Test Clan',
    },
  },
];

const mockOnActivityClick = jest.fn();

const defaultProps = {
  activities: mockActivities,
  onActivityClick: mockOnActivityClick,
  filter: 'global' as const,
};

const minimalProps = {
  activities: [],
  onActivityClick: jest.fn(),
  filter: 'global' as const,
};

const propsWithFriendsFilter = {
  ...defaultProps,
  filter: 'friends' as const,
};

const loadingProps = {
  ...defaultProps,
  loading: true,
};

const errorProps = {
  ...defaultProps,
  error: 'Failed to load activities',
};

describe('ActivityFeed', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders activity items correctly', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByText('Player1 defeated Player2')).toBeInTheDocument();
    expect(screen.getByText('Tournament Champion!')).toBeInTheDocument();
    expect(screen.getByText('Joined Test Clan')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    customRender(<ActivityFeed {...loadingProps} />);
    
    expect(screen.getByText('Loading activities...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    customRender(<ActivityFeed {...errorProps} />);
    
    expect(screen.getByText('Failed to load activities')).toBeInTheDocument();
  });

  it('handles empty activities list', () => {
    customRender(<ActivityFeed {...minimalProps} />);
    
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('handles activity click', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const firstActivity = screen.getAllByRole('button')[0];
    fireEvent.click(firstActivity);
    
    expect(mockOnActivityClick).toHaveBeenCalledWith(mockActivities[0]);
  });

  it('applies friends filter', () => {
    customRender(<ActivityFeed {...propsWithFriendsFilter} />);
    
    expect(screen.getByText('Friends Activity')).toBeInTheDocument();
  });

  it('shows correct number of activities', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const activityItems = screen.getAllByRole('button');
    expect(activityItems.length).toBe(3);
  });

  it('renders timestamps correctly', () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    const timestamps = screen.getAllByText(/ago|minutes|hours|days/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it('handles activity with no description', () => {
    const activityWithoutDescription = {
      ...mockActivities[0],
      description: '',
    };
    
    customRender(<ActivityFeed activities={[activityWithoutDescription]} onActivityClick={jest.fn()} filter="global" />);
    
    expect(screen.getByText(activityWithoutDescription.title)).toBeInTheDocument();
  });

  it('renders performance test case', async () => {
    customRender(<ActivityFeed {...defaultProps} />);
    
    expect(screen.getByText(mockActivities[0].title)).toBeInTheDocument();
  }, 5000);
});
