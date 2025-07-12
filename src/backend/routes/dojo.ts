import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { logger } from '../../config/monitoring';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();

const router = express.Router();

// Mock data for development - replace with database calls
const mockDojoCandidates = [
  {
    id: '1',
    name: 'The Empire Hotel',
    address: '339 Brunswick St, Fortitude Valley QLD 4006',
    distance: 120,
    status: 'verified',
    photo: '/images/empire-hotel.jpg',
    latitude: -27.4568,
    longitude: 153.0364
  },
  {
    id: '2',
    name: 'The Wickham',
    address: '308 Wickham St, Fortitude Valley QLD 4006',
    distance: 300,
    status: 'unconfirmed',
    photo: '/images/wickham.jpg',
    latitude: -27.4589,
    longitude: 153.0345
  },
  {
    id: '3',
    name: 'The Brightside',
    address: '27 Warner St, Fortitude Valley QLD 4006',
    distance: 450,
    status: 'pending_verification',
    photo: '/images/brightside.jpg',
    latitude: -27.4601,
    longitude: 153.0321
  }
];

const mockDojoLeaderboards: { [key: string]: { id: string; name: string; avatar: string; level: number; wins: number; losses: number; rank: number }[] } = {
  '1': [
    { id: '1', name: 'Julian', avatar: '/images/avatars/default-avatar.png', level: 12, wins: 32, losses: 15, rank: 1 },
    { id: '2', name: 'RyuKlaw', avatar: '/images/avatars/default-avatar.png', level: 15, wins: 28, losses: 12, rank: 2 },
    { id: '3', name: 'PoolMaster', avatar: '/images/avatars/default-avatar.png', level: 11, wins: 25, losses: 18, rank: 3 }
  ]
};

// Validation middleware
const validateDojoNomination = [
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('address').isString().trim().isLength({ min: 1, max: 200 }),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('contactInfo').optional().isString().trim().isLength({ max: 100 })
];

const validateHomeDojo = [
  body('dojoId').isString().trim().isLength({ min: 1 })
];

/**
 * GET /api/dojo/candidates
 * Get nearby dojo candidates for onboarding
 */
router.get('/candidates', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusMeters = parseInt(radius as string);

    // Query database for territories (dojos) within radius
    const territories = await prisma.territory.findMany({
      where: {
        isActive: true,
        status: {
          in: ['verified', 'unconfirmed', 'pending_verification']
        }
      }
    });

    // Filter by distance and convert to candidate format
    const candidates = territories
      .map(territory => {
        const coords = JSON.parse(territory.coordinates);
        const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng);
        return {
          id: territory.id,
          name: territory.name,
          address: territory.description || 'Address not available',
          distance: Math.round(distance),
          status: territory.status,
          photo: '/images/default-dojo.jpg',
          latitude: coords.lat,
          longitude: coords.lng
        };
      })
      .filter(dojo => dojo.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);

    logger.info(`Found ${candidates.length} dojo candidates near (${latitude}, ${longitude})`);

    res.json({
      success: true,
      data: candidates
    });

  } catch (error) {
    logger.error('Error fetching dojo candidates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dojo candidates'
    });
  }
});

/**
 * POST /api/dojo/nominate
 * Nominate a new dojo (triggers Sales AI pipeline)
 */
router.post('/nominate', validateDojoNomination, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, address, latitude, longitude, description, contactInfo } = req.body;

    // Create nomination record
    const nomination = await prisma.nomination.create({
      data: {
        playerId: req.user?.id || 'anonymous',
        name,
        address,
        latitude,
        longitude,
        description,
        contactInfo,
        status: 'pending_community_verification'
      }
    });

    // Create territory (dojo) record
    const newDojo = await prisma.territory.create({
      data: {
        name,
        description: address,
        coordinates: JSON.stringify({ lat: latitude, lng: longitude }),
        requiredNFT: `dojo_${Date.now()}`,
        status: 'pending_verification',
        venueOwnerId: null
      }
    });

    logger.info(`New dojo nominated: ${name} at (${latitude}, ${longitude})`);

    // TODO: Trigger Sales AI pipeline
    // await triggerSalesAIPipeline(newDojo);

    res.status(201).json({
      success: true,
      message: 'Dojo nomination submitted successfully',
      data: {
        dojoId: newDojo.id,
        status: newDojo.status
      }
    });

  } catch (error) {
    logger.error('Error nominating dojo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to nominate dojo'
    });
  }
});

/**
 * POST /api/player/setHomeDojo
 * Set player's home dojo
 */
router.post('/setHomeDojo', validateHomeDojo, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { dojoId } = req.body;
    const userId = req.user?.id || 'anonymous';

    // Update user's home dojo
    await prisma.user.update({
      where: { id: userId },
      data: { homeDojoId: dojoId }
    });

    logger.info(`Player ${userId} set home dojo to ${dojoId}`);

    res.json({
      success: true,
      message: 'Home dojo set successfully'
    });

  } catch (error) {
    logger.error('Error setting home dojo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set home dojo'
    });
  }
});

/**
 * GET /api/player/homeDojo
 * Get player's current home dojo
 */
router.get('/homeDojo', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || 'anonymous';

    // Get user with home dojo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { homeDojo: true }
    });

    if (!user?.homeDojo) {
      return res.json({
        success: true,
        data: null
      });
    }

    const coords = JSON.parse(user.homeDojo.coordinates);
    const homeDojo = {
      id: user.homeDojo.id,
      name: user.homeDojo.name,
      address: user.homeDojo.description || 'Address not available',
      status: user.homeDojo.status,
      photo: '/images/default-dojo.jpg',
      latitude: coords.lat,
      longitude: coords.lng
    };

    res.json({
      success: true,
      data: homeDojo
    });

  } catch (error) {
    logger.error('Error fetching home dojo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home dojo'
    });
  }
});

/**
 * GET /api/dojo/:id/leaderboard
 * Get dojo leaderboard (Top Ten players)
 */
router.get('/:id/leaderboard', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Get from database
    const leaderboard = mockDojoLeaderboards[id] || [];

    res.json({
      success: true,
      data: {
        dojoId: id,
        players: leaderboard
      }
    });

  } catch (error) {
    logger.error('Error fetching dojo leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dojo leaderboard'
    });
  }
});

/**
 * GET /api/dojo/:id
 * Get dojo details by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const dojo = await prisma.territory.findUnique({
      where: { id }
    });

    if (!dojo) {
      return res.status(404).json({
        success: false,
        message: 'Dojo not found'
      });
    }

    const coords = JSON.parse(dojo.coordinates);
    const dojoData = {
      id: dojo.id,
      name: dojo.name,
      address: dojo.description || 'Address not available',
      status: dojo.status,
      photo: '/images/default-dojo.jpg',
      latitude: coords.lat,
      longitude: coords.lng
    };

    res.json({
      success: true,
      data: dojoData
    });

  } catch (error) {
    logger.error('Error fetching dojo details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dojo details'
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export default router; 