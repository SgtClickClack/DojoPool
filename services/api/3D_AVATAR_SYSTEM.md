# 3D Avatar System Documentation

## Overview

The 3D Avatar System provides a comprehensive framework for rendering customizable player avatars in DojoPool's 3D world. This system enables players to express their unique identity through customizable 3D models that are rendered in real-time within the immersive world environment.

## Core Architecture

### System Components

1. **AvatarRenderer**: Core 3D rendering engine using Three.js
2. **AvatarCustomization**: Player-defined appearance settings
3. **AvatarData**: Runtime avatar state and positioning
4. **AnimationSystem**: Movement and gesture animations
5. **PerformanceOptimizer**: LOD (Level of Detail) and culling systems

### Rendering Pipeline

1. **Asset Loading**: Load 3D models and textures dynamically
2. **Customization Application**: Apply player-selected customizations
3. **Scene Integration**: Add avatar to Three.js scene with proper positioning
4. **Animation Updates**: Apply movement and gesture animations
5. **Performance Optimization**: Implement LOD and frustum culling

## Avatar Customization System

### Customization Categories

#### Physical Appearance

```typescript
interface PhysicalCustomization {
  skinTone: string; // Hex color for skin
  bodyType: 'slim' | 'average' | 'athletic' | 'heavy';
  height: number; // Scale factor (0.8 - 1.2)
  build: 'ectomorph' | 'mesomorph' | 'endomorph';
}
```

#### Hair and Head

```typescript
interface HairCustomization {
  hairStyle: 'bald' | 'short' | 'medium' | 'long' | 'ponytail' | 'bun';
  hairColor: string; // Hex color
  facialHair?: 'none' | 'stubble' | 'beard' | 'mustache';
  eyebrows: 'thin' | 'medium' | 'thick' | 'bushy';
  eyeColor: string; // Hex color
}
```

#### Clothing and Accessories

```typescript
interface ClothingCustomization {
  clothingStyle: 'casual' | 'sporty' | 'formal' | 'punk' | 'cyberpunk';
  primaryColor: string; // Main clothing color
  secondaryColor: string; // Accent color
  pattern?: 'solid' | 'striped' | 'plaid' | 'graphic';
  accessories: AccessoryItem[];
}

interface AccessoryItem {
  type: 'hat' | 'glasses' | 'necklace' | 'watch' | 'backpack';
  style: string;
  color: string;
}
```

#### Special Effects

```typescript
interface EffectsCustomization {
  aura: 'none' | 'energy' | 'fire' | 'ice' | 'electric';
  auraColor: string;
  particles: 'none' | 'sparkles' | 'smoke' | 'leaves';
  trail: 'none' | 'light' | 'shadow' | 'energy';
}
```

### Customization Limits

- **Free Customizations**: Skin tone, basic hair styles, basic clothing colors
- **Premium Features**: Advanced patterns, special effects, exclusive accessories
- **Clan Benefits**: Clan-specific customizations and colors
- **Achievement Rewards**: Special avatar items unlocked through gameplay

## Avatar Rendering Engine

### Core Classes

#### AvatarRenderer

```typescript
class AvatarRenderer {
  constructor(scene: THREE.Scene);

  // Create and manage avatars
  createAvatar(avatarData: AvatarData): Promise<THREE.Group>;
  updateAvatarPosition(avatar: THREE.Group, position: THREE.Vector3): void;
  updateAvatarRotation(avatar: THREE.Group, rotation: THREE.Euler): void;
  removeAvatar(playerId: string): void;

  // Animation management
  updateAvatarAnimation(playerId: string, animation: AvatarAnimation): void;
  updateAnimations(): void;

  // Performance optimization
  setLODLevel(playerId: string, distance: number): void;
  dispose(): void;
}
```

#### AvatarData Interface

```typescript
interface AvatarData {
  playerId: string;
  username: string;
  avatarUrl?: string;
  clanTag?: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  customization: AvatarCustomization;
  isCurrentPlayer: boolean;
  animation: AvatarAnimation;
  performanceMode: 'high' | 'medium' | 'low';
}
```

### Rendering Pipeline

#### 1. Avatar Creation

```typescript
const avatar = await avatarRenderer.createAvatar({
  playerId: 'user123',
  username: 'PlayerName',
  position: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Euler(0, 0, 0),
  customization: playerCustomization,
  isCurrentPlayer: false,
  animation: 'idle',
  performanceMode: 'high',
});
```

#### 2. Mesh Generation

```typescript
// Create body parts
const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8);
const bodyMaterial = new THREE.MeshLambertMaterial({
  color: customization.clothingColor,
});
const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.position.y = 0.4;
body.castShadow = true;
avatar.add(body);
```

