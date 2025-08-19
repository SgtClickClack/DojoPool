# 3D AI Studio Integration

This document explains how to set up and use the 3D AI Studio integration for generating 3D avatars in DojoPool.

## Overview

The 3D AI Studio integration allows users to:

- Upload a photo and generate a 3D avatar from it
- Use text prompts to create custom 3D avatars
- View the generated 3D models in real-time
- Export models in GLB format for use in games and VR

## Setup Instructions

### 1. Get API Key

1. Visit [3D AI Studio](https://www.3daistudio.com/)
2. Sign up for an account
3. Navigate to your API settings
4. Copy your API key

### 2. Configure Environment

1. Copy `.env.example` to `.env` (if not already done)
2. Add your API key to the `.env` file:
   ```
   REACT_APP_3DAI_STUDIO_API_KEY=your_actual_api_key_here
   ```

### 3. Install Dependencies

The required dependencies are already included in `package.json`:

- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful helpers for React Three Fiber
- `three` - 3D graphics library

## Usage

### For Users

1. **Upload Photo Method:**
   - Upload a full-body photo
   - Add custom prompts (e.g., "mohawk", "cyberpunk style")
   - Click "Generate Avatar"
   - View the 3D model in the preview

2. **Text Prompt Method:**
   - Type a detailed description
   - Click "Generate Avatar"
   - View the generated 3D model

### For Developers

#### Service Integration

The main service is located at `src/services/avatar3DService.ts`:

```typescript
import { avatar3DService } from '../services/avatar3DService';

// Generate from image
const result = await avatar3DService.generateAvatar({
  image: base64Image,
  prompt: 'cyberpunk style',
  format: 'glb',
});

// Generate from text only
const result = await avatar3DService.generateAvatar({
  prompt: 'cyberpunk pool player with mohawk',
  format: 'glb',
});
```

#### 3D Model Viewer

Use the `Avatar3DModelViewer` component to display GLB models:

```typescript
import Avatar3DModelViewer from './Avatar3DModelViewer';

<Avatar3DModelViewer
  modelUrl="https://example.com/model.glb"
  height={600}
/>
```

## API Reference

### Avatar3DService Methods

#### `generateAvatar(request: Avatar3DRequest): Promise<Avatar3DResponse>`

Generates a 3D avatar from image or text prompt.

**Parameters:**

- `image?: string` - Base64 encoded image (optional)
- `prompt?: string` - Text description for generation
- `format?: 'glb' | 'fbx' | 'obj'` - Output format (default: 'glb')

**Returns:**

- `success: boolean` - Whether generation was successful
- `modelUrl?: string` - URL to the generated 3D model
- `error?: string` - Error message if failed
- `modelId?: string` - Unique model identifier

#### `getModelStatus(modelId: string): Promise<Avatar3DResponse>`

Check the status of a model generation job.

## Pricing

3D AI Studio pricing:

- **25 credits per generation**
- Credits can be purchased in packages
- Fast generation (15-25 seconds)
- High-quality output

## Troubleshooting

### Common Issues

1. **"API key not configured" error:**
   - Ensure `REACT_APP_3DAI_STUDIO_API_KEY` is set in `.env`
   - Restart the development server after changing environment variables

2. **3D model not loading:**
   - Check that the model URL is accessible
   - Ensure the model format is GLB
   - Verify CORS settings if loading from external URLs

3. **Generation fails:**
   - Check API key validity
   - Ensure sufficient credits in your 3D AI Studio account
   - Verify image format (JPEG, PNG supported)

### Development Mode

For development and testing, the service includes a mock implementation:

```typescript
// Use mock instead of real API
const result = await avatar3DService.generateMockAvatar(request);
```

## Future Enhancements

- [ ] Support for animation generation
- [ ] Real-time model editing
- [ ] Integration with game engines
- [ ] Batch processing for tournaments
- [ ] Custom model marketplace

## Support

For issues with the 3D AI Studio API:

- Visit [3D AI Studio Documentation](https://docs.3daistudio.com/)
- Contact their support team
- Check their status page for service updates
