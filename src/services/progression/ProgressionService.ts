import { EventEmitter } from 'events';
import avatarProgressionService from '';

export interface PlayerStats {
  level: number;
  experience: number;
  experienceToNext: number;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  achievements: number;
  clanRank?: string;
  venueMastery: number;
  storyProgress: number;
}

export interface StoryObjective {
  id: string;
  title: string;
  description: string;
  type: 'main' | 'side' | 'social' | 'tournament';
  progress: number;
  maxProgress: number;
  reward: string;
  location?: string;
  isActive: boolean;
  storyContext?: string;
  requirements?: string[];
}

export interface StoryEvent {
  id: string;
  type: 'achievement' | 'social' | 'tournament' | 'venue_discovery' | 'venue_mastery' | 'venue_special';
  title: string;
  description: string;
  timestamp: Date;
  rewards?: {
    experience?: number;
    dojoCoins?: number;
    items?: string[];
  };
  metadata?: {
    venueType?: 'bar' | 'club' | 'hall' | 'arcade' | 'academy';
    venueId?: string;
    venueName?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    storyArc?: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'story' | 'social' | 'tournament' | 'venue' | 'skill';
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  reward: {
    experience: number;
    title?: string;
    avatarItem?: string;
    clanPrestige?: number;
  };
  unlockedAt?: string;
}

class ProgressionService extends EventEmitter {
  private playerStats: PlayerStats;
  private objectives: StoryObjective[];
  private events: StoryEvent[];
  private achievements: Achievement[];

  constructor() {
    super();
    this.playerStats = this.initializePlayerStats();
    this.objectives = this.initializeObjectives();
    this.events = this.initializeEvents();
    this.achievements = this.initializeAchievements();
  }

  private initializePlayerStats(): PlayerStats {
    return {
      level: 15,
      experience: 1250,
      experienceToNext: 2000,
      totalGames: 47,
      wins: 32,
      losses: 15,
      winRate: 68.1,
      currentStreak: 5,
      bestStreak: 8,
      achievements: 12,
      clanRank: 'Elite Member',
      venueMastery: 3,
      storyProgress: 45
    };
  }

  private initializeObjectives(): StoryObjective[] {
    return [
      {
        id: '1',
        title: 'The Rival Challenge',
        description: 'Face off against your rival "ShadowStriker" at Downtown Dojo. This grudge match will determine who advances to the Regional Championship.',
        type: 'main',
        progress: 0,
        maxProgress: 1,
        reward: 'Regional Championship Entry + 500 XP',
        location: 'Downtown Dojo',
        isActive: true,
        storyContext: 'After months of rivalry, the time has come to settle the score. ShadowStriker has been taunting you since your last encounter. This match will determine who represents the region in the upcoming championship.',
        requirements: ['Level 15', 'Win Rate > 60%', 'Complete 3 side objectives']
      },
      {
        id: '2',
        title: 'Clan Territory Expansion',
        description: 'Help your clan "Phoenix Warriors" expand their territory by winning 3 matches at rival-controlled venues.',
        type: 'social',
        progress: 1,
        maxProgress: 3,
        reward: 'Clan Prestige + Special Avatar Item',
        isActive: true,
        storyContext: 'Your clan needs to expand its influence. The rival clans have been encroaching on your territory. Winning these matches will secure your clan\'s position and earn you respect among your peers.',
        requirements: ['Clan Membership', 'Level 10']
      },
      {
        id: '3',
        title: 'Venue Mastery',
        description: 'Become a master of the Elite Pool Hall by winning 5 consecutive games and unlocking the "Hall of Fame" achievement.',
        type: 'side',
        progress: 3,
        maxProgress: 5,
        reward: 'Venue Master Badge + 1000 XP',
        location: 'Elite Pool Hall',
        isActive: true,
        storyContext: 'The Elite Pool Hall is known for its challenging players and prestigious atmosphere. Mastering this venue will earn you recognition as one of the elite players in the region.',
        requirements: ['Level 12', 'Win Rate > 50%']
      }
    ];
  }

