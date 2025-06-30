import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import AvatarProcessingService from '../services/AvatarProcessingService';
import WardrobeService from '../services/WardrobeService';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Phase 1: iOS ARKit Scanning Routes
router.post('/scan/arkit/init', async (req, res) => {
  try {
    const { userId, platform } = req.body;
    const sessionId = uuidv4();
    
    const session = await AvatarProcessingService.initializeScanSession({
      sessionId,
      userId,
      platform: 'ios',
      scanType: 'arkit',
      createdAt: new Date()
    });

    res.json({ sessionId: session.sessionId });
  } catch (error) {
    console.error('ARKit initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize ARKit scanning session' });
  }
});

router.post('/scan/arkit/submit', async (req, res) => {
  try {
    const { sessionId, metadata, usdzDataBase64 } = req.body;

    if (!usdzDataBase64) {
      return res.status(400).json({ error: 'No USDZ data provided' });
    }

    // Convert base64 to ArrayBuffer for processing
    const usdzData = new ArrayBuffer(Buffer.from(usdzDataBase64, 'base64').length);
    
    const scanResult = await AvatarProcessingService.processARKitScan({
      sessionId,
      usdzData,
      metadata
    });

    res.json({ scanId: scanResult.scanId });
  } catch (error) {
    console.error('ARKit scan submission error:', error);
    res.status(500).json({ error: 'Failed to process ARKit scan' });
  }
});

// Phase 1: Android ARCore Scanning Routes
router.post('/scan/arcore/init', async (req, res) => {
  try {
    const { userId, platform } = req.body;
    const sessionId = uuidv4();
    
    const session = await AvatarProcessingService.initializeScanSession({
      sessionId,
      userId,
      platform: 'android',
      scanType: 'arcore',
      createdAt: new Date()
    });

    res.json({ sessionId: session.sessionId });
  } catch (error) {
    console.error('ARCore initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize ARCore scanning session' });
  }
});

router.post('/scan/arcore/submit', async (req, res) => {
  try {
    const { sessionId, metadata, cameraIntrinsics, depthDataBase64, rgbImagesBase64 } = req.body;
    
    if (!depthDataBase64 || !rgbImagesBase64 || rgbImagesBase64.length === 0) {
      return res.status(400).json({ error: 'Missing depth data or RGB images' });
    }

    // Convert base64 data to ArrayBuffers
    const depthData = new ArrayBuffer(Buffer.from(depthDataBase64, 'base64').length);
    const rgbImages = rgbImagesBase64.map((imageBase64: string) => 
      new ArrayBuffer(Buffer.from(imageBase64, 'base64').length)
    );

    const scanResult = await AvatarProcessingService.processARCoreScan({
      sessionId,
      depthData,
      rgbImages,
      cameraIntrinsics,
      metadata
    });

    res.json({ scanId: scanResult.scanId });
  } catch (error) {
    console.error('ARCore scan submission error:', error);
    res.status(500).json({ error: 'Failed to process ARCore scan' });
  }
});

