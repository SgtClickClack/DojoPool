import express from 'express';
import { advancedAnalyticsService } from '../../services/analytics/AdvancedAnalyticsService.js';
import type { VenueOptimization, RevenueForecast } from '../../services/analytics/AdvancedAnalyticsService.js';

const router = express.Router();

/**
 * GET /api/advanced-analytics/performance-trends
 * Get performance trends for players
 */
router.get('/performance-trends', async (req, res) => {
  try {
    const trends = advancedAnalyticsService.getPerformanceTrends();
    res.json({
      success: true,
      data: trends,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance trends'
    });
  }
});

/**
 * GET /api/advanced-analytics/venue-optimizations
 * Get venue optimization recommendations
 */
router.get('/venue-optimizations', async (req, res) => {
  try {
    const optimizations = advancedAnalyticsService.getVenueOptimizations();
    res.json({
      success: true,
      data: optimizations
    });
  } catch (error) {
    console.error('Error fetching venue optimizations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue optimizations'
    });
  }
});

/**
 * GET /api/advanced-analytics/venue-optimization/:venueId
 * Get optimization data for a specific venue
 */
router.get('/venue-optimization/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const optimizations = advancedAnalyticsService.getVenueOptimizations();
    const optimization = optimizations.find((opt: VenueOptimization) => opt.venueId === venueId);
    
    if (!optimization) {
      return res.status(404).json({
        success: false,
        error: 'Venue optimization not found'
      });
    }

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Error fetching venue optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue optimization'
    });
  }
});

/**
 * GET /api/advanced-analytics/revenue-forecasts
 * Get revenue forecasts for venues
 */
router.get('/revenue-forecasts', async (req, res) => {
  try {
    const forecasts = advancedAnalyticsService.getRevenueForecasts();
    res.json({
      success: true,
      data: forecasts
    });
  } catch (error) {
    console.error('Error fetching revenue forecasts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecasts'
    });
  }
});

/**
 * GET /api/advanced-analytics/revenue-forecast/:venueId
 * Get revenue forecast for a specific venue
 */
router.get('/revenue-forecast/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const forecasts = advancedAnalyticsService.getRevenueForecasts();
    const forecast = forecasts.find((f: RevenueForecast) => f.venueId === venueId);
    
    if (!forecast) {
      return res.status(404).json({
        success: false,
        error: 'Revenue forecast not found'
      });
    }

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Error fetching revenue forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecast'
    });
  }
});

/**
 * GET /api/advanced-analytics/tournament-predictions
 * Get tournament predictions
 */
router.get('/tournament-predictions', async (req, res) => {
  try {
    const predictions = advancedAnalyticsService.getTournamentPredictions();
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching tournament predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament predictions'
    });
  }
});

/**
 * GET /api/advanced-analytics/tournament-prediction/:tournamentId
 * Get prediction for a specific tournament
 */
router.get('/tournament-prediction/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const prediction = advancedAnalyticsService.getTournamentPrediction(tournamentId);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Tournament prediction not found'
      });
    }

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error fetching tournament prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament prediction'
    });
  }
});

/**
 * GET /api/advanced-analytics/player-insights
 * Get player insights
 */
router.get('/player-insights', async (req, res) => {
  try {
    const insights = advancedAnalyticsService.getPlayerInsights();
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error fetching player insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player insights'
    });
  }
});

/**
 * GET /api/advanced-analytics/player-insight/:playerId
 * Get insights for a specific player
 */
router.get('/player-insight/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const insight = advancedAnalyticsService.getPlayerInsight(playerId);
    
    if (!insight) {
      return res.status(404).json({
        success: false,
        error: 'Player insight not found'
      });
    }

    res.json({
      success: true,
      data: insight
    });
  } catch (error) {
    console.error('Error fetching player insight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player insight'
    });
  }
});

/**
 * GET /api/advanced-analytics/venue-analytics
 * Get venue analytics
 */
router.get('/venue-analytics', async (req, res) => {
  try {
    const analytics = advancedAnalyticsService.getVenueAnalytics();
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching venue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue analytics'
    });
  }
});

/**
 * GET /api/advanced-analytics/venue-analytic/:venueId
 * Get analytics for a specific venue
 */
router.get('/venue-analytic/:venueId', async (req, res) => {
  try {
    const { venueId } = req.params;
    const analytic = advancedAnalyticsService.getVenueAnalytic(venueId);
    
    if (!analytic) {
      return res.status(404).json({
        success: false,
        error: 'Venue analytics not found'
      });
    }

    res.json({
      success: true,
      data: analytic
    });
  } catch (error) {
    console.error('Error fetching venue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch venue analytics'
    });
  }
});

/**
 * GET /api/advanced-analytics/dashboard
 * Get comprehensive analytics dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      trends,
      optimizations,
      forecasts,
      predictions,
      insights,
      analytics
    ] = await Promise.all([
      Promise.resolve(advancedAnalyticsService.getPerformanceTrends()),
      Promise.resolve(advancedAnalyticsService.getVenueOptimizations()),
      Promise.resolve(advancedAnalyticsService.getRevenueForecasts()),
      Promise.resolve(advancedAnalyticsService.getTournamentPredictions()),
      Promise.resolve(advancedAnalyticsService.getPlayerInsights()),
      Promise.resolve(advancedAnalyticsService.getVenueAnalytics())
    ]);

    res.json({
      success: true,
      data: {
        trends,
        optimizations,
        forecasts,
        predictions,
        insights,
        analytics,
        summary: {
          totalTrends: trends.length,
          totalOptimizations: optimizations.length,
          totalForecasts: forecasts.length,
          totalPredictions: predictions.length,
          totalInsights: insights.length,
          totalAnalytics: analytics.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics dashboard'
    });
  }
});

/**
 * POST /api/advanced-analytics/refresh
 * Manually trigger analytics refresh
 */
router.post('/refresh', async (req, res) => {
  try {
    // Trigger manual refresh
    advancedAnalyticsService['updateAllAnalytics']();
    
    res.json({
      success: true,
      message: 'Analytics refresh initiated'
    });
  } catch (error) {
    console.error('Error refreshing analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh analytics'
    });
  }
});

/**
 * GET /api/advanced-analytics/config
 * Get analytics configuration
 */
router.get('/config', async (req, res) => {
  try {
    const config = advancedAnalyticsService.getConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching analytics config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics config'
    });
  }
});

/**
 * PUT /api/advanced-analytics/config
 * Update analytics configuration
 */
router.put('/config', async (req, res) => {
  try {
    const newConfig = req.body;
    advancedAnalyticsService.updateConfig(newConfig);

    res.json({
      success: true,
      message: 'Analytics configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating analytics config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update analytics config'
    });
  }
});

export default router; 


