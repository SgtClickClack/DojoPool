import { io } from 'socket.io-client';
import { gameSocket } from '../gameSocket';

jest.mock('socket.io-client');

describe('gameSocket', () => {
  const mockSocket = {
    connected: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (io as jest.Mock).mockReturnValue(mockSocket);
    localStorage.setItem('auth_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Connection Management', () => {
    it('connects with authentication', () => {
      const gameId = '123';
      gameSocket.connect(gameId);

      expect(io).toHaveBeenCalledWith(expect.any(String), {
        auth: { token: 'mock-token' },
        query: { gameId },
      });
    });

    it('handles reconnection automatically', () => {
      gameSocket.connect('123');

      // Get connect handler
      const connectHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'connect')[1];

      // Simulate disconnect and reconnect
      act(() => {
        connectHandler();
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('rejoin_game', {
        gameId: '123',
      });
    });

    it('cleans up properly on disconnect', () => {
      gameSocket.connect('123');
      gameSocket.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(mockSocket.off).toHaveBeenCalledWith('connect');
      expect(mockSocket.off).toHaveBeenCalledWith('disconnect');
      expect(mockSocket.off).toHaveBeenCalledWith('error');
    });
  });

  describe('Location Updates', () => {
    const mockLocation = { latitude: 51.5074, longitude: -0.1278 };

    beforeEach(() => {
      gameSocket.connect('123');
    });

    it('throttles location updates', () => {
      // Send multiple updates quickly
      gameSocket.updateLocation(mockLocation);
      gameSocket.updateLocation(mockLocation);
      gameSocket.updateLocation(mockLocation);

      // Should only emit once due to throttling
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });

    it('buffers updates during disconnection', () => {
      // Simulate disconnect
      mockSocket.connected = false;

      // Send updates while disconnected
      gameSocket.updateLocation(mockLocation);
      gameSocket.updateLocation({ ...mockLocation, latitude: 51.508 });

      // Simulate reconnect
      mockSocket.connected = true;
      const connectHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'connect')[1];
      connectHandler();

      // Should send buffered updates
      expect(mockSocket.emit).toHaveBeenCalledWith('update_location', {
        gameId: '123',
        location: { ...mockLocation, latitude: 51.508 },
      });
    });

    it('handles location subscription cleanup', () => {
      const callback = jest.fn();
      const cleanup = gameSocket.onPlayerLocations(callback);

      cleanup?.();

      expect(mockSocket.off).toHaveBeenCalledWith('player_locations', callback);
    });
  });

  describe('Error Handling', () => {
    it('handles connection errors', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      gameSocket.connect('123');

      // Get error handler
      const errorHandler = mockSocket.on.mock.calls.find((call) => call[0] === 'error')[1];

      // Simulate error
      const error = new Error('Connection failed');
      errorHandler(error);

      expect(consoleError).toHaveBeenCalledWith('Socket error:', error);
      consoleError.mockRestore();
    });

    it('handles missing auth token', () => {
      localStorage.clear();
      gameSocket.connect('123');

      expect(io).not.toHaveBeenCalled();
    });
  });
});
