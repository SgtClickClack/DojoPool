import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AdvancedTournamentManagementService from '../../services/tournament/AdvancedTournamentManagementService.ts';
import { TournamentStatus, TournamentFormat } from '../../types/tournament.ts';

const router = express.Router();
const tournamentService = AdvancedTournamentManagementService.getInstance();

// Validation middleware
const validateTournamentConfig = [
  body('name').isString().notEmpty().withMessage('Tournament name is required'),
  body('format').isIn(Object.values(TournamentFormat)).withMessage('Invalid tournament format'),
  body('venueId').isString().notEmpty().withMessage('Venue ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('maxParticipants').isInt({ min: 2 }).withMessage('Max participants must be at least 2'),
  body('entryFee').isFloat({ min: 0 }).withMessage('Entry fee must be non-negative'),
  body('prizePool').isFloat({ min: 0 }).withMessage('Prize pool must be non-negative')
];

const validateMatchUpdate = [
  body('status').optional().isIn(['scheduled', 'in_progress', 'completed', 'cancelled']).withMessage('Invalid match status'),
  body('score').optional().isString().withMessage('Score must be a string'),
  body('winnerId').optional().isString().withMessage('Winner ID must be a string')
];

// GET /api/advanced-tournaments - Get all tournaments with filters
router.get('/advanced-tournaments', async (req: Request, res: Response) => {
  try {
    const { venueId, status, format } = req.query;
    let tournaments = tournamentService.getAllTournaments();

    // Apply filters
    if (venueId) {
      tournaments = tournaments.filter(t => t.venueId.toString() === venueId);
    }
    if (status) {
      tournaments = tournaments.filter(t => t.status === status);
    }
    if (format) {
      tournaments = tournaments.filter(t => t.format === format);
    }

    res.json({
      success: true,
      tournaments,
      count: tournaments.length
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournaments'
    });
  }
});

// GET /api/advanced-tournaments/:id - Get specific tournament
router.get('/advanced-tournaments/:id', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const bracket = tournamentService.getBracket(req.params.id);
    const analytics = tournamentService.getAnalytics(req.params.id);
    const insights = tournamentService.getInsights(req.params.id);

    res.json({
      success: true,
      tournament,
      bracket,
      analytics,
      insights
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament'
    });
  }
});

// POST /api/advanced-tournaments - Create new tournament
router.post('/advanced-tournaments', validateTournamentConfig, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const config = {
      id: `tournament_${Date.now()}`,
      name: req.body.name,
      format: req.body.format,
      venueId: req.body.venueId,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      maxParticipants: req.body.maxParticipants,
      entryFee: req.body.entryFee,
      prizePool: req.body.prizePool,
      seedingMethod: req.body.seedingMethod || 'random',
      consolationRounds: req.body.consolationRounds || false,
      autoStart: req.body.autoStart || false,
      autoAdvance: req.body.autoAdvance || false,
      timeLimit: req.body.timeLimit || 30,
      breakTime: req.body.breakTime || 5,
      rules: req.body.rules || [],
      requirements: req.body.requirements || {},
      analytics: req.body.analytics || {
        enabled: true,
        trackPerformance: true,
        trackEngagement: true,
        generateInsights: true,
        realTimeUpdates: true
      },
      notifications: req.body.notifications || {
        email: true,
        sms: false,
        push: true,
        webhook: false
      }
    };

    const tournament = await tournamentService.createAdvancedTournament(config);

    res.status(201).json({
      success: true,
      tournament,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create tournament'
    });
  }
});

// POST /api/advanced-tournaments/:id/generate-bracket - Generate tournament bracket
router.post('/advanced-tournaments/:id/generate-bracket', async (req: Request, res: Response) => {
  try {
    const bracket = await tournamentService.generateBracket(req.params.id);
    
    res.json({
      success: true,
      bracket,
      message: 'Tournament bracket generated successfully'
    });
  } catch (error) {
    console.error('Error generating bracket:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tournament bracket'
    });
  }
});

// POST /api/advanced-tournaments/:id/register - Register player for tournament
router.post('/advanced-tournaments/:id/register', [
  body('playerId').isString().notEmpty().withMessage('Player ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const { playerId } = req.body;

    // Check if tournament is in registration status
    if (tournament.status !== TournamentStatus.REGISTRATION) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is not accepting registrations'
      });
    }

    // Check if player is already registered (using participantCount as proxy)
    if (tournament.participantCount >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    // Update tournament participant count
    tournament.participantCount += 1;
    tournament.updatedAt = new Date();

    res.json({
      success: true,
      tournament,
      message: 'Player registered successfully'
    });
  } catch (error) {
    console.error('Error registering player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register player'
    });
  }
});

