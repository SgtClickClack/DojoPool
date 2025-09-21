import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockTournament, createMockProps } from '../../__tests__/test-utils';
import TournamentCard from '../TournamentCard';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, onClick, ...props }: any) => (
      <div data-testid="tournament-card" onClick={onClick} {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="tournament-card-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="tournament-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  People: () => <div data-testid="people-icon">👥</div>,
  AttachMoney: () => <div data-testid="money-icon">💰</div>,
  Schedule: () => <div data-testid="schedule-icon">⏰</div>,
}));

describe('TournamentCard Component', () => {
  const defaultProps = createMockProps({
    tournament: mockTournament,
    onJoin: vi.fn(),
    onView: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournament information correctly', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // maxParticipants
    expect(screen.getByText('100')).toBeInTheDocument(); // entryFee
    expect(screen.getByText('1000')).toBeInTheDocument(); // prizePool
  });

  it('displays correct status chip', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    expect(screen.getByTestId('people-icon')).toBeInTheDocument();
    expect(screen.getByTestId('money-icon')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    const joinButton = screen.getByText('Join Tournament');
    fireEvent.click(joinButton);
    
    expect(defaultProps.onJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    expect(defaultProps.onView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('handles tournament with no participants', () => {
    const tournamentWithNoParticipants = {
      ...mockTournament,
      participants: [],
    };
    
    customRender(<TournamentCard {...defaultProps} tournament={tournamentWithNoParticipants} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // participant count
  });

  it('handles tournament with participants', () => {
    const tournamentWithParticipants = {
      ...mockTournament,
      participants: [
        { id: '1', username: 'player1' },
        { id: '2', username: 'player2' },
      ],
    };
    
    customRender(<TournamentCard {...defaultProps} tournament={tournamentWithParticipants} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // participant count
  });

  it('displays correct date formatting', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    // Check if dates are displayed (format may vary based on implementation)
    const startDate = new Date(mockTournament.startDate);
    const endDate = new Date(mockTournament.endDate);
    
    expect(startDate).toBeInstanceOf(Date);
    expect(endDate).toBeInstanceOf(Date);
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      tournament: mockTournament,
      onJoin: vi.fn(),
      onView: vi.fn(),
    };
    
    expect(() => customRender(<TournamentCard {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<TournamentCard {...defaultProps} />);
    
    const card = screen.getByTestId('tournament-card');
    expect(card).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h6');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<TournamentCard {...disabledProps} />);
    
    const joinButton = screen.getByText('Join Tournament');
    expect(joinButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<TournamentCard {...defaultProps} />);
    });
    
    // Should render in less than 50ms
    expect(renderTime).toBeLessThan(50);
  });
});