#### 3. Texture Application

```typescript
// Apply custom textures
const textureLoader = new THREE.TextureLoader();
const skinTexture = textureLoader.load(
  '/textures/skin_tones/' + customization.skinTone + '.jpg'
);
headMaterial.map = skinTexture;
```

#### 4. Animation System

```typescript
// Apply animations based on movement
if (avatarData.animation === 'walking') {
  avatar.position.y = 1 + Math.sin(Date.now() * 0.01) * 0.05;
} else if (avatarData.animation === 'running') {
  avatar.position.y = 1 + Math.sin(Date.now() * 0.02) * 0.1;
}
```

## Animation System

### Animation States

#### Idle Animation

- Subtle breathing motion
- Occasional head turns
- Weight shifting between feet

#### Walking Animation

- Alternating leg movement
- Arm swinging
- Head bobbing
- Speed-based animation timing

#### Running Animation

- Faster leg cycling
- More pronounced arm movement
- Greater head bobbing
- Particle effects for dust/impact

#### Special Animations

- Victory celebration
- Defeat reaction
- Greeting gestures
- Achievement unlocks

### Animation Implementation

```typescript
// Walking cycle
const walkCycle = () => {
  const time = Date.now() * 0.01;

  // Left leg
  leftLeg.rotation.x = Math.sin(time) * 0.5;
  // Right leg
  rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.5;

  // Arms
  leftArm.rotation.x = Math.sin(time + Math.PI) * 0.3;
  rightArm.rotation.x = Math.sin(time) * 0.3;
};

// Running cycle (faster)
const runCycle = () => {
  const time = Date.now() * 0.02;

  leftLeg.rotation.x = Math.sin(time) * 0.8;
  rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.8;

  leftArm.rotation.x = Math.sin(time + Math.PI) * 0.6;
  rightArm.rotation.x = Math.sin(time) * 0.6;
};
```

## Performance Optimization

### Level of Detail (LOD)

#### Distance-Based LOD

```typescript
setLODLevel(playerId: string, distance: number): void {
  const avatar = this.avatarCache.get(playerId);
  if (!avatar) return;

  if (distance < 50) {
    // High detail - full geometry, textures, animations
    avatar.visible = true;
    enableAllDetails(avatar);
  } else if (distance < 200) {
    // Medium detail - reduced geometry, simplified textures
    avatar.visible = true;
    enableMediumDetails(avatar);
  } else {
    // Low detail - billboard sprite or simple geometry
    avatar.visible = true;
    enableLowDetails(avatar);
  }
}
```

#### Frustum Culling

```typescript
// Only render avatars in camera view
const frustum = new THREE.Frustum();
frustum.setFromProjectionMatrix(
  new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  )
);

avatarCache.forEach((avatar, playerId) => {
  const sphere = new THREE.Sphere(avatar.position, 1);
  avatar.visible = frustum.intersectsSphere(sphere);
});
```

### Memory Management

#### Texture Pooling

```typescript
class TexturePool {
  private textures = new Map<string, THREE.Texture>();

  getTexture(url: string): Promise<THREE.Texture> {
    if (this.textures.has(url)) {
      return Promise.resolve(this.textures.get(url)!);
    }

    return new Promise((resolve) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        this.textures.set(url, texture);
        resolve(texture);
      });
    });
  }

  dispose(): void {
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
  }
}
```

#### Geometry Instancing

```typescript
// Reuse geometry for similar avatars
const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8);
const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);

// Share geometries across avatars
const sharedGeometries = {
  body: bodyGeometry,
  head: headGeometry,
};
```

## Asset Management

### Asset Pipeline

#### 1. Asset Creation

- 3D models created in Blender/Maya
- Texture creation in Substance Painter
- Animation rigging and export

#### 2. Asset Optimization

- Polygon reduction for performance
- Texture compression (WebP, Basis Universal)
- LOD generation (high/medium/low detail)

#### 3. Asset Loading

```typescript
// Dynamic asset loading
const loadAvatarAssets = async (customization: AvatarCustomization) => {
  const assets = {
    body: await loadModel('/models/body.glb'),
    hair: await loadModel(`/models/hair/${customization.hairStyle}.glb`),
    clothing: await loadModel(
      `/models/clothing/${customization.clothingStyle}.glb`
    ),
  };

  // Apply textures
  assets.body.material.map = await loadTexture(
    `/textures/body/${customization.skinTone}.jpg`
  );
  assets.hair.material.map = await loadTexture(
    `/textures/hair/${customization.hairColor}.jpg`
  );

  return assets;
};
```

