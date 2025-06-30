import axios from 'axios';

export interface ScanData {
  id: string;
  userId: string;
  platform: 'ios' | 'android';
  scanType: 'arkit' | 'arcore' | 'photogrammetry';
  meshData: ArrayBuffer;
  textureData?: ArrayBuffer;
  metadata: {
    deviceInfo: string;
    scanQuality: number;
    timestamp: string;
    facePoints?: number[];
    bodyMeasurements?: Record<string, number>;
  };
}

export interface BaseMesh {
  id: string;
  vertices: Float32Array;
  faces: Uint32Array;
  uvMapping: Float32Array;
  textureUrl: string;
  status: 'processing' | 'ready' | 'failed';
}

export interface ClothingItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessory';
  meshUrl: string;
  textureUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  previewUrl: string;
  metadata: {
    tags: string[];
    storyContext?: string;
  };
}

export interface AvatarAsset {
  id: string;
  userId: string;
  baseMeshId: string;
  clothingItems: string[];
  finalAssetUrl: string;
  status: 'generating' | 'ready' | 'failed';
  optimizations: {
    dracoCompressed: boolean;
    ktx2Textures: boolean;
    fileSizeKB: number;
  };
}

class AvatarCreationService {
  private readonly baseUrl = process.env.REACT_APP_AVATAR_API_URL || 'http://localhost:8080/api/avatar';

  // Phase 1: iOS ARKit Scanning
  async initializeARKitScanning(userId: string): Promise<{ sessionId: string }> {
    const response = await axios.post(`${this.baseUrl}/scan/arkit/init`, {
      userId,
      platform: 'ios'
    });
    return response.data;
  }

  async submitARKitScan(sessionId: string, scanData: {
    usdz: ArrayBuffer;
    metadata: ScanData['metadata'];
  }): Promise<{ scanId: string }> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('usdz', new Blob([scanData.usdz]));
    formData.append('metadata', JSON.stringify(scanData.metadata));

    const response = await axios.post(`${this.baseUrl}/scan/arkit/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Phase 1: Android ARCore Scanning
  async initializeARCoreScanning(userId: string): Promise<{ sessionId: string }> {
    const response = await axios.post(`${this.baseUrl}/scan/arcore/init`, {
      userId,
      platform: 'android'
    });
    return response.data;
  }

  async submitARCoreScan(sessionId: string, scanData: {
    depthData: ArrayBuffer;
    rgbImages: ArrayBuffer[];
    cameraIntrinsics: number[];
    metadata: ScanData['metadata'];
  }): Promise<{ scanId: string }> {
    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('depthData', new Blob([scanData.depthData]));
    
    scanData.rgbImages.forEach((image, index) => {
      formData.append(`rgbImage_${index}`, new Blob([image]));
    });
    
    formData.append('cameraIntrinsics', JSON.stringify(scanData.cameraIntrinsics));
    formData.append('metadata', JSON.stringify(scanData.metadata));

    const response = await axios.post(`${this.baseUrl}/scan/arcore/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Phase 1: Photogrammetry Fallback
  async submitPhotogrammetryScan(userId: string, images: ArrayBuffer[]): Promise<{ scanId: string }> {
    const formData = new FormData();
    formData.append('userId', userId);
    
    images.forEach((image, index) => {
      formData.append(`image_${index}`, new Blob([image]));
    });

    const response = await axios.post(`${this.baseUrl}/scan/photogrammetry/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  // Phase 1: Base Mesh Processing
  async getBaseMeshStatus(scanId: string): Promise<BaseMesh> {
    const response = await axios.get(`${this.baseUrl}/mesh/${scanId}`);
    return response.data;
  }

  async requestBaseMeshFitting(scanId: string): Promise<{ fitJobId: string }> {
    const response = await axios.post(`${this.baseUrl}/mesh/${scanId}/fit`);
    return response.data;
  }

  // Phase 1: Wardrobe System
  async getAvailableClothing(): Promise<ClothingItem[]> {
    const response = await axios.get(`${this.baseUrl}/wardrobe/items`);
    return response.data;
  }

  async getClothingItem(itemId: string): Promise<ClothingItem> {
    const response = await axios.get(`${this.baseUrl}/wardrobe/items/${itemId}`);
    return response.data;
  }

  // Phase 1: Avatar Assembly
  async createAvatar(request: {
    baseMeshId: string;
    clothingItems: string[];
    userId: string;
  }): Promise<{ avatarId: string }> {
    const response = await axios.post(`${this.baseUrl}/create`, request);
    return response.data;
  }

  async getAvatarStatus(avatarId: string): Promise<AvatarAsset> {
    const response = await axios.get(`${this.baseUrl}/avatar/${avatarId}`);
    return response.data;
  }

  async getOptimizedAvatar(avatarId: string): Promise<ArrayBuffer> {
    const response = await axios.get(`${this.baseUrl}/avatar/${avatarId}/download`, {
      responseType: 'arraybuffer'
    });
    return response.data;
  }

  // Phase 1: Asset Delivery
  async preloadAvatarAssets(avatarId: string): Promise<void> {
    await axios.post(`${this.baseUrl}/avatar/${avatarId}/preload`);
  }

  // Utility Methods
  async validateScanQuality(scanData: Partial<ScanData>): Promise<{
    isValid: boolean;
    quality: number;
    issues: string[];
  }> {
    const response = await axios.post(`${this.baseUrl}/validate`, scanData);
    return response.data;
  }

  async getScanningGuidelines(platform: 'ios' | 'android'): Promise<{
    steps: string[];
    tips: string[];
    requirements: Record<string, any>;
  }> {
    const response = await axios.get(`${this.baseUrl}/guidelines/${platform}`);
    return response.data;
  }
}

export default new AvatarCreationService();