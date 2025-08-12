import { BrowserEventEmitter } from '';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface VenueTheme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  backgroundImage?: string;
  customCSS?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueAttribute {
  id: string;
  name: string;
  description: string;
  category: 'atmosphere' | 'amenities' | 'specialty' | 'vibe';
  iconUrl?: string;
  isActive: boolean;
  priority: number;
}

export interface VenueGallery {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl: string;
  category: 'interior' | 'exterior' | 'tournaments' | 'events' | 'atmosphere';
  isFeatured: boolean;
  order: number;
  createdAt: Date;
}

export interface VenueStory {
  id: string;
  title: string;
  content: string;
  featuredImage?: string;
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextToImageRequest {
  prompt: string;
  style: 'realistic' | 'artistic' | 'cyberpunk' | 'modern' | 'vintage';
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:2';
  quality: 'standard' | 'high' | 'ultra';
  venueId: string;
  category: 'logo' | 'background' | 'gallery' | 'banner' | 'icon';
}

export interface TextToImageResponse {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  style: string;
  status: 'generating' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface CustomizationConfig {
  venueId: string;
  theme: VenueTheme;
  attributes: VenueAttribute[];
  gallery: VenueGallery[];
  stories: VenueStory[];
  atmosphere: {
    lighting: string;
    music: string;
    decor: string;
    vibe: string;
  };
  branding: {
    tagline: string;
    mission: string;
    values: string[];
    logo?: string;
    banner?: string;
    favicon?: string;
  };
}

export class DojoProfileCustomizationService extends BrowserEventEmitter {
  private static instance: DojoProfileCustomizationService;
  private customizations: Map<string, CustomizationConfig> = new Map();
  private isConnected: boolean = false;
  private socket: Socket | null = null;
  private imageGenerationQueue: TextToImageRequest[] = [];
  private generatedImages: Map<string, TextToImageResponse> = new Map();

  private constructor() {
    super();
    this.initializeDefaultThemes();
    this.initializeWebSocket();
  }

  public static getInstance(): DojoProfileCustomizationService {
    if (!DojoProfileCustomizationService.instance) {
      DojoProfileCustomizationService.instance =
        new DojoProfileCustomizationService();
    }
    return DojoProfileCustomizationService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        this.socket?.emit('customization:join', { service: 'customization' });
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        this.emit('disconnected');
      });

      this.socket.on('text-to-image:generated', (data: TextToImageResponse) => {
        this.generatedImages.set(data.id, data);
        this.emit('imageGenerated', data);
      });