  private initializeEvents(): StoryEvent[] {
    return [
      {
        id: '1',
        title: 'Tournament Victory!',
        description: 'You won the "Spring Showdown" tournament and earned the "Tournament Champion" title. Your rival "ShadowStriker" was eliminated in the semifinals.',
        type: 'tournament',
        timestamp: new Date('2025-01-28T10:30:00Z'),
        rewards: {
          experience: 500,
          dojoCoins: 100
        }
      },
      {
        id: '3',
        title: 'New Clan Member',
        description: 'Player "CueMaster" has joined your clan "Phoenix Warriors". They bring valuable skills and will help in upcoming clan wars.',
        type: 'social',
        timestamp: new Date('2025-01-29T10:30:00Z'),
        rewards: {
          experience: 25
        }
      },
      {
        id: '4',
        title: 'Rival Encounter',
        description: 'You encountered "ShadowStriker" at Downtown Dojo. They challenged you to a rematch after your last victory. The tension is building!',
        type: 'social',
        timestamp: new Date('2025-01-30T10:30:00Z'),
        rewards: {
          experience: 10
        }
      }
    ];
  }

  private initializeAchievements(): Achievement[] {
    return [
      {
        id: '1',
        title: 'Tournament Champion',
        description: 'Win your first major tournament',
        category: 'tournament',
        isUnlocked: true,
        progress: 1,
        maxProgress: 1,
        reward: {
          experience: 500,
          title: 'Champion',
          avatarItem: 'champion_crown'
        },
        unlockedAt: '2025-01-28T10:30:00Z'
      },
      {
        id: '2',
        title: 'Rival Slayer',
        description: 'Defeat 5 different rivals in head-to-head matches',
        category: 'story',
        isUnlocked: false,
        progress: 3,
        maxProgress: 5,
        reward: {
          experience: 300,
          title: 'Rival Slayer',
          clanPrestige: 100
        }
      },
      {
        id: '3',
        title: 'Venue Master',
        description: 'Master 3 different venues by winning 5 consecutive games at each',
        category: 'venue',
        isUnlocked: false,
        progress: 1,
        maxProgress: 3,
        reward: {
          experience: 800,
          title: 'Venue Master',
          avatarItem: 'master_badge'
        }
      }
    ];
  }

  // Player Stats Methods
  getPlayerStats(): PlayerStats {
    return { ...this.playerStats };
  }

  addExperience(amount: number): void {
    this.playerStats.experience += amount;
    
    // Check for level up
    while (this.playerStats.experience >= this.playerStats.experienceToNext) {
      this.levelUp();
    }
    
    this.emit('statsUpdated', this.playerStats);
  }

  private levelUp(): void {
    this.playerStats.level += 1;
    this.playerStats.experience -= this.playerStats.experienceToNext;
    this.playerStats.experienceToNext = Math.floor(this.playerStats.experienceToNext * 1.2);
    
    this.emit('levelUp', {
      newLevel: this.playerStats.level,
      experienceToNext: this.playerStats.experienceToNext
    });
  }

  updateGameResult(won: boolean): void {
    this.playerStats.totalGames += 1;
    
    if (won) {
      this.playerStats.wins += 1;
      this.playerStats.currentStreak += 1;
      if (this.playerStats.currentStreak > this.playerStats.bestStreak) {
        this.playerStats.bestStreak = this.playerStats.currentStreak;
      }
    } else {
      this.playerStats.losses += 1;
      this.playerStats.currentStreak = 0;
    }
    
    this.playerStats.winRate = (this.playerStats.wins / this.playerStats.totalGames) * 100;
    
    this.emit('gameResult', { won, stats: this.playerStats });
  }

  // Story Objectives Methods
  getObjectives(): StoryObjective[] {
    return [...this.objectives];
  }

  getObjective(id: string): StoryObjective | undefined {
    return this.objectives.find(obj => obj.id === id);
  }

  updateObjectiveProgress(id: string, progress: number): void {
    const objective = this.objectives.find(obj => obj.id === id);
    if (objective) {
      objective.progress = Math.min(progress, objective.maxProgress);
      
      if (objective.progress >= objective.maxProgress) {
        this.completeObjective(id);
      }
      
      this.emit('objectiveUpdated', objective);
    }
  }

