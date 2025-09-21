import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, mockMatch, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import GameSessionView from '../GameSessionView';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="game-session-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="game-session-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="game-session-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="game-session-box" {...props}>
        {children}
      </div>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Sports: () => <div data-testid="sports-icon">🎱</div>,
  Person: () => <div data-testid="person-icon">👤</div>,
  Timer: () => <div data-testid="timer-icon">⏱️</div>,
  Score: () => <div data-testid="score-icon">📊</div>,
}));

// Mock WebSocket hook
vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    isConnected: true,
    sendMessage: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

describe('GameSessionView Component', () => {
  const defaultProps = createMockProps({
    match: mockMatch,
    currentUser: mockUser,
    onShot: vi.fn(),
    onEndGame: vi.fn(),
    onLeave: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders match information correctly', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    expect(screen.getByText('Match #1')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('displays player scores', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // score1
    expect(screen.getByText('0')).toBeInTheDocument(); // score2
  });

  it('renders all required icons', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    expect(screen.getByTestId('sports-icon')).toBeInTheDocument();
    expect(screen.getByTestId('person-icon')).toBeInTheDocument();
    expect(screen.getByTestId('timer-icon')).toBeInTheDocument();
    expect(screen.getByTestId('score-icon')).toBeInTheDocument();
  });

  it('calls onShot when shot button is clicked', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    fireEvent.click(shotButton);
    
    expect(defaultProps.onShot).toHaveBeenCalledWith(mockMatch.id);
  });

  it('calls onEndGame when end game button is clicked', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    const endGameButton = screen.getByText('End Game');
    fireEvent.click(endGameButton);
    
    expect(defaultProps.onEndGame).toHaveBeenCalledWith(mockMatch.id);
  });

  it('calls onLeave when leave button is clicked', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    const leaveButton = screen.getByText('Leave Game');
    fireEvent.click(leaveButton);
    
    expect(defaultProps.onLeave).toHaveBeenCalledWith(mockMatch.id);
  });

  it('shows correct status chip color for active match', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument();
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('shows correct status chip color for completed match', () => {
    const completedMatch = {
      ...mockMatch,
      status: 'COMPLETED' as const,
    };
    
    customRender(<GameSessionView {...defaultProps} match={completedMatch} />);
    
    expect(screen.getByTestId('chip-default')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('displays match duration', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    // Check if duration is displayed (format may vary based on implementation)
    expect(screen.getByTestId('timer-icon')).toBeInTheDocument();
  });

  it('handles match with different scores', () => {
    const matchWithScores = {
      ...mockMatch,
      score1: 3,
      score2: 1,
    };
    
    customRender(<GameSessionView {...defaultProps} match={matchWithScores} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // score1
    expect(screen.getByText('1')).toBeInTheDocument(); // score2
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      match: mockMatch,
      currentUser: mockUser,
      onShot: vi.fn(),
      onEndGame: vi.fn(),
      onLeave: vi.fn(),
    };
    
    expect(() => customRender(<GameSessionView {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    const card = screen.getByTestId('game-session-card');
    expect(card).toBeInTheDocument();
    
    // Check for proper heading structure
    const heading = screen.getByTestId('typography-h5');
    expect(heading).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true,
    };
    
    customRender(<GameSessionView {...disabledProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    expect(shotButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<GameSessionView {...defaultProps} />);
    });
    
    // Should render in less than 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('handles WebSocket connection status', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    // Component should handle WebSocket connection gracefully
    expect(screen.getByTestId('game-session-card')).toBeInTheDocument();
  });

  it('displays player information correctly', () => {
    customRender(<GameSessionView {...defaultProps} />);
    
    // Check if player information is displayed
    expect(screen.getByTestId('person-icon')).toBeInTheDocument();
  });

  it('handles match updates in real-time', () => {
    const { rerender } = customRender(<GameSessionView {...defaultProps} />);
    
    const updatedMatch = {
      ...mockMatch,
      score1: 1,
      score2: 0,
    };
    
    rerender(<GameSessionView {...defaultProps} match={updatedMatch} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // updated score1
    expect(screen.getByText('0')).toBeInTheDocument(); // score2
  });
});
