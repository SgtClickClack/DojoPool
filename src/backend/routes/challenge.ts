import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../utils/logger';
import { challenges, matchResults } from '../../services/challengeStorage';

const router = express.Router();

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
      status: 'accepted',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      acceptedAt: new Date(Date.now() - 1800000), // 30 minutes ago
      challengeType: 'high-stakes',
      stakes: { coins: 500 }
    },
    {
      id: 'test-challenge-3',
      territoryId: 'territory-3',
      challengerId: 'player-5',
      defenderId: 'player-6',
      status: 'declined',
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      declinedAt: new Date(Date.now() - 3600000), // 1 hour ago
      challengeType: 'clan-war',
      stakes: { coins: 1000 }
    }
  ];
  
  testChallenges.forEach(challenge => {
    challenges.set(challenge.id, challenge);
  });
  
  logger.info(`Initialized ${testChallenges.length} test challenges`);
};

// Clear all test data (useful for testing)
const clearTestData = () => {
  challenges.clear();
  matchResults.clear();
  logger.info('Test data cleared');
};

// Initialize test data only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  initializeTestChallenges();
}

// Add a route to clear test data for testing purposes
router.post('/challenges/clear-test-data', (req, res) => {
  clearTestData();
  res.json({ success: true, message: 'Test data cleared' });
});

