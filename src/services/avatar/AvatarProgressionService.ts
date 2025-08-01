import progressionService from '';
import venueStoryService from '';

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  steps: StoryArcStep[];
  currentStep: number;
  isComplete: boolean;
  startedAt: Date;
  completedAt?: Date;
  rivalUserId?: string;
}

export interface StoryArcStep {
  id: string;
  description: string;
  isComplete: boolean;
  eventType: string;
  eventData?: any;
  cutsceneId?: string;
}

export interface AvatarProgression {
  userId: string;
  currentLevel: number;
  experience: number;
  unlockedFeatures: AvatarFeature[];
  activeEffects: AvatarEffect[];
  storyAchievements: StoryAchievement[];
  venueMastery: VenueMastery[];
  visualProgression: VisualProgression;
  storyArc?: StoryArc;
  evolutionStage?: string;
  poolGodBlessings?: PoolGodBlessing[];
}

export interface AvatarFeature {
  id: string;
  name: string;
  type: 'outfit' | 'accessory' | 'animation' | 'effect' | 'badge';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockCondition: string;
  isUnlocked: boolean;
  unlockDate?: Date;
  storyContext?: string;
}

export interface AvatarEffect {
  id: string;
  name: string;
  type: 'aura' | 'particle' | 'sound' | 'animation';
  duration: number; // in seconds, 0 for permanent
  intensity: number; // 0-1
  isActive: boolean;
  source: 'achievement' | 'venue_mastery' | 'story_event' | 'tournament';
}

export interface StoryAchievement {
  id: string;
  title: string;
  description: string;
  type: 'tournament' | 'social' | 'venue' | 'progression';
  unlockedAt: Date;
  visualReward?: AvatarFeature;
  storyContext: string;
}

export interface VenueMastery {
  venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy';
  venueId: string;
  venueName: string;
  masteryLevel: number; // 1-5
  gamesPlayed: number;
  gamesWon: number;
  specialEventsCompleted: number;
  visualRewards: AvatarFeature[];
}

export interface VisualProgression {
  baseAvatar: string;
  currentOutfit: string;
  currentAccessories: string[];
  currentEffects: string[];
  unlockedOutfits: string[];
  unlockedAccessories: string[];
  unlockedEffects: string[];
  storyBadges: string[];
  venueBadges: string[];
}

export interface PoolGodBlessing {
  id: string;
  god: 'AI Umpire' | 'Commentator' | 'Fluke';
  description: string;
  grantedAt: Date;
  expiresAt?: Date;
  effect: string;
}

export class AvatarProgressionService {
  private avatarProgressions: Map<string, AvatarProgression> = new Map();

  constructor() {
    this.initializeDefaultFeatures();
  }

  private initializeDefaultFeatures(): void {
    // Initialize default avatar features that can be unlocked
    const defaultFeatures: AvatarFeature[] = [
      {
        id: 'beginner_outfit',
        name: 'Novice Pool Player',
        type: 'outfit',
        rarity: 'common',
        unlockCondition: 'Complete tutorial',
        isUnlocked: true,
        storyContext: 'Your first steps into the world of competitive pool'
      },
      {
        id: 'tournament_champion_outfit',
        name: 'Tournament Champion',
        type: 'outfit',
        rarity: 'epic',
        unlockCondition: 'Win a tournament',
        isUnlocked: false,
        storyContext: 'Prove your worth in the arena of champions'
      },
      {
        id: 'venue_master_badge',
        name: 'Venue Master Badge',
        type: 'badge',
        rarity: 'rare',
        unlockCondition: 'Master any venue type',
        isUnlocked: false,
        storyContext: 'Show your mastery of a specific venue type'
      },
      {
        id: 'social_butterfly_effect',
        name: 'Social Butterfly Aura',
        type: 'effect',
        rarity: 'rare',
        unlockCondition: 'Make 10 friends',
        isUnlocked: false,
        storyContext: 'Your social connections create a positive aura'
      },
      {
        id: 'rival_challenger_outfit',
        name: 'Rival Challenger',
        type: 'outfit',
        rarity: 'epic',
        unlockCondition: 'Defeat a rival in a grudge match',
        isUnlocked: false,
        storyContext: 'Face your rival and prove your superiority'
      }
    ];

    // Store default features for reference
    this.defaultFeatures = defaultFeatures;
  }

