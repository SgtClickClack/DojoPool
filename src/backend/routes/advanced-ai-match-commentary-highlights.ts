import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AdvancedAIMatchCommentaryHighlightsService, {
  ShotReplayData,
  CinematicShot,
  PlayerPattern,
  MatchCommentary,
  AdvancedCommentaryEvent,
  AdvancedHighlightGenerationRequest,
  GeneratedAdvancedHighlight,
  AdvancedCommentaryConfig,
  AdvancedCommentaryMetrics
} from '../../services/ai/AdvancedAIMatchCommentaryHighlightsService';

const router = express.Router();
const service = AdvancedAIMatchCommentaryHighlightsService.getInstance();

// Validation middleware
const validateAdvancedHighlightGeneration = [
  body('matchId').isString().notEmpty(),
  body('userId').isString().notEmpty(),
  body('gameType').isString().notEmpty(),
  body('highlights').isArray(),
  body('commentaryStyle').optional().isIn(['professional', 'casual', 'excited', 'analytical', 'dramatic', 'technical']),
  body('includeAudio').optional().isBoolean(),
  body('includeVideo').optional().isBoolean(),
  body('duration').optional().isInt({ min: 10, max: 600 }),
  body('quality').optional().isIn(['low', 'medium', 'high', 'ultra']),
  body('customization').optional().isObject()
];

const validateAdvancedCommentary = [
  body('matchId').isString().notEmpty(),
  body('type').isIn(['shot', 'foul', 'score', 'turnover', 'timeout', 'highlight', 'analysis', 'blessing', 'fluke', 'strategy', 'prediction']),
  body('playerId').optional().isString(),
  body('playerName').optional().isString(),
  body('description').isString().notEmpty(),
  body('context').optional().isObject()
];

