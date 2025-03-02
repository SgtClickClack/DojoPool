/**
 * Unit tests for ReplayAnalyticsService
 */

import replayAnalyticsService from '../replayAnalyticsService';
import ReplayService from '../replayService';
import { ReplayFrame, ReplayMetadata } from '../replayTypes';

// Mock dependencies
jest.mock('../replayService');
jest.mock('../../analyticsService', () => ({
  trackEvent: jest.fn()
}));

// Mock data
const mockReplayMetadata: ReplayMetadata = {
  id: 'replay123',
  matchId: 'match123',
  tournamentId: 'tournament123',
  venueId: 'venue123',
  startTime: 1625000000000,
  endTime: 1625000300000, // 5 minutes later
  players: [
    { id: 'player1', name: 'Player One' },
    { id: 'player2', name: 'Player Two' }
  ],
  winner: 'player1',
  frameCount: 150,
  duration: 300, // 5 minutes in seconds
  gameType: 'eight_ball',
  highlights: [],
  views: 5,
  shares: 2,
  createdAt: 1625000000000,
  updatedAt: 1625000300000
};

// Generate mock frames
const generateMockFrames = (count: number): ReplayFrame[] => {
  const frames: ReplayFrame[] = [];
  
  // Initial ball positions (not pocketed)
  const initialBallPositions = Array.from({ length: 16 }, (_, i) => ({
    ballNumber: i,
    x: Math.random(),
    y: Math.random(),
    pocketed: false
  }));
  
  let playerTurn = 'player1';
  let player1Score = 0;
  let player2Score = 0;
  
  for (let i = 0; i < count; i++) {
    // Every 10 frames, change the player turn
    if (i % 10 === 0 && i > 0) {
      playerTurn = playerTurn === 'player1' ? 'player2' : 'player1';
    }
    
    // Every 15 frames, add a ball pocketed event for the current player
    const events = [];
    
    // First frame: game started event
    if (i === 0) {
      events.push({
        id: `event_start_${i}`,
        type: 'game_started',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: {}
      });
    }
    
    // Start of a shot
    if (i % 5 === 0) {
      events.push({
        id: `event_shot_start_${i}`,
        type: 'shot_started',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { playerId: playerTurn }
      });
    }
    
    // End of a shot
    if (i % 5 === 4) {
      events.push({
        id: `event_shot_end_${i}`,
        type: 'shot_completed',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { playerId: playerTurn }
      });
    }
    
    // Ball pocketed (every 15 frames)
    if (i % 15 === 14 && i > 0) {
      const ballNumber = 1 + Math.floor((i / 15) % 15); // Skip cue ball (0)
      
      events.push({
        id: `event_pocket_${i}`,
        type: 'ball_pocketed',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { 
          playerId: playerTurn,
          ballNumber
        }
      });
      
      // Update initial ball positions to mark this ball as pocketed
      initialBallPositions[ballNumber].pocketed = true;
      
      // Update score
      if (playerTurn === 'player1') {
        player1Score++;
      } else {
        player2Score++;
      }
    }
    
    // Foul (rarely)
    if (i % 40 === 39) {
      events.push({
        id: `event_foul_${i}`,
        type: 'foul_committed',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { playerId: playerTurn }
      });
      
      // Change player after foul
      playerTurn = playerTurn === 'player1' ? 'player2' : 'player1';
    }
    
    // Impressive shot (rarely)
    if (i % 50 === 49) {
      events.push({
        id: `event_impressive_${i}`,
        type: 'impressive_shot',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { playerId: playerTurn }
      });
    }
    
    // Last frame: game ended event
    if (i === count - 1) {
      events.push({
        id: `event_end_${i}`,
        type: 'game_ended',
        timestamp: (1625000000000 + i * 2000).toString(),
        data: { 
          winnerId: 'player1',
          finalScore: {
            'player1': player1Score,
            'player2': player2Score
          }
        }
      });
    }
    
    // Create the frame with slightly different ball positions each time
    frames.push({
      id: `frame${i}`,
      matchId: 'match123',
      replayId: 'replay123',
      timestamp: (1625000000000 + i * 2000).toString(), // 2 seconds between frames
      sequenceNumber: i,
      ballPositions: initialBallPositions.map(ball => ({
        ...ball,
        // Add small random movements to non-pocketed balls
        x: ball.pocketed ? ball.x : ball.x + (Math.random() - 0.5) * 0.01,
        y: ball.pocketed ? ball.y : ball.y + (Math.random() - 0.5) * 0.01
      })),
      cuePosition: {
        originX: 0.2 + (Math.random() - 0.5) * 0.1,
        originY: 0.3 + (Math.random() - 0.5) * 0.1,
        angle: Math.random() * Math.PI * 2,
        power: 0.7 + (Math.random() - 0.5) * 0.3
      },
      tableState: 'active',
      playerTurn,
      scoreState: {
        'player1': player1Score,
        'player2': player2Score
      },
      shotInProgress: i % 5 >= 1 && i % 5 <= 3, // Shot is in progress for frames 1-3 of every 5
      events
    });
  }
  
  return frames;
};

