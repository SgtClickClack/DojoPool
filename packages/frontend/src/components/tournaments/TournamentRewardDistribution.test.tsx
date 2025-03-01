import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentRewardDistribution from './TournamentRewardDistribution';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import { useWallet } from '../../hooks/useWallet';
import { analyticsService } from '../../services/analytics';

// Mock dependencies
jest.mock('../../services/crossChainTournamentService');
jest.mock('../../hooks/useWallet');
jest.mock('../../services/analytics');

// Mock tournament details
const mockTournamentDetails = {
  id: 'tournament-123',
  name: 'Test Tournament',
  status: 'completed',
  isNativeChain: 'ethereum',
  isCrossChain: false,
  prizePool: '1.5',
  creator: '0x123456789abcdef'
};

// Mock rewards data
const mockRewardsData = {
  rewards: [
    {
      id: 1,
      tournament_id: 123,
      placement: 1,
      dojo_coins_amount: 750,
      nft_trophy_type: 'gold'
    },
    {
      id: 2,
      tournament_id: 123,
      placement: 2,
      dojo_coins_amount: 450,
      nft_trophy_type: 'silver'
    },
    {
      id: 3,
      tournament_id: 123,
      placement: 3,
      dojo_coins_amount: 225,
      nft_trophy_type: 'bronze'
    }
  ],
  distributions: [
    {
      id: 1,
      tournament_id: 123,
      user_id: 1001,
      username: 'Player One',
      placement: 1,
      dojo_coins_amount: 750,
      status: 'pending'
    },
    {
      id: 2,
      tournament_id: 123,
      user_id: 1002,
      username: 'Player Two',
      placement: 2,
      dojo_coins_amount: 450,
      status: 'pending'
    },
    {
      id: 3,
      tournament_id: 123,
      user_id: 1003,
      username: 'Player Three',
      placement: 3,
      dojo_coins_amount: 225,
      status: 'pending'
    }
  ]
};

// Mock successful distribution response
const mockDistributionResponse = {
  success: true,
  message: 'Rewards distributed successfully',
  tournamentId: 'tournament-123',
  chain: 'ethereum'
};

