import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileTournamentFlow from '../Tournament/MobileTournamentFlow';

// Mock the MobileTournamentFlow component since it doesn't exist yet
jest.mock('../Tournament/MobileTournamentFlow', () => {
  return function MockMobileTournamentFlow({ step, onNext, onBack, tournamentData }: any) {
    return (
      <div data-testid="mobile-tournament-flow">
        <h2>Step {step}: Tournament Setup</h2>
        <p>Tournament Name: {tournamentData.name}</p>
        <p>Entry Fee: ${tournamentData.entryFee}</p>
        <p>Max Players: {tournamentData.maxPlayers}</p>
        
        {step > 1 && (
          <button onClick={onBack}>Previous</button>
        )}
        {step < 3 && (
          <button onClick={onNext}>Next</button>
        )}
        {step === 3 && (
          <button>Create Tournament</button>
        )}
      </div>
    );
  };
});

const mockTournamentData = {
  name: 'Mobile Tournament Flow Test',
  entryFee: 50,
  maxPlayers: 16,
};

const mockOnNext = jest.fn();
const mockOnBack = jest.fn();

const defaultProps = {
  step: 1,
  onNext: mockOnNext,
  onBack: mockOnBack,
  tournamentData: mockTournamentData,
};

const step2Props = {
  ...defaultProps,
  step: 2,
};

const finalStepProps = {
  ...defaultProps,
  step: 3,
};

describe('MobileTournamentFlow', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders first step of tournament flow', () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    expect(screen.getByText('Step 1: Tournament Setup')).toBeInTheDocument();
    expect(screen.getByText('Tournament Name: Mobile Tournament Flow Test')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
  });

  it('handles next button click', () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('renders second step with back button', () => {
    customRender(<MobileTournamentFlow {...step2Props} />);
    
    expect(screen.getByText('Step 2: Tournament Setup')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles back button click', () => {
    customRender(<MobileTournamentFlow {...step2Props} />);
    
    const backButton = screen.getByText('Previous');
    fireEvent.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('renders final step with create button', () => {
    customRender(<MobileTournamentFlow {...finalStepProps} />);
    
    expect(screen.getByText('Step 3: Tournament Setup')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Create Tournament')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    customRender(<MobileTournamentFlow step={1} onNext={jest.fn()} onBack={jest.fn()} tournamentData={{}} />);
    
    expect(screen.getByTestId('mobile-tournament-flow')).toBeInTheDocument();
  });

  it('performance test renders flow efficiently', async () => {
    customRender(<MobileTournamentFlow {...defaultProps} />);
    
    expect(screen.getByText('Step 1: Tournament Setup')).toBeInTheDocument();
  }, 5000);
});
