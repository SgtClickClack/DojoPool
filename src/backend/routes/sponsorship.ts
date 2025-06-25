import { Router } from 'express';
import { SponsorshipService } from '../services/database/SponsorshipService';
import { SponsorshipBracketService } from '../services/sponsorship/SponsorshipBracketService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createBracketSchema = z.object({
  bracketId: z.string().min(1),
  sponsorName: z.string().min(1),
  sponsorLogo: z.string().url().optional(),
  inGameTitle: z.string().min(1),
  requiredLevel: z.number().min(1),
  narrativeIntro: z.string().min(1),
  narrativeOutro: z.string().min(1),
  challenges: z.array(z.object({
    challengeId: z.string(),
    description: z.string(),
    type: z.enum(['game_win', 'trick_shot', 'streak', 'tournament', 'level_reach', 'venue_capture']),
    requirement: z.object({
      count: z.number().optional(),
      streak: z.number().optional(),
      level: z.number().optional(),
      venue_type: z.string().optional(),
      difficulty: z.string().optional(),
    }),
    isCompleted: z.boolean().default(false),
    maxProgress: z.number().optional(),
  })),
  digitalReward: z.object({
    itemName: z.string(),
    itemDescription: z.string(),
    itemAssetUrl: z.string().optional(),
    type: z.enum(['cue', 'title', 'avatar_item', 'boost', 'currency']),
    value: z.number().optional(),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  }),
  physicalReward: z.object({
    rewardName: z.string(),
    rewardDescription: z.string(),
    redemptionInstructions: z.string(),
    estimatedValue: z.number().optional(),
    isRedeemed: z.boolean().default(false),
    redemptionDeadline: z.string().optional(),
  }),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxParticipants: z.number().optional(),
});

const updateChallengeProgressSchema = z.object({
  challengeId: z.string(),
  progress: z.number(),
  isCompleted: z.boolean().optional(),
});

// Public endpoints - Get available brackets
router.get('/brackets', async (req, res) => {
  try {
    const brackets = await SponsorshipService.getActiveBrackets();
    res.json({ success: true, data: brackets });
  } catch (error) {
    console.error('Error fetching brackets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch brackets' });
  }
});

router.get('/brackets/:bracketId', async (req, res) => {
  try {
    const { bracketId } = req.params;
    const bracket = await SponsorshipService.getBracket(bracketId);
    
    if (!bracket) {
      return res.status(404).json({ success: false, error: 'Bracket not found' });
    }
    
    res.json({ success: true, data: bracket });
  } catch (error) {
    console.error('Error fetching bracket:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bracket' });
  }
});

// Player endpoints - Require authentication
router.get('/player/progress', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const progress = await SponsorshipService.getPlayerProgress(playerId);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error fetching player progress:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

router.get('/player/stats', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const stats = await SponsorshipService.getPlayerStats(playerId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

router.post('/player/unlock/:bracketId', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const { bracketId } = req.params;
    
    // Check if bracket exists and is eligible
    const bracket = await SponsorshipService.getBracket(bracketId);
    if (!bracket) {
      return res.status(404).json({ success: false, error: 'Bracket not found' });
    }
    
    // Check if already unlocked
    const existingProgress = await SponsorshipService.getPlayerBracketProgress(playerId, bracketId);
    if (existingProgress) {
      return res.status(400).json({ success: false, error: 'Bracket already unlocked' });
    }
    
    // Unlock the bracket
    const progress = await SponsorshipService.unlockBracket(playerId, bracketId, bracket.inGameTitle);
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Error unlocking bracket:', error);
    res.status(500).json({ success: false, error: 'Failed to unlock bracket' });
  }
});

router.put('/player/challenge/:bracketId', 
  authenticateToken, 
  validateRequest(updateChallengeProgressSchema), 
  async (req, res) => {
    try {
      const playerId = req.user.id;
      const { bracketId } = req.params;
      const { challengeId, progress, isCompleted = false } = req.body;
      
      const updatedProgress = await SponsorshipService.updateChallengeProgress(
        playerId, 
        bracketId, 
        challengeId, 
        progress, 
        isCompleted
      );
      
      res.json({ success: true, data: updatedProgress });
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      res.status(500).json({ success: false, error: 'Failed to update progress' });
    }
  }
);

router.post('/player/claim-digital/:bracketId', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const { bracketId } = req.params;
    
    // Check if bracket is completed
    const progress = await SponsorshipService.getPlayerBracketProgress(playerId, bracketId);
    if (!progress || progress.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Bracket must be completed to claim digital reward' 
      });
    }
    
    if (progress.digitalRewardClaimed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Digital reward already claimed' 
      });
    }
    
    const updatedProgress = await SponsorshipService.claimDigitalReward(playerId, bracketId);
    res.json({ success: true, data: updatedProgress });
  } catch (error) {
    console.error('Error claiming digital reward:', error);
    res.status(500).json({ success: false, error: 'Failed to claim reward' });
  }
});