  private defaultFeatures: AvatarFeature[] = [];

  getUserAvatarProgression(userId: string): AvatarProgression {
    if (!this.avatarProgressions.has(userId)) {
      // Initialize new user progression
      const newProgression: AvatarProgression = {
        userId,
        currentLevel: 1,
        experience: 0,
        unlockedFeatures: [this.defaultFeatures[0]], // Start with beginner outfit
        activeEffects: [],
        storyAchievements: [],
        venueMastery: [],
        visualProgression: {
          baseAvatar: '/models/default-avatar.glb',
          currentOutfit: 'beginner_outfit',
          currentAccessories: [],
          currentEffects: [],
          unlockedOutfits: ['beginner_outfit'],
          unlockedAccessories: [],
          unlockedEffects: [],
          storyBadges: [],
          venueBadges: []
        }
      };
      this.avatarProgressions.set(userId, newProgression);
    }
    return this.avatarProgressions.get(userId)!;
  }

  addStoryAchievement(userId: string, achievement: Omit<StoryAchievement, 'unlockedAt'>): void {
    const progression = this.getUserAvatarProgression(userId);
    const newAchievement: StoryAchievement = {
      ...achievement,
      unlockedAt: new Date()
    };

    progression.storyAchievements.push(newAchievement);

    // Check if achievement unlocks any avatar features
    this.checkAchievementUnlocks(userId, newAchievement);

    // Add visual effect for achievement
    this.addTemporaryEffect(userId, {
      id: `achievement_${achievement.id}`,
      name: `${achievement.title} Effect`,
      type: 'aura',
      duration: 30, // 30 seconds
      intensity: 0.8,
      isActive: true,
      source: 'achievement'
    });
  }

  updateVenueMastery(userId: string, venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy', venueId: string, venueName: string, gameWon: boolean): void {
    const progression = this.getUserAvatarProgression(userId);
    
    let venueMastery = progression.venueMastery.find(vm => vm.venueId === venueId);
    if (!venueMastery) {
      venueMastery = {
        venueType,
        venueId,
        venueName,
        masteryLevel: 1,
        gamesPlayed: 0,
        gamesWon: 0,
        specialEventsCompleted: 0,
        visualRewards: []
      };
      progression.venueMastery.push(venueMastery);
    }

    venueMastery.gamesPlayed++;
    if (gameWon) {
      venueMastery.gamesWon++;
    }

    // Check for mastery level progression
    const newLevel = this.calculateMasteryLevel(venueMastery.gamesPlayed, venueMastery.gamesWon);
    if (newLevel > venueMastery.masteryLevel) {
      venueMastery.masteryLevel = newLevel;
      this.unlockVenueMasteryRewards(userId, venueMastery);
    }
  }

  private calculateMasteryLevel(gamesPlayed: number, gamesWon: number): number {
    const winRate = gamesWon / gamesPlayed;
    if (gamesPlayed >= 50 && winRate >= 0.8) return 5; // Master
    if (gamesPlayed >= 30 && winRate >= 0.7) return 4; // Expert
    if (gamesPlayed >= 20 && winRate >= 0.6) return 3; // Advanced
    if (gamesPlayed >= 10 && winRate >= 0.5) return 2; // Intermediate
    return 1; // Beginner
  }

  private unlockVenueMasteryRewards(userId: string, venueMastery: VenueMastery): void {
    const progression = this.getUserAvatarProgression(userId);
    
    // Unlock venue-specific features based on mastery level
    const venueFeature: AvatarFeature = {
      id: `${venueMastery.venueType}_master_${venueMastery.masteryLevel}`,
      name: `${venueMastery.venueName} Master Level ${venueMastery.masteryLevel}`,
      type: 'badge',
      rarity: venueMastery.masteryLevel >= 4 ? 'epic' : 'rare',
      unlockCondition: `Reach mastery level ${venueMastery.masteryLevel} at ${venueMastery.venueName}`,
      isUnlocked: true,
      unlockDate: new Date(),
      storyContext: `Your dedication to ${venueMastery.venueName} has earned you recognition as a master`
    };

    progression.unlockedFeatures.push(venueFeature);
    venueMastery.visualRewards.push(venueFeature);

    // Add to visual progression
    progression.visualProgression.venueBadges.push(venueFeature.id);

    // Add temporary effect for mastery achievement
    this.addTemporaryEffect(userId, {
      id: `mastery_${venueMastery.venueId}_${venueMastery.masteryLevel}`,
      name: `${venueMastery.venueName} Mastery Aura`,
      type: 'aura',
      duration: 60, // 1 minute
      intensity: venueMastery.masteryLevel / 5,
      isActive: true,
      source: 'venue_mastery'
    });
  }

