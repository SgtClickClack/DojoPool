import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { Socket, io } from 'socket.io-client';

export interface VenueTheme {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundStyle: 'cyberpunk' | 'modern' | 'classic' | 'neon' | 'minimal';
  generatedImages: string[];
  customElements: VenueElement[];
}

export interface VenueElement {
  id: string;
  type: 'logo' | 'banner' | 'background' | 'icon' | 'decoration';
  name: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

export interface DojoCoinReward {
  id: string;
  name: string;
  description: string;
  coinAmount: number;
  type: 'tournament' | 'daily' | 'achievement' | 'special' | 'loyalty';
  conditions: RewardCondition[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  maxRedemptions?: number;
  currentRedemptions: number;
}

export interface RewardCondition {
  type: 'tournament_participation' | 'match_win' | 'streak' | 'spending' | 'referral';
  value: number;
  description: string;
}

export interface VenueSpecial {
  id: string;
  name: string;
  description: string;
  type: 'happy_hour' | 'tournament_day' | 'seasonal' | 'weekly' | 'monthly';
  discount: number;
  startTime: string;
  endTime: string;
  days: string[];
  isActive: boolean;
  conditions?: string[];
}

export interface VenueAtmosphere {
  id: string;
  name: string;
  description: string;
  vibe: 'energetic' | 'relaxed' | 'competitive' | 'social' | 'professional';
  lighting: 'bright' | 'dim' | 'neon' | 'warm' | 'cool';
  music: 'upbeat' | 'ambient' | 'classic' | 'electronic' | 'none';
  generatedAttributes: string[];
}

export interface VenueStory {
  id: string;
  title: string;
  content: string;
  category: 'history' | 'mission' | 'community' | 'achievements' | 'future';
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DojoProfile {
  venueId: string;
  name: string;
  description: string;
  theme: VenueTheme;
  atmosphere: VenueAtmosphere;
  rewards: DojoCoinReward[];
  specials: VenueSpecial[];
  stories: VenueStory[];
  photoGallery: string[];
  customBranding: {
    logo: string;
    banner: string;
    favicon: string;
    colorScheme: string[];
  };
  settings: {
    publicProfile: boolean;
    allowReviews: boolean;
    showRewards: boolean;
    showSpecials: boolean;
    autoGenerateContent: boolean;
  };
}

export interface ProfileConfig {
  enableTextToImage: boolean;
  enableAutoGeneration: boolean;
  enableCustomBranding: boolean;
  enableRewardSystem: boolean;
  enableSpecialOffers: boolean;
  enableAtmosphereCustomization: boolean;
  maxGeneratedImages: number;
  maxRewards: number;
  maxSpecials: number;
}

class DojoProfileService extends BrowserEventEmitter {
  private static instance: DojoProfileService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private profiles: DojoProfile[] = [];
  private config: ProfileConfig = {
    enableTextToImage: true,
    enableAutoGeneration: true,
    enableCustomBranding: true,
    enableRewardSystem: true,
    enableSpecialOffers: true,
    enableAtmosphereCustomization: true,
    maxGeneratedImages: 20,
    maxRewards: 50,
    maxSpecials: 20
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): DojoProfileService {
    if (!DojoProfileService.instance) {
      DojoProfileService.instance = new DojoProfileService();
    }
    return DojoProfileService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('dojo_profile:join', { service: 'dojo_profile' });
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.emit('disconnected');
        this.handleReconnection();
      });

      this.socket.on('dojo_profile:profile_updated', (profile: DojoProfile) => {
        this.updateProfile(profile);
      });

      this.socket.on('dojo_profile:theme_generated', (theme: VenueTheme) => {
        this.emit('themeGenerated', theme);
      });

      this.socket.on('dojo_profile:reward_created', (reward: DojoCoinReward) => {
        this.emit('rewardCreated', reward);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this._isConnected = false;
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    }
  }

