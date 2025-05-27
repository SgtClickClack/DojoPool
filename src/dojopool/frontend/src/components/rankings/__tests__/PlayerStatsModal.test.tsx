import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "react-query";
import { ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import axios from "axios";
import PlayerStatsModal from "../PlayerStatsModal";

// Mock axios
jest.mock("axios");
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
    { date: "2024-02-01", rating: 2500 },
  ],
  achievements: [
    {
      name: "First Victory",
      date: "2024-01-01",
      icon: "/icons/victory.png",
    },
    {
      name: "Tournament Champion",
      date: "2024-01-15",
      icon: "/icons/champion.png",
    },
  ],
  performance_metrics: {
    accuracy: 0.85,
    consistency: 0.75,
    speed: 0.7,
    strategy: 0.8,
  },
  tournament_placements: [
    {
      tournament_id: 101,
      name: "Spring Open",
      date: "2024-03-01",
      placement: 1,
    },
    {
      tournament_id: 102,
      name: "Summer Classic",
      date: "2024-06-15",
      placement: 2,
    },
  ],
  games_won: 75,
  tournament_wins: 5,
  rank_movement: 2,
  rank_streak: 4,
  rank_streak_type: "win",
  highest_rating: 2550,
  highest_rating_date: "2024-02-15",
  highest_rank: 1,
  highest_rank_date: "2024-02-15",
};

// Setup test environment
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = (props: { playerId: number; onClose: () => void }) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <PlayerStatsModal {...props} />
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe("PlayerStatsModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    queryClient.clear();
    mockedAxios.get.mockClear();
    mockOnClose.mockClear();
  });

  it("does not render when closed", () => {
    renderComponent({ playerId: 1, onClose: mockOnClose });
    expect(screen.queryByText("Player Statistics")).not.toBeInTheDocument();
  });

  it("renders loading state initially", () => {
    mockedAxios.get.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    renderComponent({ playerId: 1, onClose: mockOnClose });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders player stats correctly", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ playerId: 1, onClose: mockOnClose });

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check header stats
    expect(screen.getByText(/2500/)).toBeInTheDocument();
    expect(screen.getByText(/#1/)).toBeInTheDocument();
    expect(screen.getByText(/75(\.0)?%/)).toBeInTheDocument();
    expect(screen.getByText(/100/)).toBeInTheDocument();

    // Check performance metrics
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();

    // Check achievements
    expect(screen.getByText("First Victory")).toBeInTheDocument();
    expect(screen.getByText("Tournament Champion")).toBeInTheDocument();
  });

  it("handles close button click", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ playerId: 1, onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Click close button
    fireEvent.click(screen.getByTestId("CloseIcon"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("displays error state when API fails", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("API Error"));

    renderComponent({ playerId: 1, onClose: mockOnClose });

    await waitFor(() => {
      expect(
        screen.getByText("Error loading player statistics"),
      ).toBeInTheDocument();
    });
  });

  it("formats dates correctly", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ playerId: 1, onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check date formatting in achievements
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/2024/)).toBeInTheDocument();
  });

  it("renders performance metrics with correct colors", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ playerId: 1, onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check metric colors
    const accuracyMetric = screen.getByText("Accuracy").parentElement;
    expect(accuracyMetric).toHaveStyle({
      backgroundColor: expect.stringContaining("rgba"),
    });
  });

  it("renders achievement icons correctly", async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockPlayerStats });

    renderComponent({ playerId: 1, onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Check achievement icons
    const svgs = screen.getAllByTestId("EmojiEventsIcon");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("updates when playerId changes", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockPlayerStats });

    const { rerender } = renderComponent({
      playerId: 1,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText("Player Statistics")).toBeInTheDocument();
    });

    // Rerender with new playerId
    rerender(
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <PlayerStatsModal playerId={2} onClose={mockOnClose} />
        </ThemeProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/rankings/player/2");
    });
  });
});
