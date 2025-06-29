import express from 'express';
import { venueLeaderboardService } from '../../services/venue/VenueLeaderboardService';

const router = express.Router();

/**
 * GET /api/venue-leaderboard
 * Get the current venue leaderboard
 */
router.get('/', async (req, res) => {
  try {
    const leaderboard = venueLeaderboardService.getLeaderboard();
    res.json({
      success: true,
      data: leaderboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching venue leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue leaderboard'
    });
  }
});

/**
 * GET /api/venue-leaderboard/venue/:venueId
 * Get performance data for a specific venue
 */
router.get('/venue/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const performance = venueLeaderboardService.getVenuePerformance(venueId);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    const dojoMaster = venueLeaderboardService.getDojoMaster(venueId);
    const topPlayers = venueLeaderboardService.getTopPlayers(venueId, 10);

    res.json({
      success: true,
      data: {
        performance,
        dojoMaster,
        topPlayers
      }
    });
  } catch (error) {
    console.error('Error fetching venue performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue performance'
    });
  }
});

/**
 * GET /api/venue-leaderboard/player/:playerId/:venueId
 * Get performance data for a specific player at a venue
 */
router.get('/player/:playerId/:venueId', async (req, res) => {
  try {
    const { playerId, venueId } = req.params;
    const performance = venueLeaderboardService.getPlayerPerformance(playerId, venueId);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'Player performance not found'
      });
    }

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching player performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player performance'
    });
  }
});

/**
 * GET /api/venue-leaderboard/dojo-masters
 * Get all Dojo Masters
 */
router.get('/dojo-masters', async (req, res) => {
  try {
    const dojoMasters = venueLeaderboardService.getAllDojoMasters();
    res.json({
      success: true,
      data: dojoMasters
    });
  } catch (error) {
    console.error('Error fetching Dojo Masters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Dojo Masters'
    });
  }
});

/**
 * GET /api/venue-leaderboard/dojo-master/:venueId
 * Get Dojo Master for a specific venue
 */
router.get('/dojo-master/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const dojoMaster = venueLeaderboardService.getDojoMaster(venueId);
    
    if (!dojoMaster) {
      return res.status(404).json({
        success: false,
        error: 'Dojo Master not found for this venue'
      });
    }

    res.json({
      success: true,
      data: dojoMaster
    });
  } catch (error) {
    console.error('Error fetching Dojo Master:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Dojo Master'
    });
  }
});

/**
 * POST /api/venue-leaderboard/venue-performance
 * Update venue performance data
 */
router.post('/venue-performance', async (req, res) => {
  try {
    const { venueId, activity } = req.body;
    
    if (!venueId || !activity) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID and activity data are required'
      });
    }

    venueLeaderboardService.updateVenuePerformance(venueId, activity);

    res.json({
      success: true,
      message: 'Venue performance updated successfully'
    });
  } catch (error) {
    console.error('Error updating venue performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update venue performance'
    });
  }
});

/**
 * POST /api/venue-leaderboard/player-performance
 * Update player performance data
 */
router.post('/player-performance', async (req, res) => {
  try {
    const { playerId, venueId, performance } = req.body;
    
    if (!playerId || !venueId || !performance) {
      return res.status(400).json({
        success: false,
        error: 'Player ID, venue ID, and performance data are required'
      });
    }

    venueLeaderboardService.updatePlayerPerformance(playerId, venueId, performance);

    res.json({
      success: true,
      message: 'Player performance updated successfully'
    });
  } catch (error) {
    console.error('Error updating player performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update player performance'
    });
  }
});

/**
 * POST /api/venue-leaderboard/designate-master
 * Manually designate a Dojo Master
 */
router.post('/designate-master', async (req, res) => {
  try {
    const { venueId, playerId, playerName } = req.body;
    
    if (!venueId || !playerId || !playerName) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID, player ID, and player name are required'
      });
    }

    venueLeaderboardService.designateDojoMaster(venueId, playerId, playerName);

    res.json({
      success: true,
      message: 'Dojo Master designated successfully'
    });
  } catch (error) {
    console.error('Error designating Dojo Master:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to designate Dojo Master'
    });
  }
});

/**
 * GET /api/venue-leaderboard/top-players/:venueId
 * Get top players for a venue
 */
router.get('/top-players/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topPlayers = venueLeaderboardService.getTopPlayers(venueId, limit);

    res.json({
      success: true,
      data: topPlayers
    });
  } catch (error) {
    console.error('Error fetching top players:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top players'
    });
  }
});

/**
 * GET /api/venue-leaderboard/config
 * Get leaderboard configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = venueLeaderboardService.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching leaderboard config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard config'
    });
  }
});

/**
 * PUT /api/venue-leaderboard/config
 * Update leaderboard configuration
 */
router.put('/config', async (req, res) => {
  try {
    const newConfig = req.body;
    venueLeaderboardService.updateConfig(newConfig);

    res.json({
      success: true,
      message: 'Leaderboard configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating leaderboard config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update leaderboard config'
    });
  }
});

/**
 * POST /api/venue-leaderboard/match-result
 * Handle match result for leaderboard updates
 */
router.post('/match-result', async (req, res) => {
  try {
    const { venueId, winnerId, loserId, winnerName, loserName } = req.body;
    
    if (!venueId || !winnerId || !loserId) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID, winner ID, and loser ID are required'
      });
    }

    venueLeaderboardService['handleMatchResult']({
      venueId,
      winnerId,
      loserId,
      winnerName: winnerName || `Player ${winnerId}`,
      loserName: loserName || `Player ${loserId}`
    });

    res.json({
      success: true,
      message: 'Match result processed successfully'
    });
  } catch (error) {
    console.error('Error processing match result:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process match result'
    });
  }
});

/**
 * POST /api/venue-leaderboard/tournament-complete
 * Handle tournament completion for leaderboard updates
 */
router.post('/tournament-complete', async (req, res) => {
  try {
    const { venueId, winnerId, winnerName, participants } = req.body;
    
    if (!venueId || !winnerId || !participants) {
      return res.status(400).json({
        success: false,
        error: 'Venue ID, winner ID, and participants are required'
      });
    }

    venueLeaderboardService['handleTournamentComplete']({
      venueId,
      winnerId,
      winnerName: winnerName || `Player ${winnerId}`,
      participants
    });

    res.json({
      success: true,
      message: 'Tournament completion processed successfully'
    });
  } catch (error) {
    console.error('Error processing tournament completion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process tournament completion'
    });
  }
});

export default router; 