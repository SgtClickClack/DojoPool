import * as THREE from 'three';

export interface AvatarCustomization {
  skinTone: string;
  hairColor: string;
  hairStyle: string;
  clothingColor: string;
  clothingStyle: string;
  accessory?: string;
  size: number;
  animation: 'idle' | 'walking' | 'running' | 'celebrating';
}

export interface AvatarData {
  playerId: string;
  username: string;
  avatarUrl?: string;
  clanTag?: string;
  customization?: AvatarCustomization;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  isCurrentPlayer: boolean;
}

export class AvatarRenderer {
  private scene: THREE.Scene;
  private avatarCache = new Map<string, THREE.Group>();
  private mixerCache = new Map<string, THREE.AnimationMixer>();
  private clock = new THREE.Clock();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Create or update a 3D avatar for a player
   */
  async createAvatar(avatarData: AvatarData): Promise<THREE.Group> {
    const { playerId, isCurrentPlayer } = avatarData;

    // Check if avatar already exists
    let avatar = this.avatarCache.get(playerId);
    if (avatar) {
      this.updateAvatarPosition(avatar, avatarData);
      return avatar;
    }

    // Create new avatar
    avatar = new THREE.Group();
    avatar.name = `avatar_${playerId}`;

    // Create avatar components
    await this.buildAvatarMesh(avatar, avatarData);

    // Add to scene
    this.scene.add(avatar);

    // Cache the avatar
    this.avatarCache.set(playerId, avatar);

    // Set initial position
    this.updateAvatarPosition(avatar, avatarData);

    // Add name tag
    this.addNameTag(avatar, avatarData);

    return avatar;
  }

  /**
   * Build the 3D mesh components of an avatar
   */
  private async buildAvatarMesh(
    avatar: THREE.Group,
    avatarData: AvatarData
  ): Promise<void> {
    const { customization = this.getDefaultCustomization(), isCurrentPlayer } =
      avatarData;

    // Body (torso)
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({
      color: this.hexToColor(customization.clothingColor),
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    avatar.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({
      color: this.hexToColor(customization.skinTone),
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.0;
    head.castShadow = true;
    avatar.add(head);

    // Hair
    if (customization.hairStyle !== 'bald') {
      const hairGeometry = new THREE.SphereGeometry(
        0.26,
        8,
        8,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      const hairMaterial = new THREE.MeshLambertMaterial({
        color: this.hexToColor(customization.hairColor),
      });
      const hair = new THREE.Mesh(hairGeometry, hairMaterial);
      hair.position.y = 1.15;
      avatar.add(hair);
    }

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8);
    const legMaterial = new THREE.MeshLambertMaterial({
      color: this.hexToColor(customization.clothingColor),
    });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, -0.3, 0);
    leftLeg.castShadow = true;
    avatar.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, -0.3, 0);
    rightLeg.castShadow = true;
    avatar.add(rightLeg);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8);
    const armMaterial = new THREE.MeshLambertMaterial({
      color: this.hexToColor(customization.skinTone),
    });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 0.3, 0);
    leftArm.rotation.z = Math.PI / 6;
    avatar.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 0.3, 0);
    rightArm.rotation.z = -Math.PI / 6;
    avatar.add(rightArm);

    // Special effects for current player
    if (isCurrentPlayer) {
      this.addPlayerGlow(avatar);
    }