  private completeObjective(id: string): void {
    const objective = this.objectives.find(obj => obj.id === id);
    if (objective) {
      // Add rewards
      if (objective.reward.includes('XP')) {
        const xpMatch = objective.reward.match(/(\d+) XP/);
        if (xpMatch) {
          this.addExperience(parseInt(xpMatch[1]));
        }
      }
      
      // Create completion event
      this.addEvent({
        id: `obj_complete_${id}`,
        title: `Objective Complete: ${objective.title}`,
        description: `You have successfully completed "${objective.title}" and earned your reward: ${objective.reward}`,
        type: 'achievement',
        timestamp: new Date(),
        rewards: {
          experience: 100
        }
      });
      
      this.emit('objectiveCompleted', objective);
    }
  }

  // Story Events Methods
  getEvents(): StoryEvent[] {
    return [...this.events];
  }

  addEvent(event: StoryEvent): void {
    this.events.unshift(event);
    
    // Update player stats based on event type
    this.updatePlayerStats(event);
    
    // Trigger avatar progression for story events
    this.triggerAvatarProgression(event);
    
    // Keep only the last 50 events
    if (this.events.length > 50) {
      this.events = this.events.slice(0, 50);
    }
  }

  markEventAsRead(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      // Event is automatically considered read when accessed
      // No need to track read status separately
    }
  }

  // Achievement Methods
  getAchievements(): Achievement[] {
    return [...this.achievements];
  }