  // Profile Management
  public async createProfile(profile: Omit<DojoProfile, 'venueId'>): Promise<DojoProfile> {
    const newProfile: DojoProfile = {
      ...profile,
      venueId: this.generateId()
    };

    this.profiles.push(newProfile);
    this.socket?.emit('dojo_profile:profile_created', newProfile);
    return newProfile;
  }

  public async updateProfile(profile: DojoProfile): Promise<void> {
    const index = this.profiles.findIndex(p => p.venueId === profile.venueId);
    if (index !== -1) {
      this.profiles[index] = profile;
      this.socket?.emit('dojo_profile:profile_updated', profile);
    }
  }

  public getProfile(venueId: string): DojoProfile | undefined {
    return this.profiles.find(p => p.venueId === venueId);
  }

  public getAllProfiles(): DojoProfile[] {
    return [...this.profiles];
  }

  // Theme Management
  public async generateTheme(prompt: string, style: VenueTheme['backgroundStyle']): Promise<VenueTheme> {
    const theme: VenueTheme = {
      id: this.generateId(),
      name: `Generated Theme - ${new Date().toLocaleDateString()}`,
      description: `AI-generated theme based on: ${prompt}`,
      primaryColor: this.generateColor(),
      secondaryColor: this.generateColor(),
      accentColor: this.generateColor(),
      backgroundStyle: style,
      generatedImages: await this.generateImages(prompt, style),
      customElements: []
    };

    this.socket?.emit('dojo_profile:theme_generated', theme);
    return theme;
  }

  private async generateImages(prompt: string, style: string): Promise<string[]> {
    // Simulate AI image generation
    const images = [];
    for (let i = 0; i < 3; i++) {
      images.push(`/generated-images/${style}-${Date.now()}-${i}.jpg`);
    }
    return images;
  }

