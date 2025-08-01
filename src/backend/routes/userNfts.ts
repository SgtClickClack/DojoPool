import express, { Router } from 'express';
import { param, validationResult } from 'express-validator';

const router = Router();

// NFT interface
interface UserNFT {
  id: string;
  tokenId: string;
  name: string;
  description: string;
  imageUrl: string;
  metadata: Record<string, any>;
  acquiredAt: string;
  territoryId?: string;
}

const mockUserNFTs: Record<string, UserNFT[]> = {
  user_001: [
    {
      id: 'nft_001',
      tokenId: 'dojo_nft_downtown',
      name: 'Downtown Dojo Trophy',
      description: 'NFT trophy for controlling Downtown District territory',
      imageUrl: '/images/nfts/downtown-trophy.png',
      metadata: {
        rarity: 'rare',
        territory: 'downtown',
        power: 85,
      },
      acquiredAt: '2024-01-15T10:30:00Z',
      territoryId: 'downtown',
    },
    {
      id: 'nft_002',
      tokenId: 'dojo_nft_beachfront',
      name: 'Beachfront Dojo Trophy',
      description: 'NFT trophy for controlling Beachfront territory',
      imageUrl: '/images/nfts/beachfront-trophy.png',
      metadata: {
        rarity: 'common',
        territory: 'beachfront',
        power: 60,
      },
      acquiredAt: '2024-01-20T14:15:00Z',
      territoryId: 'beachfront',
    },
  ],
  user_002: [
    {
      id: 'nft_003',
      tokenId: 'dojo_nft_beachfront',
      name: 'Beachfront Dojo Trophy',
      description: 'NFT trophy for controlling Beachfront territory',
      imageUrl: '/images/nfts/beachfront-trophy.png',
      metadata: {
        rarity: 'common',
        territory: 'beachfront',
        power: 60,
      },
      acquiredAt: '2024-01-18T09:45:00Z',
      territoryId: 'beachfront',
    },
  ],
};

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: Function) => {
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

// GET /user-nfts/:userId - Get user's NFTs
router.get('/user-nfts/:userId',
  param('userId').isString().notEmpty().withMessage('User ID is required'),
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { territory, rarity } = req.query;
      
      let userNFTs = mockUserNFTs[userId] || [];
      
      // Filter by territory if specified
      if (territory) {
        userNFTs = userNFTs.filter(nft => nft.metadata.territory === territory);
      }
      
      // Filter by rarity if specified
      if (rarity) {
        userNFTs = userNFTs.filter(nft => nft.metadata.rarity === rarity);
      }

      res.json({
        success: true,
        data: userNFTs,
        count: userNFTs.length,
        userId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch user NFTs',
      });
    }
  }
);

// GET /user-nfts/:userId/:nftId - Get specific NFT
router.get('/user-nfts/:userId/:nftId',
  [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
    param('nftId').isString().notEmpty().withMessage('NFT ID is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId, nftId } = req.params;
      const userNFTs = mockUserNFTs[userId] || [];
      const nft = userNFTs.find(n => n.id === nftId);
      
      if (!nft) {
        return res.status(404).json({
          success: false,
          error: 'NFT not found',
          message: `NFT with ID '${nftId}' not found for user '${userId}'`,
        });
      }

      res.json({
        success: true,
        data: nft,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching NFT:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch NFT',
      });
    }
  }
);

// POST /user-nfts/:userId - Mint new NFT (for territory conquest)
router.post('/user-nfts/:userId',
  [
    param('userId').isString().notEmpty().withMessage('User ID is required'),
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { tokenId, territoryId, name, description } = req.body;
      
      if (!tokenId || !territoryId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'tokenId and territoryId are required',
        });
      }

      // Check if user already owns this NFT
      const userNFTs = mockUserNFTs[userId] || [];
      const existingNFT = userNFTs.find(n => n.tokenId === tokenId);
      if (existingNFT) {
        return res.status(409).json({
          success: false,
          error: 'NFT already owned',
          message: `User already owns NFT '${tokenId}'`,
        });
      }

      const newNFT: UserNFT = {
        id: `nft_${Date.now()}`,
        tokenId,
        name: name || `${territoryId} Dojo Trophy`,
        description: description || `NFT trophy for controlling ${territoryId} territory`,
        imageUrl: `/images/nfts/${territoryId}-trophy.png`,
        metadata: {
          rarity: 'common',
          territory: territoryId,
          power: Math.floor(Math.random() * 40) + 60, // Random power between 60-100
        },
        acquiredAt: new Date().toISOString(),
        territoryId,
      };

      if (!mockUserNFTs[userId]) {
        mockUserNFTs[userId] = [];
      }
      mockUserNFTs[userId].push(newNFT);

      res.status(201).json({
        success: true,
        data: newNFT,
        message: 'NFT minted successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error minting NFT:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to mint NFT',
      });
    }
  }
);

export default router; 