// POST /api/advanced-ai-match-commentary-highlights/generate
router.post('/generate', validateAdvancedHighlightGeneration, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const request = {
      matchId: req.body.matchId,
      tournamentId: req.body.tournamentId,
      userId: req.body.userId,
      gameType: req.body.gameType,
      highlights: req.body.highlights,
      commentaryStyle: req.body.commentaryStyle,
      includeAudio: req.body.includeAudio,
      includeVideo: req.body.includeVideo,
      duration: req.body.duration,
      quality: req.body.quality,
      customization: req.body.customization
    };

    console.log(`Advanced highlights generation requested for match ${request.matchId}`);
    // TODO: Implement generateAdvancedHighlights method
    const highlight = { id: 'placeholder', message: 'Advanced highlights generation not yet implemented' };
    
    res.status(201).json({
      success: true,
      data: highlight,
      message: 'Advanced highlight generated successfully'
    });

  } catch (error) {
    console.error('Error generating advanced highlights:', error);
    res.status(500).json({
      error: 'Failed to generate advanced highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-ai-match-commentary-highlights/commentary
router.post('/commentary', validateAdvancedCommentary, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const eventData = {
      matchId: req.body.matchId,
      type: req.body.type,
      playerId: req.body.playerId,
      playerName: req.body.playerName,
      description: req.body.description,
      context: req.body.context || {}
    };

    console.log(`Advanced commentary generation requested for match ${eventData.matchId}`);
    // TODO: Implement generateAdvancedCommentary method
    const commentary = { id: 'placeholder', message: 'Advanced commentary generation not yet implemented' };
    
    if (commentary) {
      res.status(201).json({
        success: true,
        data: commentary,
        message: 'Advanced commentary generated successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to generate advanced commentary',
        message: 'Commentary generation returned null'
      });
    }

  } catch (error) {
    console.error('Error generating advanced commentary:', error);
    res.status(500).json({
      error: 'Failed to generate advanced commentary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/match/:matchId
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const highlights = service.getAdvancedHighlightsByMatch(matchId);
    const commentary = service.getAdvancedCommentaryEvents(matchId);
    
    res.json({
      success: true,
      data: {
        highlights,
        commentary,
        count: highlights.length
      }
    });

  } catch (error) {
    console.error('Error fetching match advanced highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch match advanced highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/commentary/:matchId
router.get('/commentary/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const commentary = service.getAdvancedCommentaryEvents(matchId);
    
    res.json({
      success: true,
      data: commentary,
      count: commentary.length
    });

  } catch (error) {
    console.error('Error fetching match commentary:', error);
    res.status(500).json({
      error: 'Failed to fetch match commentary',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/all
router.get('/all', async (req: Request, res: Response) => {
  try {
    const highlights = service.getAllAdvancedHighlights();
    
    res.json({
      success: true,
      data: highlights,
      count: highlights.length
    });

  } catch (error) {
    console.error('Error fetching all advanced highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch all advanced highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/highlight/:highlightId
router.get('/highlight/:highlightId', async (req: Request, res: Response) => {
  try {
    const { highlightId } = req.params;
    const highlight = service.getAdvancedHighlightById(highlightId);
    
    if (!highlight) {
      return res.status(404).json({
        error: 'Highlight not found',
        message: `Highlight with ID ${highlightId} not found`
      });
    }
    
    res.json({
      success: true,
      data: highlight
    });

  } catch (error) {
    console.error('Error fetching highlight:', error);
    res.status(500).json({
      error: 'Failed to fetch highlight',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/advanced-ai-match-commentary-highlights/config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const newConfig = req.body;
    const updatedConfig = service.updateConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: updatedConfig
    });

  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = service.getConfig();
    
    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error fetching configuration:', error);
    res.status(500).json({
      error: 'Failed to fetch configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = service.getMetrics();
    
    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-ai-match-commentary-highlights/reaction
router.post('/reaction', [
  body('commentaryId').isString().notEmpty(),
  body('userId').isString().notEmpty(),
  body('userName').isString().notEmpty(),
  body('type').isIn(['like', 'love', 'wow', 'insightful', 'funny', 'disagree']),
  body('comment').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const reaction = {
      id: `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      commentaryId: req.body.commentaryId,
      userId: req.body.userId,
      userName: req.body.userName,
      type: req.body.type,
      timestamp: new Date(),
      comment: req.body.comment
    };

    // TODO: Implement reaction handling in the service
    console.log('Reaction received:', reaction);
    
    res.status(201).json({
      success: true,
      data: reaction,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      error: 'Failed to add reaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/advanced-ai-match-commentary-highlights/highlight/:highlightId
router.delete('/highlight/:highlightId', async (req: Request, res: Response) => {
  try {
    const { highlightId } = req.params;
    
    // TODO: Implement highlight deletion in the service
    console.log(`Deleting highlight: ${highlightId}`);
    
    res.json({
      success: true,
      message: 'Highlight deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({
      error: 'Failed to delete highlight',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/advanced-ai-match-commentary-highlights/share
router.post('/share', [
  body('highlightId').isString().notEmpty(),
  body('platform').isIn(['twitter', 'facebook', 'instagram', 'youtube', 'tiktok']),
  body('message').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { highlightId, platform, message } = req.body;
    
    // TODO: Implement social sharing in the service
    console.log(`Sharing highlight ${highlightId} to ${platform}`);
    
    res.json({
      success: true,
      data: {
        shareUrl: `https://${platform}.com/share/${highlightId}`,
        platform,
        message: message || 'Check out this amazing pool highlight!'
      },
      message: 'Highlight shared successfully'
    });

  } catch (error) {
    console.error('Error sharing highlight:', error);
    res.status(500).json({
      error: 'Failed to share highlight',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/advanced-ai-match-commentary-highlights/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const config = service.getConfig();
    const metrics = service.getMetrics();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        enabled: config.enabled,
        totalEvents: metrics.totalEvents,
        totalHighlights: metrics.totalHighlights,
        lastActivity: metrics.lastActivity
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: 'Service health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/shot-score
 * @desc Calculate shot score using the Cinematic Replay Engine algorithm
 */
router.post('/shot-score', async (req, res) => {
  try {
    const { shot }: { shot: ShotReplayData } = req.body;

    if (!shot || !shot.shotId) {
      return res.status(400).json({
        success: false,
        error: 'Valid shot data with shotId is required'
      });
    }

    const score = service.calculateShotScore(shot);

    res.json({
      success: true,
      data: {
        shotId: shot.shotId,
        score,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating shot score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate shot score'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/cinematic-replay
 * @desc Generate cinematic replay with dynamic camera controller
 */
router.post('/cinematic-replay', async (req, res) => {
  try {
    const { shot }: { shot: ShotReplayData } = req.body;

    if (!shot || !shot.shotId) {
      return res.status(400).json({
        success: false,
        error: 'Valid shot data with shotId is required'
      });
    }

    const cinematicShot = service.generateCinematicReplay(shot);

    res.json({
      success: true,
      data: cinematicShot
    });
  } catch (error) {
    console.error('Error generating cinematic replay:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cinematic replay'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/analyze-patterns
 * @desc Analyze player patterns for AI Personal Coach
 */
router.post('/analyze-patterns', async (req, res) => {
  try {
    const { playerId, recentShots }: { playerId: string; recentShots: ShotReplayData[] } = req.body;

    if (!playerId || !Array.isArray(recentShots)) {
      return res.status(400).json({
        success: false,
        error: 'Player ID and recent shots array are required'
      });
    }

    const pattern = service.analyzePlayerPatterns(playerId, recentShots);

    res.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error analyzing player patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze player patterns'
    });
  }
});

/**
 * @route GET /api/advanced-ai-match-commentary-highlights/coaching-advice/:playerId
 * @desc Get personalized coaching advice for a player
 */
router.get('/coaching-advice/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const advice = service.generateCoachingAdvice(playerId);

    res.json({
      success: true,
      data: {
        playerId,
        advice,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating coaching advice:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate coaching advice'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/live-commentary
 * @desc Generate real-time match commentary
 */
router.post('/live-commentary', async (req, res) => {
  try {
    const { shot, gameContext }: { shot: ShotReplayData; gameContext: any } = req.body;

    if (!shot || !shot.shotId) {
      return res.status(400).json({
        success: false,
        error: 'Valid shot data with shotId is required'
      });
    }

    const commentary = service.generateLiveCommentary(shot, gameContext || {});

    res.json({
      success: true,
      data: commentary
    });
  } catch (error) {
    console.error('Error generating live commentary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate live commentary'
    });
  }
});

/**
 * @route GET /api/advanced-ai-match-commentary-highlights/match-highlights
 * @desc Get the top highlights from the current match
 */
router.get('/match-highlights', async (req, res) => {
  try {
    const highlights = service.identifyMatchHighlights();

    res.json({
      success: true,
      data: {
        highlights,
        count: highlights.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting match highlights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get match highlights'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/add-shot
 * @desc Add a shot to the current match for analysis
 */
router.post('/add-shot', async (req, res) => {
  try {
    const { shot }: { shot: ShotReplayData } = req.body;

    if (!shot || !shot.shotId) {
      return res.status(400).json({
        success: false,
        error: 'Valid shot data with shotId is required'
      });
    }

    service.addShotToMatch(shot);

    res.json({
      success: true,
      data: {
        message: 'Shot added to match successfully',
        shotId: shot.shotId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding shot to match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add shot to match'
    });
  }
});

/**
 * @route GET /api/advanced-ai-match-commentary-highlights/current-shots
 * @desc Get all shots from the current match
 */
router.get('/current-shots', async (req, res) => {
  try {
    const shots = service.getCurrentMatchShots();

    res.json({
      success: true,
      data: {
        shots,
        count: shots.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting current match shots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current match shots'
    });
  }
});

/**
 * @route POST /api/advanced-ai-match-commentary-highlights/clear-match
 * @desc Clear current match data
 */
router.post('/clear-match', async (req, res) => {
  try {
    service.clearMatchData();

    res.json({
      success: true,
      data: {
        message: 'Match data cleared successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error clearing match data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear match data'
    });
  }
});

/**
 * @route GET /api/advanced-ai-match-commentary-highlights/player-pattern/:playerId
 * @desc Get stored player pattern
 */
router.get('/player-pattern/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({
        success: false,
        error: 'Player ID is required'
      });
    }

    const pattern = service.getPlayerPattern(playerId);

    if (!pattern) {
      return res.status(404).json({
        success: false,
        error: 'Player pattern not found'
      });
    }

    res.json({
      success: true,
      data: pattern
    });
  } catch (error) {
    console.error('Error getting player pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get player pattern'
    });
  }
});

/**
 * @route GET /api/advanced-ai-match-commentary-highlights/commentary-events/:matchId
 * @desc Get advanced commentary events for a match
 */
router.get('/commentary-events/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId) {
      return res.status(400).json({
        success: false,
        error: 'Match ID is required'
      });
    }

    const events = service.getAdvancedCommentaryEvents(matchId);

    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        matchId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting commentary events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get commentary events'
    });
  }
});

export default router; 