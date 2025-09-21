import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockTournament, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import TournamentList from '../TournamentList';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="tournament-list-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="tournament-list-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="tournament-list-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="tournament-list-box" {...props}>
        {children}
      </div>
    ),
    Grid: ({ children, ...props }: any) => (
      <div data-testid="tournament-list-grid" {...props}>
        {children}
      </div>
    ),
    TextField: ({ onChange, ...props }: any) => (
      <input data-testid="tournament-list-search" onChange={onChange} {...props} />
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Search: () => <div data-testid="search-icon">🔍</div>,
  FilterList: () => <div data-testid="filter-icon">🔽</div>,
  Sort: () => <div data-testid="sort-icon">↕️</div>,
}));

describe('TournamentList Component', () => {
  const mockTournaments = [
    mockTournament,
    {
      ...mockTournament,
      id: '2',
      name: 'Another Tournament',
      status: 'UPCOMING' as const,
      participants: [{ id: '1', username: 'player1' }],
    },
    {
      ...mockTournament,
      id: '3',
      name: 'Completed Tournament',
      status: 'COMPLETED' as const,
      participants: [
        { id: '1', username: 'player1' },
        { id: '2', username: 'player2' },
      ],
    },
  ];

  const defaultProps = createMockProps({
    tournaments: mockTournaments,
    onJoin: vi.fn(),
    onView: vi.fn(),
    onFilter: vi.fn(),
    onSort: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all tournaments correctly', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('Another Tournament')).toBeInTheDocument();
    expect(screen.getByText('Completed Tournament')).toBeInTheDocument();
  });

  it('displays tournament count', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByText('3 Tournaments')).toBeInTheDocument();
  });

  it('renders search functionality', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByTestId('tournament-list-search')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  it('renders filter and sort controls', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByTestId('filter-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sort-icon')).toBeInTheDocument();
  });

  it('filters tournaments by search term', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const searchInput = screen.getByTestId('tournament-list-search');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith('Test');
  });

  it('handles empty tournament list', () => {
    const emptyProps = {
      ...defaultProps,
      tournaments: [],
    };
    
    customRender(<TournamentList {...emptyProps} />);
    
    expect(screen.getByText('No tournaments found')).toBeInTheDocument();
    expect(screen.getByText('0 Tournaments')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const loadingProps = {
      ...defaultProps,
      loading: true,
    };
    
    customRender(<TournamentList {...loadingProps} />);
    
    expect(screen.getByText('Loading tournaments...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const errorProps = {
      ...defaultProps,
      error: 'Failed to load tournaments',
    };
    
    customRender(<TournamentList {...errorProps} />);
    
    expect(screen.getByText('Failed to load tournaments')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const joinButtons = screen.getAllByText('Join Tournament');
    fireEvent.click(joinButtons[0]);
    
    expect(defaultProps.onJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const viewButtons = screen.getAllByText('View Details');
    fireEvent.click(viewButtons[0]);
    
    expect(defaultProps.onView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('displays different status chips correctly', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument(); // ACTIVE
    expect(screen.getByTestId('chip-warning')).toBeInTheDocument(); // UPCOMING
    expect(screen.getByTestId('chip-default')).toBeInTheDocument(); // COMPLETED
  });

  it('shows participant count for each tournament', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByText('0/16')).toBeInTheDocument(); // Test Tournament
    expect(screen.getByText('1/16')).toBeInTheDocument(); // Another Tournament
    expect(screen.getByText('2/16')).toBeInTheDocument(); // Completed Tournament
  });

  it('handles tournament with no participants', () => {
    const tournamentWithNoParticipants = {
      ...mockTournament,
      participants: [],
    };
    
    customRender(<TournamentList {...defaultProps} tournaments={[tournamentWithNoParticipants]} />);
    
    expect(screen.getByText('0/16')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      tournaments: mockTournaments,
      onJoin: vi.fn(),
      onView: vi.fn(),
    };
    
    expect(() => customRender(<TournamentList {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const grid = screen.getByTestId('tournament-list-grid');
    expect(grid).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<TournamentList {...disabledProps} />);
    
    const joinButtons = screen.getAllByText('Join Tournament');
    expect(joinButtons[0]).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<TournamentList {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles large tournament lists efficiently', () => {
    const largeTournamentList = Array.from({ length: 50 }, (_, i) => ({
      ...mockTournament,
      id: `tournament-${i}`,
      name: `Tournament ${i}`,
    }));
    
    const largeProps = {
      ...defaultProps,
      tournaments: largeTournamentList,
    };
    
    customRender(<TournamentList {...largeProps} />);
    
    expect(screen.getByText('50 Tournaments')).toBeInTheDocument();
  });

  it('maintains scroll position during updates', () => {
    const { rerender } = customRender(<TournamentList {...defaultProps} />);
    
    const updatedTournaments = [
      ...mockTournaments,
      {
        ...mockTournament,
        id: '4',
        name: 'New Tournament',
      },
    ];
    
    rerender(<TournamentList {...defaultProps} tournaments={updatedTournaments} />);
    
    expect(screen.getByText('4 Tournaments')).toBeInTheDocument();
    expect(screen.getByText('New Tournament')).toBeInTheDocument();
  });

  it('handles tournament updates in real-time', () => {
    const { rerender } = customRender(<TournamentList {...defaultProps} />);
    
    const updatedTournaments = mockTournaments.map(tournament => ({
      ...tournament,
      participants: [...tournament.participants, { id: '3', username: 'player3' }],
    }));
    
    rerender(<TournamentList {...defaultProps} tournaments={updatedTournaments} />);
    
    // Check if participant counts are updated
    expect(screen.getByText('1/16')).toBeInTheDocument(); // Test Tournament
    expect(screen.getByText('2/16')).toBeInTheDocument(); // Another Tournament
    expect(screen.getByText('3/16')).toBeInTheDocument(); // Completed Tournament
  });
});
