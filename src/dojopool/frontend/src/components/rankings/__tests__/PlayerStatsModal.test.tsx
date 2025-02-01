import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import axios from 'axios';
import PlayerStatsModal from '../PlayerStatsModal';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create theme for testing
const theme = createTheme();

// Sample player stats data
const mockPlayerStats = {
  user_id: 1,
  username: "Player1",
  rating: 2500,
  rank: 1,
  tier: "Pool God",
  tier_color: "#FFD700",
  total_games: 100,
  recent_games: 20,
  win_rate: 0.75,
  tournament_score: 0.8,
  ranking_history: [
    { date: "2024-01-01", rating: 2400 },
    { date: "2024-01-15", rating: 2450 },
    { date: "2024-02-01", rating: 2500 }
  ],
  achievements: [
    {
      name: "First Victory",
      date: "2024-01-01",
      icon: "/icons/victory.png"
    },
    {
      name: "Tournament Champion",
      date: "2024-01-15",
      icon: "/icons/champion.png"
    }
  ],
  performance_metrics: {
    accuracy: 0.85,
    consistency: 0.75,
    speed: 0.70,
    strategy: 0.80
  }
};

// Setup test environment
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = (props: { open: boolean; onClose: () => void; userId: number }) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <PlayerStatsModal {...props} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('PlayerStatsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    queryClient.clear();
    mockedAxios.get.mockClear();
    mockOnClose.mockClear();
  });

  it('does not render when closed', () => {
    renderComponent({ open: false, onClose: mockOnClose, userId: 1 });
    expect(screen.queryByText('Player Statistics')).not.toBeInTheDocument();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementationOnce(() => 
      new Promise((resolve) => setTimeout(resolve, 100))
    );

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders player stats correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Check header stats
    expect(screen.getByText('2500')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('75.0%')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    // Check performance metrics
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    // Check achievements
    expect(screen.getByText('First Victory')).toBeInTheDocument();
    expect(screen.getByText('Tournament Champion')).toBeInTheDocument();
  });

  it('handles close button click', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Click close button
    fireEvent.click(screen.getByTestId('CloseIcon'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays error state when API fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Error loading player statistics')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Check date formatting in achievements
    expect(screen.getByText('1/1/2024')).toBeInTheDocument();
    expect(screen.getByText('1/15/2024')).toBeInTheDocument();
  });

  it('renders performance metrics with correct colors', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Check metric colors
    const accuracyMetric = screen.getByText('Accuracy').parentElement;
    expect(accuracyMetric).toHaveStyle({
      backgroundColor: expect.stringContaining('rgba')
    });
  });

  it('renders achievement icons correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Check achievement icons
    const achievementIcons = screen.getAllByRole('img');
    expect(achievementIcons).toHaveLength(2);
    expect(achievementIcons[0]).toHaveAttribute('src', '/icons/victory.png');
    expect(achievementIcons[1]).toHaveAttribute('src', '/icons/champion.png');
  });

  it('updates when userId changes', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockPlayerStats })
      .mockResolvedValueOnce({ data: { ...mockPlayerStats, user_id: 2, username: 'Player2' } });

    const { rerender } = renderComponent({ open: true, onClose: mockOnClose, userId: 1 });

    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });

    // Rerender with new userId
    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <PlayerStatsModal open={true} onClose={mockOnClose} userId={2} />
        </ThemeProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/rankings/player/2');
    });
  });
}); 