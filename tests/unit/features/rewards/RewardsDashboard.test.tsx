import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import RewardsDashboard from '../../../../src/features/rewards/RewardsDashboard';
import { Transaction } from '../../../../src/types/wallet';
import useWalletService from '../../../../src/frontend/hooks/services/useWalletService';
import useRewardsService from '../../../../src/frontend/hooks/services/useRewardsService';
import { useAuth } from '../../../../src/hooks/useAuth';

jest.mock('../../../../src/frontend/hooks/services/useWalletService');
jest.mock('../../../../src/frontend/hooks/services/useRewardsService');
jest.mock('../../../../src/hooks/useAuth');

const mockWalletData = {
  balance: 100,
  otherTokens: [
    { id: 'ft1', symbol: 'ABC', name: 'Alpha Token', balance: 50, contractAddress: '0xabc...' },
  ],
};
const mockRewards = [
  { id: '1', name: 'Test Reward 1', description: 'Desc 1', type: 'dojo_coins', points_cost: 10, tier: null, imageUrl: null },
  { id: '2', name: 'Test Reward 2', description: 'Desc 2', type: 'nft', points_cost: 50, tier: null, imageUrl: 'http://example.com/nft_reward.png' },
];

const mockTransactions = [
  { id: 'tx1', type: 'claim', amount: 10, currency: 'Dojo Coin', date: '2023-01-01', description: 'Claimed reward' },
];

const mockNfts = [
  { id: 'nft1', name: 'Earned NFT 1', description: 'Earned Desc 1', imageUrl: 'http://example.com/earned_nft1.png', contractAddress: '0xdef...', tokenId: '789', collection: { id: 'col1', name: 'Collection A' }, owner: 'user123' },
];

const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User', token: 'token' };

class MockHeaders {
  get = () => null;
  append = () => {};
  delete = () => {};
  getSetCookie = () => [];
  has = () => false;
  set = () => {};
  keys = () => [][Symbol.iterator]();
  entries = () => [][Symbol.iterator]();
  forEach = () => {};
  values = () => [][Symbol.iterator]();
  [Symbol.iterator]() { return [].values(); }
}

class MockResponse {
  public ok: boolean;
  public status: number;
  public statusText: string;
  public type: ResponseType;
  constructor(private data: any, ok = true, status = 200) {
    this.ok = ok;
    this.status = status;
    this.statusText = ok ? 'OK' : 'Error';
    this.type = 'default';
  }
  json = () => Promise.resolve(this.data);
  text = () => Promise.resolve(JSON.stringify(this.data));
  headers = new MockHeaders();
  redirected = false;
  url = '';
  clone = () => this;
  body = null;
  bodyUsed = false;
  arrayBuffer = () => Promise.resolve(new ArrayBuffer(0));
  blob = () => Promise.resolve(new Blob());
  formData = () => Promise.resolve(new FormData());
  bytes = () => Promise.resolve(new Uint8Array());
}

const createMockResponse = (data: any, ok = true, status = 200) => new MockResponse(data, ok, status);

