import express from 'express';

const router = express.Router();

/**
 * GET /api/player/profile
 * Get current player profile data
 */
router.get('/profile', async (req, res) => {
  try {
    // Mock player data for now
    const playerData = {
      name: 'Kicky Breaks',
      level: 15,
      homeDojo: 'The Empire Hotel',
      avatar: '👤',
      clan: 'Phoenix Warriors',
      clanRank: 'Elite Member',
      dojoCoins: 12500,
      currentLocation: {
        lat: -27.4698,
        lng: 153.0251
      },
      isMoving: false,
      destination: null
    };

    res.json({
      success: true,
      data: playerData
    });
  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player profile'
    });
  }
});

/**
 * GET /api/player/homeDojo
 * Get player's home dojo information
 */
router.get('/homeDojo', async (req, res) => {
  try {
    // Mock home dojo data
    const homeDojo = {
      id: 'home-001',
      name: 'The Empire Hotel',
      coordinates: {
        lat: -27.4698,
        lng: 153.0251
      },
      allegiance: 'player',
      isLocked: false,
      players: 8,
      rating: 4.5,
      clan: 'Phoenix Warriors',
      clanLeader: 'Kicky Breaks',
      territoryLevel: 3,
      clanWarStatus: 'none',
      clanWarScore: '0-0',
      lastChallenge: '2 days ago',
      distance: '0m',
      revenue: '$2,450/week',
      activeMatches: 2,
      challenges: []
    };

    res.json({
      success: true,
      data: homeDojo
    });
  } catch (error) {
    console.error('Error fetching home dojo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home dojo'
    });
  }
});

/**
 * PUT /api/player/profile
 * Update player profile
 */
router.put('/profile', async (req, res) => {
  try {
    const updates = req.body;
    
    // In a real app, this would update the database
    console.log('Updating player profile:', updates);
    
    res.json({
      success: true,
      message: 'Player profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating player profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update player profile'
    });
  }
});

/**
 * POST /api/player/location
 * Update player location
 */
router.post('/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    
    // In a real app, this would update the player's location in the database
    console.log('Updating player location:', { lat, lng });
    
    res.json({
      success: true,
      message: 'Player location updated successfully'
    });
  } catch (error) {
    console.error('Error updating player location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update player location'
    });
  }
});

export default router; 