import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportScoreModal from '../src/components/tournament/ReportScoreModal';
import { Match, TournamentParticipant } from '../src/services/ApiService';

// Mock the ApiService
jest.mock('../src/services/ApiService', () => ({
  apiService: {
    updateMatch: jest.fn(),
  },
}));

const mockMatch: Match = {
  id: 'match-123',
  tournamentId: 'tournament-456',
  venueId: 'venue-789',
  playerAId: 'player-a',
  playerBId: 'player-b',
  scoreA: 0,
  scoreB: 0,
  status: 'ACTIVE',
  round: 1,
};

const mockParticipants: TournamentParticipant[] = [
  {
    id: 'player-a',
    tournamentId: 'tournament-456',
    userId: 'user-a',
    joinedAt: '2024-01-01T00:00:00Z',
    status: 'ACTIVE',
    user: {
      id: 'user-a',
      username: 'PlayerA',
      email: 'playera@example.com',
    },
  },
  {
    id: 'player-b',
    tournamentId: 'tournament-456',
    userId: 'user-b',
    joinedAt: '2024-01-01T00:00:00Z',
    status: 'ACTIVE',
    user: {
      id: 'user-b',
      username: 'PlayerB',
      email: 'playerb@example.com',
    },
  },
];

describe('ReportScoreModal', () => {
  const mockOnClose = jest.fn();
  const mockOnScoreSubmitted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(
      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={true}
        onClose={mockOnClose}
        onScoreSubmitted={mockOnScoreSubmitted}
      />
    );

    expect(screen.getByText('🏆 Report Match Score')).toBeInTheDocument();
    expect(screen.getByText('PlayerA')).toBeInTheDocument();
    expect(screen.getByText('PlayerB')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={false}
        onClose={mockOnClose}
        onScoreSubmitted={mockOnScoreSubmitted}
      />
    );

    expect(screen.queryByText('🏆 Report Match Score')).not.toBeInTheDocument();
  });

  it('allows score input and winner selection', async () => {
    render(
      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={true}
        onClose={mockOnClose}
        onScoreSubmitted={mockOnScoreSubmitted}
      />
    );

    const scoreAInput = screen.getByDisplayValue('0');
    const scoreBInput = screen.getAllByDisplayValue('0')[1];

    // Update scores
    fireEvent.change(scoreAInput, { target: { value: '5' } });
    fireEvent.change(scoreBInput, { target: { value: '3' } });

    // Winner should be auto-selected based on higher score
    expect(screen.getByText('🏆 Winner')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={true}
        onClose={mockOnClose}
        onScoreSubmitted={mockOnScoreSubmitted}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    render(
      <ReportScoreModal
        match={mockMatch}
        participants={mockParticipants}
        isOpen={true}
        onClose={mockOnClose}
        onScoreSubmitted={mockOnScoreSubmitted}
      />
    );

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
