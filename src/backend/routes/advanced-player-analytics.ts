import express from 'express';
import AdvancedPlayerAnalyticsService from '../../services/analytics/AdvancedPlayerAnalyticsService.ts';

const router = express.Router();
const analyticsService = AdvancedPlayerAnalyticsService.getInstance();

// Get service configuration
router.get('/config', (req, res) => {
  try {
    const config = analyticsService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error getting player analytics config:', error);
    res.status(500).json({ success: false, error: 'Failed to get configuration' });
  }
});

// Update service configuration
router.put('/config', (req, res) => {
  try {
    const { config } = req.body;
    analyticsService.updateConfig(config);
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating player analytics config:', error);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// Get service metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = analyticsService.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error getting player analytics metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

// Get all player performances
router.get('/performances', (req, res) => {
  try {
    const performances = analyticsService.getAllPlayerPerformances();
    res.json({ success: true, performances });
  } catch (error) {
    console.error('Error getting player performances:', error);
    res.status(500).json({ success: false, error: 'Failed to get performances' });
  }
});

// Get specific player performance
router.get('/performances/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const performance = analyticsService.getPlayerPerformance(playerId);
    
    if (!performance) {
      return res.status(404).json({ success: false, error: 'Player performance not found' });
    }
    
    res.json({ success: true, performance });
  } catch (error) {
    console.error('Error getting player performance:', error);
    res.status(500).json({ success: false, error: 'Failed to get player performance' });
  }
});

// Update player performance
router.post('/performances/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const { matchData } = req.body;
    
    analyticsService.updatePlayerPerformance(playerId, matchData)
      .then(performance => {
        res.json({ success: true, performance });
      })
      .catch(error => {
        console.error('Error updating player performance:', error);
        res.status(500).json({ success: false, error: 'Failed to update performance' });
      });
  } catch (error) {
    console.error('Error updating player performance:', error);
    res.status(500).json({ success: false, error: 'Failed to update performance' });
  }
});

// Get top performers
router.get('/performances/top/:limit?', (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    const topPerformers = analyticsService.getTopPerformers(limit);
    res.json({ success: true, topPerformers });
  } catch (error) {
    console.error('Error getting top performers:', error);
    res.status(500).json({ success: false, error: 'Failed to get top performers' });
  }
});

// Get most improved players
router.get('/performances/improved/:limit?', (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    const mostImproved = analyticsService.getMostImproved(limit);
    res.json({ success: true, mostImproved });
  } catch (error) {
    console.error('Error getting most improved players:', error);
    res.status(500).json({ success: false, error: 'Failed to get most improved players' });
  }
});

// Add performance metric
router.post('/metrics', (req, res) => {
  try {
    const { metric } = req.body;
    
    analyticsService.addPerformanceMetric(metric)
      .then(newMetric => {
        res.json({ success: true, metric: newMetric });
      })
      .catch(error => {
        console.error('Error adding performance metric:', error);
        res.status(500).json({ success: false, error: 'Failed to add metric' });
      });
  } catch (error) {
    console.error('Error adding performance metric:', error);
    res.status(500).json({ success: false, error: 'Failed to add metric' });
  }
});

// Get performance metrics for a player
router.get('/metrics/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const { metricType } = req.query;
    
    const metrics = analyticsService.getPerformanceMetrics(playerId, metricType as string);
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

// Update skill progression
router.post('/skills/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const { skillArea, improvement, reason, matchId } = req.body;
    
    analyticsService.updateSkillProgression(playerId, skillArea, improvement, reason, matchId)
      .then(progression => {
        res.json({ success: true, progression });
      })
      .catch(error => {
        console.error('Error updating skill progression:', error);
        res.status(500).json({ success: false, error: 'Failed to update skill progression' });
      });
  } catch (error) {
    console.error('Error updating skill progression:', error);
    res.status(500).json({ success: false, error: 'Failed to update skill progression' });
  }
});

// Get skill progression for a player
router.get('/skills/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const progressions = analyticsService.getSkillProgression(playerId);
    res.json({ success: true, progressions });
  } catch (error) {
    console.error('Error getting skill progression:', error);
    res.status(500).json({ success: false, error: 'Failed to get skill progression' });
  }
});

// Analyze match
router.post('/matches/analyze', (req, res) => {
  try {
    const { matchData } = req.body;
    
    analyticsService.analyzeMatch(matchData)
      .then(analysis => {
        res.json({ success: true, analysis });
      })
      .catch(error => {
        console.error('Error analyzing match:', error);
        res.status(500).json({ success: false, error: 'Failed to analyze match' });
      });
  } catch (error) {
    console.error('Error analyzing match:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze match' });
  }
});

// Get match analyses for a player
router.get('/matches/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const analyses = analyticsService.getMatchAnalyses(playerId);
    res.json({ success: true, analyses });
  } catch (error) {
    console.error('Error getting match analyses:', error);
    res.status(500).json({ success: false, error: 'Failed to get match analyses' });
  }
});

// Generate player insights
router.post('/insights/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    
    analyticsService.generatePlayerInsights(playerId)
      .then(insights => {
        res.json({ success: true, insights });
      })
      .catch(error => {
        console.error('Error generating player insights:', error);
        res.status(500).json({ success: false, error: 'Failed to generate insights' });
      });
  } catch (error) {
    console.error('Error generating player insights:', error);
    res.status(500).json({ success: false, error: 'Failed to generate insights' });
  }
});

// Get player insights
router.get('/insights/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const insights = analyticsService.getPlayerInsights(playerId);
    
    if (!insights) {
      return res.status(404).json({ success: false, error: 'Player insights not found' });
    }
    
    res.json({ success: true, insights });
  } catch (error) {
    console.error('Error getting player insights:', error);
    res.status(500).json({ success: false, error: 'Failed to get insights' });
  }
});

// Compare players
router.post('/compare', (req, res) => {
  try {
    const { playerId, comparisonPlayerId } = req.body;
    
    analyticsService.comparePlayers(playerId, comparisonPlayerId)
      .then(comparison => {
        res.json({ success: true, comparison });
      })
      .catch(error => {
        console.error('Error comparing players:', error);
        res.status(500).json({ success: false, error: 'Failed to compare players' });
      });
  } catch (error) {
    console.error('Error comparing players:', error);
    res.status(500).json({ success: false, error: 'Failed to compare players' });
  }
});

// Get player comparisons
router.get('/compare/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    const comparisons = analyticsService.getPlayerComparisons(playerId);
    res.json({ success: true, comparisons });
  } catch (error) {
    console.error('Error getting player comparisons:', error);
    res.status(500).json({ success: false, error: 'Failed to get comparisons' });
  }
});

export default router; 