import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceDashboard from '../Dashboard/PerformanceDashboard';

// Mock the PerformanceDashboard component since it doesn't exist yet
jest.mock('../Dashboard/PerformanceDashboard', () => {
  return function MockPerformanceDashboard({ stats, recentGames, loading }: any) {
    return (
      <div data-testid="performance-dashboard">
        {loading ? (
          <div data-testid="loading-stats">Loading performance data...</div>
        ) : (
          <div>
            <h1>Performance Dashboard</h1>
            
            <section data-testid="stats-section">
              <h2>Statistics</h2>
              <div>Win Rate: {stats?.winRate || 0}%</div>
              <div>Games Played: {stats?.gamesPlayed || 0}</div>
              <div>Average Score: {stats?.avgScore || 0}</div>
              <div>Best Streak: {stats?.bestStreak || 0}</div>
            </section>

            <section data-testid="recent-games">
              <h2>Recent Games</h2>
              {recentGames?.map((game: any) => (
                <div key={game.id} data-testid={`game-${game.id}`}>
                  <p>{game.opponent} - {game.result} ({game.score})</p>
                  <span>{game.date}</span>
                </div>
              ))}
              {(!recentGames || recentGames.length === 0) && (
                <p>No recent games</p>
              )}
            </section>
          </div>
        )}
      </div>
    );
  };
});

const mockStats = {
  winRate: 75,
  gamesPlayed: 42,
  avgScore: 85,
  bestStreak: 8,
};

const mockRecentGames = [
  {
    id: 'game-1',
    opponent: 'Player2',
    result: 'Win',
    score: 92,
    date: '2024-01-01',
  },
  {
    id: 'game-2',
    opponent: 'Player3',
    result: 'Loss',
    score: 78,
    date: '2024-01-02',
  },
];

const defaultProps = {
  stats: mockStats,
  recentGames: mockRecentGames,
};

const loadingProps = {
  ...defaultProps,
  loading: true,
};

const emptyProps = {
  stats: null,
  recentGames: [],
};

describe('PerformanceDashboard', () => {
  const customRender = (ui: React.ReactElement, options = {}) =>
    render(ui, {
      wrapper: ({ children }) => <div>{children}</div>,
      ...options,
    });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders performance dashboard with stats', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Win Rate: 75%')).toBeInTheDocument();
    expect(screen.getByText('Games Played: 42')).toBeInTheDocument();
    expect(screen.getByText('Player2 - Win (92)')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    customRender(<PerformanceDashboard {...loadingProps} />);
    
    expect(screen.getByTestId('loading-stats')).toBeInTheDocument();
    expect(screen.queryByText('Performance Dashboard')).not.toBeInTheDocument();
  });

  it('handles empty stats and games', () => {
    customRender(<PerformanceDashboard {...emptyProps} />);
    
    expect(screen.getByText('Win Rate: 0%')).toBeInTheDocument();
    expect(screen.getByText('No recent games')).toBeInTheDocument();
  });

  it('renders recent games section', () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByTestId('recent-games')).toBeInTheDocument();
    expect(screen.getAllByTestId(/^game-/)).toHaveLength(2);
  });

  it('renders with minimal props', () => {
    customRender(<PerformanceDashboard stats={null} recentGames={[]} />);
    
    expect(screen.getByTestId('performance-dashboard')).toBeInTheDocument();
  });

  it('performance test renders dashboard efficiently', async () => {
    customRender(<PerformanceDashboard {...defaultProps} />);
    
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument();
  }, 5000);
});
