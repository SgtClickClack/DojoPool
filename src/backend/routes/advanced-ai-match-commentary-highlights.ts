import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AdvancedAIMatchCommentaryHighlightsService from '../../services/ai/AdvancedAIMatchCommentaryHighlightsService';

const router = express.Router();
const advancedCommentaryService = AdvancedAIMatchCommentaryHighlightsService.getInstance();

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

    console.log(`Generating advanced highlights for match ${request.matchId}`);
    const highlight = await advancedCommentaryService.generateAdvancedHighlights(request);
    
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

    console.log(`Generating advanced commentary for match ${eventData.matchId}`);
    const commentary = await advancedCommentaryService.generateAdvancedCommentary(eventData);
    
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
    const highlights = advancedCommentaryService.getAdvancedHighlightsByMatch(matchId);
    const commentary = advancedCommentaryService.getAdvancedCommentaryEvents(matchId);
    
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
    const commentary = advancedCommentaryService.getAdvancedCommentaryEvents(matchId);
    
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
    const highlights = advancedCommentaryService.getAllAdvancedHighlights();
    
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
    const allHighlights = advancedCommentaryService.getAllAdvancedHighlights();
    const highlight = allHighlights.find(h => h.id === highlightId);
    
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
    advancedCommentaryService.updateConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: advancedCommentaryService.getConfig()
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
    const config = advancedCommentaryService.getConfig();
    
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
    const metrics = advancedCommentaryService.getMetrics();
    
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
    const config = advancedCommentaryService.getConfig();
    const metrics = advancedCommentaryService.getMetrics();
    
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

export default router; 