describe('RewardsDashboard', () => {
  beforeEach(() => {
    (useWalletService as jest.Mock).mockReturnValue({
      walletData: mockWalletData,
      loading: false,
      error: null,
      fetchWalletData: jest.fn().mockResolvedValue(undefined),
    });
    (useRewardsService as jest.Mock).mockReturnValue({
      rewards: mockRewards,
      loading: false,
      error: null,
      fetchRewards: jest.fn().mockResolvedValue(undefined),
    });
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    jest.spyOn(global, 'fetch').mockImplementation((url) => {
      if (typeof url === 'string' && url.startsWith('/api/v1/nft/list')) {
        return Promise.resolve(createMockResponse({ nfts: mockNfts }));
      }
      if (url === '/api/v1/wallet/me/transactions') {
        return Promise.resolve(createMockResponse(mockTransactions));
      }
      if (url === '/api/rewards/claim') {
        return Promise.resolve(createMockResponse({ message: 'Reward claimed successfully' }));
      }
      return Promise.reject(new Error('unhandled fetch URL'));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    // Mock the wallet and rewards hooks
    (useWalletService as jest.Mock).mockReturnValue({
      walletData: mockWalletData,
      loading: false,
      error: null,
      fetchWalletData: jest.fn(() => new Promise(() => {})),
    });
    (useRewardsService as jest.Mock).mockReturnValue({
      rewards: mockRewards,
      loading: false,
      error: null,
      fetchRewards: jest.fn(() => new Promise(() => {})),
    });

    render(<RewardsDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders error state if data fetching fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    render(<RewardsDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Failed to load rewards or wallet data/i);
    });
  });

  test('renders dashboard with fetched data', async () => {
    render(<RewardsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Rewards Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Wallet Balance/i)).toBeInTheDocument();
      expect(screen.getByText(/100 Dojo Coins/)).toBeInTheDocument();
      expect(screen.getByText(/Available Rewards/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Reward 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Reward 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaction History/i)).toBeInTheDocument();
      expect(screen.getByText(/Claimed reward/i)).toBeInTheDocument();
      expect(screen.getByText(/Earned NFTs/i)).toBeInTheDocument();
      expect(screen.getByText(/Earned NFT 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Other Tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/Alpha Token \(ABC\): 50/)).toBeInTheDocument();
    });
  });

  test('renders NFTs from /api/v1/nft/list', async () => {
    render(<RewardsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Earned NFT 1/i)).toBeInTheDocument();
    });
  });

  test('shows no NFTs state', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (typeof url === 'string' && url.startsWith('/api/v1/nft/list')) {
        return Promise.resolve(createMockResponse({ nfts: [] }));
      }
      if (url === '/api/v1/wallet/me/transactions') {
        return Promise.resolve(createMockResponse(mockTransactions));
      }
      return Promise.reject(new Error('unhandled fetch URL'));
    });
    render(<RewardsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/No NFTs earned yet/i)).toBeInTheDocument();
    });
  });

  test('shows error if NFT fetch fails', async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (typeof url === 'string' && url.startsWith('/api/v1/nft/list')) {
        return Promise.reject(new Error('NFT fetch failed'));
      }
      if (url === '/api/v1/wallet/me/transactions') {
        return Promise.resolve(createMockResponse(mockTransactions));
      }
      return Promise.reject(new Error('unhandled fetch URL'));
    });
    render(<RewardsDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  test('does not fetch NFTs if no user', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<RewardsDashboard />);
    // Should not throw, should show loading or error for missing user
    await waitFor(() => {
      expect(screen.getByText(/Wallet Balance/i)).toBeInTheDocument();
    });
  });

  test('clicking an NFT shows the detail view', async () => {
    render(<RewardsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Earned NFT 1/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/Earned NFT 1/i));

    await waitFor(() => {
      expect(screen.getByText(/NFT Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Earned NFT 1/i)).toBeInTheDocument();
      // Check for other details in the detail view if needed
      expect(screen.getByText(/Contract Address:/i)).toBeInTheDocument();
      expect(screen.getByText(/0xdef.../)).toBeInTheDocument();
    });
  });

  test('clicking Back to Rewards button hides the detail view', async () => {
    render(<RewardsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Earned NFT 1/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByText(/Earned NFT 1/i));

    await waitFor(() => {
      expect(screen.getByText(/NFT Details/i)).toBeInTheDocument();
    });

    userEvent.click(screen.getByRole('button', { name: /Back to Rewards/i }));

    await waitFor(() => {
      expect(screen.queryByText(/NFT Details/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Available Rewards/i)).toBeInTheDocument(); // Check if back to main view
    });
  });

  test('clicking Claim button calls the claim API and refreshes data', async () => {
    const claimUrl = '/api/rewards/claim';

    // Mock fetch for claim, then subsequent data refreshes
    global.fetch = jest.fn((url) => {
      if (url === claimUrl) {
        return Promise.resolve(createMockResponse({ message: 'Reward claimed successfully' }));
      } else if (url === '/api/rewards/available') {
        // Simulate rewards list updating after claim
        return Promise.resolve(createMockResponse([])); // Empty rewards after claiming the only one
      } else if (url === '/api/wallet/balance') {
        // Simulate balance updating after claim
        return Promise.resolve(createMockResponse({ balance: 110, otherTokens: [] })); // Balance increased
      } else if (url === '/api/wallet/transactions') {
        // Simulate transactions updating after claim
        return Promise.resolve(createMockResponse([{ id: 'tx2', type: 'claim', amount: 10, currency: 'Dojo Coin', date: '2023-01-02', description: 'Claimed reward 2' }] as Transaction[]));
      } else if (url === '/api/wallet/nfts') {
        return Promise.resolve(createMockResponse(mockNfts));
      }
      return Promise.reject(new Error(`unhandled fetch URL in claim test: ${url}`));
    });

    render(<RewardsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Test Reward 1/i)).toBeInTheDocument();
    });

    const claimButton = screen.getByRole('button', { name: /Claim/i });
    userEvent.click(claimButton);

    // Check if fetch was called with correct parameters for claim
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(claimUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: '1' }), // Assuming the first reward is claimed
      });
    });

    // Check if data is refreshed after claim
    await waitFor(() => {
      expect(screen.queryByText(/Test Reward 1/i)).not.toBeInTheDocument(); // Reward is gone
      expect(screen.getByText(/110 Dojo Coins/)).toBeInTheDocument(); // Balance updated
      expect(screen.getByText(/Claimed reward 2/i)).toBeInTheDocument(); // New transaction
    });
  });

  // Add tests for claiming different reward types if necessary
}); 