// Validation middleware
const validateChallenge = [
  body('territoryId').isString().notEmpty(),
  body('challengerId').isString().notEmpty(),
  body('defenderId').isString().notEmpty(),
  body('challengeType').isIn(['standard', 'high-stakes', 'clan-war']),
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

// Decline a challenge (PUT method for integration tests) - MUST BE SECOND
router.put('/challenges/:challengeId/decline-challenge', async (req, res) => {
  try {
    console.log('DEBUG: Decline challenge route hit', req.params, req.body);
    
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
        error: 'Challenge cannot be declined',
        currentStatus: challenge.status,
        allowedStatuses: ['pending']
      });
    }
    
    // Update challenge status
    challenge.status = 'declined';
    challenge.declinedAt = new Date();
    challenges.set(challengeId, challenge);
    
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

/**
 * Create a new territory challenge
 */
router.post('/challenges', validateChallenge, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { territoryId, challengerId, defenderId, challengeType, stakes } = req.body;

    // Check if territory is available for challenge (only check for pending/accepted challenges)
    const existingActiveChallenge = Array.from(challenges.values()).find(
      (c: any) => c.territoryId === territoryId && ['pending', 'accepted'].includes(c.status)
    );

    if (existingActiveChallenge) {
      return res.status(409).json({
        error: 'Territory already has an active challenge',
        existingChallenge: existingActiveChallenge.id,
      });
    }

    const challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      territoryId,
      challengerId,
      defenderId,
      status: 'pending',
      createdAt: new Date(),
      challengeType,
      stakes,
    };

    challenges.set(challenge.id, challenge);

    logger.info(`Challenge created: ${challenge.id} for territory ${territoryId}`);

    res.status(201).json(challenge);

  } catch (error) {
    logger.error('Error creating challenge:', error instanceof Error ? error : undefined);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all challenges for a user
 */
router.get('/challenges/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    let userChallenges = Array.from(challenges.values()).filter(
      (c: any) => c.challengerId === userId || c.defenderId === userId
    );

    if (status) {
      userChallenges = userChallenges.filter((c: any) => c.status === status);
    }

    res.json({
      success: true,
      challenges: userChallenges,
      count: userChallenges.length,
    });

  } catch (error) {
    logger.error('Error fetching user challenges:', error instanceof Error ? error : undefined);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get all active challenges
 */
router.get('/challenges', async (req: Request, res: Response) => {
  try {
    const { status, territoryId } = req.query;

    let allChallenges = Array.from(challenges.values());

    if (status) {
      allChallenges = allChallenges.filter((c: any) => c.status === status);
    }

    if (territoryId) {
      allChallenges = allChallenges.filter((c: any) => c.territoryId === territoryId);
    }

    res.json({
      success: true,
      challenges: allChallenges,
      count: allChallenges.length,
    });

  } catch (error) {
    logger.error('Error fetching challenges:', error instanceof Error ? error : undefined);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Create a new challenge (API endpoint for ChallengeService)
 */
router.post('/challenge/create', async (req: Request, res: Response) => {
  try {
    const { defenderId, dojoId, type } = req.body;
    
    // Validate required fields
    if (!defenderId || !dojoId || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: defenderId, dojoId, type'
      });
    }

    // Validate challenge type
    if (!['pilgrimage', 'gauntlet', 'duel'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid challenge type. Must be: pilgrimage, gauntlet, or duel'
      });
    }

    // TODO: Validate challenger requirements based on type
    // For now, we'll allow all challenges

    const challenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      challengerId: req.user?.id || 'anonymous', // TODO: Get from auth
      defenderId,
      dojoId,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      requirements: {
        wins: type === 'pilgrimage' ? 2 : type === 'gauntlet' ? 5 : 1,
        topTenDefeats: type === 'pilgrimage' ? 2 : type === 'gauntlet' ? 3 : 0,
        masterDefeat: type === 'pilgrimage' || type === 'gauntlet' ? 1 : 0
      }
    };

    challenges.set(challenge.id, challenge);

    logger.info(`Challenge created: ${challenge.id} for dojo ${dojoId}`);

    res.status(201).json({
      success: true,
      data: challenge
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

/**
 * Get active challenges for current user
 */
router.get('/challenge/active', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    
    const userChallenges = Array.from(challenges.values()).filter(
      (c: any) => (c.challengerId === userId || c.defenderId === userId) && 
                  c.status !== 'completed' && c.status !== 'declined'
    );

    res.json({
      success: true,
      data: userChallenges
    });

  } catch (error) {
    logger.error('Error fetching active challenges:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Respond to a challenge (accept/decline)
 */
router.post('/challenge/:id/respond', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    if (!['accept', 'decline'].includes(response)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response. Must be: accept or decline'
      });
    }

    if (!challenges.has(id)) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found'
      });
    }

    const challenge = challenges.get(id);
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth

    // Verify user is the defender
    if (challenge.defenderId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the defender can respond to this challenge'
      });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Challenge cannot be responded to',
        currentStatus: challenge.status
      });
    }

    // Update challenge status
    challenge.status = response === 'accept' ? 'accepted' : 'declined';
    if (response === 'accept') {
      challenge.acceptedAt = new Date().toISOString();
    } else {
      challenge.declinedAt = new Date().toISOString();
    }

    challenges.set(id, challenge);

    logger.info(`Challenge ${response}d: ${id}`);

    res.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    logger.error('Error responding to challenge:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Submit match result
 */
router.post('/match-results', validateMatchResult, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      matchId,
      territoryId,
      winnerId,
      loserId,
      winnerScore,
      loserScore,
      matchType,
      isTerritoryMatch,
      highlights,
      duration,
    } = req.body;

    const matchResult = {
      matchId,
      territoryId,
      winnerId,
      loserId,
      winnerScore,
      loserScore,
      matchType,
      isTerritoryMatch,
      highlights: highlights || [],
      duration: duration || 0,
      timestamp: new Date(),
    };

    matchResults.set(matchId, matchResult);

    // If this is a territory match, update territory ownership
    if (isTerritoryMatch) {
      // Find the active challenge for this territory
      const activeChallenge = Array.from(challenges.values()).find(
        (c: any) => c.territoryId === territoryId && c.status === 'in-progress'
      );

      if (activeChallenge) {
        activeChallenge.status = 'completed';
        activeChallenge.completedAt = new Date();
        activeChallenge.matchId = matchId;
        challenges.set(activeChallenge.id, activeChallenge);
      }

      logger.info(`Territory match completed: ${matchId} for territory ${territoryId}`);
    }

    logger.info(`Match result recorded: ${matchId}`);

    res.status(201).json({
      success: true,
      matchResult,
    });

  } catch (error) {
    logger.error('Error recording match result:', error instanceof Error ? error : undefined);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get match results
 */
router.get('/match-results', async (req: Request, res: Response) => {
  try {
    const { matchId, territoryId, winnerId, matchType } = req.query;

    let results = Array.from(matchResults.values());

    if (matchId) {
      results = results.filter((r: any) => r.matchId === matchId);
    }

    if (territoryId) {
      results = results.filter((r: any) => r.territoryId === territoryId);
    }

    if (winnerId) {
      results = results.filter((r: any) => r.winnerId === winnerId);
    }

    if (matchType) {
      results = results.filter((r: any) => r.matchType === matchType);
    }

    res.json({
      success: true,
      matchResults: results,
      count: results.length,
    });

  } catch (error) {
    logger.error('Error fetching match results:', error instanceof Error ? error : undefined);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get a specific challenge by ID
 */
router.get('/challenges/:challengeId', async (req: Request, res: Response) => {
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

/**
 * Start match tracking for a challenge
 */
router.post('/challenges/:challengeId/start-match', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { matchData } = req.body;
    
    if (!challenges.has(challengeId)) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
        challengeId
      });
    }
    
    const challenge = challenges.get(challengeId);
    
    if (challenge.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Challenge must be accepted before starting match',
        currentStatus: challenge.status
      });
    }
    
    // Update challenge status to in-progress
    challenge.status = 'in-progress';
    challenge.matchStartedAt = new Date();
    challenge.matchData = matchData;
    challenges.set(challengeId, challenge);
    
    logger.info(`Match started for challenge: ${challengeId}`);
    
    res.json({
      success: true,
      challenge: {
        id: challengeId,
        status: 'in-progress',
        matchStartedAt: challenge.matchStartedAt
      }
    });
    
  } catch (error) {
    logger.error('Error starting match:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Record match event
 */
router.post('/challenges/:challengeId/match-events', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { eventData } = req.body;
    
    if (!challenges.has(challengeId)) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
        challengeId
      });
    }
    
    const challenge = challenges.get(challengeId);
    
    if (challenge.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Match must be in progress to record events',
        currentStatus: challenge.status
      });
    }
    
    // Initialize events array if it doesn't exist
    if (!challenge.matchEvents) {
      challenge.matchEvents = [];
    }
    
    // Add event to challenge
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...eventData
    };
    
    challenge.matchEvents.push(event);
    challenges.set(challengeId, challenge);
    
    logger.info(`Match event recorded for challenge: ${challengeId}`, event);
    
    res.json({
      success: true,
      event
    });
    
  } catch (error) {
    logger.error('Error recording match event:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get match events for a challenge
 */
router.get('/challenges/:challengeId/match-events', async (req: Request, res: Response) => {
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
    const events = challenge.matchEvents || [];
    
    res.json({
      success: true,
      events,
      count: events.length
    });
    
  } catch (error) {
    logger.error('Error fetching match events:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * End match and record final result
 */
router.post('/challenges/:challengeId/end-match', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const { resultData } = req.body;
    
    if (!challenges.has(challengeId)) {
      return res.status(404).json({
        success: false,
        error: 'Challenge not found',
        challengeId
      });
    }
    
    const challenge = challenges.get(challengeId);
    
    if (challenge.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        error: 'Match must be in progress to end',
        currentStatus: challenge.status
      });
    }
    
    // Update challenge status to completed
    challenge.status = 'completed';
    challenge.completedAt = new Date();
    challenge.matchResult = resultData;
    challenges.set(challengeId, challenge);
    
    // Record match result
    const matchResult = {
      matchId: resultData.matchId,
      challengeId,
      territoryId: resultData.territoryId,
      winnerId: resultData.winnerId,
      loserId: resultData.loserId,
      winnerScore: resultData.winnerScore,
      loserScore: resultData.loserScore,
      matchType: 'challenge',
      isTerritoryMatch: resultData.isTerritoryMatch,
      highlights: resultData.highlights || [],
      duration: resultData.duration,
      timestamp: new Date(),
    };
    
    matchResults.set(resultData.matchId, matchResult);
    
    logger.info(`Match ended for challenge: ${challengeId}`, matchResult);
    
    res.json({
      success: true,
      challenge: {
        id: challengeId,
        status: 'completed',
        completedAt: challenge.completedAt
      },
      matchResult
    });
    
  } catch (error) {
    logger.error('Error ending match:', error instanceof Error ? error : undefined);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug catch-all for unmatched requests
router.all('/challenges/*', (req, res, next) => {
  console.log('DEBUG: challenge router catch-all', req.method, req.originalUrl);
  next();
});

export default router; 