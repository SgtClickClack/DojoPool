import React from 'react';
import { screen } from '@testing-library/react';
import { GameHistory } from '../../../dojopool/frontend/components/Game/[GAME]GameHistory';
import { renderWithProviders } from '../../utils/testUtils';
import { format } from 'date-fns';

describe('GameHistory Component', () => {
  const mockHistory = [
    {
      id: '1',
      timestamp: '2024-02-15T10:00:00Z',
      player: 'Player 1',
      action: 'SHOT',
      details: {
        ball: '8',
        pocket: '4',
        power: 'medium'
      }
    },
    {
      id: '2',
      timestamp: '2024-02-15T10:01:00Z',
      player: 'Player 2',
      action: 'FOUL',
      details: {
        type: 'scratch',
        penalty: '-1 point'
      }
    },
    {
      id: '3',
      timestamp: '2024-02-15T10:02:00Z',
      player: 'Player 1',
      action: 'WIN',
      details: {
        score: '7-5',
        duration: '15m'
      }
    }
  ];

  it('renders game history table with correct headers', () => {
    renderWithProviders(<GameHistory history={mockHistory} />);
    
    expect(screen.getByText('Game History')).toBeInTheDocument();
    expect(screen.getByText('Time')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('renders history entries with correct formatting', () => {
    renderWithProviders(<GameHistory history={mockHistory} />);
    
    mockHistory.forEach((entry) => {
      // Check time formatting
      expect(screen.getByText(format(new Date(entry.timestamp), 'HH:mm:ss'))).toBeInTheDocument();
      
      // Check player name
      expect(screen.getByText(entry.player)).toBeInTheDocument();
      
      // Check action
      expect(screen.getByText(entry.action)).toBeInTheDocument();
      
      // Check details
      Object.entries(entry.details).forEach(([key, value]) => {
        expect(screen.getByText(`${key}: ${value}`)).toBeInTheDocument();
      });
    });
  });

  it('renders empty table when history is empty', () => {
    renderWithProviders(<GameHistory history={[]} />);
    
    expect(screen.getByText('Game History')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByRole('row')).toHaveLength(1); // Only header row
  });

  it('handles long history lists', () => {
    const longHistory = Array.from({ length: 50 }, (_, index) => ({
      id: index.toString(),
      timestamp: new Date(2024, 1, 15, 10, index).toISOString(),
      player: index % 2 === 0 ? 'Player 1' : 'Player 2',
      action: 'SHOT',
      details: {
        ball: (index % 15 + 1).toString(),
        pocket: (index % 6 + 1).toString()
      }
    }));

    renderWithProviders(<GameHistory history={longHistory} />);
    
    // Check that all entries are rendered
    expect(screen.getAllByRole('row')).toHaveLength(51); // 50 entries + header row
  });

  it('displays different types of actions correctly', () => {
    const variedHistory = [
      {
        id: '1',
        timestamp: '2024-02-15T10:00:00Z',
        player: 'Player 1',
        action: 'SHOT',
        details: { ball: '1', pocket: '1' }
      },
      {
        id: '2',
        timestamp: '2024-02-15T10:01:00Z',
        player: 'Player 2',
        action: 'FOUL',
        details: { type: 'scratch' }
      },
      {
        id: '3',
        timestamp: '2024-02-15T10:02:00Z',
        player: 'Player 1',
        action: 'TIMEOUT',
        details: { duration: '5m' }
      },
      {
        id: '4',
        timestamp: '2024-02-15T10:03:00Z',
        player: 'Player 2',
        action: 'CHALLENGE',
        details: { reason: 'illegal move' }
      }
    ];

    renderWithProviders(<GameHistory history={variedHistory} />);
    
    expect(screen.getByText('SHOT')).toBeInTheDocument();
    expect(screen.getByText('FOUL')).toBeInTheDocument();
    expect(screen.getByText('TIMEOUT')).toBeInTheDocument();
    expect(screen.getByText('CHALLENGE')).toBeInTheDocument();
  });

  it('handles entries with empty details', () => {
    const historyWithEmptyDetails = [
      {
        id: '1',
        timestamp: '2024-02-15T10:00:00Z',
        player: 'Player 1',
        action: 'START',
        details: {}
      }
    ];

    renderWithProviders(<GameHistory history={historyWithEmptyDetails} />);
    
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });

  it('handles entries with null or undefined values', () => {
    const historyWithNulls = [
      {
        id: '1',
        timestamp: '2024-02-15T10:00:00Z',
        player: 'Player 1',
        action: 'SHOT',
        details: {
          ball: null,
          pocket: undefined,
          power: ''
        }
      }
    ];

    renderWithProviders(<GameHistory history={historyWithNulls} />);
    
    expect(screen.getByText('ball: ')).toBeInTheDocument();
    expect(screen.getByText('pocket: ')).toBeInTheDocument();
    expect(screen.getByText('power: ')).toBeInTheDocument();
  });
}); 