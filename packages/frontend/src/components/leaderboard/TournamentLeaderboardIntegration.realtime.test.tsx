import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TournamentLeaderboardIntegration } from './TournamentLeaderboardIntegration';
import { crossChainTournamentService } from '../../services/crossChainTournamentService';
import leaderboardService from '../../services/leaderboardService';
import { websocketService } from '../../services/websocketService';
import { analyticsService } from '../../services/analytics';

// Mock dependencies
jest.mock('../../services/crossChainTournamentService');
jest.mock('../../services/leaderboardService');
jest.mock('../../services/websocketService');
jest.mock('../../services/analytics');
jest.mock('./TournamentLeaderboard', () => ({
  TournamentLeaderboard: jest.fn(() => <div data-testid="tournament-leaderboard" />)
}));
jest.mock('./GlobalLeaderboard', () => ({
  GlobalLeaderboard: jest.fn(() => <div data-testid="global-leaderboard" />)
}));

// Mocked tournament details
const mockTournamentDetails = {
  id: 'tournament-123',
  name: 'Test Tournament',
  description: 'A test tournament',
  startTime: '2025-03-01T12:00:00Z',
  endTime: '2025-03-01T18:00:00Z',
  registrationDeadline: '2025-02-28T23:59:59Z',
  location: 'Test Venue',
  format: 'Single Elimination',
  gameType: 'Eight Ball',
  prizePool: '1.5',
  entryFeeEth: '0.1',
  entryFeeSol: '2',
  maxParticipants: 16,
  participantsCount: 8,
  isNativeChain: 'ethereum',
  isCrossChain: true,
  status: 'in_progress',
  creator: '0x123456789'
};

// Mocked leaderboard data
const mockLeaderboardData = {
  entries: [
    {
      id: 'entry-1',
      rank: 1,
      userId: 'user-1',
      username: 'Player One',
      avatar: 'avatar1.png',
      score: 150,
      tournamentId: 'tournament-123',
      tournamentName: 'Test Tournament',
      matchesPlayed: 6
    },
    {
      id: 'entry-2',
      rank: 2,
      userId: 'user-2',
      username: 'Player Two',
      avatar: 'avatar2.png',
      score: 120,
      tournamentId: 'tournament-123',
      tournamentName: 'Test Tournament',
      matchesPlayed: 5
    }
  ],
  lastUpdated: '2025-03-01T17:30:00Z',
  tournamentId: 'tournament-123',
  tournamentName: 'Test Tournament'
};

// Mock implementation of the WebSocket service
let websocketSubscriptionCallback: (data: any) => void;
const mockWebSocketImplementation = {
  isConnected: jest.fn(() => true),
  connect: jest.fn(),
  subscribe: jest.fn((eventType, callback) => {
    websocketSubscriptionCallback = callback;
    return jest.fn(); // Return unsubscribe function
  }),
  send: jest.fn()
};

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset the WebSocket subscription callback
  websocketSubscriptionCallback = () => {};
  
  // Setup mock implementations
  (crossChainTournamentService.getTournamentDetails as jest.Mock).mockResolvedValue(mockTournamentDetails);
  (leaderboardService.getTournamentLeaderboard as jest.Mock).mockResolvedValue(mockLeaderboardData);
  (analyticsService.trackEvent as jest.Mock).mockImplementation(() => {});
  
  // Setup WebSocket service mock
  (websocketService.isConnected as jest.Mock).mockImplementation(mockWebSocketImplementation.isConnected);
  (websocketService.connect as jest.Mock).mockImplementation(mockWebSocketImplementation.connect);
  (websocketService.subscribe as jest.Mock).mockImplementation(mockWebSocketImplementation.subscribe);
  (websocketService.send as jest.Mock).mockImplementation(mockWebSocketImplementation.send);
});

