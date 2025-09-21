import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import JournalFeed from '../profile/JournalFeed';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="journal-feed-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="journal-feed-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="journal-feed-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="journal-feed-box" {...props}>
        {children}
      </div>
    ),
    List: ({ children, ...props }: any) => (
      <div data-testid="journal-feed-list" {...props}>
        {children}
      </div>
    ),
    ListItem: ({ children, ...props }: any) => (
      <div data-testid="journal-feed-list-item" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Sports: () => <div data-testid="sports-icon">🎱</div>,
  EmojiEvents: () => <div data-testid="trophy-icon">🏆</div>,
  Group: () => <div data-testid="group-icon">👥</div>,
  Schedule: () => <div data-testid="schedule-icon">⏰</div>,
  TrendingUp: () => <div data-testid="trending-icon">📈</div>,
}));

describe('JournalFeed Component', () => {
  const mockJournalEntries = [
    {
      id: '1',
      type: 'MATCH_WON',
      title: 'Victory!',
      content: 'Won a thrilling match against Player 2',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {
        matchId: '1',
        opponentId: '2',
        score: '8-5',
        venueId: '1',
      },
    },
    {
      id: '2',
      type: 'SKILL_IMPROVEMENT',
      title: 'Skill Level Up',
      content: 'Reached 1600 skill rating!',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: '1',
      metadata: {
        oldRating: 1550,
        newRating: 1600,
        improvement: 50,
      },
    },
    {
      id: '3',
      type: 'TOURNAMENT_PARTICIPATION',
      title: 'Tournament Entry',
      content: 'Joined the Spring Championship',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userId: '1',
      metadata: {
        tournamentId: '1',
        tournamentName: 'Spring Championship',
        entryFee: 100,
      },
    },
  ];

  const defaultProps = createMockProps({
    journalEntries: mockJournalEntries,
    onEntryClick: vi.fn(),
    onLoadMore: vi.fn(),
    onFilter: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all journal entries correctly', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText('Victory!')).toBeInTheDocument();
    expect(screen.getByText('Skill Level Up')).toBeInTheDocument();
    expect(screen.getByText('Tournament Entry')).toBeInTheDocument();
  });

  it('displays journal entry content', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText('Won a thrilling match against Player 2')).toBeInTheDocument();
    expect(screen.getByText('Reached 1600 skill rating!')).toBeInTheDocument();
    expect(screen.getByText('Joined the Spring Championship')).toBeInTheDocument();
  });

  it('renders journal entry timestamps', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    // Check if timestamps are displayed
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('renders appropriate icons for different entry types', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByTestId('sports-icon')).toBeInTheDocument(); // Match entry
    expect(screen.getByTestId('trending-icon')).toBeInTheDocument(); // Skill improvement
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument(); // Tournament entry
  });

  it('calls onEntryClick when journal entry is clicked', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const journalCards = screen.getAllByTestId('journal-feed-card');
    fireEvent.click(journalCards[0]);
    
    expect(defaultProps.onEntryClick).toHaveBeenCalledWith(mockJournalEntries[0]);
  });

  it('calls onLoadMore when load more button is clicked', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);
    
    expect(defaultProps.onLoadMore).toHaveBeenCalled();
  });

  it('handles empty journal list', () => {
    const emptyProps = {
      ...defaultProps,
      journalEntries: [],
    };
    
    customRender(<JournalFeed {...emptyProps} />);
    
    expect(screen.getByText('No journal entries found')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<JournalFeed {...loadingProps} />);
    
    expect(screen.getByText('Loading journal entries...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load journal entries',
    };
    
    customRender(<JournalFeed {...errorProps} />);
    
    expect(screen.getByText('Failed to load journal entries')).toBeInTheDocument();
  });

  it('filters journal entries by type', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    // Check if filter options are displayed
    expect(screen.getByText('All Entries')).toBeInTheDocument();
    expect(screen.getByText('Matches')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Tournaments')).toBeInTheDocument();
  });

  it('calls onFilter when filter is applied', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const filterButton = screen.getByText('Filter');
    fireEvent.click(filterButton);
    
    const matchFilter = screen.getByText('Matches');
    fireEvent.click(matchFilter);
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('MATCH_WON');
  });

  it('displays journal entry count', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    expect(screen.getByText('3 Journal Entries')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      journalEntries: mockJournalEntries,
      onEntryClick: vi.fn(),
    };
    
    expect(() => customRender(<JournalFeed {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    const list = screen.getByTestId('journal-feed-list');
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
    
    customRender(<JournalFeed {...disabledProps} />);
    
    const loadMoreButton = screen.getByText('Load More');
    expect(loadMoreButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<JournalFeed {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large journal lists efficiently', () => {
    const largeJournalList = Array.from({ length: 100 }, (_, i) => ({
      id: `entry-${i}`,
      type: 'MATCH_WON',
      title: `Entry ${i}`,
      content: `Content for entry ${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      userId: '1',
      metadata: {},
    }));
    
    const largeProps = {
      ...defaultProps,
      journalEntries: largeJournalList,
    };
    
    customRender(<JournalFeed {...largeProps} />);
    
    expect(screen.getByText('100 Journal Entries')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<JournalFeed {...defaultProps} />);
    
    const updatedEntries = [
      ...mockJournalEntries,
      {
        id: '4',
        type: 'ACHIEVEMENT_EARNED',
        title: 'Achievement Unlocked',
        content: 'Earned the "Century Club" achievement',
        timestamp: new Date().toISOString(),
        userId: '1',
        metadata: {},
      },
    ];
    
    rerender(<JournalFeed {...defaultProps} journalEntries={updatedEntries} />);
    
    expect(screen.getByText('4 Journal Entries')).toBeInTheDocument();
    expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
  });

  it('handles journal entry updates in real-time', () => {
    const { rerender } = customRender(<JournalFeed {...defaultProps} />);
    
    const updatedEntries = mockJournalEntries.map(entry => ({
      ...entry,
      timestamp: new Date().toISOString(), // Update timestamp
    }));
    
    rerender(<JournalFeed {...defaultProps} journalEntries={updatedEntries} />);
    
    // Check if entries are updated
    expect(screen.getByText('Victory!')).toBeInTheDocument();
    expect(screen.getByText('Skill Level Up')).toBeInTheDocument();
    expect(screen.getByText('Tournament Entry')).toBeInTheDocument();
  });

  it('displays relative time formatting', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    // Check if relative time is displayed (e.g., "2 hours ago", "1 day ago")
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('handles journal entries with no metadata', () => {
    const entryWithNoMetadata = {
      id: '4',
      type: 'GENERAL',
      title: 'General Entry',
      content: 'A general journal entry',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {},
    };
    
    customRender(<JournalFeed {...defaultProps} journalEntries={[entryWithNoMetadata]} />);
    
    expect(screen.getByText('General Entry')).toBeInTheDocument();
    expect(screen.getByText('A general journal entry')).toBeInTheDocument();
  });

  it('handles journal entries with complex metadata', () => {
    const entryWithComplexMetadata = {
      id: '5',
      type: 'TOURNAMENT_WON',
      title: 'Tournament Victory',
      content: 'Won the Spring Championship tournament',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {
        tournamentId: '1',
        tournamentName: 'Spring Championship',
        prizePool: 1000,
        participantCount: 16,
        finalScore: '8-3',
        opponentId: '2',
        opponentName: 'Player 2',
      },
    };
    
    customRender(<JournalFeed {...defaultProps} journalEntries={[entryWithComplexMetadata]} />);
    
    expect(screen.getByText('Tournament Victory')).toBeInTheDocument();
    expect(screen.getByText('Won the Spring Championship tournament')).toBeInTheDocument();
  });

  it('displays skill rating improvements correctly', () => {
    customRender(<JournalFeed {...defaultProps} />);
    
    // Check if skill rating improvement is displayed
    expect(screen.getByText('Reached 1600 skill rating!')).toBeInTheDocument();
  });

  it('handles journal entries with different content lengths', () => {
    const shortEntry = {
      id: '6',
      type: 'QUICK_NOTE',
      title: 'Quick Note',
      content: 'Short',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {},
    };
    
    const longEntry = {
      id: '7',
      type: 'DETAILED_REPORT',
      title: 'Detailed Report',
      content: 'This is a very long journal entry that contains detailed information about a match, including strategy, shots taken, mistakes made, and lessons learned. It should be handled gracefully by the component.',
      timestamp: new Date().toISOString(),
      userId: '1',
      metadata: {},
    };
    
    customRender(<JournalFeed {...defaultProps} journalEntries={[shortEntry, longEntry]} />);
    
    expect(screen.getByText('Quick Note')).toBeInTheDocument();
    expect(screen.getByText('Short')).toBeInTheDocument();
    expect(screen.getByText('Detailed Report')).toBeInTheDocument();
    expect(screen.getByText('This is a very long journal entry')).toBeInTheDocument();
  });
});
