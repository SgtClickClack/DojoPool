import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Territory interface
interface Territory {
  id: string;
  name: string;
  coordinates: Array<{ lat: number; lng: number }>;
  owner: string | null;
  clan: string | null;
  requiredNFT: string;
  influence: number;
  description?: string;
}

const mockTerritories: Territory[] = [
  {
    id: 'territory-1',
    name: 'Test Territory 1',
    coordinates: [
      { lat: -27.4698, lng: 153.0251 },
      { lat: -27.4698, lng: 153.0351 },
      { lat: -27.4798, lng: 153.0351 },
      { lat: -27.4798, lng: 153.0251 },
    ],
    owner: 'user-1',
    clan: 'Test Clan',
    requiredNFT: 'dojo_nft_test',
    influence: 50,
    description: 'Test territory for integration tests',
  },
  {
    id: 'downtown',
    name: 'Downtown District',
    coordinates: [
      { lat: -27.4698, lng: 153.0251 },
      { lat: -27.4698, lng: 153.0351 },
      { lat: -27.4798, lng: 153.0351 },
      { lat: -27.4798, lng: 153.0251 },
    ],
    owner: 'user_001',
    clan: 'Red Dragons',
    requiredNFT: 'dojo_nft_downtown',
    influence: 85,
    description: 'Downtown Dojo territory with high strategic value',
  },
  {
    id: 'beachfront',
    name: 'Beachfront',
    coordinates: [
      { lat: -27.4700, lng: 153.0400 },
      { lat: -27.4700, lng: 153.0500 },
      { lat: -27.4800, lng: 153.0500 },
      { lat: -27.4800, lng: 153.0400 },
    ],
    owner: null,
    clan: null,
    requiredNFT: 'dojo_nft_beachfront',
    influence: 0,
    description: 'Beachfront Dojo territory - currently unclaimed',
  },
];

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

// GET /territories - Get all territories
router.get('/territories', async (req: Request, res: Response) => {
  try {
    // Add query parameters for filtering
    const { owner, clan, unlocked } = req.query;
    
    let filteredTerritories = [...mockTerritories];
    
    if (owner) {
      filteredTerritories = filteredTerritories.filter(t => t.owner === owner);
    }
    
    if (clan) {
      filteredTerritories = filteredTerritories.filter(t => t.clan === clan);
    }
    
    if (unlocked === 'true') {
      filteredTerritories = filteredTerritories.filter(t => t.owner !== null);
    } else if (unlocked === 'false') {
      filteredTerritories = filteredTerritories.filter(t => t.owner === null);
    }

    res.json(filteredTerritories);
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch territories',
    });
  }
});

// GET /territories/:id - Get specific territory
router.get('/territories/:id', 
  param('id').isString().notEmpty().withMessage('Territory ID is required'),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const territory = mockTerritories.find(t => t.id === id);
      
      if (!territory) {
        return res.status(404).json({
          success: false,
          error: 'Territory not found',
          message: `Territory with ID '${id}' does not exist`,
        });
      }

      res.json(territory);
    } catch (error) {
      console.error('Error fetching territory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch territory',
      });
    }
  }
);

// POST /territories - Create new territory (admin only)
router.post('/territories',
  [
    body('name').isString().notEmpty().withMessage('Territory name is required'),
    body('coordinates').isArray({ min: 3 }).withMessage('At least 3 coordinates required'),
    body('requiredNFT').isString().notEmpty().withMessage('Required NFT is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { name, coordinates, requiredNFT, description } = req.body;
      
      // Check if territory already exists
      const existingTerritory = mockTerritories.find(t => t.name === name);
      if (existingTerritory) {
        return res.status(409).json({
          success: false,
          error: 'Territory already exists',
          message: `Territory '${name}' already exists`,
        });
      }

      const newTerritory: Territory = {
        id: `territory_${Date.now()}`,
        name,
        coordinates,
        owner: null,
        clan: null,
        requiredNFT,
        influence: 0,
        description,
      };

      mockTerritories.push(newTerritory);

      res.status(201).json({
        success: true,
        data: newTerritory,
        message: 'Territory created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating territory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create territory',
      });
    }
  }
);

export default router; 