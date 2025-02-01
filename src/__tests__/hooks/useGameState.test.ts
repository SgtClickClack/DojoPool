import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../hooks/useGameState';

describe('useGameState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useGameState());
    
    expect(result.current.score).toEqual({
      player1: 0,
      player2: 0
    });
    expect(result.current.currentPlayer).toBe(1);
    expect(result.current.isGameOver).toBe(false);
  });

  it('updates score correctly', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.addPoints(1, 2);
    });
    
    expect(result.current.score.player1).toBe(2);
    expect(result.current.currentPlayer).toBe(2);
  });

  it('handles game over condition', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.addPoints(1, 8); // Win condition
    });
    
    expect(result.current.isGameOver).toBe(true);
    expect(result.current.winner).toBe(1);
  });

  it('resets game state', () => {
    const { result } = renderHook(() => useGameState());
    
    act(() => {
      result.current.addPoints(1, 3);
      result.current.resetGame();
    });
    
    expect(result.current.score).toEqual({
      player1: 0,
      player2: 0
    });
    expect(result.current.currentPlayer).toBe(1);
    expect(result.current.isGameOver).toBe(false);
  });
}); 