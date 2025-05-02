import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { WalletDashboard } from '../../components/wallet/WalletDashboard';
import { WalletService } from '../../services/wallet/WalletService';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/format';
import { Wallet, Transaction, WalletStats } from '../../types/wallet';

// Create the mock instance *outside* describe/beforeEach
const mockedWalletServiceInstance = {
  getWallet: jest.fn(),
  getWalletStats: jest.fn(),
  getTransactionHistory: jest.fn(),
  transferCoins: jest.fn(),
};

// Mock dependencies
jest.mock('../../firebase/config');
jest.mock('../../services/wallet/WalletService', () => ({
  // Factory now returns the *same* mock instance every time
  WalletService: jest.fn().mockImplementation(() => mockedWalletServiceInstance),
}));
// Explicit factory mock for useAuth
jest.mock('../../hooks/useAuth', () => ({
  __esModule: true, 
  useAuth: jest.fn(() => ({
    user: { /* Mock User Data */ } as any, // Placeholder, fill with necessary fields
    loading: false,
    error: null,
    // Provide jest.fn() for other methods
    signIn: jest.fn(),
    signUp: jest.fn(),
    // ... other useAuth methods
    getDeletionRequestStatusCheck: jest.fn(),
  })),
}));

jest.mock('../../utils/format', () => ({
  formatCurrency: jest.fn((value, currency) => `${value} ${currency}`),
}));
// Mock child components to isolate testing WalletDashboard
jest.mock('../../components/wallet/WalletTransactionList', () => ({
  WalletTransactionList: ({ transactions }: { transactions: Transaction[] }) => (
    <div data-testid="wallet-transaction-list">{transactions.length} transactions</div>
  ),
}));
jest.mock('../../components/wallet/WalletStats', () => ({
  WalletStats: ({ stats }: { stats: WalletStats | null }) => (
    <div data-testid="wallet-stats">{stats ? JSON.stringify(stats) : 'No stats'}</div>
  ),
}));
jest.mock('../../components/wallet/TransferDialog', () => ({
  TransferDialog: ({ open, onClose, onTransfer, maxAmount }: any) =>
    open ? (
      <div data-testid="transfer-dialog">
        <button onClick={() => onTransfer(123, 50, 'Test Transfer')}>Submit Transfer</button>
        <button onClick={onClose}>Close Dialog</button>
        <span>Max: {maxAmount}</span>
      </div>
    ) : null,
}));

// Cast the implicitly created hook mock
const mockUseAuth = useAuth as jest.MockedFunction<typeof import('../../hooks/useAuth').useAuth>;
const mockFormatCurrency = formatCurrency as jest.MockedFunction<typeof formatCurrency>;

const theme = createTheme();

const renderComponent = () => {
  return render(
    <ThemeProvider theme={theme}>
      <WalletDashboard />
    </ThemeProvider>
  );
};

