import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { render as customRender, mockUser, createMockProps, measureRenderTime } from '../../__tests__/test-utils';
import MobileTournamentFlow from '../Tournament/MobileTournamentFlow';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Card: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-flow-card" {...props}>
        {children}
      </div>
    ),
    CardContent: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-flow-content" {...props}>
        {children}
      </div>
    ),
    Typography: ({ children, variant, ...props }: any) => (
      <div data-testid={`typography-${variant}`} {...props}>
        {children}
      </div>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="mobile-tournament-flow-button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    Stepper: ({ children, activeStep, ...props }: any) => (
      <div data-testid="mobile-tournament-flow-stepper" data-active-step={activeStep} {...props}>
        {children}
      </div>
    ),
    Step: ({ children, ...props }: any) => (
      <div data-testid="mobile-tournament-flow-step" {...props}>
        {children}
      </div>
    ),
  };
});

describe('MobileTournamentFlow Component', () => {
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
    currentStep: 0,
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onComplete: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tournament flow correctly', () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tournament-flow-stepper')).toBeInTheDocument();
  });

  it('displays current step', () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    const stepper = screen.getByTestId('mobile-tournament-flow-stepper');
    expect(stepper).toHaveAttribute('data-active-step', '0');
  });

  it('calls onNext when next button is clicked', () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('calls onPrevious when previous button is clicked', () => {
    const propsWithStep = {
      ...defaultProps,
      currentStep: 1,
    };
    
    customRender(<MobileTournamentFlow {...propsWithStep} />);
    
    const previousButton = screen.getByText('Previous');
    fireEvent.click(previousButton);
    
    expect(defaultProps.onPrevious).toHaveBeenCalled();
  });

  it('calls onComplete when complete button is clicked', () => {
    const propsWithLastStep = {
      ...defaultProps,
      currentStep: 2,
    };
    
    customRender(<MobileTournamentFlow {...propsWithLastStep} />);
    
    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);
    
    expect(defaultProps.onComplete).toHaveBeenCalled();
  });

  it('renders within acceptable performance threshold', async () => {
    const renderTime = await measureRenderTime(() => {
      customRender(<MobileTournamentFlow {...defaultProps} />);
    });
    
    expect(renderTime).toBeLessThan(100);
  });
});