// Mocked frames for testing
const mockFrames = generateMockFrames(150); // 150 frames (5 minutes at 30fps)

// Mock the ReplayService implementation
const mockReplayService = ReplayService as jest.MockedClass<typeof ReplayService>;
mockReplayService.prototype.getReplayMetadata.mockResolvedValue(mockReplayMetadata);
mockReplayService.prototype.getReplayFrames.mockResolvedValue(mockFrames);
mockReplayService.prototype.getReplays.mockResolvedValue([mockReplayMetadata]);
mockReplayService.prototype.updateReplay.mockResolvedValue(mockReplayMetadata);

describe('ReplayAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getReplayAnalytics', () => {
    it('should generate analytics for a replay', async () => {
      const analytics = await replayAnalyticsService.getReplayAnalytics('replay123');
      
      // Check that the analytics object has the expected properties
      expect(analytics).toHaveProperty('replayId', 'replay123');
      expect(analytics).toHaveProperty('matchId', 'match123');
      expect(analytics).toHaveProperty('duration', 300);
      expect(analytics).toHaveProperty('totalShots');
      expect(analytics).toHaveProperty('averageShotTime');
      expect(analytics).toHaveProperty('playerStats');
      expect(analytics).toHaveProperty('highlights');
      expect(analytics).toHaveProperty('gameFlow');
      expect(analytics).toHaveProperty('matchIntensity');
      
      // Check that player stats are generated for both players
      expect(analytics.playerStats).toHaveProperty('player1');
      expect(analytics.playerStats).toHaveProperty('player2');
      
      // Verify the service fetched the necessary data
      expect(mockReplayService.prototype.getReplayMetadata).toHaveBeenCalledWith('replay123');
      expect(mockReplayService.prototype.getReplayFrames).toHaveBeenCalledWith('replay123');
    });
    
    it('should use cached analytics if available and not expired', async () => {
      // First call should fetch the data
      await replayAnalyticsService.getReplayAnalytics('replay123');
      
      // Reset mock counts
      jest.clearAllMocks();
      
      // Second call should use cache
      await replayAnalyticsService.getReplayAnalytics('replay123');
      
      // Verify the service did not fetch data again
      expect(mockReplayService.prototype.getReplayMetadata).not.toHaveBeenCalled();
      expect(mockReplayService.prototype.getReplayFrames).not.toHaveBeenCalled();
    });
    
    it('should force refresh of analytics when specified', async () => {
      // First call should fetch the data
      await replayAnalyticsService.getReplayAnalytics('replay123');
      
      // Reset mock counts
      jest.clearAllMocks();
      
      // Second call with force refresh should fetch data again
      await replayAnalyticsService.getReplayAnalytics('replay123', true);
      
      // Verify the service fetched data again
      expect(mockReplayService.prototype.getReplayMetadata).toHaveBeenCalledWith('replay123');
      expect(mockReplayService.prototype.getReplayFrames).toHaveBeenCalledWith('replay123');
    });
  });
  
  describe('getHighlights', () => {
    it('should return highlights for a replay', async () => {
      const highlights = await replayAnalyticsService.getHighlights('replay123');
      
      // Verify the service fetched the replay metadata
      expect(mockReplayService.prototype.getReplayMetadata).toHaveBeenCalledWith('replay123');
      
      // The returned highlights should match what's in the metadata
      expect(highlights).toEqual(mockReplayMetadata.highlights);
    });
  });
  
  describe('getPlayerStats', () => {
    it('should generate player statistics across multiple matches', async () => {
      const playerStats = await replayAnalyticsService.getPlayerStats('player1');
      
      // Check that the player stats object has the expected properties
      expect(playerStats).toHaveProperty('matchesPlayed');
      expect(playerStats).toHaveProperty('matchesWon');
      expect(playerStats).toHaveProperty('totalShots');
      expect(playerStats).toHaveProperty('avgShotsPerMatch');
      expect(playerStats).toHaveProperty('totalBallsPocketed');
      expect(playerStats).toHaveProperty('avgBallsPocketedPerMatch');
      expect(playerStats).toHaveProperty('totalFouls');
      expect(playerStats).toHaveProperty('avgShotTime');
      expect(playerStats).toHaveProperty('impressiveShots');
      expect(playerStats).toHaveProperty('winRate');
      expect(playerStats).toHaveProperty('recentMatches');
      
      // Verify the service fetched the necessary data
      expect(mockReplayService.prototype.getReplays).toHaveBeenCalledWith({
        playerIds: ['player1'],
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc'
      });
    });
  });
}); 