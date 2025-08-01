import express from 'express';
import { body, validationResult } from 'express-validator';
import { passiveIncomeService } from '../../services/economy/PassiveIncomeService.js';

const router = express.Router();

// Middleware to validate request body
const validateTerritoryRegistration = [
  body('territoryId').isString().notEmpty(),
  body('ownerId').isString().notEmpty(),
  body('clanId').optional().isString()
];

const validateActivityUpdate = [
  body('territoryId').isString().notEmpty(),
  body('activity').isObject(),
  body('activity.playerCount').isNumeric(),
  body('activity.matchCount').isNumeric(),
  body('activity.tournamentCount').isNumeric(),
  body('activity.revenue').isNumeric()
];

/**
 * Register a territory for passive income
 * POST /api/passive-income/territories
 */
router.post('/territories', validateTerritoryRegistration, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { territoryId, ownerId, clanId } = req.body;
    
    const territoryIncome = passiveIncomeService.registerTerritory(territoryId, ownerId, clanId);
    
    res.status(201).json({
      success: true,
      message: 'Territory registered for passive income',
      data: territoryIncome
    });
  } catch (error) {
    console.error('Error registering territory for passive income:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register territory for passive income'
    });
  }
});

/**
 * Get income information for a territory
 * GET /api/passive-income/territories/:territoryId
 */
router.get('/territories/:territoryId', async (req: express.Request, res: express.Response) => {
  try {
    const { territoryId } = req.params;
    
    const territoryIncome = passiveIncomeService.getTerritoryIncome(territoryId);
    
    if (!territoryIncome) {
      return res.status(404).json({
        success: false,
        message: 'Territory not found or not registered for passive income'
      });
    }
    
    res.json({
      success: true,
      data: territoryIncome
    });
  } catch (error) {
    console.error('Error getting territory income:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get territory income'
    });
  }
});

/**
 * Get all territory incomes
 * GET /api/passive-income/territories
 */
router.get('/territories', async (req: express.Request, res: express.Response) => {
  try {
    const territoryIncomes = passiveIncomeService.getAllTerritoryIncomes();
    
    res.json({
      success: true,
      data: territoryIncomes
    });
  } catch (error) {
    console.error('Error getting all territory incomes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get territory incomes'
    });
  }
});

/**
 * Update venue activity for a territory
 * PUT /api/passive-income/territories/:territoryId/activity
 */
router.put('/territories/:territoryId/activity', validateActivityUpdate, async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { territoryId } = req.params;
    const { activity } = req.body;
    
    passiveIncomeService.updateVenueActivity(territoryId, activity);
    
    res.json({
      success: true,
      message: 'Venue activity updated'
    });
  } catch (error) {
    console.error('Error updating venue activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update venue activity'
    });
  }
});

/**
 * Get payout history for a territory
 * GET /api/passive-income/territories/:territoryId/payouts
 */
router.get('/territories/:territoryId/payouts', async (req: express.Request, res: express.Response) => {
  try {
    const { territoryId } = req.params;
    
    const payoutHistory = passiveIncomeService.getPayoutHistory(territoryId);
    
    res.json({
      success: true,
      data: payoutHistory
    });
  } catch (error) {
    console.error('Error getting payout history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payout history'
    });
  }
});

/**
 * Get total earnings for a user
 * GET /api/passive-income/users/:userId/earnings
 */
router.get('/users/:userId/earnings', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.params;
    
    const totalEarnings = passiveIncomeService.getUserTotalEarnings(userId);
    
    res.json({
      success: true,
      data: {
        userId,
        totalEarnings
      }
    });
  } catch (error) {
    console.error('Error getting user earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user earnings'
    });
  }
});

/**
 * Get passive income configuration
 * GET /api/passive-income/config
 */
router.get('/config', async (req: express.Request, res: express.Response) => {
  try {
    const config = passiveIncomeService.getConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting passive income config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get passive income configuration'
    });
  }
});

/**
 * Update passive income configuration (admin only)
 * PUT /api/passive-income/config
 */
router.put('/config', async (req: express.Request, res: express.Response) => {
  try {
    const { baseRate, territoryBonus, venueActivityBonus, clanBonus, maxIncomePerHour, payoutInterval } = req.body;
    
    const newConfig: any = {};
    if (baseRate !== undefined) newConfig.baseRate = baseRate;
    if (territoryBonus !== undefined) newConfig.territoryBonus = territoryBonus;
    if (venueActivityBonus !== undefined) newConfig.venueActivityBonus = venueActivityBonus;
    if (clanBonus !== undefined) newConfig.clanBonus = clanBonus;
    if (maxIncomePerHour !== undefined) newConfig.maxIncomePerHour = maxIncomePerHour;
    if (payoutInterval !== undefined) newConfig.payoutInterval = payoutInterval;
    
    passiveIncomeService.updateConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Passive income configuration updated',
      data: passiveIncomeService.getConfig()
    });
  } catch (error) {
    console.error('Error updating passive income config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update passive income configuration'
    });
  }
});

/**
 * Start passive income system
 * POST /api/passive-income/start
 */
router.post('/start', async (req: express.Request, res: express.Response) => {
  try {
    passiveIncomeService.startPayoutSystem();
    
    res.json({
      success: true,
      message: 'Passive income system started'
    });
  } catch (error) {
    console.error('Error starting passive income system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start passive income system'
    });
  }
});

/**
 * Stop passive income system
 * POST /api/passive-income/stop
 */
router.post('/stop', async (req: express.Request, res: express.Response) => {
  try {
    passiveIncomeService.stopPayoutSystem();
    
    res.json({
      success: true,
      message: 'Passive income system stopped'
    });
  } catch (error) {
    console.error('Error stopping passive income system:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop passive income system'
    });
  }
});

/**
 * Get passive income statistics
 * GET /api/passive-income/stats
 */
router.get('/stats', async (req: express.Request, res: express.Response) => {
  try {
    const territoryIncomes = passiveIncomeService.getAllTerritoryIncomes();
    
    const stats = {
      totalTerritories: territoryIncomes.length,
      totalActiveTerritories: territoryIncomes.filter(t => t.totalIncome > 0).length,
      totalIncomePerHour: territoryIncomes.reduce((sum, t) => sum + t.totalIncome, 0),
      totalEarned: territoryIncomes.reduce((sum, t) => sum + t.totalEarned, 0),
      averageIncomePerTerritory: territoryIncomes.length > 0 
        ? territoryIncomes.reduce((sum, t) => sum + t.totalIncome, 0) / territoryIncomes.length 
        : 0,
      clanControlledTerritories: territoryIncomes.filter(t => t.clanId).length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting passive income stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get passive income statistics'
    });
  }
});

export default router; 


