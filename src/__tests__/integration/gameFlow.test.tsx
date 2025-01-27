import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameProvider } from '../../contexts/GameContext';
import { Game } from '../../components/Game';

describe('Game Flow Integration', () => {
  beforeEach(() => {
    render(
      <GameProvider>
        <Game />
      </GameProvider>
    );
  });

  it('completes a full game cycle', async () => {
    // Start new game
    const startButton = screen.getByText(/start game/i);
    fireEvent.click(startButton);

    // Verify game started
    expect(screen.getByTestId('game-board')).toBeInTheDocument();
    expect(screen.getByText(/player 1's turn/i)).toBeInTheDocument();

    // Simulate shots
    const gameBoard = screen.getByTestId('game-board');
    fireEvent.click(gameBoard);

    // Wait for turn switch
    await waitFor(() => {
      expect(screen.getByText(/player 2's turn/i)).toBeInTheDocument();
    });

    // Verify score updates
    expect(screen.getByTestId('player-1-score')).toHaveTextContent(/\d+/);
  });

  it('handles fouls and turn switching', async () => {
    // Start game
    fireEvent.click(screen.getByText(/start game/i));

    // Simulate foul
    const foulButton = screen.getByText(/call foul/i);
    fireEvent.click(foulButton);

    // Verify foul handling
    await waitFor(() => {
      expect(screen.getByText(/foul/i)).toBeInTheDocument();
      expect(screen.getByText(/player 2's turn/i)).toBeInTheDocument();
    });
  });

  it('completes game with winner declaration', async () => {
    // Start game
    fireEvent.click(screen.getByText(/start game/i));

    // Simulate winning condition
    // This would typically involve multiple shots and score updates
    await waitFor(() => {
      const winner = screen.getByTestId('game-winner');
      expect(winner).toBeInTheDocument();
    });
  });
}); 