// This service is frontend-only. Do not use in backend.

interface Avatar3DRequest {
  image?: string; // base64 encoded image
  prompt?: string; // text prompt for generation
  format?: 'glb' | 'fbx' | 'obj';
}

interface Avatar3DResponse {
  success: boolean;
  modelUrl?: string;
  error?: string;
  modelId?: string;
}

import { env } from '.js';

class Avatar3DService {
  private apiKey: string;
  private baseUrl = 'https://api.3daistudio.com/v1';
  private mockModelUrl = '/models/default-avatar.glb'; // Local placeholder model

  constructor() {
    this.apiKey = env.VITE_3DAI_STUDIO_API_KEY;
  }

  async generateAvatar(request: Avatar3DRequest): Promise<Avatar3DResponse> {
    // Use mock implementation in development
    if (env.DEV) {
      return this.generateMockAvatar(request);
    }

    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: '3D AI Studio API key not configured'
        };
      }

      const payload = {
        type: request.image ? 'image-to-3d' : 'text-to-3d',
        image: request.image,
        prompt: request.prompt || 'cyberpunk avatar character',
        format: request.format || 'glb',
        quality: 'high'
      };

      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        modelUrl: data.model_url,
        modelId: data.model_id
      };

    } catch (error) {
      console.error('3D Avatar generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async getModelStatus(modelId: string): Promise<Avatar3DResponse> {
    // Use mock implementation in development
    if (env.DEV) {
      return {
        success: true,
        modelUrl: this.mockModelUrl,
        modelId: 'mock-model-123'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/status/${modelId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: data.status === 'completed',
        modelUrl: data.model_url,
        error: data.status === 'failed' ? 'Generation failed' : undefined
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  // Mock implementation for development/testing
  public async generateMockAvatar(request: Avatar3DRequest): Promise<Avatar3DResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      modelUrl: this.mockModelUrl,
      modelId: 'mock-model-123'
    };
  }
}

export const avatar3DService = new Avatar3DService();
export type { Avatar3DRequest, Avatar3DResponse }; 
