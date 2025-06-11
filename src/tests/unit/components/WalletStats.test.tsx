import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { WalletStatsDisplay } from '../../components/wallet/WalletStats';
import type { WalletStats } from '../../types/wallet';
import { formatCurrency, formatNumber } from '../../utils/format';

// Mock formatCurrency
jest.mock('../../utils/format', () => ({
  formatCurrency: jest.fn((value, currency) => `${value.toFixed(2)} ${currency}`),
  formatNumber: jest.fn((value) => value.toString()),
}));

const theme = createTheme();

const renderComponent = (stats: WalletStats | null) => {
  return render(
    <ThemeProvider theme={theme}>
      <WalletStatsDisplay stats={stats} />
    </ThemeProvider>
  );
};

// Mock stats data
const mockStatsData: WalletStats = {
  total_transactions: 15,
  total_volume: 1250.75,
  total_incoming: 800.50,
  total_outgoing: 450.25,
  rewards: {
    'daily': { count: 5, total_amount: 100 },
    'tournament': { count: 2, total_amount: 250 },
  },
};

describe('WalletStats Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Restore mock implementations if they were changed in tests
    (formatCurrency as jest.Mock).mockImplementation((value, currency) => `${value.toFixed(2)} ${currency}`);
    (formatNumber as jest.Mock).mockImplementation((value) => value.toString());
  });

  it('renders nothing when stats prop is null', () => {
    const { container } = renderComponent(null);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all stat cards with correct data when stats are provided', () => {
    renderComponent(mockStatsData);

    // Check Total Volume card
    expect(screen.getByText('Total Volume')).toBeInTheDocument();
    expect(screen.getByText('1250.75 DP')).toBeInTheDocument(); // Check formatted value
    expect(screen.getByText(`${mockStatsData.total_transactions} transactions`)).toBeInTheDocument(); // Check subValue
    expect(formatCurrency).toHaveBeenCalledWith(mockStatsData.total_volume, 'DP');
    expect(formatNumber).toHaveBeenCalledWith(mockStatsData.total_transactions);

    // Check Total Rewards card
    const expectedTotalRewards = mockStatsData.rewards!['daily'].total_amount + mockStatsData.rewards!['tournament'].total_amount;
    const expectedRewardCount = mockStatsData.rewards!['daily'].count + mockStatsData.rewards!['tournament'].count;
    expect(screen.getByText('Total Rewards')).toBeInTheDocument();
    expect(screen.getByText(`${expectedTotalRewards.toFixed(2)} DP`)).toBeInTheDocument(); // Check formatted value
    expect(screen.getByText(`${expectedRewardCount} rewards earned`)).toBeInTheDocument(); // Check subValue
    expect(formatCurrency).toHaveBeenCalledWith(expectedTotalRewards, 'DP');
    
    // Check Total Received card
    expect(screen.getByText('Total Received')).toBeInTheDocument();
    expect(screen.getByText(`${mockStatsData.total_incoming.toFixed(2)} DP`)).toBeInTheDocument();
    expect(formatCurrency).toHaveBeenCalledWith(mockStatsData.total_incoming, 'DP');

    // Check Total Sent card
    expect(screen.getByText('Total Sent')).toBeInTheDocument();
    expect(screen.getByText(`${mockStatsData.total_outgoing.toFixed(2)} DP`)).toBeInTheDocument();
    expect(formatCurrency).toHaveBeenCalledWith(mockStatsData.total_outgoing, 'DP');
  });

  it('handles stats with no rewards correctly', () => {
    const statsWithoutRewards: WalletStats = {
      total_transactions: 5,
      total_volume: 100,
      total_incoming: 60,
      total_outgoing: 40,
      // rewards property is optional, test case where it might be missing or empty
      // rewards: {},
    };
    renderComponent(statsWithoutRewards);

    // Total Rewards card should show 0
    expect(screen.getByText('Total Rewards')).toBeInTheDocument();
    expect(screen.getByText('0.00 DP')).toBeInTheDocument(); 
    expect(screen.getByText('0 rewards earned')).toBeInTheDocument(); 
    expect(formatCurrency).toHaveBeenCalledWith(0, 'DP'); // Called for rewards calculation
  });
}); 