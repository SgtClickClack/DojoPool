import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { LiveMatchDisplay } from '../LiveMatch';
import matchUpdateService from '../../../services/match-updates';

// Mock the match update service
jest.mock('../../../services/match-updates', () => ({
  __esModule: true,
  default: {
    startWatchingMatch: jest.fn(),
    stopWatchingMatch: jest.fn(),
    subscribeToMatch: jest.fn(),
  },
}));

// Mock the date formatter
jest.mock('../../../utils/date', () => ({
  formatTimestamp: jest.fn().mockReturnValue('5 minutes ago'),
}));

describe('LiveMatchDisplay', () => {
  const mockMatch = {
    matchId: 'test-match-id',
    isLive: true,
    status: 'in_progress',
    player1: {
      name: 'Player 1',
      avatar: 'player1-avatar.jpg',
    },
    player2: {
      name: 'Player 2',
      avatar: 'player2-avatar.jpg',
    },
    currentScore: {
      player1: 5,
      player2: 3,
    },
    spectatorCount: 42,
    lastUpdate: '2025-01-07T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    render(<LiveMatchDisplay matchId="test-match-id" />);

    expect(screen.getByText('Loading match data...')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should start watching match on mount', () => {
    render(<LiveMatchDisplay matchId="test-match-id" />);

    expect(matchUpdateService.startWatchingMatch).toHaveBeenCalledWith('test-match-id');
  });

  it('should subscribe to match updates', () => {
    render(<LiveMatchDisplay matchId="test-match-id" />);

    expect(matchUpdateService.subscribeToMatch).toHaveBeenCalledWith(
      'test-match-id',
      expect.any(Function)
    );
  });

  it('should stop watching match on unmount', () => {
    const { unmount } = render(<LiveMatchDisplay matchId="test-match-id" />);

    unmount();

    expect(matchUpdateService.stopWatchingMatch).toHaveBeenCalledWith('test-match-id');
  });

  it('should display match information when data is loaded', () => {
    // Mock the subscription callback
    (matchUpdateService.subscribeToMatch as jest.Mock).mockImplementation((_, callback) => {
      act(() => {
        callback(mockMatch);
      });
      return jest.fn();
    });

    render(<LiveMatchDisplay matchId="test-match-id" />);

    // Check if all match information is displayed
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
    expect(screen.getByText('Player 2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('VS')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Last update: 5 minutes ago')).toBeInTheDocument();
  });

  it('should call onScoreUpdate when score changes', () => {
    const mockOnScoreUpdate = jest.fn();

    // Mock the subscription callback
    (matchUpdateService.subscribeToMatch as jest.Mock).mockImplementation((_, callback) => {
      act(() => {
        callback(mockMatch);
      });
      return jest.fn();
    });

    render(<LiveMatchDisplay matchId="test-match-id" onScoreUpdate={mockOnScoreUpdate} />);

    expect(mockOnScoreUpdate).toHaveBeenCalledWith(mockMatch.currentScore);
  });

  it('should handle paused match status', () => {
    const pausedMatch = {
      ...mockMatch,
      status: 'paused',
    };

    // Mock the subscription callback
    (matchUpdateService.subscribeToMatch as jest.Mock).mockImplementation((_, callback) => {
      act(() => {
        callback(pausedMatch);
      });
      return jest.fn();
    });

    render(<LiveMatchDisplay matchId="test-match-id" />);

    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
});
