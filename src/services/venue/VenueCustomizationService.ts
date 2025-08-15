import { TextGenerationService } from '';

export interface VenueCustomizationOptions {
  venueName: string;
  location: string;
  venueType: 'pool_hall' | 'sports_bar' | 'entertainment_center' | 'community_center';
  atmosphere: 'casual' | 'competitive' | 'upscale' | 'family_friendly';
  targetAudience: 'professionals' | 'students' | 'families' | 'tournament_players';
  specialFeatures?: string[];
}

export interface GeneratedVenueAttributes {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    visualStyle: string;
  };
  branding: {
    tagline: string;
    description: string;
    missionStatement: string;
    uniqueSellingPoints: string[];
  };
  atmosphere: {
    mood: string;
    lighting: string;
    music: string;
    decor: string;
    vibe: string;
  };
  features: {
    amenities: string[];
    specialServices: string[];
    uniqueExperiences: string[];
  };
  story: {
    origin: string;
    community: string;
    achievements: string;
    future: string;
  };
}

export class VenueCustomizationService {
  private textGenerationService: TextGenerationService;

  constructor() {
    this.textGenerationService = new TextGenerationService();
  }

  /**
   * Generate comprehensive venue customization using AI
   */
  async generateVenueCustomization(options: VenueCustomizationOptions): Promise<GeneratedVenueAttributes> {
    try {
      // Generate theme and visual identity
      const theme = await this.generateTheme(options);
      
      // Generate branding elements
      const branding = await this.generateBranding(options);
      
      // Generate atmosphere and vibe
      const atmosphere = await this.generateAtmosphere(options);
      
      // Generate unique features and amenities
      const features = await this.generateFeatures(options);
      
      // Generate venue story and narrative
      const story = await this.generateStory(options);

      return {
        theme,
        branding,
        atmosphere,
        features,
        story
      };
    } catch (error) {
      console.error('Error generating venue customization:', error);
      throw new Error('Failed to generate venue customization');
    }
  }

  /**
   * Generate theme and visual identity for the venue
   */
  private async generateTheme(options: VenueCustomizationOptions) {
    const prompt = `Create a unique visual theme for a ${options.venueType} called "${options.venueName}" in ${options.location}. 
    The venue has a ${options.atmosphere} atmosphere targeting ${options.targetAudience}.
    
    Generate a JSON response with:
    - primaryColor: Main brand color (hex code)
    - secondaryColor: Supporting color (hex code) 
    - accentColor: Highlight color (hex code)
    - fontFamily: Recommended font family
    - visualStyle: Overall visual aesthetic description
    
    Make it unique and memorable for the DojoPool gaming experience.`;

    const response = await this.textGenerationService.generateResponse(prompt);
    return this.parseThemeResponse(response);
  }

  /**
   * Generate branding elements
   */
  private async generateBranding(options: VenueCustomizationOptions) {
    const prompt = `Create compelling branding for a ${options.venueType} called "${options.venueName}" in ${options.location}.
    The venue has a ${options.atmosphere} atmosphere targeting ${options.targetAudience}.
    
    Generate a JSON response with:
    - tagline: Catchy tagline (max 10 words)
    - description: Brief venue description (2-3 sentences)
    - missionStatement: Venue mission statement
    - uniqueSellingPoints: Array of 3-5 unique selling points
    
    Focus on the DojoPool gaming experience and community aspects.`;

    const response = await this.textGenerationService.generateResponse(prompt);
    return this.parseBrandingResponse(response);
  }

  /**
   * Generate atmosphere and vibe elements
   */
  private async generateAtmosphere(options: VenueCustomizationOptions) {
    const prompt = `Describe the perfect atmosphere for a ${options.venueType} called "${options.venueName}" in ${options.location}.
    The venue has a ${options.atmosphere} atmosphere targeting ${options.targetAudience}.
    
    Generate a JSON response with:
    - mood: Overall mood description
    - lighting: Lighting style and ambiance
    - music: Music style and atmosphere
    - decor: Decorative elements and style
    - vibe: Overall vibe description
    
    Focus on creating an immersive DojoPool gaming environment.`;

    const response = await this.textGenerationService.generateResponse(prompt);
    return this.parseAtmosphereResponse(response);
  }

  /**
   * Generate unique features and amenities
   */
  private async generateFeatures(options: VenueCustomizationOptions) {
    const prompt = `Create unique features and amenities for a ${options.venueType} called "${options.venueName}" in ${options.location}.
    The venue has a ${options.atmosphere} atmosphere targeting ${options.targetAudience}.
    
    Generate a JSON response with:
    - amenities: Array of 5-8 venue amenities
    - specialServices: Array of 3-5 special services
    - uniqueExperiences: Array of 3-5 unique DojoPool experiences
    
    Focus on features that enhance the gaming experience and community building.`;

    const response = await this.textGenerationService.generateResponse(prompt);
    return this.parseFeaturesResponse(response);
  }

  /**
   * Generate venue story and narrative
   */
  private async generateStory(options: VenueCustomizationOptions) {
    const prompt = `Create a compelling story for a ${options.venueType} called "${options.venueName}" in ${options.location}.
    The venue has a ${options.atmosphere} atmosphere targeting ${options.targetAudience}.
    
    Generate a JSON response with:
    - origin: How the venue came to be (2-3 sentences)
    - community: Role in the local community (2-3 sentences)
    - achievements: Notable achievements and milestones (2-3 sentences)
    - future: Vision for the future (2-3 sentences)
    
    Make it engaging and authentic for the DojoPool community.`;

    const response = await this.textGenerationService.generateResponse(prompt);
    return this.parseStoryResponse(response);
  }

