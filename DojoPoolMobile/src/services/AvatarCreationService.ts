export interface ScanData {
  id: string;
  userId: string;
  platform: 'ios' | 'android';
  scanType: 'arkit' | 'arcore' | 'photogrammetry';
  metadata: {
    deviceInfo: string;
    scanQuality: number;
    timestamp: string;
    facePoints?: number[];
    bodyMeasurements?: Record<string, number>;
  };
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
  description: string;
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
  private readonly baseUrl = __DEV__
    ? 'http://localhost:8080/api/avatar'
    : 'https://api.dojopool.com/api/avatar';

  // Phase 1: iOS ARKit Scanning
  async initializeARKitScanning(
    userId: string
  ): Promise<{ sessionId: string }> {
    const response = await fetch(`${this.baseUrl}/scan/arkit/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        platform: 'ios',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize ARKit scanning');
    }

    return response.json();
  }

  async submitARKitScan(
    sessionId: string,
    scanData: {
      usdzDataBase64: string;
      metadata: ScanData['metadata'];
    }
  ): Promise<{ scanId: string }> {
    const response = await fetch(`${this.baseUrl}/scan/arkit/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        usdzDataBase64: scanData.usdzDataBase64,
        metadata: scanData.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit ARKit scan');
    }

    return response.json();
  }

  // Phase 1: Android ARCore Scanning
  async initializeARCoreScanning(
    userId: string
  ): Promise<{ sessionId: string }> {
    const response = await fetch(`${this.baseUrl}/scan/arcore/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        platform: 'android',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize ARCore scanning');
    }

    return response.json();
  }

  async submitARCoreScan(
    sessionId: string,
    scanData: {
      depthDataBase64: string;
      rgbImagesBase64: string[];
      cameraIntrinsics: number[];
      metadata: ScanData['metadata'];
    }
  ): Promise<{ scanId: string }> {
    const response = await fetch(`${this.baseUrl}/scan/arcore/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        depthDataBase64: scanData.depthDataBase64,
        rgbImagesBase64: scanData.rgbImagesBase64,
        cameraIntrinsics: scanData.cameraIntrinsics,
        metadata: scanData.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit ARCore scan');
    }

    return response.json();
  }

  // Phase 1: Photogrammetry Fallback
  async submitPhotogrammetryScan(
    userId: string,
    imagesBase64: string[]
  ): Promise<{ scanId: string }> {
    const response = await fetch(`${this.baseUrl}/scan/photogrammetry/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        imagesBase64,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit photogrammetry scan');
    }

    return response.json();
  }

  // Phase 1: Base Mesh Processing
  async getBaseMeshStatus(scanId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/mesh/${scanId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get base mesh status');
    }

    return response.json();
  }

  async requestBaseMeshFitting(scanId: string): Promise<{ fitJobId: string }> {
    const response = await fetch(`${this.baseUrl}/mesh/${scanId}/fit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to request base mesh fitting');
    }

    return response.json();
  }

  // Phase 1: Wardrobe System
  async getAvailableClothing(): Promise<ClothingItem[]> {
    const response = await fetch(`${this.baseUrl}/wardrobe/items`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get available clothing');
    }

    return response.json();
  }

  async getClothingItem(itemId: string): Promise<ClothingItem> {
    const response = await fetch(`${this.baseUrl}/wardrobe/items/${itemId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get clothing item');
    }

    return response.json();
  }

  // Phase 1: Avatar Assembly
  async createAvatar(request: {
    baseMeshId: string;
    clothingItems: string[];
    userId: string;
  }): Promise<{ avatarId: string }> {
    const response = await fetch(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to create avatar');
    }

    return response.json();
  }

  async getAvatarStatus(avatarId: string): Promise<AvatarAsset> {
    const response = await fetch(`${this.baseUrl}/avatar/${avatarId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get avatar status');
    }

    return response.json();
  }

  async getOptimizedAvatarUrl(avatarId: string): string {
    return `${this.baseUrl}/avatar/${avatarId}/download`;
  }

  // Phase 1: Asset Delivery
  async preloadAvatarAssets(avatarId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/avatar/${avatarId}/preload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to preload avatar assets');
    }
  }

  // Utility Methods
  async validateScanQuality(scanData: Partial<ScanData>): Promise<{
    isValid: boolean;
    quality: number;
    issues: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scanData),
    });

    if (!response.ok) {
      throw new Error('Failed to validate scan quality');
    }

    return response.json();
  }

  async getScanningGuidelines(platform: 'ios' | 'android'): Promise<{
    steps: string[];
    tips: string[];
    requirements: Record<string, any>;
  }> {
    const response = await fetch(`${this.baseUrl}/guidelines/${platform}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get scanning guidelines');
    }

    return response.json();
  }
}

export default new AvatarCreationService();
