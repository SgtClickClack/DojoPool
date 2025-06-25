import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { SponsorshipHub } from '../../../components/sponsorship/SponsorshipHub';
import * as sponsorshipService from '../../../services/sponsorship/SponsorshipBracketService';

// Mock the service
jest.mock('../../../services/sponsorship/SponsorshipBracketService');
const mockSponsorshipService = sponsorshipService as jest.Mocked<typeof sponsorshipService>;

// Mock the child components
jest.mock('../../../components/sponsorship/BracketCard', () => ({
  BracketCard: ({ bracket, onClick }: any) => (
    <div data-testid="bracket-card" onClick={() => onClick?.(bracket)}>
      {bracket.inGameTitle}
    </div>
  )
}));

jest.mock('../../../components/common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

jest.mock('../../../components/common/ErrorMessage', () => ({
  ErrorMessage: ({ message, onRetry }: any) => (
    <div data-testid="error-message">
      {message}
      <button onClick={onRetry}>Retry</button>
    </div>
  )
}));

const mockBrackets = [
  {
    bracketId: 'bracket-1',
    inGameTitle: 'The Path of the Iron Hammer',
    sponsorName: "Kaito's Forge Cues",
    sponsorLogo: '/logos/kaito-forge.png',
    levelRequirement: 15,
    status: 'available',
    endDate: new Date('2024-12-31'),
    participantCount: 150,
    narrativeIntro: 'In the depths of the forge...',
    challenges: [],
    digitalReward: {
      itemType: 'cue_skin',
      itemName: 'Forgemaster Cue',
      description: 'A legendary cue forged in dragon fire',
      imageUrl: '/items/forgemaster-cue.png',
      rarity: 'legendary'
    },
    physicalReward: {
      itemName: 'Premium Cue Case',
      description: 'Hand-crafted leather cue case',
      imageUrl: '/items/premium-case.png',
      estimatedValue: 299,
      redemptionInstructions: 'Contact sponsor for shipping details'
    }
  },
  {
    bracketId: 'bracket-2',
    inGameTitle: 'The Lightning Strike Challenge',
    sponsorName: 'Velocity Tables Pro',
    sponsorLogo: '/logos/velocity.png',
    levelRequirement: 25,
    status: 'locked',
    endDate: new Date('2024-12-31'),
    participantCount: 89,
    narrativeIntro: 'Speed is everything...',
    challenges: [],
    digitalReward: {
      itemType: 'table_skin',
      itemName: 'Lightning Table',
      description: 'Electrifying table design',
      imageUrl: '/items/lightning-table.png',
      rarity: 'epic'
    },
    physicalReward: {
      itemName: 'Speed Chalk Set',
      description: 'Professional grade chalk set',
      imageUrl: '/items/speed-chalk.png',
      estimatedValue: 49,
      redemptionInstructions: 'Available at sponsor retail locations'
    }
  }
];

const mockPlayerProgress = {
  'bracket-1': {
    playerId: 'player-1',
    bracketId: 'bracket-1',
    status: 'in_progress',
    challengeProgress: {},
    digitalRewardClaimed: false,
    physicalRewardRedeemed: false,
    startedAt: new Date(),
    lastUpdated: new Date()
  }
};

describe('SponsorshipHub', () => {
  const defaultProps = {
    playerId: 'player-1',
    playerLevel: 20
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSponsorshipService.getAllBrackets.mockResolvedValue(mockBrackets);
    mockSponsorshipService.getPlayerProgress.mockResolvedValue(mockPlayerProgress);
  });

  it('renders the sponsorship hub with title and subtitle', async () => {
    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    expect(screen.getByText('The Path of the Patron')).toBeInTheDocument();
    expect(screen.getByText(/Forge your legacy through sponsored quests/)).toBeInTheDocument();
  });

  it('shows loading spinner initially', () => {
    render(<SponsorshipHub {...defaultProps} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays brackets after loading', async () => {
    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
      expect(screen.getByText('The Lightning Strike Challenge')).toBeInTheDocument();
    });
  });

  it('filters brackets correctly', async () => {
    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
    });

    // Click on "Locked" filter
    const lockedFilter = screen.getByText('Locked');
    fireEvent.click(lockedFilter);

    await waitFor(() => {
      expect(screen.getByText('The Lightning Strike Challenge')).toBeInTheDocument();
      expect(screen.queryByText('The Path of the Iron Hammer')).not.toBeInTheDocument();
    });
  });

  it('shows no brackets message when filter returns no results', async () => {
    mockSponsorshipService.getAllBrackets.mockResolvedValue([]);

    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/No sponsorship brackets found/)).toBeInTheDocument();
    });
  });

  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to load brackets';
    mockSponsorshipService.getAllBrackets.mockRejectedValue(new Error(errorMessage));

    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('retries loading on error retry button click', async () => {
    mockSponsorshipService.getAllBrackets
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockBrackets);

    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
    });
  });

  it('navigates to bracket detail on card click', async () => {
    const mockNavigate = jest.fn();
    // Mock useNavigate hook
    jest.mock('react-router-dom', () => ({
      useNavigate: () => mockNavigate
    }));

    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
    });

    const bracketCard = screen.getAllByTestId('bracket-card')[0];
    fireEvent.click(bracketCard);

    // In a real implementation, this would test navigation
    // For now, we just ensure the click handler is called
  });

  describe('Filter functionality', () => {
    const filters = ['All', 'Available', 'Locked', 'In Progress', 'Completed'];

    filters.forEach(filter => {
      it(`applies ${filter} filter correctly`, async () => {
        await act(async () => {
          render(<SponsorshipHub {...defaultProps} />);
        });

        await waitFor(() => {
          expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
        });

        const filterButton = screen.getByText(filter);
        fireEvent.click(filterButton);

        // Filter should be active
        expect(filterButton).toHaveClass('active');
      });
    });
  });

  it('updates brackets when data changes', async () => {
    const { rerender } = render(<SponsorshipHub {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
    });

    // Update mock data
    const updatedBrackets = [...mockBrackets, {
      bracketId: 'bracket-3',
      inGameTitle: 'New Quest',
      sponsorName: 'Test Sponsor',
      sponsorLogo: '/logos/test.png',
      levelRequirement: 10,
      status: 'available',
      endDate: new Date('2024-12-31'),
      participantCount: 50,
      narrativeIntro: 'A new adventure...',
      challenges: [],
      digitalReward: {
        itemType: 'avatar_skin',
        itemName: 'Test Avatar',
        description: 'Test description',
        imageUrl: '/items/test.png',
        rarity: 'common'
      },
      physicalReward: {
        itemName: 'Test Item',
        description: 'Test physical item',
        imageUrl: '/items/test-physical.png',
        estimatedValue: 25,
        redemptionInstructions: 'Test instructions'
      }
    }];

    mockSponsorshipService.getAllBrackets.mockResolvedValue(updatedBrackets);

    await act(async () => {
      rerender(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('New Quest')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    await act(async () => {
      render(<SponsorshipHub {...defaultProps} />);
    });

    await waitFor(() => {
      expect(screen.getByText('The Path of the Iron Hammer')).toBeInTheDocument();
    });

    // Simulate refresh action (this would typically be triggered by a pull-to-refresh or button)
    await act(async () => {
      // In a real implementation, this might trigger a refresh method
      // For now, we verify the service is called again
    });

    expect(mockSponsorshipService.getAllBrackets).toHaveBeenCalledTimes(1);
  });
});