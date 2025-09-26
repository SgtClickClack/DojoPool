import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentList from '../TournamentList';
import type { Tournament } from '@/types/tournament';
import { TournamentStatus } from '@/types/tournament';

// Mock Tournament data with valid status values and proper Tournament interface
const mockTournament: Tournament = {
  id: 'tournament-1',
  name: 'Test Tournament 1',
  description: 'Test tournament description',
  venueId: 'venue-1',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T12:00:00Z',
  status: TournamentStatus.REGISTRATION,
  maxPlayers: 16,
  entryFee: 100,
  prizePool: 1000,
  participants: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTournamentInProgress: Tournament = {
  id: 'tournament-2',
  name: 'Active Tournament',
  description: 'Tournament currently in progress',
  venueId: 'venue-2',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T12:00:00Z',
  status: TournamentStatus.ACTIVE,
  maxPlayers: 16,
  entryFee: 100,
  prizePool: 1000,
  participants: [
    { id: 'user1', username: 'player1' },
    { id: 'user2', username: 'player2' },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTournamentCompleted: Tournament = {
  id: 'tournament-3',
  name: 'Completed Tournament',
  description: 'Tournament that has finished',
  venueId: 'venue-3',
  startDate: '2024-01-01T10:00:00Z',
  endDate: '2024-01-01T12:00:00Z',
  status: TournamentStatus.COMPLETED,
  maxPlayers: 16,
  entryFee: 100,
  prizePool: 1000,
  participants: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOnJoin = jest.fn();
const mockOnView = jest.fn();
const mockOnFilter = jest.fn();

const defaultProps = {
  tournaments: [mockTournament],
  onJoin: mockOnJoin,
  onView: mockOnView,
  onFilter: mockOnFilter,
};

const loadingProps = {
  ...defaultProps,
  loading: true,
};

const errorProps = {
  ...defaultProps,
  error: 'Failed to load tournaments',
};

const propsWithNoTournaments = {
  ...defaultProps,
  tournaments: [],
};

const propsWithUpdatedTournaments = {
  ...defaultProps,
  tournaments: [...defaultProps.tournaments, mockTournamentInProgress],
};

const disabledProps = {
  ...defaultProps,
  disabled: true,
};

describe('TournamentList', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tournament list correctly', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    customRender(<TournamentList {...loadingProps} />);
    
    expect(screen.getByText('Loading tournaments...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    customRender(<TournamentList {...errorProps} />);
    
    expect(screen.getByText('Failed to load tournaments')).toBeInTheDocument();
  });

  it('shows empty state when no tournaments', () => {
    customRender(<TournamentList {...propsWithNoTournaments} />);
    
    expect(screen.getByText('No tournaments available')).toBeInTheDocument();
  });

  it('renders tournaments with different statuses', () => {
    const tournaments = [mockTournament, mockTournamentInProgress, mockTournamentCompleted];
    
    customRender(<TournamentList {...defaultProps} tournaments={tournaments} />);
    
    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
    expect(screen.getByText(mockTournamentInProgress.name)).toBeInTheDocument();
    expect(screen.getByText(mockTournamentCompleted.name)).toBeInTheDocument();
  });

  it('handles join button click', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const firstJoinButton = screen.getAllByRole('button', { name: /join/i })[0];
    fireEvent.click(firstJoinButton);
    
    expect(mockOnJoin).toHaveBeenCalledWith(mockTournament.id);
  });

  it('handles view button click', () => {
    customRender(<TournamentList {...defaultProps} />);
    
    const firstViewButton = screen.getAllByRole('button', { name: /view/i })[0];
    fireEvent.click(firstViewButton);
    
    expect(mockOnView).toHaveBeenCalledWith(mockTournament.id);
  });

  it('filters tournaments by status', () => {
    const tournaments = [mockTournament, mockTournamentInProgress];
    
    customRender(<TournamentList {...defaultProps} tournaments={tournaments} />);
    
    const filterButton = screen.getByRole('button', { name: /filter/i });
    fireEvent.click(filterButton);
    
    expect(mockOnFilter).toHaveBeenCalled();
  });

  it('handles disabled state', () => {
    customRender(<TournamentList {...disabledProps} />);
    
    const joinButton = screen.getByRole('button', { name: /join/i });
    expect(joinButton).toBeDisabled();
  });

  it('renders performance test case', async () => {
    customRender(<TournamentList {...defaultProps} />);
    
    expect(screen.getByText(mockTournament.name)).toBeInTheDocument();
  }, 5000);
});