  updateAchievementProgress(id: string, progress: number): void {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.isUnlocked) {
      achievement.progress = Math.min(progress, achievement.maxProgress);
      
      if (achievement.progress >= achievement.maxProgress) {
        this.unlockAchievement(id);
      }
      
      this.emit('achievementUpdated', achievement);
    }
  }

  private unlockAchievement(id: string): void {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement) {
      achievement.isUnlocked = true;
      achievement.unlockedAt = new Date().toISOString();
      this.playerStats.achievements += 1;
      
      // Apply rewards
      this.addExperience(achievement.reward.experience);
      
      // Create unlock event
      this.addEvent({
        id: `ach_unlock_${id}`,
        title: `Achievement Unlocked: ${achievement.title}`,
        description: `Congratulations! You have unlocked the "${achievement.title}" achievement: ${achievement.description}`,
        type: 'achievement',
        timestamp: new Date(),
        rewards: {
          experience: achievement.reward.experience
        }
      });
      
      this.emit('achievementUnlocked', achievement);
    }
  }

  // Story Context Methods
  getStoryContext(): {
    currentChapter: string;
    mainPlot: string;
    activeRivals: string[];
    clanStatus: string;
    nextMajorEvent: string;
  } {
    return {
      currentChapter: 'The Rise of the Phoenix Warriors',
      mainPlot: 'You are a rising star in the pool world, building your reputation and clan while facing off against rivals and competing in tournaments.',
      activeRivals: ['ShadowStriker', 'CueMaster', 'PoolShark'],
      clanStatus: 'Elite Member of Phoenix Warriors - Expanding Territory',
      nextMajorEvent: 'Regional Championship Qualifier'
    };
  }

  // Game Flow Integration
  startObjective(id: string): { success: boolean; message: string; nextStep?: string } {
    const objective = this.getObjective(id);
    if (!objective) {
      return { success: false, message: 'Objective not found' };
    }
    
    if (!objective.isActive) {
      return { success: false, message: 'Objective is not currently available' };
    }
    
    // Check requirements
    if (objective.requirements) {
      const canStart = this.checkRequirements(objective.requirements);
      if (!canStart) {
        return { 
          success: false, 
          message: 'You do not meet the requirements for this objective',
          nextStep: 'Complete the required prerequisites first'
        };
      }
    }
    
    this.emit('objectiveStarted', objective);
    
    return { 
      success: true, 
      message: `Starting objective: ${objective.title}`,
      nextStep: objective.location ? `Navigate to ${objective.location}` : 'Begin the challenge'
    };
  }

  private checkRequirements(requirements: string[]): boolean {
    // Simple requirement checking - can be expanded
    for (const req of requirements) {
      if (req.includes('Level') && req.includes('>')) {
        const levelMatch = req.match(/Level (\d+)/);
        if (levelMatch && this.playerStats.level < parseInt(levelMatch[1])) {
          return false;
        }
      }
      // Add more requirement checks as needed
    }
    return true;
  }

  // Save/Load Methods
  saveProgress(): void {
    const progressData = {
      playerStats: this.playerStats,
      objectives: this.objectives,
      events: this.events,
      achievements: this.achievements,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('dojopool_progression', JSON.stringify(progressData));
    this.emit('progressSaved', progressData);
  }

  loadProgress(): boolean {
    const savedData = localStorage.getItem('dojopool_progression');
    if (savedData) {
      try {
        const progressData = JSON.parse(savedData);
        this.playerStats = progressData.playerStats;
        this.objectives = progressData.objectives;
        this.events = progressData.events;
        this.achievements = progressData.achievements;
        
        this.emit('progressLoaded', progressData);
        return true;
      } catch (error) {
        console.error('Failed to load progression data:', error);
        return false;
      }
    }
    return false;
  }

  getUnreadEvents(): StoryEvent[] {
    return this.events.filter(event => {
      // Consider events from the last 24 hours as "unread"
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return event.timestamp > oneDayAgo;
    });
  }

  // Venue-specific story methods
  addVenueDiscoveryEvent(venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy', venueId: string, venueName: string): void {
    const event: StoryEvent = {
      id: `venue_discovery_${Date.now()}`,
      type: 'venue_discovery',
      title: `Discovered ${venueName}`,
      description: `You've discovered a new ${venueType} venue: ${venueName}. This could be the start of a new adventure!`,
      timestamp: new Date(),
      rewards: {
        experience: 50,
        dojoCoins: 25
      },
      metadata: {
        venueType,
        venueId,
        venueName,
        difficulty: 'beginner',
        storyArc: 'venue_exploration'
      }
    };
    this.addEvent(event);
  }

  addVenueMasteryEvent(venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy', venueId: string, venueName: string, masteryLevel: number): void {
    const event: StoryEvent = {
      id: `venue_mastery_${Date.now()}`,
      type: 'venue_mastery',
      title: `Mastered ${venueName}`,
      description: `You've reached mastery level ${masteryLevel} at ${venueName}! Your skills are recognized throughout the ${venueType} community.`,
      timestamp: new Date(),
      rewards: {
        experience: masteryLevel * 100,
        dojoCoins: masteryLevel * 50
      },
      metadata: {
        venueType,
        venueId,
        venueName,
        difficulty: masteryLevel >= 4 ? 'expert' : 'advanced',
        storyArc: 'venue_mastery'
      }
    };
    this.addEvent(event);
  }

  addVenueSpecialEvent(venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy', venueId: string, venueName: string, eventTitle: string, eventDescription: string): void {
    const event: StoryEvent = {
      id: `venue_special_${Date.now()}`,
      type: 'venue_special',
      title: eventTitle,
      description: eventDescription,
      timestamp: new Date(),
      rewards: {
        experience: 75,
        dojoCoins: 100
      },
      metadata: {
        venueType,
        venueId,
        venueName,
        difficulty: 'intermediate',
        storyArc: 'venue_special'
      }
    };
    this.addEvent(event);
  }

  getVenueStoryEvents(venueType?: 'bar' | 'club' | 'hall' | 'arcade' | 'academy'): StoryEvent[] {
    return this.events.filter(event => 
      (event.type === 'venue_discovery' || event.type === 'venue_mastery' || event.type === 'venue_special') &&
      (!venueType || event.metadata?.venueType === venueType)
    );
  }

  // Avatar progression integration
  private triggerAvatarProgression(event: StoryEvent): void {
    // For now, use a mock user ID - in a real app, this would come from authentication
    const userId = 'current_user';
    
    // Trigger avatar progression based on event type
    avatarProgressionService.onStoryEvent(userId, event.type, {
      ...event,
      venueType: event.metadata?.venueType,
      venueId: event.metadata?.venueId,
      venueName: event.metadata?.venueName,
      description: event.description
    });
  }

  // Update player stats based on event
  private updatePlayerStats(event: StoryEvent): void {
    // Apply event impact
    if (event.rewards) {
      if (event.rewards.experience) {
        this.addExperience(event.rewards.experience);
      }
      // Add other impact effects here
    }
    
    this.emit('eventAdded', event);
  }
}

// Export singleton instance
export const progressionService = new ProgressionService();
export default progressionService; 