describe('TournamentRewardDistribution Component', () => {
  // Set up mocks before each test
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fetch function
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/tournament/rewards')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRewardsData)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    // Mock crossChainTournamentService
    (crossChainTournamentService.getTournamentDetails as jest.Mock).mockResolvedValue(mockTournamentDetails);
    (crossChainTournamentService as any).distributeTournamentRewards = jest.fn().mockResolvedValue(mockDistributionResponse);
    
    // Mock useWallet hook
    (useWallet as jest.Mock).mockReturnValue({
      isConnected: jest.fn((chain) => chain === 'ethereum'),
      connectWallet: jest.fn(),
      walletAddress: {
        ethereum: '0x123456789abcdef',
        solana: null
      }
    });
    
    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn()
      },
      writable: true
    });
    
    // Mock analytics
    (analyticsService.trackEvent as jest.Mock).mockImplementation(() => {});
  });
  
  test('renders tournament rewards component', async () => {
    render(<TournamentRewardDistribution tournamentId="tournament-123" />);
    
    // Wait for the component to load data
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Check if rewards table is displayed
    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Reward')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check if rewards are displayed
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
    expect(screen.getByText('Player Three')).toBeInTheDocument();
  });
  
  test('shows only distribute button for organizers', async () => {
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Check if distribute button is shown
    expect(screen.getByText('Distribute Rewards')).toBeInTheDocument();
  });
  
  test('does not show distribute button for non-organizers', async () => {
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={false} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Check if distribute button is not shown
    expect(screen.queryByText('Distribute Rewards')).not.toBeInTheDocument();
  });
  
  test('shows wallet connection prompt if wallet is not connected', async () => {
    // Mock wallet not connected
    (useWallet as jest.Mock).mockReturnValue({
      isConnected: jest.fn(() => false),
      connectWallet: jest.fn(),
      walletAddress: {
        ethereum: null,
        solana: null
      }
    });
    
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Check if wallet connection prompt is shown
    expect(screen.getByText(/You need to connect your ethereum wallet to distribute rewards/i)).toBeInTheDocument();
    expect(screen.getByText('Connect ethereum Wallet')).toBeInTheDocument();
  });
  
  test('clicking distribute button opens confirmation dialog', async () => {
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Click distribute button
    fireEvent.click(screen.getByText('Distribute Rewards'));
    
    // Check if confirmation dialog is shown
    expect(screen.getByText('Confirm Reward Distribution')).toBeInTheDocument();
    expect(screen.getByText(/You are about to distribute rewards for tournament/i)).toBeInTheDocument();
    expect(screen.getByText('Confirm Distribution')).toBeInTheDocument();
  });
  
  test('confirms reward distribution and shows success message', async () => {
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Click distribute button
    fireEvent.click(screen.getByText('Distribute Rewards'));
    
    // Check if confirmation dialog is shown
    expect(screen.getByText('Confirm Reward Distribution')).toBeInTheDocument();
    
    // Click confirm button
    fireEvent.click(screen.getByText('Confirm Distribution'));
    
    // Check if service was called with correct parameters
    await waitFor(() => {
      expect(crossChainTournamentService.distributeTournamentRewards).toHaveBeenCalledWith(
        'tournament-123',
        expect.arrayContaining([
          expect.objectContaining({
            rank: 1,
            amount: '750'
          }),
          expect.objectContaining({
            rank: 2,
            amount: '450'
          }),
          expect.objectContaining({
            rank: 3,
            amount: '225'
          })
        ])
      );
    });
    
    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('Tournament rewards distributed successfully!')).toBeInTheDocument();
    });
    
    // Check if analytics was called
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'tournament_rewards_distributed',
      expect.objectContaining({
        tournamentId: 'tournament-123'
      })
    );
  });
  
  test('handles reward distribution failure', async () => {
    // Mock distribution failure
    (crossChainTournamentService as any).distributeTournamentRewards = jest.fn().mockResolvedValue({
      success: false,
      message: 'Distribution failed'
    });
    
    render(<TournamentRewardDistribution tournamentId="tournament-123" isOrganizer={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Click distribute button
    fireEvent.click(screen.getByText('Distribute Rewards'));
    
    // Click confirm button
    fireEvent.click(screen.getByText('Confirm Distribution'));
    
    // Check if error message is shown
    await waitFor(() => {
      expect(screen.getByText('Distribution failed')).toBeInTheDocument();
    });
    
    // Check if analytics tracked the error
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'tournament_rewards_distribution_error',
      expect.objectContaining({
        tournamentId: 'tournament-123',
        error: 'Distribution failed'
      })
    );
  });
  
  test('allows copying transaction hash to clipboard', async () => {
    // Mock rewards with completed distribution
    const mockDataWithTransaction = {
      ...mockRewardsData,
      distributions: [
        {
          ...mockRewardsData.distributions[0],
          status: 'completed',
          transaction_hash: '0xabcdef1234567890'
        },
        ...mockRewardsData.distributions.slice(1)
      ]
    };
    
    // Update fetch mock
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDataWithTransaction)
      });
    });
    
    render(<TournamentRewardDistribution tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Tournament Rewards')).toBeInTheDocument();
    });
    
    // Find and click the copy button (first one in the document)
    const copyButton = document.querySelector('[aria-label="Copy"]') || 
                     document.querySelector('button[title="Copy to clipboard"]') ||
                     screen.getAllByRole('button')[1]; // Fallback to second button which should be the copy
                     
    fireEvent.click(copyButton);
    
    // Check if clipboard API was called
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('0xabcdef1234567890');
    
    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('Transaction hash copied to clipboard')).toBeInTheDocument();
    });
  });
}); 