// POST /api/advanced-tournaments/:id/withdraw - Withdraw player from tournament
router.post('/advanced-tournaments/:id/withdraw', [
  body('playerId').isString().notEmpty().withMessage('Player ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Update tournament participant count
    if (tournament.participantCount > 0) {
      tournament.participantCount -= 1;
    }
    tournament.updatedAt = new Date();

    res.json({
      success: true,
      tournament,
      message: 'Player withdrawn successfully'
    });
  } catch (error) {
    console.error('Error withdrawing player:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to withdraw player'
    });
  }
});

// POST /api/advanced-tournaments/:id/start - Start tournament
router.post('/advanced-tournaments/:id/start', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament can be started
    if (tournament.status !== TournamentStatus.REGISTRATION && tournament.status !== TournamentStatus.CHECK_IN) {
      return res.status(400).json({
        success: false,
        error: 'Tournament cannot be started in current status'
      });
    }

    // Update tournament status
    tournament.status = TournamentStatus.IN_PROGRESS;
    tournament.updatedAt = new Date();

    res.json({
      success: true,
      tournament,
      message: 'Tournament started successfully'
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start tournament'
    });
  }
});

// POST /api/advanced-tournaments/:id/complete - Complete tournament
router.post('/advanced-tournaments/:id/complete', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament can be completed
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      return res.status(400).json({
        success: false,
        error: 'Tournament cannot be completed in current status'
      });
    }

    // Update tournament status
    tournament.status = TournamentStatus.COMPLETED;
    tournament.updatedAt = new Date();

    res.json({
      success: true,
      tournament,
      message: 'Tournament completed successfully'
    });
  } catch (error) {
    console.error('Error completing tournament:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete tournament'
    });
  }
});

// POST /api/advanced-tournaments/:id/update-match - Update match result
router.post('/advanced-tournaments/:id/update-match', [
  body('matchId').isString().notEmpty().withMessage('Match ID is required'),
  body('player1Score').isInt({ min: 0 }).withMessage('Player 1 score must be non-negative'),
  body('player2Score').isInt({ min: 0 }).withMessage('Player 2 score must be non-negative'),
  body('winnerId').isString().notEmpty().withMessage('Winner ID is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { matchId, player1Score, player2Score, winnerId } = req.body;
    
    const success = await tournamentService.updateMatch(req.params.id, matchId, {
      player1Score,
      player2Score,
      winnerId: parseInt(winnerId),
      status: 'completed' as any
    });

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to update match'
      });
    }

    res.json({
      success: true,
      message: 'Match updated successfully'
    });
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match'
    });
  }
});

// GET /api/advanced-tournaments/:id/analytics - Get tournament analytics
router.get('/advanced-tournaments/:id/analytics', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament is in progress or completed
    if (tournament.status !== TournamentStatus.IN_PROGRESS && tournament.status !== TournamentStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Analytics not available for tournament in current status'
      });
    }

    const analytics = await tournamentService.generateTournamentAnalytics(req.params.id);
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate analytics'
    });
  }
});

// GET /api/advanced-tournaments/:id/insights - Get tournament insights
router.get('/advanced-tournaments/:id/insights', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament is in progress or completed
    if (tournament.status !== TournamentStatus.IN_PROGRESS && tournament.status !== TournamentStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        error: 'Insights not available for tournament in current status'
      });
    }

    const insights = await tournamentService.generateTournamentInsights(req.params.id);
    
    res.json({
      success: true,
      insights
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate insights'
    });
  }
});

// GET /api/advanced-tournaments/:id/leaderboard - Get tournament leaderboard
router.get('/advanced-tournaments/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const tournament = tournamentService.getTournament(req.params.id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const bracket = tournamentService.getBracket(req.params.id);
    if (!bracket) {
      return res.status(404).json({
        success: false,
        error: 'Tournament bracket not found'
      });
    }

    // Generate leaderboard from bracket data
    const leaderboard = bracket.finalStandings.map((playerId, index) => ({
      rank: index + 1,
      playerId,
      placement: index + 1
    }));

    res.json({
      success: true,
      leaderboard,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        participantCount: tournament.participantCount
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Advanced Tournament Management'
  });
});

export default router; 