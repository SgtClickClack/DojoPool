import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import MobileTournamentCard from '../Tournament/MobileTournamentCard';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-tournament-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-box" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  EmojiEvents: () => <div data-testid="trophy-icon">🏆</div>,
  People: () => <div data-testid="people-icon">👥</div>,
  AttachMoney: () => <div data-testid="money-icon">💰</div>,
  Schedule: () => <div data-testid="schedule-icon">⏰</div>,
}));

describe('MobileTournamentCard Component', () => {
  const mockTournament = {
    id: '1',
    name: 'Test Tournament',
    status: 'ACTIVE' as const,
    participants: [],
    maxParticipants: 16,
    entryFee: 100,
    prizePool: 1000,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
  };

  const defaultProps = createMockProps({
    tournament: mockTournament,
    onJoin: vi.fn(),
    onView: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournament information correctly', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // maxParticipants
    expect(screen.getByText('100')).toBeInTheDocument(); // entryFee
    expect(screen.getByText('1000')).toBeInTheDocument(); // prizePool
  });

  it('displays correct status chip', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
    expect(screen.getByTestId('people-icon')).toBeInTheDocument();
    expect(screen.getByTestId('money-icon')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-icon')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    const joinButton = screen.getByText('Join Tournament');
    fireEvent.click(joinButton);
    
    expect(defaultProps.onJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('calls onView when view button is clicked', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    expect(defaultProps.onView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<MobileTournamentCard {...defaultProps} />);
    });
    
    expect(renderTime).toBeLessThan(50);
  });
});
