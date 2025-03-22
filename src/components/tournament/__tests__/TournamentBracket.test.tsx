import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { TournamentBracket } from '../TournamentBracket';

const renderWithChakra = (component: React.ReactElement) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

const mockMatches = [
  {
    id: '1',
    round: 1,
    matchNumber: 1,
    player1: { id: 'p1', name: 'Player 1', seed: 1 },
    player2: { id: 'p2', name: 'Player 2', seed: 8 },
    status: 'completed',
    startTime: '2024-01-16T10:00:00Z',
    endTime: '2024-01-16T10:30:00Z',
    winner: { id: 'p1', name: 'Player 1', seed: 1 },
  },
  {
    id: '2',
    round: 1,
    matchNumber: 2,
    player1: { id: 'p3', name: 'Player 3', seed: 4 },
    player2: { id: 'p4', name: 'Player 4', seed: 5 },
    status: 'in_progress',
    startTime: '2024-01-16T11:00:00Z',
  },
  {
    id: '3',
    round: 2,
    matchNumber: 1,
    player1: { id: 'p1', name: 'Player 1', seed: 1 },
    player2: { id: 'p3', name: 'Player 3', seed: 4 },
    status: 'scheduled',
  },
];

describe('TournamentBracket', () => {
  it('renders tournament bracket with matches', () => {
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
      />
    );

    expect(screen.getByText('Tournament Bracket')).toBeInTheDocument();
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 2')).toBeInTheDocument();
  });

  it('displays match information correctly', () => {
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
      />
    );

    // Check player names
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('Player 3')).toBeInTheDocument();
    expect(screen.getByText('Player 4')).toBeInTheDocument();

    // Check seeds
    expect(screen.getByText('Seed 1')).toBeInTheDocument();
    expect(screen.getByText('Seed 8')).toBeInTheDocument();
    expect(screen.getByText('Seed 4')).toBeInTheDocument();
    expect(screen.getByText('Seed 5')).toBeInTheDocument();

    // Check match status
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
  });

  it('displays winner for completed matches', () => {
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
      />
    );

    expect(screen.getByText('Winner: Player 1')).toBeInTheDocument();
  });

  it('displays match times for completed and in-progress matches', () => {
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
      />
    );

    expect(screen.getByText(/Started:/)).toBeInTheDocument();
    expect(screen.getByText(/Completed:/)).toBeInTheDocument();
  });

  it('handles match click events', () => {
    const onMatchClick = jest.fn();
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
        onMatchClick={onMatchClick}
      />
    );

    const match = screen.getByText('Match 1').closest('div');
    fireEvent.click(match!);

    expect(onMatchClick).toHaveBeenCalledWith('1');
  });

  it('expands and collapses rounds', () => {
    renderWithChakra(
      <TournamentBracket
        tournamentId="tournament-1"
        matches={mockMatches}
      />
    );

    // Initially, only Round 1 should be expanded
    expect(screen.getByText('Round 1')).toBeInTheDocument();
    expect(screen.getByText('Round 2')).toBeInTheDocument();
    expect(screen.getByText('Match 1')).toBeInTheDocument();
    expect(screen.queryByText('Match 3')).not.toBeInTheDocument();

    // Click expand button for Round 2
    const expandButton = screen.getByText('Expand');
    fireEvent.click(expandButton);

    // Round 2 matches should now be visible
    expect(screen.getByText('Match 3')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByText('Collapse');
    fireEvent.click(collapseButton);

    // Round 2 matches should be hidden again
    expect(screen.queryByText('Match 3')).not.toBeInTheDocument();
  });
}); 