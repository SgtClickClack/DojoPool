import { Router, Request, Response } from 'express';
import { VenueCustomizationService, VenueCustomizationOptions, GeneratedVenueAttributes } from '../services/venue/VenueCustomizationService';
import { logger } from '../utils/logger';

const router = Router();
const venueCustomizationService = new VenueCustomizationService();

/**
 * Generate venue customization preview
 * POST /api/venue-customization/preview
 */
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const options: VenueCustomizationOptions = req.body;
    
    // Validate required fields
    if (!options.venueName || !options.location || !options.venueType || !options.atmosphere || !options.targetAudience) {
      return res.status(400).json({
        error: 'Missing required fields: venueName, location, venueType, atmosphere, targetAudience'
      });
    }

    logger.info('Generating venue customization preview', {
      venueName: options.venueName,
      venueType: options.venueType,
      atmosphere: options.atmosphere
    });

    const customization = await venueCustomizationService.generatePreview(options);
    
    res.json({
      success: true,
      customization
    });
  } catch (error) {
    logger.error('Error generating venue customization preview', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body
    });
    
    res.status(500).json({
      error: 'Failed to generate venue customization preview'
    });
  }
});

/**
 * Apply venue customization
 * PUT /api/venues/:venueId/customization
 */
router.put('/:venueId/customization', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const customization: GeneratedVenueAttributes = req.body;
    
    if (!venueId) {
      return res.status(400).json({
        error: 'Venue ID is required'
      });
    }

    logger.info('Applying venue customization', {
      venueId,
      customizationType: 'full'
    });

    await venueCustomizationService.applyCustomization(venueId, customization);
    
    res.json({
      success: true,
      message: 'Venue customization applied successfully'
    });
  } catch (error) {
    logger.error('Error applying venue customization', {
      error: error instanceof Error ? error.message : String(error),
      venueId: req.params.venueId,
      body: req.body
    });
    
    res.status(500).json({
      error: 'Failed to apply venue customization'
    });
  }
});

/**
 * Generate and apply venue customization in one step
 * POST /api/venues/:venueId/customization/generate
 */
router.post('/:venueId/customization/generate', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    const options: VenueCustomizationOptions = req.body;
    
    if (!venueId) {
      return res.status(400).json({
        error: 'Venue ID is required'
      });
    }

    // Validate required fields
    if (!options.venueName || !options.location || !options.venueType || !options.atmosphere || !options.targetAudience) {
      return res.status(400).json({
        error: 'Missing required fields: venueName, location, venueType, atmosphere, targetAudience'
      });
    }

    logger.info('Generating and applying venue customization', {
      venueId,
      venueName: options.venueName,
      venueType: options.venueType
    });

    // Generate customization
    const customization = await venueCustomizationService.generateVenueCustomization(options);
    
    // Apply customization
    await venueCustomizationService.applyCustomization(venueId, customization);
    
    res.json({
      success: true,
      message: 'Venue customization generated and applied successfully',
      customization
    });
  } catch (error) {
    logger.error('Error generating and applying venue customization', {
      error: error instanceof Error ? error.message : String(error),
      venueId: req.params.venueId,
      body: req.body
    });
    
    res.status(500).json({
      error: 'Failed to generate and apply venue customization'
    });
  }
});

/**
 * Get venue customization
 * GET /api/venues/:venueId/customization
 */
router.get('/:venueId/customization', async (req: Request, res: Response) => {
  try {
    const { venueId } = req.params;
    
    if (!venueId) {
      return res.status(400).json({
        error: 'Venue ID is required'
      });
    }

    logger.info('Fetching venue customization', {
      venueId
    });

    // TODO: Implement database retrieval of venue customization
    // For now, return a placeholder response
    res.json({
      success: true,
      customization: {
        theme: {
          primaryColor: '#2196F3',
          secondaryColor: '#FF9800',
          accentColor: '#4CAF50',
          fontFamily: 'Orbitron, sans-serif',
          visualStyle: 'Modern gaming aesthetic'
        },
        branding: {
          tagline: 'Where Legends Play',
          description: 'A premier gaming destination for pool enthusiasts.',
          missionStatement: 'To create an inclusive community where players can compete, connect, and grow.',
          uniqueSellingPoints: [
            'Advanced AI-powered game tracking',
            'Community-driven tournaments',
            'Professional-grade equipment'
          ]
        },
        atmosphere: {
          mood: 'Energetic and competitive',
          lighting: 'Dynamic LED lighting system',
          music: 'Upbeat gaming and electronic music',
          decor: 'Modern gaming aesthetic with neon accents',
          vibe: 'High-energy competitive atmosphere'
        },
        features: {
          amenities: [
            'Professional pool tables',
            'High-speed WiFi',
            'Comfortable seating areas',
            'Refreshment bar',
            'Tournament viewing screens'
          ],
          specialServices: [
            'AI-powered game analysis',
            'Personalized coaching sessions',
            'Tournament organization',
            'Equipment rental',
            'Private event hosting'
          ],
          uniqueExperiences: [
            'Real-time performance tracking',
            'Community leaderboards',
            'Achievement system',
            'Social gaming features',
            'Exclusive member benefits'
          ]
        },
        story: {
          origin: 'Founded by passionate pool enthusiasts who wanted to create a modern gaming experience.',
          community: 'A hub for local players, hosting regular tournaments and community events.',
          achievements: 'Recognized for excellence in tournament organization and player development.',
          future: 'Expanding to become the premier destination for competitive pool gaming.'
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching venue customization', {
      error: error instanceof Error ? error.message : String(error),
      venueId: req.params.venueId
    });
    
    res.status(500).json({
      error: 'Failed to fetch venue customization'
    });
  }
});

export default router; 