  /**
   * Parse theme response from AI
   */
  private parseThemeResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        primaryColor: parsed.primaryColor || '#2196F3',
        secondaryColor: parsed.secondaryColor || '#FF9800',
        accentColor: parsed.accentColor || '#4CAF50',
        fontFamily: parsed.fontFamily || 'Orbitron, sans-serif',
        visualStyle: parsed.visualStyle || 'Modern gaming aesthetic'
      };
    } catch (error) {
      console.warn('Failed to parse theme response, using defaults');
      return {
        primaryColor: '#2196F3',
        secondaryColor: '#FF9800',
        accentColor: '#4CAF50',
        fontFamily: 'Orbitron, sans-serif',
        visualStyle: 'Modern gaming aesthetic'
      };
    }
  }

  /**
   * Parse branding response from AI
   */
  private parseBrandingResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        tagline: parsed.tagline || 'Where Legends Play',
        description: parsed.description || 'A premier gaming destination for pool enthusiasts.',
        missionStatement: parsed.missionStatement || 'To create an inclusive community where players can compete, connect, and grow.',
        uniqueSellingPoints: parsed.uniqueSellingPoints || [
          'Advanced AI-powered game tracking',
          'Community-driven tournaments',
          'Professional-grade equipment'
        ]
      };
    } catch (error) {
      console.warn('Failed to parse branding response, using defaults');
      return {
        tagline: 'Where Legends Play',
        description: 'A premier gaming destination for pool enthusiasts.',
        missionStatement: 'To create an inclusive community where players can compete, connect, and grow.',
        uniqueSellingPoints: [
          'Advanced AI-powered game tracking',
          'Community-driven tournaments',
          'Professional-grade equipment'
        ]
      };
    }
  }

  /**
   * Parse atmosphere response from AI
   */
  private parseAtmosphereResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        mood: parsed.mood || 'Energetic and competitive',
        lighting: parsed.lighting || 'Dynamic LED lighting system',
        music: parsed.music || 'Upbeat gaming and electronic music',
        decor: parsed.decor || 'Modern gaming aesthetic with neon accents',
        vibe: parsed.vibe || 'High-energy competitive atmosphere'
      };
    } catch (error) {
      console.warn('Failed to parse atmosphere response, using defaults');
      return {
        mood: 'Energetic and competitive',
        lighting: 'Dynamic LED lighting system',
        music: 'Upbeat gaming and electronic music',
        decor: 'Modern gaming aesthetic with neon accents',
        vibe: 'High-energy competitive atmosphere'
      };
    }
  }

  /**
   * Parse features response from AI
   */
  private parseFeaturesResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        amenities: parsed.amenities || [
          'Professional pool tables',
          'High-speed WiFi',
          'Comfortable seating areas',
          'Refreshment bar',
          'Tournament viewing screens'
        ],
        specialServices: parsed.specialServices || [
          'AI-powered game analysis',
          'Personalized coaching sessions',
          'Tournament organization',
          'Equipment rental',
          'Private event hosting'
        ],
        uniqueExperiences: parsed.uniqueExperiences || [
          'Real-time performance tracking',
          'Community leaderboards',
          'Achievement system',
          'Social gaming features',
          'Exclusive member benefits'
        ]
      };
    } catch (error) {
      console.warn('Failed to parse features response, using defaults');
      return {
        amenities: [
          'Professional pool tables',
          'High-speed WiFi',
          'Comfortable seating areas',
          'Refreshment bar',
          'Tournament viewing screens'
        ],
        specialServices: [
          'AI-powered game analysis',
          'Personalized coaching sessions',
          'Tournament organization',
          'Equipment rental',
          'Private event hosting'
        ],
        uniqueExperiences: [
          'Real-time performance tracking',
          'Community leaderboards',
          'Achievement system',
          'Social gaming features',
          'Exclusive member benefits'
        ]
      };
    }
  }

  /**
   * Parse story response from AI
   */
  private parseStoryResponse(response: string) {
    try {
      const parsed = JSON.parse(response);
      return {
        origin: parsed.origin || 'Founded by passionate pool enthusiasts who wanted to create a modern gaming experience.',
        community: parsed.community || 'A hub for local players, hosting regular tournaments and community events.',
        achievements: parsed.achievements || 'Recognized for excellence in tournament organization and player development.',
        future: parsed.future || 'Expanding to become the premier destination for competitive pool gaming.'
      };
    } catch (error) {
      console.warn('Failed to parse story response, using defaults');
      return {
        origin: 'Founded by passionate pool enthusiasts who wanted to create a modern gaming experience.',
        community: 'A hub for local players, hosting regular tournaments and community events.',
        achievements: 'Recognized for excellence in tournament organization and player development.',
        future: 'Expanding to become the premier destination for competitive pool gaming.'
      };
    }
  }

  /**
   * Apply customization to venue profile
   */
  async applyCustomization(venueId: string, customization: GeneratedVenueAttributes): Promise<void> {
    try {
      // Update venue profile with generated attributes
      const response = await fetch(`/api/venues/${venueId}/customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customization),
      });

      if (!response.ok) {
        throw new Error('Failed to apply venue customization');
      }

      console.log(`Venue customization applied successfully for venue ${venueId}`);
    } catch (error) {
      console.error('Error applying venue customization:', error);
      throw error;
    }
  }

  /**
   * Generate preview of customization
   */
  async generatePreview(options: VenueCustomizationOptions): Promise<GeneratedVenueAttributes> {
    return this.generateVenueCustomization(options);
  }
}

export default VenueCustomizationService; 