router.post('/player/redeem-physical/:bracketId', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const { bracketId } = req.params;
    
    // Check if bracket is completed
    const progress = await SponsorshipService.getPlayerBracketProgress(playerId, bracketId);
    if (!progress || progress.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Bracket must be completed to redeem physical reward' 
      });
    }
    
    if (progress.physicalRewardRedeemed) {
      return res.status(400).json({ 
        success: false, 
        error: 'Physical reward already redeemed' 
      });
    }
    
    // Generate redemption code using Firebase service
    const redemptionCode = await SponsorshipBracketService.generateRedemptionCode(playerId, bracketId);
    
    res.json({ 
      success: true, 
      data: { 
        redemptionCode,
        message: 'Redemption code generated. Check your email for instructions.' 
      } 
    });
  } catch (error) {
    console.error('Error redeeming physical reward:', error);
    res.status(500).json({ success: false, error: 'Failed to redeem reward' });
  }
});

// Game event processing endpoint
router.post('/events/process', authenticateToken, async (req, res) => {
  try {
    const playerId = req.user.id;
    const { eventType, eventData } = req.body;
    
    // Process the game event
    await SponsorshipBracketService.processGameEvent(playerId, eventType, eventData);
    
    res.json({ success: true, message: 'Event processed successfully' });
  } catch (error) {
    console.error('Error processing game event:', error);
    res.status(500).json({ success: false, error: 'Failed to process event' });
  }
});

// Admin endpoints - Require admin authentication
router.post('/admin/brackets', 
  authenticateToken, 
  validateRequest(createBracketSchema), 
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
      }
      
      const bracket = await SponsorshipService.createBracket(req.body);
      res.status(201).json({ success: true, data: bracket });
    } catch (error) {
      console.error('Error creating bracket:', error);
      res.status(500).json({ success: false, error: 'Failed to create bracket' });
    }
  }
);

router.put('/admin/brackets/:bracketId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { bracketId } = req.params;
    const updates = req.body;
    
    const bracket = await SponsorshipService.updateBracket(bracketId, updates);
    res.json({ success: true, data: bracket });
  } catch (error) {
    console.error('Error updating bracket:', error);
    res.status(500).json({ success: false, error: 'Failed to update bracket' });
  }
});

router.delete('/admin/brackets/:bracketId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { bracketId } = req.params;
    const bracket = await SponsorshipService.deactivateBracket(bracketId);
    res.json({ success: true, data: bracket });
  } catch (error) {
    console.error('Error deactivating bracket:', error);
    res.status(500).json({ success: false, error: 'Failed to deactivate bracket' });
  }
});

router.get('/admin/analytics/:bracketId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    const { bracketId } = req.params;
    const analytics = await SponsorshipService.getBracketAnalytics(bracketId);
    
    if (!analytics) {
      return res.status(404).json({ success: false, error: 'Bracket not found' });
    }
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;