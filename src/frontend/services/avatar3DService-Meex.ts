export type Avatar3DRequest = {
  format: string; // e.g., 'glb'
  prompt: string;
  image?: string; // base64 image data URL
};

export type Avatar3DResponse = {
  success: boolean;
  modelUrl?: string;
  error?: string;
};

export const avatar3DService = {
  // Mocked generator for development and tests
  async generateMockAvatar(
    _request: Avatar3DRequest
  ): Promise<Avatar3DResponse> {
    // Return a placeholder GLB model URL or any accessible asset
    // For now we just return a data URL placeholder to satisfy usage
    return {
      success: true,
      modelUrl: 'https://example.com/mock-avatar.glb',
    };
  },
};
