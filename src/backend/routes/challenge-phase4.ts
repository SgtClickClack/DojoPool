import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/monitoring.js';

const router = express.Router();

// Mock data for development
const mockChallenges: any[] = [
  {
    id: '1',
    type: 'pilgrimage',
    challengerId: 'user_1',
    defenderId: 'user_2',
    dojoId: '1',
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: {
      wins: 2,
      topTenDefeats: 2,
      masterDefeat: 1
    },
    acceptedAt: null,
    declinedAt: null,
    winnerId: null,
    completedAt: null,
    matchData: null
  }
];

// Validation middleware
const validateChallenge = [
  body('type').isIn(['pilgrimage', 'gauntlet', 'duel']),
  body('defenderId').isString().trim().isLength({ min: 1 }),
  body('dojoId').isString().trim().isLength({ min: 1 }),
  body('requirements').optional().isObject()
];

/**
 * POST /api/challenge/create
 * Create a new challenge
 */
router.post('/create', validateChallenge, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { type, defenderId, dojoId, requirements } = req.body;
    const challengerId = req.user?.id || 'anonymous';

    // Check if challenge already exists
    const existingChallenge = mockChallenges.find(
      c => c.challengerId === challengerId && 
           c.defenderId === defenderId && 
           c.status === 'active'
    );

    if (existingChallenge) {
      return res.status(400).json({
        success: false,
        message: 'Active challenge already exists'
      });
    }

    // Create new challenge
    const newChallenge = {
      id: `challenge_${Date.now()}`,
      type,
      challengerId,
      defenderId,
      dojoId,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: requirements || {
        wins: 2,
        topTenDefeats: 2,
        masterDefeat: 1
      },
      acceptedAt: null,
      declinedAt: null,
      winnerId: null,
      completedAt: null,
      matchData: null
    };

    // TODO: Save to database
    mockChallenges.push(newChallenge);

    logger.info(`New challenge created: ${type} by ${challengerId} against ${defenderId}`);

    res.status(201).json({
      success: true,
      message: 'Challenge created successfully',
      data: newChallenge
    });

  } catch (error) {
    logger.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge'
    });
  }
});

/**
 * GET /api/challenge/active
 * Get active challenges for current user
 */
router.get('/active', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id || 'anonymous';

    const activeChallenges = mockChallenges.filter(
      c => (c.challengerId === userId || c.defenderId === userId) && c.status === 'active'
    );

    res.json({
      success: true,
      data: activeChallenges
    });

  } catch (error) {
    logger.error('Error fetching active challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active challenges'
    });
  }
});

/**
 * POST /api/challenge/:id/accept
 * Accept a challenge
 */
router.post('/:id/accept', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const challenge = mockChallenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (challenge.defenderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the defender can accept this challenge'
      });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Challenge is not active'
      });
    }

    // Update challenge status
    challenge.status = 'accepted';
    challenge.acceptedAt = new Date().toISOString();

    logger.info(`Challenge ${id} accepted by ${userId}`);

    res.json({
      success: true,
      message: 'Challenge accepted successfully',
      data: challenge
    });

  } catch (error) {
    logger.error('Error accepting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept challenge'
    });
  }
});

/**
 * POST /api/challenge/:id/decline
 * Decline a challenge
 */
router.post('/:id/decline', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 'anonymous';

    const challenge = mockChallenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (challenge.defenderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the defender can decline this challenge'
      });
    }

    // Update challenge status
    challenge.status = 'declined';
    challenge.declinedAt = new Date().toISOString();

    logger.info(`Challenge ${id} declined by ${userId}`);

    res.json({
      success: true,
      message: 'Challenge declined successfully',
      data: challenge
    });

  } catch (error) {
    logger.error('Error declining challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline challenge'
    });
  }
});

/**
 * POST /api/challenge/:id/complete
 * Complete a challenge with match result
 */
router.post('/:id/complete', [
  body('winnerId').isString().trim().isLength({ min: 1 }),
  body('matchData').optional().isObject()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { winnerId, matchData } = req.body;
    const userId = req.user?.id || 'anonymous';

    const challenge = mockChallenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    if (![challenge.challengerId, challenge.defenderId].includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only challenge participants can complete this challenge'
      });
    }

    if (challenge.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Challenge must be accepted before completion'
      });
    }

    // Update challenge with result
    challenge.status = 'completed';
    challenge.winnerId = winnerId;
    challenge.completedAt = new Date().toISOString();
    challenge.matchData = matchData;

    // TODO: Update player stats and rewards
    logger.info(`Challenge ${id} completed. Winner: ${winnerId}`);

    res.json({
      success: true,
      message: 'Challenge completed successfully',
      data: challenge
    });

  } catch (error) {
    logger.error('Error completing challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete challenge'
    });
  }
});

/**
 * GET /api/challenge/:id
 * Get challenge details
 */
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const challenge = mockChallenges.find(c => c.id === id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      data: challenge
    });

  } catch (error) {
    logger.error('Error fetching challenge details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge details'
    });
  }
});

export default router; 