### Asset Formats

- **Models**: GLTF/GLB (compact, web-optimized)
- **Textures**: WebP (smaller file size, better compression)
- **Animations**: Baked animations in GLTF format
- **Materials**: PBR materials with metallic/roughness workflow

## Social Features

### Clan Integration

#### Clan Colors and Markings

```typescript
// Apply clan-specific customizations
if (avatarData.clanTag) {
  const clanColors = getClanColors(avatarData.clanTag);
  avatar.add(createClanMarking(clanColors.primary, clanColors.secondary));
}
```

#### Clan Leader Indicators

```typescript
// Special effects for clan leaders
if (isClanLeader) {
  avatar.add(createLeadershipAura());
}
```

### Friend System

#### Friend Indicators

```typescript
// Visual indicators for friends
if (isFriend) {
  avatar.add(createFriendIndicator());
}
```

#### Proximity Effects

```typescript
// Special effects when friends are nearby
if (friendsNearby.length > 0) {
  avatar.add(createFriendProximityEffect(friendsNearby.length));
}
```

## Real-time Synchronization

### Position Updates

#### Smooth Interpolation

```typescript
// Smooth position updates to prevent jerky movement
updateAvatarPositionSmooth(avatar: THREE.Group, targetPosition: THREE.Vector3): void {
  const currentPosition = avatar.position.clone();
  const distance = currentPosition.distanceTo(targetPosition);

  if (distance > 0.01) {
    // Interpolate towards target position
    avatar.position.lerp(targetPosition, 0.1);
  } else {
    avatar.position.copy(targetPosition);
  }
}
```

#### Prediction and Correction

```typescript
// Client-side prediction for smooth movement
class MovementPredictor {
  private velocity = new THREE.Vector3();
  private lastUpdate = Date.now();

  predictPosition(
    currentPosition: THREE.Vector3,
    deltaTime: number
  ): THREE.Vector3 {
    const predictedPosition = currentPosition.clone();
    predictedPosition.add(this.velocity.clone().multiplyScalar(deltaTime));
    return predictedPosition;
  }

  updateVelocity(newPosition: THREE.Vector3, timestamp: number): void {
    const deltaTime = (timestamp - this.lastUpdate) / 1000;
    this.velocity.subVectors(
      newPosition,
      this.lastUpdatePosition || newPosition
    );
    this.velocity.divideScalar(deltaTime);
    this.lastUpdate = timestamp;
    this.lastUpdatePosition = newPosition;
  }
}
```

### Animation Synchronization

#### State Synchronization

```typescript
// Synchronize animation states across clients
syncAnimationState(playerId: string, animationState: AnimationState): void {
  const avatar = avatarCache.get(playerId);
  if (!avatar) return;

  // Update animation mixer
  if (avatar.userData.mixer) {
    const action = avatar.userData.mixer.clipAction(animationState.clip);
    action.play();
  }

  // Update avatar state
  avatar.userData.animationState = animationState;
}
```

## Error Handling and Fallbacks

### Loading Failures

#### Asset Loading Errors

```typescript
const loadAssetWithFallback = async (url: string, fallbackUrl: string) => {
  try {
    return await loadAsset(url);
  } catch (error) {
    console.warn(`Failed to load ${url}, using fallback`);
    return await loadAsset(fallbackUrl);
  }
};
```

#### Network Issues

```typescript
// Progressive loading with fallbacks
const loadAvatarProgressive = async (avatarData: AvatarData) => {
  // Load basic avatar first
  const basicAvatar = await createBasicAvatar(avatarData);

  // Load detailed assets in background
  try {
    const detailedAssets = await loadDetailedAssets(avatarData);
    upgradeAvatar(basicAvatar, detailedAssets);
  } catch (error) {
    console.warn('Failed to load detailed avatar, using basic version');
  }

  return basicAvatar;
};
```

### Rendering Errors

#### WebGL Context Loss

```typescript
// Handle WebGL context loss
renderer.domElement.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  console.warn('WebGL context lost, attempting recovery');

  // Clean up current scene
  disposeAllAvatars();

  // Attempt to restore context
  setTimeout(() => {
    initRenderer();
    reloadAllAvatars();
  }, 1000);
});
```

#### Memory Issues

```typescript
// Monitor memory usage and clean up if necessary
const monitorMemoryUsage = () => {
  if (performance.memory) {
    const usedPercent =
      (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) *
      100;

    if (usedPercent > 80) {
      console.warn('High memory usage, cleaning up avatars');
      cleanupDistantAvatars();
      disposeUnusedTextures();
    }
  }
};
```

