import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/monitoring.ts';
import { challenges, matchResults } from '../../services/challengeStorage.ts';
import { VenueLeaderboardService } from '../../services/venue/VenueLeaderboardService.ts';
import { Server } from 'socket.io';

const userSocketMap = new Map<string, string>(); // userId -> socketId

const challengeRoutes = (io: Server) => {
  const router = express.Router();

  // On socket connection, register userId
  io.on('connection', (socket) => {
    socket.on('register_user', (userId: string) => {
      userSocketMap.set(userId, socket.id);
      logger.info(`User registered for WebSocket: ${userId} -> ${socket.id}`);
    });
    socket.on('disconnect', () => {
      for (const [userId, sId] of userSocketMap.entries()) {
        if (sId === socket.id) userSocketMap.delete(userId);
      }
    });
  });

  // Validation middleware
  const validateChallenge = [
    body('territoryId').isString().notEmpty(),
    body('challengerId').isString().notEmpty(),
    body('defenderId').isString().notEmpty(),
    body('challengeType').isIn(['standard', 'high-stakes', 'clan-war', 'pilgrimage', 'gauntlet', 'duel', 'clan_war']),
  ];

  const validateMatchResult = [
    body('matchId').isString().notEmpty(),
    body('territoryId').isString().notEmpty(),
    body('winnerId').isString().notEmpty(),
    body('loserId').isString().notEmpty(),
    body('winnerScore').isInt({ min: 0 }),
    body('loserScore').isInt({ min: 0 }),
    body('matchType').isIn(['challenge', 'tournament', 'casual']),
    body('isTerritoryMatch').isBoolean(),
  ];

  // Initialize some test challenges for development/testing
  const initializeTestChallenges = () => {
    const testChallenges = [
      {
        id: 'test-challenge-1',
        territoryId: 'territory-1',
        challengerId: 'player-1',
        defenderId: 'player-2',
        status: 'pending',
        createdAt: new Date(),
        challengeType: 'standard',
        stakes: { coins: 100 }
      },
      {
        id: 'test-challenge-2',
        territoryId: 'territory-2',
        challengerId: 'player-3',
        defenderId: 'player-4',
        status: 'pending',
        createdAt: new Date(),
        challengeType: 'standard',
        stakes: { coins: 150 }
      },
      {
        id: 'test-challenge-3',
        territoryId: 'territory-3',
        challengerId: 'player-5',
        defenderId: 'player-6',
        status: 'accepted',
        createdAt: new Date(),
        acceptedAt: new Date(),
        challengeType: 'pilgrimage',
        stakes: { coins: 200 }
      }
    ];

    testChallenges.forEach(challenge => {
      challenges.set(challenge.id, challenge);
    });
  };

  // Initialize test data
  initializeTestChallenges();

  // TEST-ONLY: GET and PUT /challenges/test-alive
  router.get('/challenges/test-alive', (req, res) => {
    res.json({ ok: true, method: 'GET' });
  });
  router.put('/challenges/test-alive', (req, res) => {
    res.json({ ok: true, method: 'PUT' });
  });

  // TEST-ONLY: Dynamic PUT /challenges/:challengeId/test
  router.put('/challenges/:challengeId/test', (req, res) => {
    res.json({ ok: true, method: 'PUT', challengeId: req.params.challengeId });
  });

  // TEST-ONLY: Minimal route with same pattern as accept
  router.put('/challenges/:challengeId/accept-minimal', (req, res) => {
    res.json({ ok: true, method: 'PUT', challengeId: req.params.challengeId, action: 'accept-minimal' });
  });

  // Accept a challenge (PUT method for integration tests) - MUST BE FIRST
  router.put('/challenges/:challengeId/accept-challenge', async (req, res) => {
    try {
      console.log('DEBUG: Accept challenge route hit', req.params, req.body);
      
      const { challengeId } = req.params;
      
      // Safely access the challenges Map
      if (!challenges.has(challengeId)) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
          challengeId
        });
      }
      
      const challenge = challenges.get(challengeId);
      
      // Validate challenge status
      if (challenge.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Challenge cannot be accepted',
          currentStatus: challenge.status,
          allowedStatuses: ['pending']
        });
      }
      
      // Update challenge status
      challenge.status = 'accepted';
      challenge.acceptedAt = new Date();
      challenges.set(challengeId, challenge);
      
      logger.info(`Challenge accepted: ${challengeId}`);
      
      res.json({
        success: true,
        challenge: {
          id: challengeId,
          status: 'accepted',
          acceptedAt: challenge.acceptedAt
        }
      });
      
    } catch (error) {
      logger.error('Error accepting challenge:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create a new challenge
  router.post('/challenges/create', validateChallenge, async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { territoryId, challengerId, defenderId, challengeType, stakes } = req.body;

      // Check if challenger is eligible for this challenge type
      const venueLeaderboardService = new VenueLeaderboardService();
      const challengerPerformance = venueLeaderboardService.getPlayerPerformance(challengerId, territoryId);
      
      // For now, allow all challenges (in production, this would check actual rankings)
      if (challengeType === 'pilgrimage') {
        // In production, this would check if player is in top 10
        logger.info(`Pilgrimage challenge created by ${challengerId} for territory ${territoryId}`);
      }

      if (challengeType === 'gauntlet') {
        // In production, this would check if player is in top 5
        logger.info(`Gauntlet challenge created by ${challengerId} for territory ${territoryId}`);
      }

      const challengeId = `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const challenge = {
        id: challengeId,
        territoryId,
        challengerId,
        defenderId,
        status: 'pending',
        createdAt: new Date(),
        challengeType,
        stakes: stakes || { coins: 100 }
      };

      challenges.set(challengeId, challenge);

      // Send WebSocket notification to defender
      const defenderSocketId = userSocketMap.get(defenderId);
      if (defenderSocketId) {
        io.to(defenderSocketId).emit('new_challenge', {
          challengeId,
          challengerId,
          challengeType,
          stakes
        });
      }

      logger.info(`Challenge created: ${challengeId}`, challenge);

      res.status(201).json({
        success: true,
        challenge
      });

    } catch (error) {
      logger.error('Error creating challenge:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all challenges
  router.get('/challenges', (req: Request, res: Response) => {
    try {
      const challengesList = Array.from(challenges.values());
      res.json({
        success: true,
        challenges: challengesList,
        count: challengesList.length
      });
    } catch (error) {
      logger.error('Error fetching challenges:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a specific challenge
  router.get('/challenges/:challengeId', (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      
      if (!challenges.has(challengeId)) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
          challengeId
        });
      }

      const challenge = challenges.get(challengeId);
      res.json({
        success: true,
        challenge
      });

    } catch (error) {
      logger.error('Error fetching challenge:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Accept a challenge
  router.put('/challenges/:challengeId/accept', async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      
      if (!challenges.has(challengeId)) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
          challengeId
        });
      }
      
      const challenge = challenges.get(challengeId);
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Challenge cannot be accepted',
          currentStatus: challenge.status,
          allowedStatuses: ['pending']
        });
      }
      
      challenge.status = 'accepted';
      challenge.acceptedAt = new Date();
      challenges.set(challengeId, challenge);
      
      // Send WebSocket notification to challenger
      const challengerSocketId = userSocketMap.get(challenge.challengerId);
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('challenge_response', {
          challengeId,
          status: 'accepted',
          defenderId: challenge.defenderId
        });
      }
      
      logger.info(`Challenge accepted: ${challengeId}`);
      
      res.json({
        success: true,
        challenge: {
          id: challengeId,
          status: 'accepted',
          acceptedAt: challenge.acceptedAt
        }
      });
      
    } catch (error) {
      logger.error('Error accepting challenge:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Decline a challenge
  router.put('/challenges/:challengeId/decline', async (req: Request, res: Response) => {
    try {
      const { challengeId } = req.params;
      
      if (!challenges.has(challengeId)) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
          challengeId
        });
      }
      
      const challenge = challenges.get(challengeId);
      
      if (challenge.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Challenge cannot be declined',
          currentStatus: challenge.status,
          allowedStatuses: ['pending']
        });
      }
      
      challenge.status = 'declined';
      challenge.declinedAt = new Date();
      challenges.set(challengeId, challenge);
      
      // Send WebSocket notification to challenger
      const challengerSocketId = userSocketMap.get(challenge.challengerId);
      if (challengerSocketId) {
        io.to(challengerSocketId).emit('challenge_response', {
          challengeId,
          status: 'declined',
          defenderId: challenge.defenderId
        });
      }
      
      logger.info(`Challenge declined: ${challengeId}`);
      
      res.json({
        success: true,
        challenge: {
          id: challengeId,
          status: 'declined',
          declinedAt: challenge.declinedAt
        }
      });
      
    } catch (error) {
      logger.error('Error declining challenge:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Record match result
  router.post('/challenges/:challengeId/record-result', validateMatchResult, async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { challengeId } = req.params;
      const { matchId, territoryId, winnerId, loserId, winnerScore, loserScore, matchType, isTerritoryMatch, highlights, duration } = req.body;
      
      if (!challenges.has(challengeId)) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
          challengeId
        });
      }
      
      const challenge = challenges.get(challengeId);
      
      if (challenge.status !== 'accepted' && challenge.status !== 'in-progress') {
        return res.status(400).json({
          success: false,
          error: 'Challenge cannot have result recorded',
          currentStatus: challenge.status,
          allowedStatuses: ['accepted', 'in-progress']
        });
      }
      
      // Update challenge status
      challenge.status = 'completed';
      challenge.completedAt = new Date();
      challenge.matchResult = {
        matchId,
        winnerId,
        loserId,
        winnerScore,
        loserScore
      };
      challenges.set(challengeId, challenge);
      
      // Record match result
      const matchResult = {
        matchId,
        challengeId,
        territoryId,
        winnerId,
        loserId,
        winnerScore,
        loserScore,
        matchType,
        isTerritoryMatch,
        highlights: highlights || [],
        duration,
        timestamp: new Date(),
      };
      
      matchResults.set(matchId, matchResult);
      
      // Distribute rewards
      const winnerReward = challenge.stakes.coins;
      const loserPenalty = Math.floor(challenge.stakes.coins * 0.1);
      
      logger.info(`Match result recorded: ${matchId}`, {
        challengeId,
        winnerId,
        loserId,
        winnerReward,
        loserPenalty
      });
      
      res.json({
        success: true,
        challenge: {
          id: challengeId,
          status: 'completed',
          completedAt: challenge.completedAt
        },
        matchResult,
        rewards: {
          winner: winnerReward,
          loser: -loserPenalty
        }
      });
      
    } catch (error) {
      logger.error('Error recording match result:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get match results
  router.get('/match-results', (req: Request, res: Response) => {
    try {
      const resultsList = Array.from(matchResults.values());
      res.json({
        success: true,
        results: resultsList,
        count: resultsList.length
      });
    } catch (error) {
      logger.error('Error fetching match results:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a specific match result
  router.get('/match-results/:matchId', (req: Request, res: Response) => {
    try {
      const { matchId } = req.params;
      
      if (!matchResults.has(matchId)) {
        return res.status(404).json({
          success: false,
          error: 'Match result not found',
          matchId
        });
      }

      const matchResult = matchResults.get(matchId);
      res.json({
        success: true,
        matchResult
      });

    } catch (error) {
      logger.error('Error fetching match result:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Clear test data
  router.delete('/challenges/test-clear', (req: Request, res: Response) => {
    try {
      challenges.clear();
      matchResults.clear();
      initializeTestChallenges();
      
      logger.info('Test data cleared and reinitialized');
      
      res.json({
        success: true,
        message: 'Test data cleared and reinitialized'
      });
      
    } catch (error) {
      logger.error('Error clearing test data:', error instanceof Error ? error : undefined);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
};

export default challengeRoutes; 