  private checkAchievementUnlocks(userId: string, achievement: StoryAchievement): void {
    const progression = this.getUserAvatarProgression(userId);
    
    // Check if achievement unlocks any features
    this.defaultFeatures.forEach(feature => {
      if (!feature.isUnlocked && this.evaluateUnlockCondition(feature.unlockCondition, achievement, progression)) {
        feature.isUnlocked = true;
        feature.unlockDate = new Date();
        feature.storyContext = achievement.storyContext;
        
        progression.unlockedFeatures.push(feature);
        
        // Add to visual progression based on feature type
        switch (feature.type) {
          case 'outfit':
            progression.visualProgression.unlockedOutfits.push(feature.id);
            break;
          case 'accessory':
            progression.visualProgression.unlockedAccessories.push(feature.id);
            break;
          case 'effect':
            progression.visualProgression.unlockedEffects.push(feature.id);
            break;
          case 'badge':
            progression.visualProgression.storyBadges.push(feature.id);
            break;
        }
      }
    });
  }

  private evaluateUnlockCondition(condition: string, achievement: StoryAchievement, progression: AvatarProgression): boolean {
    // Simple condition evaluation - in a real app, this would be more sophisticated
    if (condition.includes('tournament') && achievement.type === 'tournament') {
      return true;
    }
    if (condition.includes('social') && achievement.type === 'social') {
      return true;
    }
    if (condition.includes('venue') && achievement.type === 'venue') {
      return true;
    }
    if (condition.includes('rival') && achievement.title.toLowerCase().includes('rival')) {
      return true;
    }
    return false;
  }

  private addTemporaryEffect(userId: string, effect: AvatarEffect): void {
    const progression = this.getUserAvatarProgression(userId);
    progression.activeEffects.push(effect);

    // Remove effect after duration
    if (effect.duration > 0) {
      setTimeout(() => {
        const updatedProgression = this.getUserAvatarProgression(userId);
        const effectIndex = updatedProgression.activeEffects.findIndex(e => e.id === effect.id);
        if (effectIndex !== -1) {
          updatedProgression.activeEffects.splice(effectIndex, 1);
        }
      }, effect.duration * 1000);
    }
  }

  getVisualProgression(userId: string): VisualProgression {
    const progression = this.getUserAvatarProgression(userId);
    return progression.visualProgression;
  }

  updateCurrentOutfit(userId: string, outfitId: string): void {
    const progression = this.getUserAvatarProgression(userId);
    const outfit = progression.unlockedFeatures.find(f => f.id === outfitId && f.type === 'outfit');
    
    if (outfit && outfit.isUnlocked) {
      progression.visualProgression.currentOutfit = outfitId;
    }
  }

  addAccessory(userId: string, accessoryId: string): void {
    const progression = this.getUserAvatarProgression(userId);
    const accessory = progression.unlockedFeatures.find(f => f.id === accessoryId && f.type === 'accessory');
    
    if (accessory && accessory.isUnlocked) {
      if (!progression.visualProgression.currentAccessories.includes(accessoryId)) {
        progression.visualProgression.currentAccessories.push(accessoryId);
      }
    }
  }

  removeAccessory(userId: string, accessoryId: string): void {
    const progression = this.getUserAvatarProgression(userId);
    const index = progression.visualProgression.currentAccessories.indexOf(accessoryId);
    if (index !== -1) {
      progression.visualProgression.currentAccessories.splice(index, 1);
    }
  }

  // Integration with ProgressionService
  onStoryEvent(userId: string, eventType: string, eventData: any): void {
    // Create achievement from story event
    const achievement: Omit<StoryAchievement, 'unlockedAt'> = {
      id: `story_${eventType}_${Date.now()}`,
      title: this.generateAchievementTitle(eventType, eventData),
      description: this.generateAchievementDescription(eventType, eventData),
      type: this.mapEventTypeToAchievementType(eventType),
      visualReward: this.generateVisualReward(eventType, eventData),
      storyContext: eventData.description || 'Story-driven achievement'
    };

    this.addStoryAchievement(userId, achievement);
  }

