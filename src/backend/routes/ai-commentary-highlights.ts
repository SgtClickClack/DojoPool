import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AIPoweredCommentaryHighlightsService, { 
  HighlightGenerationRequest, 
  GeneratedHighlight 
} from '../../services/ai/AIPoweredCommentaryHighlightsService';

const router = express.Router();
const commentaryHighlightsService = AIPoweredCommentaryHighlightsService.getInstance();

// Validation middleware
const validateHighlightGeneration = [
  body('matchId').isString().notEmpty(),
  body('userId').isString().notEmpty(),
  body('gameType').isString().notEmpty(),
  body('highlights').isArray().notEmpty(),
  body('commentaryStyle').optional().isIn(['professional', 'casual', 'excited', 'analytical']),
  body('includeAudio').optional().isBoolean(),
  body('duration').optional().isInt({ min: 10, max: 600 }),
  body('quality').optional().isIn(['low', 'medium', 'high'])
];

const validateShareRequest = [
  body('platforms').isArray().notEmpty(),
  body('message').optional().isString().isLength({ max: 280 })
];

// POST /api/ai-commentary-highlights/generate
router.post('/generate', validateHighlightGeneration, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const request: HighlightGenerationRequest = {
      matchId: req.body.matchId,
      tournamentId: req.body.tournamentId,
      userId: req.body.userId,
      gameType: req.body.gameType,
      highlights: req.body.highlights,
      commentaryStyle: req.body.commentaryStyle,
      includeAudio: req.body.includeAudio,
      duration: req.body.duration,
      quality: req.body.quality
    };

    console.log(`Generating highlights for match ${request.matchId}`);
    const highlight = await commentaryHighlightsService.generateHighlights(request);
    
    res.status(201).json({
      success: true,
      data: highlight,
      message: 'Highlight generated successfully'
    });

  } catch (error) {
    console.error('Error generating highlights:', error);
    res.status(500).json({
      error: 'Failed to generate highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/match/:matchId
router.get('/match/:matchId', async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const highlights = commentaryHighlightsService.getHighlightsByMatch(matchId);
    
    res.json({
      success: true,
      data: highlights,
      count: highlights.length
    });

  } catch (error) {
    console.error('Error fetching match highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch match highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/tournament/:tournamentId
router.get('/tournament/:tournamentId', async (req: Request, res: Response) => {
  try {
    const { tournamentId } = req.params;
    const highlights = commentaryHighlightsService.getHighlightsByTournament(tournamentId);
    
    res.json({
      success: true,
      data: highlights,
      count: highlights.length
    });

  } catch (error) {
    console.error('Error fetching tournament highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch tournament highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/user/:userId
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const highlights = commentaryHighlightsService.getHighlightsByUser(userId);
    
    res.json({
      success: true,
      data: highlights,
      count: highlights.length
    });

  } catch (error) {
    console.error('Error fetching user highlights:', error);
    res.status(500).json({
      error: 'Failed to fetch user highlights',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ai-commentary-highlights/:highlightId/share
router.post('/:highlightId/share', validateShareRequest, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { highlightId } = req.params;
    const { platforms, message } = req.body;

    await commentaryHighlightsService.shareHighlight(highlightId, platforms, message);
    
    res.json({
      success: true,
      message: 'Highlight shared successfully',
      data: {
        highlightId,
        platforms,
        message
      }
    });

  } catch (error) {
    console.error('Error sharing highlight:', error);
    res.status(500).json({
      error: 'Failed to share highlight',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/:highlightId/download
router.get('/:highlightId/download', async (req: Request, res: Response) => {
  try {
    const { highlightId } = req.params;
    const downloadUrl = await commentaryHighlightsService.downloadHighlight(highlightId);
    
    res.json({
      success: true,
      data: {
        highlightId,
        downloadUrl
      }
    });

  } catch (error) {
    console.error('Error downloading highlight:', error);
    res.status(500).json({
      error: 'Failed to download highlight',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = commentaryHighlightsService.getConfig();
    
    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({
      error: 'Failed to fetch config',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/ai-commentary-highlights/config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = req.body;
    commentaryHighlightsService.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      data: commentaryHighlightsService.getConfig()
    });

  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({
      error: 'Failed to update config',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-commentary-highlights/metrics
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = commentaryHighlightsService.getMetrics();
    
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

// POST /api/ai-commentary-highlights/metrics/reset
router.post('/metrics/reset', async (req: Request, res: Response) => {
  try {
    commentaryHighlightsService.resetMetrics();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });

  } catch (error) {
    console.error('Error resetting metrics:', error);
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const config = commentaryHighlightsService.getConfig();
    const metrics = commentaryHighlightsService.getMetrics();
    
    res.json({
      success: true,
      status: 'healthy',
      data: {
        enabled: config.enabled,
        totalHighlights: metrics.totalHighlights,
        lastActivity: metrics.lastActivity
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Service unavailable'
    });
  }
});

export default router; 