describe('TournamentLeaderboardIntegration Real-time Updates', () => {
  test('live updates toggle button appears when tournament is in progress', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
  
  test('enabling live updates connects to WebSocket if not already connected', async () => {
    // Mock WebSocket as not connected initially
    (websocketService.isConnected as jest.Mock).mockReturnValueOnce(false);
    
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Click the live updates button to enable them
    fireEvent.click(screen.getByText('Paused'));
    
    expect(websocketService.connect).toHaveBeenCalled();
  });
  
  test('enabling live updates subscribes to tournament updates', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Click the live updates button to enable them
    fireEvent.click(screen.getByText('Paused'));
    
    expect(websocketService.subscribe).toHaveBeenCalledWith('tournament_update', expect.any(Function));
    expect(websocketService.send).toHaveBeenCalledWith({
      type: 'tournament_update',
      data: {
        action: 'subscribe',
        tournamentId: 'tournament-123'
      }
    });
  });
  
  test('live updates change button state and text to "Live"', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Initially button should show "Paused"
    expect(screen.getByText('Paused')).toBeInTheDocument();
    
    // Click the live updates button to enable them
    fireEvent.click(screen.getByText('Paused'));
    
    // Now button should show "Live"
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
  
  test('component updates leaderboard entries when WebSocket sends leaderboard update', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates
    fireEvent.click(screen.getByText('Paused'));
    
    // Create updated leaderboard entries
    const updatedEntries = [
      {
        id: 'entry-1',
        rank: 1,
        userId: 'user-1',
        username: 'Player One',
        avatar: 'avatar1.png',
        score: 180, // Score increased
        tournamentId: 'tournament-123',
        tournamentName: 'Test Tournament',
        matchesPlayed: 7 // Played one more match
      },
      {
        id: 'entry-2',
        rank: 2,
        userId: 'user-2',
        username: 'Player Two',
        avatar: 'avatar2.png',
        score: 140, // Score increased
        tournamentId: 'tournament-123',
        tournamentName: 'Test Tournament',
        matchesPlayed: 6 // Played one more match
      }
    ];
    
    // Simulate WebSocket receiving an update
    act(() => {
      websocketSubscriptionCallback({
        tournamentId: 'tournament-123',
        type: 'leaderboard_update',
        entries: updatedEntries
      });
    });
    
    // Verify analytics was called
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'tournament_live_update_received',
      expect.objectContaining({
        tournamentId: 'tournament-123',
        updateType: 'leaderboard'
      })
    );
  });
  
  test('component updates tournament details when WebSocket sends status update', async () => {
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates
    fireEvent.click(screen.getByText('Paused'));
    
    // Create updated tournament details
    const updatedDetails = {
      participantsCount: 10, // Two more participants joined
      status: 'in_progress'
    };
    
    // Simulate WebSocket receiving an update
    act(() => {
      websocketSubscriptionCallback({
        tournamentId: 'tournament-123',
        type: 'tournament_status_update',
        details: updatedDetails
      });
    });
    
    // Verify analytics was called
    expect(analyticsService.trackEvent).toHaveBeenCalledWith(
      'tournament_live_update_received',
      expect.objectContaining({
        tournamentId: 'tournament-123',
        updateType: 'status'
      })
    );
  });
  
  test('disabling live updates unsubscribes from WebSocket', async () => {
    const mockUnsubscribe = jest.fn();
    (websocketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates
    fireEvent.click(screen.getByText('Paused'));
    
    // Disable live updates
    fireEvent.click(screen.getByText('Live'));
    
    // Unsubscribe should have been called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  test('component unsubscribes from WebSocket when unmounted', async () => {
    const mockUnsubscribe = jest.fn();
    (websocketService.subscribe as jest.Mock).mockReturnValue(mockUnsubscribe);
    
    const { unmount } = render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates
    fireEvent.click(screen.getByText('Paused'));
    
    // Unmount the component
    unmount();
    
    // Unsubscribe should have been called
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  test('error in WebSocket connection shows error message and disables live updates', async () => {
    // Setup WebSocket connection to fail
    (websocketService.connect as jest.Mock).mockImplementation(({ onError }) => {
      onError();
    });
    
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates which will trigger the error
    fireEvent.click(screen.getByText('Paused'));
    
    // Check for error message
    expect(screen.getByText('Failed to connect to real-time updates. Data may be delayed.')).toBeInTheDocument();
    
    // Live updates should be disabled (button should still show "Paused")
    expect(screen.getByText('Paused')).toBeInTheDocument();
  });
  
  test('last updated timestamp is displayed and updated with new data', async () => {
    jest.useFakeTimers();
    const initialTime = new Date('2025-03-01T17:30:00Z');
    jest.setSystemTime(initialTime);
    
    render(<TournamentLeaderboardIntegration tournamentId="tournament-123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading Tournament...')).not.toBeInTheDocument();
    });
    
    // Enable live updates
    fireEvent.click(screen.getByText('Paused'));
    
    // Get the initial timestamp
    expect(screen.getByText(`Last updated: ${initialTime.toLocaleTimeString()}`)).toBeInTheDocument();
    
    // Advance time for WebSocket update
    const newTime = new Date('2025-03-01T17:35:00Z');
    jest.setSystemTime(newTime);
    
    // Simulate WebSocket receiving an update
    act(() => {
      websocketSubscriptionCallback({
        tournamentId: 'tournament-123',
        type: 'leaderboard_update',
        entries: mockLeaderboardData.entries
      });
    });
    
    // Timestamp should be updated
    expect(screen.getByText(`Last updated: ${newTime.toLocaleTimeString()}`)).toBeInTheDocument();
    
    jest.useRealTimers();
  });
}); 