      this.socket.on(
        'text-to-image:failed',
        (data: { id: string; error: string }) => {
          this.emit('imageGenerationFailed', data);
        }
      );
    } catch (error) {
      console.error('WebSocket initialization failed:', error);
    }
  }

  private initializeDefaultThemes(): void {
    const defaultThemes: VenueTheme[] = [
      {
        id: 'neon-futuristic',
        name: 'Neon Futuristic',
        primaryColor: '#00ff9d',
        secondaryColor: '#00a8ff',
        accentColor: '#ff6b6b',
        fontFamily: 'Orbitron, monospace',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'classic-elegant',
        name: 'Classic Elegant',
        primaryColor: '#2c3e50',
        secondaryColor: '#34495e',
        accentColor: '#e74c3c',
        fontFamily: 'Playfair Display, serif',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'urban-industrial',
        name: 'Urban Industrial',
        primaryColor: '#95a5a6',
        secondaryColor: '#7f8c8d',
        accentColor: '#f39c12',
        fontFamily: 'Roboto, sans-serif',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultThemes.forEach((theme) => {
      this.customizations.set(theme.id, {
        venueId: theme.id,
        theme,
        attributes: [],
        gallery: [],
        stories: [],
        atmosphere: {
          lighting: 'ambient',
          music: 'electronic',
          decor: 'modern',
          vibe: 'energetic',
        },
        branding: {
          tagline: 'Where Champions Are Made',
          mission: 'Creating the ultimate pool gaming experience',
          values: ['Excellence', 'Community', 'Innovation'],
        },
      });
    });
  }

  // Text-to-Image Generation
  public async generateImageFromText(
    request: TextToImageRequest
  ): Promise<TextToImageResponse> {
    const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const response: TextToImageResponse = {
      id: imageId,
      imageUrl: '',
      thumbnailUrl: '',
      prompt: request.prompt,
      style: request.style,
      status: 'generating',
      createdAt: new Date(),
    };

    this.generatedImages.set(imageId, response);
    this.imageGenerationQueue.push(request);

    // Send to AI service for generation
    this.socket?.emit('text-to-image:generate', {
      ...request,
      imageId,
    });

    // Simulate AI generation with realistic delay
    setTimeout(
      () => {
        const generatedImage = this.generatedImages.get(imageId);
        if (generatedImage) {
          generatedImage.status = 'completed';
          generatedImage.imageUrl = `/api/generated-images/${imageId}.png`;
          generatedImage.thumbnailUrl = `/api/generated-images/${imageId}-thumb.png`;
          generatedImage.completedAt = new Date();

          this.emit('imageGenerated', generatedImage);
          this.socket?.emit('text-to-image:completed', generatedImage);
        }
      },
      3000 + Math.random() * 2000
    );

    return response;
  }

  public async generateLogoFromText(
    venueId: string,
    description: string
  ): Promise<string> {
    const request: TextToImageRequest = {
      prompt: `Modern, professional logo for a pool gaming venue: ${description}. Clean, minimalist design with gaming elements.`,
      style: 'modern',
      aspectRatio: '1:1',
      quality: 'high',
      venueId,
      category: 'logo',
    };

    const response = await this.generateImageFromText(request);
    return response.imageUrl;
  }

  public async generateBackgroundFromText(
    venueId: string,
    description: string
  ): Promise<string> {
    const request: TextToImageRequest = {
      prompt: `Atmospheric background for pool gaming venue: ${description}. Ambient lighting, modern decor, gaming atmosphere.`,
      style: 'realistic',
      aspectRatio: '16:9',
      quality: 'high',
      venueId,
      category: 'background',
    };

    const response = await this.generateImageFromText(request);
    return response.imageUrl;
  }

  public async generateGalleryImagesFromText(
    venueId: string,
    description: string
  ): Promise<string[]> {
    const prompts = [
      `Interior view of pool gaming venue: ${description}. Main gaming area with tables and modern lighting.`,
      `Tournament setup in pool venue: ${description}. Professional tournament atmosphere with spectators.`,
      `Atmospheric corner of pool venue: ${description}. Cozy seating area with ambient lighting.`,
      `Exterior view of pool gaming venue: ${description}. Modern building facade with gaming branding.`,
    ];

    const imageUrls: string[] = [];

    for (const prompt of prompts) {
      const request: TextToImageRequest = {
        prompt,
        style: 'realistic',
        aspectRatio: '4:3',
        quality: 'standard',
        venueId,
        category: 'gallery',
      };

      const response = await this.generateImageFromText(request);
      imageUrls.push(response.imageUrl);
    }

    return imageUrls;
  }

  // Theme Management
  public async generateThemeFromText(description: string): Promise<VenueTheme> {
    const themeId = `generated-${Date.now()}`;

    // Generate logo and background images
    const logoUrl = await this.generateLogoFromText(themeId, description);
    const backgroundUrl = await this.generateBackgroundFromText(
      themeId,
      description
    );

    const theme: VenueTheme = {
      id: themeId,
      name: `Generated Theme - ${new Date().toLocaleDateString()}`,
      primaryColor: this.generateColorFromText(description),
      secondaryColor: this.generateComplementaryColor(description),
      accentColor: this.generateAccentColor(description),
      fontFamily: this.selectFontFromText(description),
      logoUrl,
      backgroundImage: backgroundUrl,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return theme;
  }

  public updateTheme(venueId: string, theme: Partial<VenueTheme>): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.theme = { ...config.theme, ...theme, updatedAt: new Date() };
      this.emit('themeUpdated', { venueId, theme: config.theme });
    }
  }

  public getTheme(venueId: string): VenueTheme | null {
    const config = this.customizations.get(venueId);
    return config?.theme || null;
  }

  // Attribute Management
  public async generateAttributesFromText(
    description: string
  ): Promise<VenueAttribute[]> {
    const attributes: VenueAttribute[] = [];
    const keywords = description.toLowerCase().split(' ');

    // Generate attributes based on description keywords
    if (keywords.includes('modern') || keywords.includes('futuristic')) {
      attributes.push({
        id: `attr-${Date.now()}-1`,
        name: 'Modern Design',
        description: 'Contemporary and sleek venue design',
        category: 'atmosphere',
        isActive: true,
        priority: 1,
      });
    }

    if (keywords.includes('tournament') || keywords.includes('competitive')) {
      attributes.push({
        id: `attr-${Date.now()}-2`,
        name: 'Tournament Ready',
        description: 'Professional tournament facilities',
        category: 'amenities',
        isActive: true,
        priority: 2,
      });
    }

    if (keywords.includes('technology') || keywords.includes('ai')) {
      attributes.push({
        id: `attr-${Date.now()}-3`,
        name: 'AI Enhanced',
        description: 'Advanced AI-powered gaming experience',
        category: 'specialty',
        isActive: true,
        priority: 3,
      });
    }

    if (keywords.includes('community') || keywords.includes('social')) {
      attributes.push({
        id: `attr-${Date.now()}-4`,
        name: 'Community Hub',
        description: 'Vibrant community and social atmosphere',
        category: 'vibe',
        isActive: true,
        priority: 4,
      });
    }

    return attributes;
  }

  public addAttribute(venueId: string, attribute: VenueAttribute): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.attributes.push(attribute);
      this.emit('attributeAdded', { venueId, attribute });
    }
  }

  public updateAttribute(
    venueId: string,
    attributeId: string,
    updates: Partial<VenueAttribute>
  ): void {
    const config = this.customizations.get(venueId);
    if (config) {
      const index = config.attributes.findIndex(
        (attr) => attr.id === attributeId
      );
      if (index !== -1) {
        config.attributes[index] = { ...config.attributes[index], ...updates };
        this.emit('attributeUpdated', {
          venueId,
          attribute: config.attributes[index],
        });
      }
    }
  }

  // Gallery Management
  public async generateGalleryFromText(
    description: string
  ): Promise<VenueGallery[]> {
    const galleries: VenueGallery[] = [];
    const imageUrls = await this.generateGalleryImagesFromText(
      'gallery',
      description
    );

    const titles = [
      'Venue Overview',
      'Tournament Setup',
      'Atmospheric Corner',
      'Exterior View',
    ];
    const categories: VenueGallery['category'][] = [
      'interior',
      'tournaments',
      'atmosphere',
      'exterior',
    ];

    imageUrls.forEach((imageUrl, index) => {
      galleries.push({
        id: `gallery-${Date.now()}-${index}`,
        title: titles[index],
        description: `Generated ${titles[index].toLowerCase()}`,
        imageUrl,
        thumbnailUrl: imageUrl.replace('.png', '-thumb.png'),
        category: categories[index],
        isFeatured: index === 0,
        order: index + 1,
        createdAt: new Date(),
      });
    });

    return galleries;
  }

  public addGalleryItem(venueId: string, item: VenueGallery): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.gallery.push(item);
      this.emit('galleryItemAdded', { venueId, item });
    }
  }

  public updateGalleryItem(
    venueId: string,
    itemId: string,
    updates: Partial<VenueGallery>
  ): void {
    const config = this.customizations.get(venueId);
    if (config) {
      const index = config.gallery.findIndex((item) => item.id === itemId);
      if (index !== -1) {
        config.gallery[index] = { ...config.gallery[index], ...updates };
        this.emit('galleryItemUpdated', {
          venueId,
          item: config.gallery[index],
        });
      }
    }
  }

  // Story Management
  public async generateStoryFromText(description: string): Promise<VenueStory> {
    const storyId = `story-${Date.now()}`;
    const featuredImage = await this.generateBackgroundFromText(
      storyId,
      description
    );

    const story: VenueStory = {
      id: storyId,
      title: 'Our Story',
      content: `Generated story based on: ${description}. This venue represents the perfect blend of modern technology and traditional pool gaming excellence.`,
      featuredImage,
      tags: ['venue', 'story', 'generated'],
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return story;
  }

  public addStory(venueId: string, story: VenueStory): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.stories.push(story);
      this.emit('storyAdded', { venueId, story });
    }
  }

  public updateStory(
    venueId: string,
    storyId: string,
    updates: Partial<VenueStory>
  ): void {
    const config = this.customizations.get(venueId);
    if (config) {
      const index = config.stories.findIndex((story) => story.id === storyId);
      if (index !== -1) {
        config.stories[index] = {
          ...config.stories[index],
          ...updates,
          updatedAt: new Date(),
        };
        this.emit('storyUpdated', { venueId, story: config.stories[index] });
      }
    }
  }

  // Atmosphere Management
  public updateAtmosphere(
    venueId: string,
    atmosphere: Partial<CustomizationConfig['atmosphere']>
  ): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.atmosphere = { ...config.atmosphere, ...atmosphere };
      this.emit('atmosphereUpdated', {
        venueId,
        atmosphere: config.atmosphere,
      });
    }
  }

  // Branding Management
  public updateBranding(
    venueId: string,
    branding: Partial<CustomizationConfig['branding']>
  ): void {
    const config = this.customizations.get(venueId);
    if (config) {
      config.branding = { ...config.branding, ...branding };
      this.emit('brandingUpdated', { venueId, branding: config.branding });
    }
  }

  // Utility Methods
  private generateColorFromText(text: string): string {
    const hash = text.split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `#${Math.abs(hash).toString(16).padStart(6, '0').substring(0, 6)}`;
  }

  private generateComplementaryColor(text: string): string {
    const baseColor = this.generateColorFromText(text);
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `#${(255 - r).toString(16).padStart(2, '0')}${(255 - g).toString(16).padStart(2, '0')}${(255 - b).toString(16).padStart(2, '0')}`;
  }

  private generateAccentColor(text: string): string {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'];
    const index = text.length % colors.length;
    return colors[index];
  }

  private selectFontFromText(text: string): string {
    const fonts = [
      'Orbitron, monospace',
      'Playfair Display, serif',
      'Roboto, sans-serif',
      'Poppins, sans-serif',
    ];
    const index = text.length % fonts.length;
    return fonts[index];
  }

  // Data Retrieval
  public getCustomization(venueId: string): CustomizationConfig | null {
    return this.customizations.get(venueId) || null;
  }

  public getAllCustomizations(): CustomizationConfig[] {
    return Array.from(this.customizations.values());
  }

  public getThemes(): VenueTheme[] {
    return Array.from(this.customizations.values()).map(
      (config) => config.theme
    );
  }

  public getAttributes(venueId: string): VenueAttribute[] {
    const config = this.customizations.get(venueId);
    return config?.attributes || [];
  }

  public getGallery(venueId: string): VenueGallery[] {
    const config = this.customizations.get(venueId);
    return config?.gallery || [];
  }

  public getStories(venueId: string): VenueStory[] {
    const config = this.customizations.get(venueId);
    return config?.stories || [];
  }

  public getGeneratedImages(): TextToImageResponse[] {
    return Array.from(this.generatedImages.values());
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public connect(): void {
    this.socket?.connect();
  }

  public disconnect(): void {
    this.socket?.disconnect();
  }
}