// Mock data
const mockWallet: Wallet = {
  id: 1,
  user_id: 1,
  balance: 1000,
  currency: 'DP',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockStats: WalletStats = {
  total_transactions: 5,
  total_volume: 500,
  total_incoming: 300,
  total_outgoing: 200,
  rewards: { 'daily': { count: 2, total_amount: 50 } },
};

const mockTransactions: Transaction[] = [
  { id: 1, wallet_id: 1, user_id: 1, amount: 100, currency: 'DP', type: 'REWARD', transaction_type: 'CREDIT', status: 'COMPLETED', description: 'Daily Login', reference_id: null, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, wallet_id: 1, user_id: 1, amount: -50, currency: 'DP', type: 'TRANSFER', transaction_type: 'DEBIT', status: 'COMPLETED', description: 'Sent to user 2', reference_id: null, metadata: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

describe('WalletDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // No need to instantiate the service mock here

    // Reset and configure return values on the *shared* mock instance
    mockedWalletServiceInstance.getWallet.mockResolvedValue(mockWallet);
    mockedWalletServiceInstance.getWalletStats.mockResolvedValue(mockStats);
    mockedWalletServiceInstance.getTransactionHistory.mockResolvedValue(mockTransactions);
    mockedWalletServiceInstance.transferCoins.mockResolvedValue({ success: true });
  });

  it('renders loading state initially', () => {
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays wallet data after loading', async () => {
    renderComponent();
    await waitFor(() => {
        // Check that the mocked methods were called
        expect(mockedWalletServiceInstance.getWallet).toHaveBeenCalledTimes(1);
        expect(mockedWalletServiceInstance.getWalletStats).toHaveBeenCalledTimes(1);
        expect(mockedWalletServiceInstance.getTransactionHistory).toHaveBeenCalledTimes(1);
        // Check that the data is displayed correctly
        expect(screen.getByText(`${mockWallet.balance} DP`)).toBeInTheDocument();
        expect(screen.getByText(mockStats.total_transactions.toString())).toBeInTheDocument();
    });
     // Check formatCurrency was eventually called with correct balance
    await waitFor(() => expect(mockFormatCurrency).toHaveBeenCalledWith(mockWallet.balance, 'DP'));
  });

  it('opens the transfer dialog when "Transfer Coins" button is clicked', async () => {
    renderComponent();
    // Wait for balance to appear, indicating data load complete
    await waitFor(() => expect(screen.getByText(`${mockWallet.balance} DP`)).toBeInTheDocument()); 

    expect(screen.queryByTestId('transfer-dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));

    await waitFor(() => {
       expect(screen.getByTestId('transfer-dialog')).toBeInTheDocument();
       expect(screen.getByText(`Max: ${mockWallet.balance}`)).toBeInTheDocument(); 
    });
  });

  it('calls transfer service and reloads data on successful transfer', async () => {
    renderComponent();
    // Wait for initial data load
    await waitFor(() => expect(mockedWalletServiceInstance.getWallet).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));
    await waitFor(() => expect(screen.getByTestId('transfer-dialog')).toBeInTheDocument());

    const initialGetWalletCalls = mockedWalletServiceInstance.getWallet.mock.calls.length;
    
    fireEvent.click(screen.getByRole('button', { name: /submit transfer/i }));

    // Check transferCoins was called on the shared instance
    await waitFor(() => expect(mockedWalletServiceInstance.transferCoins).toHaveBeenCalledWith(123, 50, 'Test Transfer'));
    
    // Check data reload was triggered (getWallet called again)
    await waitFor(() => expect(mockedWalletServiceInstance.getWallet).toHaveBeenCalledTimes(initialGetWalletCalls + 1));

    expect(screen.queryByTestId('transfer-dialog')).not.toBeInTheDocument();
  });

  it('handles error during data loading', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Configure rejection on the shared instance
    mockedWalletServiceInstance.getWallet.mockRejectedValueOnce(new Error('Network Error'));

    renderComponent();

    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    
    expect(screen.getByText('0 DP')).toBeInTheDocument(); 
    const transactionsCard = screen.getByText('Transactions').closest('.MuiCard-root');
    expect(within(transactionsCard as HTMLElement).getByText('0')).toBeInTheDocument();
    const rewardsCard = screen.getByText('Rewards').closest('.MuiCard-root');
    expect(within(rewardsCard as HTMLElement).getByText('0')).toBeInTheDocument();

    // Check error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading wallet data:', expect.any(Error));
    
    consoleErrorSpy.mockRestore();
  });

  it('handles error during transfer', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Configure rejection on the shared instance
    mockedWalletServiceInstance.transferCoins.mockRejectedValueOnce(new Error('Transfer Failed'));

    renderComponent();
    // Wait for initial load
    await waitFor(() => expect(mockedWalletServiceInstance.getWallet).toHaveBeenCalled()); 

    fireEvent.click(screen.getByRole('button', { name: /transfer coins/i }));
    await waitFor(() => expect(screen.getByTestId('transfer-dialog')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /submit transfer/i }));

    // Check transferCoins was called
    await waitFor(() => expect(mockedWalletServiceInstance.transferCoins).toHaveBeenCalled());
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Transfer error:', expect.any(Error));
    expect(screen.getByTestId('transfer-dialog')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
}); 