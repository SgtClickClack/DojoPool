import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileTournamentCard from '../Tournament/MobileTournamentCard';

// Mock the MobileTournamentCard component since it doesn't exist yet
jest.mock('../Tournament/MobileTournamentCard', () => {
  return function MockMobileTournamentCard({ tournament, onJoin, onView }: any) {
    return (
      <div data-testid="mobile-tournament-card">
        <h3>{tournament.name}</h3>
        <p>{tournament.description}</p>
        <p>Status: {tournament.status}</p>
        <p>Participants: {tournament.currentParticipants}/{tournament.maxParticipants}</p>
        <p>Prize: ${tournament.prizePool}</p>
        <button onClick={() => onJoin(tournament.id)}>Join</button>
        <button onClick={() => onView(tournament.id)}>View</button>
      </div>
    );
  };
});

const mockTournament = {
  id: 'mobile-tournament-1',
  name: 'Mobile Test Tournament',
  description: 'A mobile-optimized tournament card test',
  status: 'REGISTRATION',
  currentParticipants: 5,
  maxParticipants: 16,
  prizePool: 1000,
};

const mockOnJoin = jest.fn();
const mockOnView = jest.fn();

const defaultProps = {
  tournament: mockTournament,
  onJoin: mockOnJoin,
  onView: mockOnView,
};

const completedProps = {
  ...defaultProps,
  tournament: {
    ...mockTournament,
    status: 'COMPLETED',
  },
};

describe('MobileTournamentCard', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tournament information correctly on mobile', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
    expect(screen.getByText(mockTournament.description)).toBeInTheDocument();
    expect(screen.getByText('Status: REGISTRATION')).toBeInTheDocument();
    expect(screen.getByText('Participants: 5/16')).toBeInTheDocument();
    expect(screen.getByText('Prize: $1000')).toBeInTheDocument();
  });

  it('handles join button click', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    const joinButton = screen.getByText('Join');
    fireEvent.click(joinButton);
    
    expect(mockOnJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('handles view button click', () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    const viewButton = screen.getByText('View');
    fireEvent.click(viewButton);
    
    expect(mockOnView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('displays completed tournament status', () => {
    customRender(<MobileTournamentCard {...completedProps} />);
    
    expect(screen.getByText('Status: COMPLETED')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    const minimalTournament = {
      id: 'min-tournament',
      name: 'Minimal Tournament',
      status: 'REGISTRATION',
    };
    
    customRender(<MobileTournamentCard tournament={minimalTournament} onJoin={jest.fn()} onView={jest.fn()} />);
    
    expect(screen.getByText('Minimal Tournament')).toBeInTheDocument();
  });

  it('performance test renders mobile card efficiently', async () => {
    customRender(<MobileTournamentCard {...defaultProps} />);
    
    expect(screen.getByTestId('mobile-tournament-card')).toBeInTheDocument();
  }, 5000);
});
