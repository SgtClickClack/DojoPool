import express from 'express';
import AdvancedVenueManagementService from '../../config/monitoring.js';

const router = express.Router();
const venueService = AdvancedVenueManagementService.getInstance();

// Get service configuration
router.get('/config', (req, res) => {
  try {
    const config = venueService.getConfig();
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error getting venue management config:', error);
    res.status(500).json({ success: false, error: 'Failed to get configuration' });
  }
});

// Update service configuration
router.put('/config', (req, res) => {
  try {
    const { config } = req.body;
    venueService.updateConfig(config);
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating venue management config:', error);
    res.status(500).json({ success: false, error: 'Failed to update configuration' });
  }
});

// Get service metrics
router.get('/metrics', (req, res) => {
  try {
    const metrics = venueService.getMetrics();
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error getting venue management metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to get metrics' });
  }
});

// Get all venue performances
router.get('/performances', (req, res) => {
  try {
    const performances = venueService.getAllVenuePerformances();
    res.json({ success: true, performances });
  } catch (error) {
    console.error('Error getting venue performances:', error);
    res.status(500).json({ success: false, error: 'Failed to get performances' });
  }
});

// Get specific venue performance
router.get('/performances/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const performance = venueService.getVenuePerformance(venueId);
    
    if (!performance) {
      return res.status(404).json({ success: false, error: 'Venue performance not found' });
    }
    
    res.json({ success: true, performance });
  } catch (error) {
    console.error('Error getting venue performance:', error);
    res.status(500).json({ success: false, error: 'Failed to get venue performance' });
  }
});

// Update venue performance
router.post('/performances/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const { performanceData } = req.body;
    
    venueService.updateVenuePerformance(venueId, performanceData)
      .then(performance => {
        res.json({ success: true, performance });
      })
      .catch(error => {
        console.error('Error updating venue performance:', error);
        res.status(500).json({ success: false, error: 'Failed to update performance' });
      });
  } catch (error) {
    console.error('Error updating venue performance:', error);
    res.status(500).json({ success: false, error: 'Failed to update performance' });
  }
});

// Get top performing venues
router.get('/performances/top/:limit?', (req, res) => {
  try {
    const limit = req.params.limit ? parseInt(req.params.limit) : 10;
    const topVenues = venueService.getTopPerformingVenues(limit);
    res.json({ success: true, topVenues });
  } catch (error) {
    console.error('Error getting top performing venues:', error);
    res.status(500).json({ success: false, error: 'Failed to get top venues' });
  }
});

// Generate venue analytics
router.post('/analytics/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const { period, startDate, endDate } = req.body;
    
    venueService.generateVenueAnalytics(venueId, period, new Date(startDate), new Date(endDate))
      .then(analytics => {
        res.json({ success: true, analytics });
      })
      .catch(error => {
        console.error('Error generating venue analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to generate analytics' });
      });
  } catch (error) {
    console.error('Error generating venue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to generate analytics' });
  }
});

// Get venue analytics
router.get('/analytics/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const analytics = venueService.getVenueAnalytics(venueId);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error getting venue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// Update table performance
router.post('/tables/:tableId', (req, res) => {
  try {
    const { tableId } = req.params;
    const { venueId, performanceData } = req.body;
    
    venueService.updateTablePerformance(tableId, venueId, performanceData)
      .then(performance => {
        res.json({ success: true, performance });
      })
      .catch(error => {
        console.error('Error updating table performance:', error);
        res.status(500).json({ success: false, error: 'Failed to update table performance' });
      });
  } catch (error) {
    console.error('Error updating table performance:', error);
    res.status(500).json({ success: false, error: 'Failed to update table performance' });
  }
});

// Get table performances for a venue
router.get('/tables/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const tables = venueService.getTablePerformances(venueId);
    res.json({ success: true, tables });
  } catch (error) {
    console.error('Error getting table performances:', error);
    res.status(500).json({ success: false, error: 'Failed to get table performances' });
  }
});

// Add maintenance record
router.post('/tables/:tableId/maintenance', (req, res) => {
  try {
    const { tableId } = req.params;
    const { venueId, maintenanceData } = req.body;
    
    venueService.addMaintenanceRecord(tableId, venueId, maintenanceData)
      .then(record => {
        res.json({ success: true, record });
      })
      .catch(error => {
        console.error('Error adding maintenance record:', error);
        res.status(500).json({ success: false, error: 'Failed to add maintenance record' });
      });
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({ success: false, error: 'Failed to add maintenance record' });
  }
});

// Update player engagement
router.post('/engagement/:venueId/:playerId', (req, res) => {
  try {
    const { venueId, playerId } = req.params;
    const { engagementData } = req.body;
    
    venueService.updatePlayerEngagement(venueId, playerId, engagementData)
      .then(engagement => {
        res.json({ success: true, engagement });
      })
      .catch(error => {
        console.error('Error updating player engagement:', error);
        res.status(500).json({ success: false, error: 'Failed to update engagement' });
      });
  } catch (error) {
    console.error('Error updating player engagement:', error);
    res.status(500).json({ success: false, error: 'Failed to update engagement' });
  }
});

// Get player engagements for a venue
router.get('/engagement/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const engagements = venueService.getPlayerEngagements(venueId);
    res.json({ success: true, engagements });
  } catch (error) {
    console.error('Error getting player engagements:', error);
    res.status(500).json({ success: false, error: 'Failed to get engagements' });
  }
});

// Generate revenue analytics
router.post('/revenue/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const { period } = req.body;
    
    venueService.generateRevenueAnalytics(venueId, period)
      .then(analytics => {
        res.json({ success: true, analytics });
      })
      .catch(error => {
        console.error('Error generating revenue analytics:', error);
        res.status(500).json({ success: false, error: 'Failed to generate revenue analytics' });
      });
  } catch (error) {
    console.error('Error generating revenue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to generate revenue analytics' });
  }
});

// Get revenue analytics for a venue
router.get('/revenue/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const analytics = venueService.getRevenueAnalytics(venueId);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get revenue analytics' });
  }
});

// Generate venue optimization
router.post('/optimization/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    
    venueService.generateVenueOptimization(venueId)
      .then(optimization => {
        res.json({ success: true, optimization });
      })
      .catch(error => {
        console.error('Error generating venue optimization:', error);
        res.status(500).json({ success: false, error: 'Failed to generate optimization' });
      });
  } catch (error) {
    console.error('Error generating venue optimization:', error);
    res.status(500).json({ success: false, error: 'Failed to generate optimization' });
  }
});

// Get venue optimizations
router.get('/optimization/:venueId', (req, res) => {
  try {
    const { venueId } = req.params;
    const optimizations = venueService.getVenueOptimizations(venueId);
    res.json({ success: true, optimizations });
  } catch (error) {
    console.error('Error getting venue optimizations:', error);
    res.status(500).json({ success: false, error: 'Failed to get optimizations' });
  }
});

export default router; 