  private generateColor(): string {
    const colors = ['#00ff9d', '#00a8ff', '#feca57', '#ff6b6b', '#a55eea', '#26de81'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // Reward Management
  public async createReward(reward: Omit<DojoCoinReward, 'id' | 'currentRedemptions'>): Promise<DojoCoinReward> {
    const newReward: DojoCoinReward = {
      ...reward,
      id: this.generateId(),
      currentRedemptions: 0
    };

    this.socket?.emit('dojo_profile:reward_created', newReward);
    return newReward;
  }

  public async updateReward(reward: DojoCoinReward): Promise<void> {
    this.socket?.emit('dojo_profile:reward_updated', reward);
  }

  public getRewards(venueId: string): DojoCoinReward[] {
    const profile = this.getProfile(venueId);
    return profile?.rewards || [];
  }

  public getActiveRewards(venueId: string): DojoCoinReward[] {
    const now = new Date();
    return this.getRewards(venueId).filter(reward => 
      reward.isActive && 
      reward.startDate <= now && 
      (!reward.endDate || reward.endDate >= now) &&
      (!reward.maxRedemptions || reward.currentRedemptions < reward.maxRedemptions)
    );
  }

  // Special Offers Management
  public async createSpecial(special: Omit<VenueSpecial, 'id'>): Promise<VenueSpecial> {
    const newSpecial: VenueSpecial = {
      ...special,
      id: this.generateId()
    };

    this.socket?.emit('dojo_profile:special_created', newSpecial);
    return newSpecial;
  }

  public async updateSpecial(special: VenueSpecial): Promise<void> {
    this.socket?.emit('dojo_profile:special_updated', special);
  }

  public getSpecials(venueId: string): VenueSpecial[] {
    const profile = this.getProfile(venueId);
    return profile?.specials || [];
  }

  public getActiveSpecials(venueId: string): VenueSpecial[] {
    return this.getSpecials(venueId).filter(special => special.isActive);
  }

  // Atmosphere Management
  public async createAtmosphere(atmosphere: Omit<VenueAtmosphere, 'id'>): Promise<VenueAtmosphere> {
    const newAtmosphere: VenueAtmosphere = {
      ...atmosphere,
      id: this.generateId(),
      generatedAttributes: await this.generateAtmosphereAttributes(atmosphere.vibe, atmosphere.lighting)
    };

    this.socket?.emit('dojo_profile:atmosphere_created', newAtmosphere);
    return newAtmosphere;
  }

  private async generateAtmosphereAttributes(vibe: string, lighting: string): Promise<string[]> {
    // Simulate AI-generated atmosphere attributes
    const attributes = [
      `${vibe} atmosphere with ${lighting} lighting`,
      `Perfect for ${vibe} gaming sessions`,
      `Enhanced ${lighting} ambiance for competitive play`
    ];
    return attributes;
  }

  // Story Management
  public async createStory(story: Omit<VenueStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<VenueStory> {
    const now = new Date();
    const newStory: VenueStory = {
      ...story,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    this.socket?.emit('dojo_profile:story_created', newStory);
    return newStory;
  }

  public async updateStory(story: VenueStory): Promise<void> {
    const updatedStory = { ...story, updatedAt: new Date() };
    this.socket?.emit('dojo_profile:story_updated', updatedStory);
  }

  public getStories(venueId: string): VenueStory[] {
    const profile = this.getProfile(venueId);
    return profile?.stories || [];
  }

  public getPublicStories(venueId: string): VenueStory[] {
    return this.getStories(venueId).filter(story => story.isPublic);
  }

  // Configuration
  public getConfig(): ProfileConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<ProfileConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('dojo_profile:config_updated', this.config);
  }

  // Utility Methods
  public getConnectionStatus(): boolean {
    return this._isConnected;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private loadMockData(): void {
    // Mock profile
    const mockProfile: DojoProfile = {
      venueId: 'venue1',
      name: 'Cyber Dojo Pool Hall',
      description: 'The ultimate cyberpunk pool gaming experience',
      theme: {
        id: 'theme1',
        name: 'Cyberpunk Neon',
        description: 'Futuristic neon-lit atmosphere',
        primaryColor: '#00ff9d',
        secondaryColor: '#00a8ff',
        accentColor: '#feca57',
        backgroundStyle: 'cyberpunk',
        generatedImages: ['/images/cyberpunk-bg1.jpg', '/images/cyberpunk-bg2.jpg'],
        customElements: []
      },
      atmosphere: {
        id: 'atmosphere1',
        name: 'High Energy Gaming',
        description: 'Energetic atmosphere for competitive play',
        vibe: 'energetic',
        lighting: 'neon',
        music: 'electronic',
        generatedAttributes: ['High energy gaming environment', 'Neon lighting for focus', 'Electronic beats for motivation']
      },
      rewards: [
        {
          id: 'reward1',
          name: 'Tournament Champion',
          description: 'Earn Dojo Coins for winning tournaments',
          coinAmount: 100,
          type: 'tournament',
          conditions: [
            {
              type: 'match_win',
              value: 1,
              description: 'Win a tournament match'
            }
          ],
          isActive: true,
          startDate: new Date(),
          currentRedemptions: 0
        }
      ],
      specials: [
        {
          id: 'special1',
          name: 'Happy Hour Special',
          description: '50% off all drinks during happy hour',
          type: 'happy_hour',
          discount: 50,
          startTime: '17:00',
          endTime: '19:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          isActive: true
        }
      ],
      stories: [
        {
          id: 'story1',
          title: 'Our Mission',
          content: 'To create the ultimate pool gaming experience with cutting-edge technology and community spirit.',
          category: 'mission',
          isPublic: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      photoGallery: ['/images/venue1.jpg', '/images/venue2.jpg'],
      customBranding: {
        logo: '/images/cyber-dojo-logo.png',
        banner: '/images/cyber-dojo-banner.jpg',
        favicon: '/images/favicon.ico',
        colorScheme: ['#00ff9d', '#00a8ff', '#feca57']
      },
      settings: {
        publicProfile: true,
        allowReviews: true,
        showRewards: true,
        showSpecials: true,
        autoGenerateContent: true
      }
    };

    this.profiles.push(mockProfile);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default DojoProfileService; 