// Phase 1: Photogrammetry Fallback Route
router.post('/scan/photogrammetry/submit', async (req, res) => {
  try {
    const { userId, imagesBase64 } = req.body;

    if (!imagesBase64 || imagesBase64.length < 8) {
      return res.status(400).json({ error: 'Minimum 8 images required for photogrammetry' });
    }

    // Convert base64 images to ArrayBuffers
    const images = imagesBase64.map((imageBase64: string) => 
      new ArrayBuffer(Buffer.from(imageBase64, 'base64').length)
    );

    const scanResult = await AvatarProcessingService.processPhotogrammetryScan({
      userId,
      images,
      metadata: {
        imageCount: images.length,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ scanId: scanResult.scanId });
  } catch (error) {
    console.error('Photogrammetry scan error:', error);
    res.status(500).json({ error: 'Failed to process photogrammetry scan' });
  }
});

// Phase 1: Base Mesh Processing Routes
router.get('/mesh/:scanId', async (req, res) => {
  try {
    const { scanId } = req.params;
    const baseMesh = await AvatarProcessingService.getBaseMeshStatus(scanId);
    res.json(baseMesh);
  } catch (error) {
    console.error('Base mesh status error:', error);
    res.status(500).json({ error: 'Failed to get base mesh status' });
  }
});

router.post('/mesh/:scanId/fit', async (req, res) => {
  try {
    const { scanId } = req.params;
    const fitJob = await AvatarProcessingService.startBaseMeshFitting(scanId);
    res.json({ fitJobId: fitJob.jobId });
  } catch (error) {
    console.error('Base mesh fitting error:', error);
    res.status(500).json({ error: 'Failed to start base mesh fitting' });
  }
});

// Phase 1: Wardrobe System Routes
router.get('/wardrobe/items', async (req, res) => {
  try {
    const clothingItems = await WardrobeService.getAvailableClothing();
    res.json(clothingItems);
  } catch (error) {
    console.error('Wardrobe items error:', error);
    res.status(500).json({ error: 'Failed to get clothing items' });
  }
});

router.get('/wardrobe/items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const clothingItem = await WardrobeService.getClothingItem(itemId);
    res.json(clothingItem);
  } catch (error) {
    console.error('Clothing item error:', error);
    res.status(500).json({ error: 'Failed to get clothing item' });
  }
});

// Phase 1: Avatar Creation Routes
router.post('/create', async (req, res) => {
  try {
    const { baseMeshId, clothingItems, userId } = req.body;
    
    const avatar = await AvatarProcessingService.createAvatar({
      baseMeshId,
      clothingItems,
      userId
    });

    res.json({ avatarId: avatar.avatarId });
  } catch (error) {
    console.error('Avatar creation error:', error);
    res.status(500).json({ error: 'Failed to create avatar' });
  }
});

router.get('/avatar/:avatarId', async (req, res) => {
  try {
    const { avatarId } = req.params;
    const avatar = await AvatarProcessingService.getAvatarStatus(avatarId);
    res.json(avatar);
  } catch (error) {
    console.error('Avatar status error:', error);
    res.status(500).json({ error: 'Failed to get avatar status' });
  }
});

router.get('/avatar/:avatarId/download', async (req, res) => {
  try {
    const { avatarId } = req.params;
    const avatarData = await AvatarProcessingService.getOptimizedAvatar(avatarId);
    
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Content-Disposition', `attachment; filename="avatar_${avatarId}.glb"`);
    res.send(Buffer.from(avatarData));
  } catch (error) {
    console.error('Avatar download error:', error);
    res.status(500).json({ error: 'Failed to download avatar' });
  }
});

// Phase 1: Asset Preloading
router.post('/avatar/:avatarId/preload', async (req, res) => {
  try {
    const { avatarId } = req.params;
    await AvatarProcessingService.preloadAvatarAssets(avatarId);
    res.json({ status: 'preload initiated' });
  } catch (error) {
    console.error('Avatar preload error:', error);
    res.status(500).json({ error: 'Failed to preload avatar assets' });
  }
});

// Utility Routes
router.post('/validate', async (req, res) => {
  try {
    const scanData = req.body;
    const validation = await AvatarProcessingService.validateScanQuality(scanData);
    res.json(validation);
  } catch (error) {
    console.error('Scan validation error:', error);
    res.status(500).json({ error: 'Failed to validate scan' });
  }
});

router.get('/guidelines/:platform', async (req, res) => {
  try {
    const { platform } = req.params;
    const guidelines = await AvatarProcessingService.getScanningGuidelines(platform as 'ios' | 'android');
    res.json(guidelines);
  } catch (error) {
    console.error('Guidelines error:', error);
    res.status(500).json({ error: 'Failed to get scanning guidelines' });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'avatar-creation',
    timestamp: new Date().toISOString()
  });
});

export default router;