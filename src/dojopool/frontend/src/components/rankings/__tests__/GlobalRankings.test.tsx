import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import axios from 'axios';
import GlobalRankings from '../GlobalRankings';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create theme for testing
const theme = createTheme();

// Sample ranking data
const mockRankings = [
  {
    user_id: 1,
    username: "Player1",
    rating: 2500,
    rank: 1,
    tier: "Pool God",
    tier_color: "#FFD700",
    total_games: 100,
    recent_games: 20,
    win_rate: 0.75,
    tournament_score: 0.8
  },
  {
    user_id: 2,
    username: "Player2",
    rating: 2300,
    rank: 2,
    tier: "Divine",
    tier_color: "#FF69B4",
    total_games: 80,
    recent_games: 15,
    win_rate: 0.65,
    tournament_score: 0.7
  }
];

// Setup test environment
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <GlobalRankings />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('GlobalRankings', () => {
  beforeEach(() => {
    queryClient.clear();
    mockedAxios.get.mockClear();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementationOnce(() => 
      new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders rankings data correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    // Check if rankings are displayed correctly
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Pool God')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    // Find and click next page button
    const nextPageButton = screen.getByRole('button', { name: /go to page 2/i });
    fireEvent.click(nextPageButton);

    // Verify new API call was made with correct parameters
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('start_rank=11&end_rank=20')
    );
  });

  it('opens player stats modal on click', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    // Click on player row
    fireEvent.click(screen.getByText('Player1'));

    // Verify modal is opened
    expect(screen.getByText('Player Statistics')).toBeInTheDocument();
  });

  it('displays error state when API fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Error loading rankings')).toBeInTheDocument();
    });
  });

  it('shows correct tier icons', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Pool God')).toBeInTheDocument();
    });

    // Verify tier icons are displayed
    const poolGodIcon = screen.getByTestId('EmojiEventsIcon');
    expect(poolGodIcon).toBeInTheDocument();
    expect(poolGodIcon).toHaveStyle({ color: '#FFD700' });
  });

  it('shows correct activity indicators', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    // Verify activity indicators
    const trendingUpIcon = screen.getByTestId('TrendingUpIcon');
    expect(trendingUpIcon).toBeInTheDocument();
    expect(trendingUpIcon).toHaveClass('MuiSvgIcon-colorSuccess');
  });

  it('formats numbers correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('2500')).toBeInTheDocument();
    });

    // Verify number formatting
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('(20 recent)')).toBeInTheDocument();
  });

  it('applies correct styling for top 3 players', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockRankings });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument();
    });

    // Verify top player styling
    const rank1 = screen.getByText('#1');
    expect(rank1).toHaveStyle({ fontWeight: 'bold' });
  });
}); 