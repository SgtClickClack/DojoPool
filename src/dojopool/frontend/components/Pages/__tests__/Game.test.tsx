import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import { theme } from '@/theme';
import Game from '../Game';
import { gameApi } from '@/services/api';
import { gameSocket } from '@/services/websocket/gameSocket';

// Mock dependencies
jest.mock('@/services/api');
jest.mock('@/services/websocket/gameSocket');

describe('Game', () => {
  const mockLocation = { latitude: 51.5074, longitude: -0.1278 };
  let mockUseLocation: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset location mock for each test
    mockUseLocation = jest.fn().mockReturnValue({
      location: mockLocation,
      error: null,
      isLoading: false,
    });
    jest.mock('@/hooks/useLocation', () => ({
      useLocation: () => mockUseLocation(),
    }));

    // Mock initial game state
    (gameApi.getGameState as jest.Mock).mockResolvedValue({
      timeRemaining: 3600,
      score: 100,
      currentLocation: mockLocation,
      isActive: true,
    });
  });

  const renderGame = () => {
    return render(
      <MemoryRouter initialEntries={['/game/123']}>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route path="/game/:gameId" element={<Game />} />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  describe('Location Tracking', () => {
    it('sends location updates to websocket when location changes', async () => {
      renderGame();
      await waitFor(() => {
        expect(gameSocket.connect).toHaveBeenCalledWith('123');
      });

      const newLocation = { latitude: 51.508, longitude: -0.128 };
      mockUseLocation.mockReturnValue({
        location: newLocation,
        error: null,
        isLoading: false,
      });

      // Re-render with new location
      await act(async () => {
        renderGame();
      });

      expect(gameSocket.updateLocation).toHaveBeenCalledWith(newLocation);
    });

    it('shows loading state while getting location', () => {
      mockUseLocation.mockReturnValue({
        location: null,
        error: null,
        isLoading: true,
      });

      renderGame();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows error when location access fails', () => {
      mockUseLocation.mockReturnValue({
        location: null,
        error: new GeolocationPositionError(),
        isLoading: false,
      });

      renderGame();
      expect(screen.getByText(/Failed to access location/)).toBeInTheDocument();
    });
  });

  describe('Player Interactions', () => {
    it('updates map when other players move', async () => {
      const { container } = renderGame();
      await waitFor(() => {
        expect(gameSocket.connect).toHaveBeenCalled();
      });

      const otherPlayers = {
        player1: { latitude: 51.508, longitude: -0.128 },
        player2: { latitude: 51.509, longitude: -0.129 },
      };

      // Simulate receiving other player locations
      const locationCallback = (gameSocket.onPlayerLocations as jest.Mock).mock.calls[0][0];
      act(() => {
        locationCallback(otherPlayers);
      });

      // Verify map is updated with new markers
      expect(container.querySelector('[data-testid="google-map"]')).toBeInTheDocument();
    });

    it('maintains player locations during reconnection', async () => {
      renderGame();
      await waitFor(() => {
        expect(gameSocket.connect).toHaveBeenCalled();
      });

      // Simulate disconnect
      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'disconnect'
      )[1];
      act(() => {
        disconnectHandler();
      });

      // Simulate reconnect
      const connectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connect'
      )[1];
      act(() => {
        connectHandler();
      });

      // Should maintain game state
      expect(screen.getByText('Score: 100')).toBeInTheDocument();
    });
  });

  describe('Game State Updates', () => {
    it('updates score in real-time', async () => {
      renderGame();
      await waitFor(() => {
        expect(gameSocket.connect).toHaveBeenCalled();
      });

      // Simulate game update
      const gameUpdateCallback = (gameSocket.onGameUpdate as jest.Mock).mock.calls[0][0];
      act(() => {
        gameUpdateCallback({
          type: 'score_update',
          data: { score: 150 },
        });
      });

      expect(screen.getByText('Score: 150')).toBeInTheDocument();
    });

    it('handles game completion', async () => {
      renderGame();
      await waitFor(() => {
        expect(gameSocket.connect).toHaveBeenCalled();
      });

      // Simulate game over
      const gameUpdateCallback = (gameSocket.onGameUpdate as jest.Mock).mock.calls[0][0];
      act(() => {
        gameUpdateCallback({
          type: 'game_over',
          data: { finalScore: 200 },
        });
      });

      expect(screen.getByText('Score: 200')).toBeInTheDocument();
    });
  });
});
