import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { WalletTransactionList } from '../../components/wallet/WalletTransactionList';
import { Transaction } from '../../types/wallet';
import { formatCurrency } from '../../utils/format';
import { formatDistanceToNow } from 'date-fns';

// Mock date-fns and formatCurrency
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn((date, options) => `some time ago`),
}));
jest.mock('../../utils/format', () => ({
  formatCurrency: jest.fn((value, currency) => `${value.toFixed(2)} ${currency}`),
  formatNumber: jest.fn((value) => value.toString()),
}));

const theme = createTheme();

const renderComponent = (transactions: Transaction[]) => {
  return render(
    <ThemeProvider theme={theme}>
      <WalletTransactionList transactions={transactions} />
    </ThemeProvider>
  );
};

// Mock transaction data
const mockTransactions: Transaction[] = [
  {
    id: 1,
    wallet_id: 1,
    user_id: 1,
    amount: 100,
    currency: 'DP',
    type: 'REWARD',
    transaction_type: 'CREDIT',
    status: 'COMPLETED',
    description: 'Daily Login Bonus',
    reference_id: null,
    metadata: { reward_type: 'login' },
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    wallet_id: 1,
    user_id: 1,
    amount: -50,
    currency: 'DP',
    type: 'TRANSFER',
    transaction_type: 'DEBIT',
    status: 'COMPLETED',
    description: 'Sent to Friend X',
    reference_id: 'tx_abc',
    metadata: { recipient_id: 'user_2' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    wallet_id: 1,
    user_id: 2, // Received from another user
    amount: 25,
    currency: 'DP',
    type: 'TRANSFER',
    transaction_type: 'CREDIT',
    status: 'COMPLETED',
    description: 'Received from Friend Y',
    reference_id: 'tx_def',
    metadata: { sender_id: 'user_3' },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  },
];

describe('WalletTransactionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "No transactions yet" message when the list is empty', () => {
    renderComponent([]);
    expect(screen.getByText('No transactions yet')).toBeInTheDocument();
  });

  it('renders a list of transactions with correct details', () => {
    renderComponent(mockTransactions);

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(mockTransactions.length);

    // Check details of the first transaction (REWARD)
    const firstItem = listItems[0];
    expect(within(firstItem).getByText('Daily Login Bonus')).toBeInTheDocument();
    expect(within(firstItem).getByText('Reward')).toBeInTheDocument(); // Chip label
    expect(within(firstItem).getByTestId('EmojiEventsIcon')).toBeInTheDocument(); // Icon
    expect(within(firstItem).getByText(/ago$/)).toBeInTheDocument(); // Check date format
    expect(within(firstItem).getByText('100.00 DP')).toBeInTheDocument(); // Check formatted amount
    expect(formatCurrency).toHaveBeenCalledWith(100, 'DP');
    expect(formatDistanceToNow).toHaveBeenCalledWith(new Date(mockTransactions[0].created_at!), { addSuffix: true });

    // Check details of the second transaction (SENT TRANSFER)
    const secondItem = listItems[1];
    expect(within(secondItem).getByText('Sent to Friend X')).toBeInTheDocument();
    expect(within(secondItem).getByText('Sent Transfer')).toBeInTheDocument(); // Chip label
    expect(within(secondItem).getByTestId('CallMadeIcon')).toBeInTheDocument(); // Icon
    expect(within(secondItem).getByText(/ago$/)).toBeInTheDocument(); 
    expect(within(secondItem).getByText('50.00 DP')).toBeInTheDocument(); 
    expect(formatCurrency).toHaveBeenCalledWith(50, 'DP'); 
    expect(formatDistanceToNow).toHaveBeenCalledWith(new Date(mockTransactions[1].created_at!), { addSuffix: true });

     // Check details of the third transaction (RECEIVED TRANSFER)
     const thirdItem = listItems[2];
     expect(within(thirdItem).getByText('Received from Friend Y')).toBeInTheDocument();
     expect(within(thirdItem).getByText('Received Transfer')).toBeInTheDocument(); // Chip label
     expect(within(thirdItem).getByTestId('CallReceivedIcon')).toBeInTheDocument(); // Icon
     expect(within(thirdItem).getByText(/ago$/)).toBeInTheDocument(); 
     expect(within(thirdItem).getByText('25.00 DP')).toBeInTheDocument(); 
     expect(formatCurrency).toHaveBeenCalledWith(25, 'DP'); 
     expect(formatDistanceToNow).toHaveBeenCalledWith(new Date(mockTransactions[2].created_at!), { addSuffix: true });
  });
}); 