import React from 'react';
import { render, screen } from '@testing-library/react';
import RewardsDisplayPanel from './RewardsDisplayPanel';
import { RewardItem } from '../../../types/rewards';

// Mock the hooks
const mockUseAuth = jest.fn();
const mockUseRewardsService = jest.fn();

jest.mock('../../hooks/services/useRewardsService', () => ({
  __esModule: true,
  default: () => mockUseRewardsService(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  __esModule: true,
  useAuth: () => mockUseAuth(),
}));

const mockRewards: RewardItem[] = [
  {
    id: '1',
    name: 'Golden Cue NFT',
    description: 'Awarded for winning the Grand Dojo Championship.',
    imageUrl: 'https://via.placeholder.com/150/FFD700/000000?Text=Golden+Cue',
    type: 'NFT',
    earnedDate: '2024-07-15',
  },
  {
    id: '2',
    name: 'Sharpshooter Badge',
    description: 'Awarded for achieving 10 consecutive wins.',
    imageUrl: 'https://via.placeholder.com/150/C0C0C0/000000?Text=Sharp+Badge',
    type: 'Badge',
    earnedDate: '2024-06-20',
  },
];

describe('RewardsDisplayPanel', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' } });
    mockUseRewardsService.mockReturnValue({
      rewards: [],
      loading: false,
      error: null,
    });
  });

  test('renders the title', () => {
    render(<RewardsDisplayPanel />);
    expect(screen.getByText('My Rewards & Trophies')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseRewardsService.mockReturnValue({
      rewards: [],
      loading: true,
      error: null,
    });
    render(<RewardsDisplayPanel />);
    expect(screen.getByText('Loading rewards...')).toBeInTheDocument();
  });

  test('shows error state', () => {
    mockUseRewardsService.mockReturnValue({
      rewards: [],
      loading: false,
      error: 'Failed to fetch rewards',
    });
    render(<RewardsDisplayPanel />);
    expect(screen.getByText(/Error fetching rewards: Failed to fetch rewards/i)).toBeInTheDocument();
  });

  test('shows message when no rewards are earned', () => {
    mockUseRewardsService.mockReturnValue({
      rewards: [],
      loading: false,
      error: null,
    });
    render(<RewardsDisplayPanel />);
    expect(screen.getByText('No rewards earned yet. Keep playing!')).toBeInTheDocument();
  });

  test('renders a list of rewards', () => {
    mockUseRewardsService.mockReturnValue({
      rewards: mockRewards,
      loading: false,
      error: null,
    });
    render(<RewardsDisplayPanel />);

    expect(screen.getByText('Golden Cue NFT')).toBeInTheDocument();
    expect(screen.getByText(/Awarded for winning the Grand Dojo Championship./i)).toBeInTheDocument();
    expect(screen.getByText('Sharpshooter Badge')).toBeInTheDocument();
    expect(screen.getByText(/Awarded for achieving 10 consecutive wins./i)).toBeInTheDocument();

    // Check if images are rendered (if they exist)
    const goldenCueImage = screen.getByAltText('Golden Cue NFT');
    expect(goldenCueImage).toBeInTheDocument();
    expect(goldenCueImage).toHaveAttribute('src', mockRewards[0].imageUrl);

     const sharpBadgeImage = screen.getByAltText('Sharpshooter Badge');
    expect(sharpBadgeImage).toBeInTheDocument();
    expect(sharpBadgeImage).toHaveAttribute('src', mockRewards[1].imageUrl);
  });

}); 