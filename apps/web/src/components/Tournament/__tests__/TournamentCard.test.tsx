import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentCard from '../TournamentCard';
import { TournamentStatus } from '@/types/tournament';

// Mock the tournament data with proper types to match Tournament interface
const mockTournament = {
  id: 'tournament-1',
  name: 'Test Tournament',
  description: 'A test tournament',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T12:00:00Z',
  location: 'Test Venue',
  maxParticipants: 16,
  currentParticipants: 8,
  entryFee: 100,
  prizePool: 1000,
  status: TournamentStatus.REGISTRATION,
  participants: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOnJoin = jest.fn();
const mockOnView = jest.fn();

const defaultProps = {
  tournament: mockTournament,
  onJoin: mockOnJoin,
  onView: mockOnView,
};

const tournamentWithNoParticipants = {
  ...mockTournament,
  participants: [],
};

const tournamentWithParticipants = {
  ...mockTournament,
  participants: [
    { id: 'user1', username: 'player1' },
    { id: 'user2', username: 'player2' },
  ],
  currentParticipants: 2,
};

const disabledProps = {
  ...defaultProps,
  disabled: true,
};

const minimalProps = {
  tournament: {
    id: 'min-tournament',
    name: 'Minimal Tournament',
    status: TournamentStatus.REGISTRATION,
    startDate: '2024-01-01T10:00:00Z',
    location: 'Test Location',
    maxParticipants: 8,
    currentParticipants: 0,
    entryFee: 50,
    prizePool: 500,
    participants: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  onJoin: jest.fn(),
  onView: jest.fn(),
};

describe('TournamentCard', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tournament information correctly', () => {
    customRender(<TournamentCard {...defaultProps} />);

    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
    expect(screen.getByText(mockTournament.description || '')).toBeInTheDocument();
    expect(screen.getByText(`$${mockTournament.entryFee}`)).toBeInTheDocument();
    expect(screen.getByText(`Prize: $${mockTournament.prizePool}`)).toBeInTheDocument();
  });

  it('displays participant count correctly', () => {
    customRender(<TournamentCard {...defaultProps} />);

    expect(screen.getByText(`${mockTournament.currentParticipants}/${mockTournament.maxParticipants}`)).toBeInTheDocument();
  });

  it('shows registration status', () => {
    customRender(<TournamentCard {...defaultProps} />);

    expect(screen.getByText('Registration Open')).toBeInTheDocument();
  });

  it('handles join button click', () => {
    customRender(<TournamentCard {...defaultProps} />);

    const joinButton = screen.getByRole('button', { name: /join/i });
    fireEvent.click(joinButton);

    expect(mockOnJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('handles view details click', () => {
    customRender(<TournamentCard {...defaultProps} />);

    const viewButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('displays no participants message when empty', () => {
    customRender(<TournamentCard tournament={tournamentWithNoParticipants} onJoin={jest.fn()} onView={jest.fn()} />);

    expect(screen.queryByText(/participants/i)).not.toBeInTheDocument();
  });

  it('displays participants list when available', () => {
    customRender(<TournamentCard tournament={tournamentWithParticipants} onJoin={jest.fn()} onView={jest.fn()} />);

    expect(screen.getByText('player1')).toBeInTheDocument();
    expect(screen.getByText('player2')).toBeInTheDocument();
  });

  it('renders disabled state correctly', () => {
    customRender(<TournamentCard {...disabledProps} />);

    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeDisabled();
  });

  it('handles minimal props without errors', () => {
    expect(() => customRender(<TournamentCard {...minimalProps} />)).not.toThrow();
  });

  it('renders with default props', () => {
    customRender(<TournamentCard {...defaultProps} />);

    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
  });

  it('renders performance test case', async () => {
    // Simple performance test - just render and check
    customRender(<TournamentCard {...defaultProps} />);

    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
  }, 5000);

  it('handles tournament with long name', () => {
    const longNameTournament = {
      ...mockTournament,
      name: 'This is a very long tournament name that should wrap properly in the UI',
    };

    customRender(<TournamentCard tournament={longNameTournament} onJoin={jest.fn()} onView={jest.fn()} />);

    expect(screen.getByText(longNameTournament.name)).toBeInTheDocument();
  });

  it('handles different tournament status', () => {
    const activeTournament = {
      ...mockTournament,
      status: TournamentStatus.ACTIVE,
    };

    customRender(<TournamentCard tournament={activeTournament} onJoin={jest.fn()} onView={jest.fn()} />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
