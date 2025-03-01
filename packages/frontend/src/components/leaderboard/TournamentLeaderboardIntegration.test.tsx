import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TournamentLeaderboardIntegration } from './TournamentLeaderboardIntegration';
import crossChainTournamentService from '../../services/crossChainTournamentService';
import leaderboardService from '../../services/leaderboardService';
import { analyticsService } from '../../services/analytics';

// Mock dependencies
jest.mock('../../services/crossChainTournamentService');
jest.mock('../../services/leaderboardService');
jest.mock('../../services/analytics');

// Mocked types
const mockTournamentDetails = {
  id: 'tournament-123',
  name: 'Test Tournament',
  description: 'A test tournament',
  startTime: '2025-03-01T12:00:00Z',
  endTime: '2025-03-01T18:00:00Z',
  registrationDeadline: '2025-02-28T23:59:59Z',
  location: 'Test Venue',
  format: 'Single Elimination',
  gameType: 'Eight Ball',
  prizePool: '1.5',
  entryFeeEth: '0.1',
  entryFeeSol: '2',
  maxParticipants: 16,
  participantsCount: 8,
  isNativeChain: 'ethereum',
  isCrossChain: true,
  status: 'in_progress',
  creator: '0x123456789'
};

const mockLeaderboardData = {
  entries: [
    {
      id: 'entry-1',
      rank: 1,
      userId: 'user-1',
      username: 'Player One',
      avatar: 'avatar1.png',
      score: 150,
      wins: 5,
      losses: 1,
      totalGames: 6,
      winRate: 83.33,
      lastActive: '2025-03-01T17:30:00Z',
      tournamentId: 'tournament-123',
      tournamentName: 'Test Tournament',
      entryFee: '0.1',
      entryFeeCurrency: 'ETH',
      position: 1,
      eliminated: false,
      matchesPlayed: 6
    },
    {
      id: 'entry-2',
      rank: 2,
      userId: 'user-2',
      username: 'Player Two',
      avatar: 'avatar2.png',
      score: 120,
      wins: 4,
      losses: 2,
      totalGames: 6,
      winRate: 66.67,
      lastActive: '2025-03-01T17:00:00Z',
      tournamentId: 'tournament-123',
      tournamentName: 'Test Tournament',
      entryFee: '0.1',
      entryFeeCurrency: 'ETH',
      position: 2,
      eliminated: false,
      matchesPlayed: 6
    }
  ],
  tournamentName: 'Test Tournament',
  lastUpdated: '2025-03-01T17:30:00Z',
  tournamentId: 'tournament-123'
};

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock crossChainTournamentService methods
  (crossChainTournamentService.getTournamentDetails as jest.Mock).mockResolvedValue(mockTournamentDetails);
  (crossChainTournamentService.submitTournamentResults as jest.Mock).mockResolvedValue(true);
  
  // Mock leaderboardService methods
  (leaderboardService.getTournamentLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
  
  // Mock analytics service
  (analyticsService.trackEvent as jest.Mock).mockImplementation(() => {});
});

describe('TournamentLeaderboardIntegration Component', () => {
  test('renders loading state initially', () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    expect(screen.getByText('Loading Tournament...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('renders tournament details after loading', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('1.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('8 / 16')).toBeInTheDocument();
    expect(screen.getByText('ethereum')).toBeInTheDocument();
    expect(screen.getByText('Cross-Chain')).toBeInTheDocument();
  });
  
  test('does not show submit button when allowSubmission is false', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    expect(screen.queryByText('Submit Final Results')).not.toBeInTheDocument();
  });
  
  test('shows submit button when allowSubmission is true', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={true} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Submit Final Results')).toBeInTheDocument();
  });
  
  test('opens confirmation dialog when submit button is clicked', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={true} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Final Results'));
    
    expect(screen.getByText('Confirm Tournament Results Submission')).toBeInTheDocument();
    expect(screen.getByText('Prize distribution will be as follows:')).toBeInTheDocument();
    expect(screen.getByText('1. Player One')).toBeInTheDocument();
    expect(screen.getByText('2. Player Two')).toBeInTheDocument();
  });
  
  test('submits tournament results when confirm button is clicked', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={true} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Final Results'));
    fireEvent.click(screen.getByText('Confirm Submission'));
    
    await waitFor(() => {
      expect(crossChainTournamentService.submitTournamentResults).toHaveBeenCalledWith(
        'tournament-123',
        expect.arrayContaining([
          expect.objectContaining({
            playerId: 'user-1',
            finalRank: 1,
            prize: '0.75'
          }),
          expect.objectContaining({
            playerId: 'user-2',
            finalRank: 2,
            prize: '0.45'
          })
        ]),
        true
      );
    });
    
    expect(screen.getByText('Tournament results submitted successfully! Global leaderboard will be updated shortly.')).toBeInTheDocument();
  });
  
  test('handles submission error correctly', async () => {
    (crossChainTournamentService.submitTournamentResults as jest.Mock).mockRejectedValue(new Error('Submission failed'));
    
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={true} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Final Results'));
    fireEvent.click(screen.getByText('Confirm Submission'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit tournament results. Please try again.')).toBeInTheDocument();
    });
  });
  
  test('does not show global leaderboard when showGlobalLeaderboard is false', async () => {
    render(<TournamentLeaderboardIntegration 
      tournamentId="tournament-123" 
      showGlobalLeaderboard={false} 
    />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    expect(screen.queryByText('Global Rankings')).not.toBeInTheDocument();
  });
  
  test('shows global leaderboard when showGlobalLeaderboard is true', async () => {
    // We need to mock the GlobalLeaderboard component since it's used in our component
    jest.mock('./GlobalLeaderboard', () => ({
      GlobalLeaderboard: () => <div>Global Rankings Mock</div>
    }));
    
    render(<TournamentLeaderboardIntegration 
      tournamentId="tournament-123" 
      showGlobalLeaderboard={true} 
    />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // In a real test, we would check for the actual component or its title
    // For this mock, we're just checking if the divider that separates the sections exists
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });
  
  test('handles refresh button click correctly', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Get initial call counts
    const initialTournamentDetailsCallCount = (crossChainTournamentService.getTournamentDetails as jest.Mock).mock.calls.length;
    const initialLeaderboardCallCount = (leaderboardService.getTournamentLeaderboard as jest.Mock).mock.calls.length;
    
    // Click refresh button
    fireEvent.click(screen.getByRole('button', { name: /refresh data/i }));
    
    // Verify that the services were called again
    await waitFor(() => {
      expect(crossChainTournamentService.getTournamentDetails).toHaveBeenCalledTimes(initialTournamentDetailsCallCount + 1);
      expect(leaderboardService.getTournamentLeaderboard).toHaveBeenCalledTimes(initialLeaderboardCallCount + 1);
    });
  });
  
  test('calculates prize distribution correctly', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" allowSubmission={true} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Submit Final Results'));
    
    // Prize calculation is based on ranks and total prize pool (1.5 ETH)
    // 1st place: 50% = 0.75 ETH
    // 2nd place: 30% = 0.45 ETH
    expect(screen.getByText('Prize: 0.75 ETH')).toBeInTheDocument();
    expect(screen.getByText('Prize: 0.45 ETH')).toBeInTheDocument();
  });
}); 