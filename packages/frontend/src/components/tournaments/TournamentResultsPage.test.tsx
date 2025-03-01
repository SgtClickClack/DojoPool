import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TournamentResultsPage } from './TournamentResultsPage';
import { useWallet } from '../../hooks/useWallet';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { analyticsService } from '../../services/analytics';

// Mocking hooks and services
jest.mock('../../hooks/useWallet');
jest.mock('../../services/crossChainTournamentService');
jest.mock('../../services/analytics');

// Mocking components
jest.mock('../leaderboard/TournamentLeaderboardIntegration', () => ({
  TournamentLeaderboardIntegration: () => <div data-testid="leaderboard-integration">Mock Leaderboard</div>
}));

jest.mock('./TournamentRewardDistribution', () => ({
  __esModule: true,
  default: ({ tournamentId, isOrganizer }: { tournamentId: string; isOrganizer: boolean }) => (
    <div data-testid="reward-distribution" data-tournamentid={tournamentId} data-isorganizer={isOrganizer}>
      Mock Reward Distribution Component
    </div>
  )
}));

// Mock router dependency
jest.mock('react-router-dom', () => ({
  useParams: () => ({ tournamentId: 'test-tournament-id' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>
}));

// Mock tournament details
const mockTournamentDetails = {
  id: 'test-tournament-id',
  name: 'Test Tournament',
  description: 'This is a test tournament',
  status: 'completed',
  creator: '0x123456789abcdef',
  prizePool: '1.5'
};

describe('TournamentResultsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock wallet connection
    (useWallet as jest.Mock).mockReturnValue({
      isConnected: jest.fn().mockReturnValue(true),
      walletAddress: {
        ethereum: '0x123456789abcdef',
        solana: null
      }
    });
    
    // Mock tournament service
    (crossChainTournamentService.getTournamentDetails as jest.Mock).mockResolvedValue(mockTournamentDetails);
    
    // Mock analytics
    (analyticsService.trackEvent as jest.Mock).mockImplementation(() => {});
  });
  
  test('renders TournamentResultsPage with all tabs', async () => {
    render(<TournamentResultsPage />);
    
    // Check if tabs are rendered
    expect(screen.getByText('Leaderboard & Results')).toBeInTheDocument();
    expect(screen.getByText('Match History')).toBeInTheDocument();
    expect(screen.getByText('Player Stats')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    
    // The first tab should be selected by default
    expect(screen.getByTestId('leaderboard-integration')).toBeInTheDocument();
  });
  
  test('changes tab when clicked and tracks analytics', () => {
    render(<TournamentResultsPage />);
    
    // Click on the Rewards tab
    fireEvent.click(screen.getByText('Rewards'));
    
    // Rewards component should now be visible
    expect(screen.getByTestId('reward-distribution')).toBeInTheDocument();
    
    // Check that analytics was called with the correct parameters
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'tournament_tab_changed',
      expect.objectContaining({
        tournamentId: 'test-tournament-id',
        tabName: 'rewards'
      })
    );
  });
  
  test('passes correct isOrganizer prop to TournamentRewardDistribution', async () => {
    // Mock user as tournament organizer
    (useWallet as jest.Mock).mockReturnValue({
      isConnected: jest.fn().mockReturnValue(true),
      walletAddress: {
        ethereum: '0x123456789abcdef', // Matches the creator address
        solana: null
      }
    });
    
    render(<TournamentResultsPage />);
    
    // Click on the Rewards tab
    fireEvent.click(screen.getByText('Rewards'));
    
    // Check that the reward distribution component receives the correct isOrganizer prop
    const rewardDistributionComponent = screen.getByTestId('reward-distribution');
    expect(rewardDistributionComponent.getAttribute('data-isorganizer')).toBe('true');
  });
  
  test('passes false isOrganizer prop when user is not the creator', async () => {
    // Mock user as not the tournament organizer
    (useWallet as jest.Mock).mockReturnValue({
      isConnected: jest.fn().mockReturnValue(true),
      walletAddress: {
        ethereum: '0xdifferentaddress', // Different from creator
        solana: null
      }
    });
    
    render(<TournamentResultsPage />);
    
    // Click on the Rewards tab
    fireEvent.click(screen.getByText('Rewards'));
    
    // Check that the reward distribution component receives false isOrganizer prop
    const rewardDistributionComponent = screen.getByTestId('reward-distribution');
    expect(rewardDistributionComponent.getAttribute('data-isorganizer')).toBe('false');
  });
}); 