    // Clan indicator
    if (avatarData.clanTag) {
      this.addClanIndicator(avatar, avatarData.clanTag);
    }
  }

  /**
   * Update avatar position and rotation
   */
  updateAvatarPosition(avatar: THREE.Group, avatarData: AvatarData): void {
    avatar.position.copy(avatarData.position);
    avatar.rotation.copy(avatarData.rotation);
  }

  /**
   * Add a floating name tag above the avatar
   */
  private addNameTag(avatar: THREE.Group, avatarData: AvatarData): void {
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    // Configure text
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.textAlign = 'center';

    // Draw text with outline
    const displayName =
      avatarData.username.length > 12
        ? avatarData.username.substring(0, 12) + '...'
        : avatarData.username;

    context.strokeText(displayName, canvas.width / 2, 30);
    context.fillText(displayName, canvas.width / 2, 30);

    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 1.8, 0);
    sprite.scale.set(2, 0.5, 1);

    avatar.add(sprite);
  }

  /**
   * Add a glowing effect for the current player
   */
  private addPlayerGlow(avatar: THREE.Group): void {
    // Create a subtle glow effect
    const glowGeometry = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4caf50,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    avatar.add(glow);

    // Add pulsing animation
    const mixer = new THREE.AnimationMixer(glow);
    const opacityTrack = new THREE.NumberKeyframeTrack(
      '.material.opacity',
      [0, 1, 2],
      [0.05, 0.15, 0.05]
    );
    const clip = new THREE.AnimationClip('pulse', 2, [opacityTrack]);
    const action = mixer.clipAction(clip);
    action.play();

    this.mixerCache.set(`${avatar.name}_glow`, mixer);
  }

  /**
   * Add clan indicator above the avatar
   */
  private addClanIndicator(avatar: THREE.Group, clanTag: string): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 32;

    context.font = 'Bold 16px Arial';
    context.fillStyle = '#FF9800';
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    context.textAlign = 'center';

    context.strokeText(`[${clanTag}]`, canvas.width / 2, 20);
    context.fillText(`[${clanTag}]`, canvas.width / 2, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 2.0, 0);
    sprite.scale.set(1, 0.25, 1);

    avatar.add(sprite);
  }

  /**
   * Remove an avatar from the scene
   */
  removeAvatar(playerId: string): void {
    const avatar = this.avatarCache.get(playerId);
    if (avatar) {
      this.scene.remove(avatar);

      // Clean up animations
      const glowMixer = this.mixerCache.get(`${playerId}_glow`);
      if (glowMixer) {
        glowMixer.stopAllAction();
        this.mixerCache.delete(`${playerId}_glow`);
      }

      // Dispose of geometries and materials
      avatar.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });

      this.avatarCache.delete(playerId);
    }
  }

  /**
   * Update avatar animation based on movement
   */
  updateAvatarAnimation(
    playerId: string,
    animation: AvatarCustomization['animation']
  ): void {
    // This would implement walking/running animations
    // For now, we'll keep it simple
    const avatar = this.avatarCache.get(playerId);
    if (!avatar) return;

    // Simple animation based on movement state
    switch (animation) {
      case 'walking':
        // Add subtle bobbing animation
        avatar.position.y = 1 + Math.sin(Date.now() * 0.01) * 0.05;
        break;
      case 'running':
        // Add more pronounced bobbing
        avatar.position.y = 1 + Math.sin(Date.now() * 0.02) * 0.1;
        break;
      case 'celebrating':
        // Add jumping animation
        avatar.position.y = 1 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.3;
        break;
      default:
        avatar.position.y = 1;
    }
  }

  /**
   * Update animations for all avatars
   */
  updateAnimations(): void {
    const delta = this.clock.getDelta();

    for (const mixer of this.mixerCache.values()) {
      mixer.update(delta);
    }
  }

  /**
   * Get default avatar customization
   */
  private getDefaultCustomization(): AvatarCustomization {
    return {
      skinTone: '#F5DEB3',
      hairColor: '#8B4513',
      hairStyle: 'short',
      clothingColor: '#4169E1',
      clothingStyle: 'casual',
      size: 1.0,
      animation: 'idle',
    };
  }

  /**
   * Convert hex color string to THREE.Color
   */
  private hexToColor(hex: string): THREE.Color {
    return new THREE.Color(hex);
  }

  /**
   * Clean up all avatars and resources
   */
  dispose(): void {
    for (const avatar of this.avatarCache.values()) {
      this.scene.remove(avatar);
      avatar.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    this.avatarCache.clear();
    this.mixerCache.clear();
  }
}