## Integration with Game Systems

### Achievement Integration

#### Achievement Avatars

```typescript
// Unlock special avatar items through achievements
unlockAchievementAvatar(achievementId: string, playerId: string): void {
  const avatarItem = getAchievementReward(achievementId);
  addAvatarAccessory(playerId, avatarItem);
}
```

#### Progress-Based Customizations

```typescript
// Unlock customizations based on player progress
updateProgressBasedCustomizations(playerId: string, progress: PlayerProgress): void {
  const unlockedItems = getUnlockedItems(progress);
  unlockedItems.forEach(item => {
    addAvailableCustomization(playerId, item);
  });
}
```

### Tournament Integration

#### Tournament Avatars

```typescript
// Special avatars for tournament participants
setTournamentAvatar(playerId: string, tournamentId: string): void {
  const tournamentTheme = getTournamentTheme(tournamentId);
  applyThemeToAvatar(playerId, tournamentTheme);
}
```

#### Victory Celebrations

```typescript
// Victory animations and effects
playVictoryAnimation(playerId: string): void {
  const avatar = avatarCache.get(playerId);
  if (avatar) {
    startVictorySequence(avatar);
  }
}
```

## Mobile Optimization

### Touch Controls

#### Gesture Recognition

```typescript
// Handle touch gestures for mobile interaction
handleTouchGesture(gesture: TouchGesture): void {
  switch (gesture.type) {
    case 'tap':
      selectAvatar(gesture.targetPlayerId);
      break;
    case 'swipe':
      rotateCamera(gesture.deltaX, gesture.deltaY);
      break;
    case 'pinch':
      zoomCamera(gesture.scale);
      break;
  }
}
```

### Performance Optimizations

#### Mobile LOD

```typescript
// More aggressive LOD for mobile devices
setMobileLODLevel(playerId: string, distance: number, deviceTier: DeviceTier): void {
  let lodLevel: 'high' | 'medium' | 'low';

  if (deviceTier === 'low') {
    lodLevel = distance < 25 ? 'medium' : 'low';
  } else {
    lodLevel = distance < 50 ? 'high' : distance < 150 ? 'medium' : 'low';
  }

  applyLODLevel(playerId, lodLevel);
}
```

#### Battery Optimization

```typescript
// Reduce update frequency on low battery
setBatteryOptimizationMode(enabled: boolean): void {
  if (enabled) {
    updateFrequency = 30; // 30 FPS instead of 60
    disableExpensiveEffects();
  } else {
    updateFrequency = 60;
    enableAllEffects();
  }
}
```

## Testing and Quality Assurance

### Automated Testing

#### Avatar Rendering Tests

```typescript
describe('AvatarRenderer', () => {
  it('should create avatar with correct customization', async () => {
    const avatarData = createTestAvatarData();
    const avatar = await avatarRenderer.createAvatar(avatarData);

    expect(avatar).toBeDefined();
    expect(avatar.children.length).toBeGreaterThan(0);
    expect(avatar.position).toEqual(avatarData.position);
  });

  it('should apply customizations correctly', () => {
    const customization = createTestCustomization();
    const avatar = applyCustomization(testAvatar, customization);

    expect(getAvatarColor(avatar, 'clothing')).toBe(
      customization.clothingColor
    );
    expect(getAvatarHairStyle(avatar)).toBe(customization.hairStyle);
  });

  it('should handle animation state changes', () => {
    const avatar = createTestAvatar();
    avatarRenderer.updateAvatarAnimation(avatar.id, 'walking');

    expect(avatar.animation.current).toBe('walking');
  });
});
```

#### Performance Tests

```typescript
describe('Performance', () => {
  it('should maintain 60 FPS with 100 avatars', async () => {
    const avatars = await createMultipleAvatars(100);
    const fps = measureFPS(() => updateAllAvatars(avatars));

    expect(fps).toBeGreaterThan(55);
  });

  it('should load avatar within 2 seconds', async () => {
    const startTime = Date.now();
    const avatar = await avatarRenderer.createAvatar(testAvatarData);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(2000);
  });
});
```

### Visual Testing

#### Screenshot Comparison

```typescript
// Automated visual regression testing
it('should render avatar consistently', async () => {
  const avatar = await createTestAvatar();
  const screenshot = await takeScreenshot(renderer);

  expect(screenshot).toMatchImageSnapshot();
});
```

This comprehensive 3D Avatar System documentation covers the complete architecture, implementation details, performance optimizations, and integration patterns for creating immersive, customizable player avatars in DojoPool's 3D world.
