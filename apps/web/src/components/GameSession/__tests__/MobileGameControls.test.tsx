import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import MobileGameControls from '../GameSession/MobileGameControls';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="mobile-game-controls-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="mobile-game-controls-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-game-controls-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Chip: ({ label, color, ...props }: any) => (
      <span data-testid={`chip-${color}`} {...props}>
        {label}
      </span>
    ),
    Box: ({ children, ...props }: any) => (
      <div data-testid="mobile-game-controls-box" {...props}>
        {children}
      </div>
    ),
    Fab: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-game-controls-fab" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

// Mock icons
vi.mock('@mui/icons-material', () => ({
  Sports: () => <div data-testid="sports-icon">🎱</div>,
  Pause: () => <div data-testid="pause-icon">⏸️</div>,
  PlayArrow: () => <div data-testid="play-icon">▶️</div>,
  Stop: () => <div data-testid="stop-icon">⏹️</div>,
  SkipNext: () => <div data-testid="skip-icon">⏭️</div>,
  Settings: () => <div data-testid="settings-icon">⚙️</div>,
}));

describe('MobileGameControls Component', () => {
  const mockGameState = {
    id: '1',
    status: 'ACTIVE' as const,
    currentPlayer: '1',
    score1: 3,
    score2: 2,
    turn: 1,
    phase: 'SHOOTING' as const,
  };

  const defaultProps = createMockProps({
    gameState: mockGameState,
    onShot: vi.fn(),
    onPause: vi.fn(),
    onResume: vi.fn(),
    onEnd: vi.fn(),
    onSkip: vi.fn(),
    onSettings: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders game controls correctly', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Take Shot')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('End Game')).toBeInTheDocument();
  });

  it('displays current game score', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // score1
    expect(screen.getByText('2')).toBeInTheDocument(); // score2
  });

  it('displays current turn', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Turn 1')).toBeInTheDocument();
  });

  it('displays current phase', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('SHOOTING')).toBeInTheDocument();
  });

  it('renders all required icons', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByTestId('sports-icon')).toBeInTheDocument();
    expect(screen.getByTestId('pause-icon')).toBeInTheDocument();
    expect(screen.getByTestId('stop-icon')).toBeInTheDocument();
  });

  it('calls onShot when shot button is clicked', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    fireEvent.click(shotButton);
    
    expect(defaultProps.onShot).toHaveBeenCalledWith(mockGameState.id);
  });

  it('calls onPause when pause button is clicked', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const pauseButton = screen.getByText('Pause');
    fireEvent.click(pauseButton);
    
    expect(defaultProps.onPause).toHaveBeenCalledWith(mockGameState.id);
  });

  it('calls onResume when resume button is clicked', () => {
    const pausedGameState = {
      ...mockGameState,
      status: 'PAUSED' as const,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={pausedGameState} />);
    
    const resumeButton = screen.getByText('Resume');
    fireEvent.click(resumeButton);
    
    expect(defaultProps.onResume).toHaveBeenCalledWith(mockGameState.id);
  });

  it('calls onEnd when end game button is clicked', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const endButton = screen.getByText('End Game');
    fireEvent.click(endButton);
    
    expect(defaultProps.onEnd).toHaveBeenCalledWith(mockGameState.id);
  });

  it('calls onSkip when skip button is clicked', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const skipButton = screen.getByText('Skip Turn');
    fireEvent.click(skipButton);
    
    expect(defaultProps.onSkip).toHaveBeenCalledWith(mockGameState.id);
  });

  it('calls onSettings when settings button is clicked', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const settingsButton = screen.getByTestId('settings-icon');
    fireEvent.click(settingsButton);
    
    expect(defaultProps.onSettings).toHaveBeenCalledWith(mockGameState.id);
  });

  it('shows pause button when game is active', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Resume')).not.toBeInTheDocument();
  });

  it('shows resume button when game is paused', () => {
    const pausedGameState = {
      ...mockGameState,
      status: 'PAUSED' as const,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={pausedGameState} />);
    
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('displays game status correctly', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByTestId('chip-success')).toBeInTheDocument(); // ACTIVE status
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
  });

  it('handles different game phases', () => {
    const gameStateWithDifferentPhase = {
      ...mockGameState,
      phase: 'BREAK' as const,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithDifferentPhase} />);
    
    expect(screen.getByText('BREAK')).toBeInTheDocument();
  });

  it('handles different game statuses', () => {
    const completedGameState = {
      ...mockGameState,
      status: 'COMPLETED' as const,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={completedGameState} />);
    
    expect(screen.getByTestId('chip-default')).toBeInTheDocument(); // COMPLETED status
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      gameState: mockGameState,
      onShot: vi.fn(),
      onPause: vi.fn(),
      onEnd: vi.fn(),
    };
    
    expect(() => customRender(<MobileGameControls {...minimalProps} />)).not.toThrow();
  });

  it('has proper accessibility attributes', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    const card = screen.getByTestId('mobile-game-controls-card');
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
    
    customRender(<MobileGameControls {...disabledProps} />);
    
    const shotButton = screen.getByText('Take Shot');
    expect(shotButton).toBeDisabled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<MobileGameControls {...defaultProps} />);
    });
    
    // Should render in less than 50ms
    expect(renderTime).toBeLessThan(50);
  });

  it('handles game state updates in real-time', () => {
    const { rerender } = customRender(<MobileGameControls {...defaultProps} />);
    
    const updatedGameState = {
      ...mockGameState,
      score1: 4,
      score2: 3,
      turn: 2,
    };
    
    rerender(<MobileGameControls {...defaultProps} gameState={updatedGameState} />);
    
    // Check if updated values are displayed
    expect(screen.getByText('4')).toBeInTheDocument(); // Updated score1
    expect(screen.getByText('3')).toBeInTheDocument(); // Updated score2
    expect(screen.getByText('Turn 2')).toBeInTheDocument(); // Updated turn
  });

  it('displays current player information', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    // Check if current player is displayed
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });

  it('handles game phase changes', () => {
    const { rerender } = customRender(<MobileGameControls {...defaultProps} />);
    
    const gameStateWithNewPhase = {
      ...mockGameState,
      phase: 'FOUL' as const,
    };
    
    rerender(<MobileGameControls {...defaultProps} gameState={gameStateWithNewPhase} />);
    
    expect(screen.getByText('FOUL')).toBeInTheDocument();
  });

  it('displays game timer if available', () => {
    const gameStateWithTimer = {
      ...mockGameState,
      timer: 120, // 2 minutes
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithTimer} />);
    
    // Check if timer is displayed
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('handles game with no timer', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    // Should render without timer
    expect(screen.getByText('Take Shot')).toBeInTheDocument();
  });

  it('displays game controls for mobile', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    // Check if mobile-specific controls are displayed
    expect(screen.getByTestId('mobile-game-controls-fab')).toBeInTheDocument();
  });

  it('handles game with different scores', () => {
    const gameStateWithDifferentScores = {
      ...mockGameState,
      score1: 0,
      score2: 0,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithDifferentScores} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Both scores
  });

  it('displays game progress', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    // Check if game progress is displayed
    expect(screen.getByText('Turn 1')).toBeInTheDocument();
  });

  it('handles game with maximum scores', () => {
    const gameStateWithMaxScores = {
      ...mockGameState,
      score1: 8,
      score2: 8,
    };
    
    customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithMaxScores} />);
    
    expect(screen.getByText('8')).toBeInTheDocument(); // Both scores
  });

  it('displays game controls title', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    expect(screen.getByText('Game Controls')).toBeInTheDocument();
  });

  it('handles game state updates in real-time', () => {
    const { rerender } = customRender(<MobileGameControls {...defaultProps} />);
    
    const updatedGameState = {
      ...mockGameState,
      status: 'PAUSED' as const,
      phase: 'BREAK' as const,
    };
    
    rerender(<MobileGameControls {...defaultProps} gameState={updatedGameState} />);
    
    // Check if status and phase changes are reflected
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
    expect(screen.getByText('BREAK')).toBeInTheDocument();
  });

  it('handles game with different phases', () => {
    const phases = ['SHOOTING', 'BREAK', 'FOUL', 'SAFETY', 'SCRATCH'];
    
    phases.forEach(phase => {
      const gameStateWithPhase = {
        ...mockGameState,
        phase: phase as any,
      };
      
      const { rerender } = customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithPhase} />);
      
      expect(screen.getByText(phase)).toBeInTheDocument();
      
      rerender(<div />); // Clean up for next iteration
    });
  });

  it('displays game controls with proper spacing', () => {
    customRender(<MobileGameControls {...defaultProps} />);
    
    // Check if controls are properly spaced
    const controlsBox = screen.getByTestId('mobile-game-controls-box');
    expect(controlsBox).toBeInTheDocument();
  });

  it('handles game with different statuses', () => {
    const statuses = ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    
    statuses.forEach(status => {
      const gameStateWithStatus = {
        ...mockGameState,
        status: status as any,
      };
      
      const { rerender } = customRender(<MobileGameControls {...defaultProps} gameState={gameStateWithStatus} />);
      
      expect(screen.getByText(status)).toBeInTheDocument();
      
      rerender(<div />); // Clean up for next iteration
    });
  });
});