  private generateAchievementTitle(eventType: string, eventData: any): string {
    switch (eventType) {
      case 'venue_discovery':
        return `Explorer: ${eventData.venueName}`;
      case 'venue_mastery':
        return `Master of ${eventData.venueName}`;
      case 'tournament':
        return 'Tournament Champion';
      case 'social':
        return 'Social Butterfly';
      default:
        return 'Story Achievement';
    }
  }

  private generateAchievementDescription(eventType: string, eventData: any): string {
    switch (eventType) {
      case 'venue_discovery':
        return `Discovered the ${eventData.venueType} venue: ${eventData.venueName}`;
      case 'venue_mastery':
        return `Became a master of ${eventData.venueName}`;
      case 'tournament':
        return 'Proved your worth in competitive play';
      case 'social':
        return 'Built strong connections with other players';
      default:
        return 'Achieved something remarkable';
    }
  }

  private mapEventTypeToAchievementType(eventType: string): 'tournament' | 'social' | 'venue' | 'progression' {
    switch (eventType) {
      case 'tournament':
        return 'tournament';
      case 'social':
        return 'social';
      case 'venue_discovery':
      case 'venue_mastery':
      case 'venue_special':
        return 'venue';
      default:
        return 'progression';
    }
  }

  private generateVisualReward(eventType: string, eventData: any): AvatarFeature | undefined {
    // Generate appropriate visual rewards based on event type
    switch (eventType) {
      case 'venue_discovery':
        return {
          id: `discovery_${eventData.venueType}_badge`,
          name: `${eventData.venueType} Explorer Badge`,
          type: 'badge',
          rarity: 'common',
          unlockCondition: `Discover ${eventData.venueType} venue`,
          isUnlocked: true,
          unlockDate: new Date(),
          storyContext: `Explored the ${eventData.venueType} venue: ${eventData.venueName}`
        };
      case 'venue_mastery':
        return {
          id: `mastery_${eventData.venueType}_outfit`,
          name: `${eventData.venueType} Master Outfit`,
          type: 'outfit',
          rarity: 'epic',
          unlockCondition: `Master ${eventData.venueType} venue`,
          isUnlocked: true,
          unlockDate: new Date(),
          storyContext: `Mastered the ${eventData.venueType} venue: ${eventData.venueName}`
        };
      default:
        return undefined;
    }
  }

  // Add methods for story arc management, evolution, and blessings
  public startStoryArc(userId: string, arc: StoryArc): void {
    const progression = this.getUserAvatarProgression(userId);
    progression.storyArc = { ...arc, currentStep: 0, isComplete: false, startedAt: new Date() };
  }

  public advanceStoryArc(userId: string): void {
    const progression = this.getUserAvatarProgression(userId);
    if (!progression.storyArc || progression.storyArc.isComplete) return;
    const arc = progression.storyArc;
    if (arc.currentStep < arc.steps.length) {
      arc.steps[arc.currentStep].isComplete = true;
      arc.currentStep++;
      if (arc.currentStep >= arc.steps.length) {
        arc.isComplete = true;
        arc.completedAt = new Date();
        // Optionally trigger evolution or achievement
        this.triggerEvolution(userId, arc.id);
      }
    }
  }

  public triggerEvolution(userId: string, arcId: string): void {
    const progression = this.getUserAvatarProgression(userId);
    // Example: evolve based on arcId
    if (arcId === 'rivalry_arc') {
      progression.evolutionStage = 'Rival Champion';
    } else if (arcId === 'dojo_mastery_arc') {
      progression.evolutionStage = 'Dojo Master';
    } else {
      progression.evolutionStage = 'Evolved';
    }
  }

  public grantPoolGodBlessing(userId: string, god: 'AI Umpire' | 'Commentator' | 'Fluke', effect: string, durationMinutes = 60): void {
    const progression = this.getUserAvatarProgression(userId);
    const blessing: PoolGodBlessing = {
      id: `${god}_${Date.now()}`,
      god,
      description: `Blessing from ${god}: ${effect}`,
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60000),
      effect
    };
    if (!progression.poolGodBlessings) progression.poolGodBlessings = [];
    progression.poolGodBlessings.push(blessing);
  }
}

export default new AvatarProgressionService(); 
