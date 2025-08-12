import progressionService from '';

export interface VenueStory {
  id: string;
  venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy';
  venueId: string;
  venueName: string;
  storyArc: string;
  currentChapter: number;
  totalChapters: number;
  isCompleted: boolean;
  specialEvents: VenueSpecialEvent[];
}

export interface VenueSpecialEvent {
  id: string;
  title: string;
  description: string;
  triggerCondition: string;
  isTriggered: boolean;
  rewards: {
    experience: number;
    dojoCoins: number;
    items?: string[];
  };
}

export class VenueStoryService {
  private venueStories: Map<string, VenueStory> = new Map();

  constructor() {
    this.initializeVenueStories();
  }

  private initializeVenueStories(): void {
    // Bar venue stories
    this.addVenueStory({
      id: 'bar_1',
      venueType: 'bar',
      venueId: 'bar_1',
      venueName: 'The Rusty Cue',
      storyArc: 'The Local Legend',
      currentChapter: 1,
      totalChapters: 5,
      isCompleted: false,
      specialEvents: [
        {
          id: 'bar_1_event_1',
          title: 'The Regular Challenge',
          description:
            'A local regular challenges you to a game. Win to earn their respect and unlock the "Local Hero" achievement.',
          triggerCondition: 'Play 3 games at this venue',
          isTriggered: false,
          rewards: {
            experience: 100,
            dojoCoins: 50,
            items: ['local_hero_badge'],
          },
        },
      ],
    });

    // Club venue stories
    this.addVenueStory({
      id: 'club_1',
      venueType: 'club',
      venueId: 'club_1',
      venueName: 'Neon Nights',
      storyArc: 'Underground Champion',
      currentChapter: 1,
      totalChapters: 7,
      isCompleted: false,
      specialEvents: [
        {
          id: 'club_1_event_1',
          title: 'The Underground Tournament',
          description:
            'A secret tournament is being held tonight. Only the best players are invited. Can you prove yourself worthy?',
          triggerCondition: 'Win 5 consecutive games',
          isTriggered: false,
          rewards: {
            experience: 300,
            dojoCoins: 150,
            items: ['underground_champion_badge'],
          },
        },
      ],
    });

    // Hall venue stories
    this.addVenueStory({
      id: 'hall_1',
      venueType: 'hall',
      venueId: 'hall_1',
      venueName: 'Elite Pool Hall',
      storyArc: 'Hall of Fame',
      currentChapter: 1,
      totalChapters: 10,
      isCompleted: false,
      specialEvents: [
        {
          id: 'hall_1_event_1',
          title: "The Master's Challenge",
          description:
            "The hall's resident master has noticed your skills. They challenge you to a match that could change your destiny.",
          triggerCondition: 'Reach level 20',
          isTriggered: false,
          rewards: {
            experience: 500,
            dojoCoins: 250,
            items: ['masters_apprentice_badge'],
          },
        },
      ],
    });

    // Arcade venue stories
    this.addVenueStory({
      id: 'arcade_1',
      venueType: 'arcade',
      venueId: 'arcade_1',
      venueName: 'Pixel Pool Paradise',
      storyArc: 'Digital Champion',
      currentChapter: 1,
      totalChapters: 6,
      isCompleted: false,
      specialEvents: [
        {
          id: 'arcade_1_event_1',
          title: 'The High Score Challenge',
          description:
            'Beat the arcade\'s high score to unlock a special digital avatar and earn the "Pixel Perfect" achievement.',
          triggerCondition: 'Score 1000+ points in a single game',
          isTriggered: false,
          rewards: {
            experience: 200,
            dojoCoins: 100,
            items: ['pixel_perfect_avatar'],
          },
        },
      ],
    });

    // Academy venue stories
    this.addVenueStory({
      id: 'academy_1',
      venueType: 'academy',
      venueId: 'academy_1',
      venueName: 'DojoPool Academy',
      storyArc: 'The Path to Mastery',
      currentChapter: 1,
      totalChapters: 12,
      isCompleted: false,
      specialEvents: [
        {
          id: 'academy_1_event_1',
          title: 'The Final Test',
          description:
            "Your training is complete. Face the academy's grandmaster in a final test of skill and determination.",
          triggerCondition: 'Complete all academy training modules',
          isTriggered: false,
          rewards: {
            experience: 1000,
            dojoCoins: 500,
            items: ['grandmaster_badge'],
          },
        },
      ],
    });
  }

  private addVenueStory(story: VenueStory): void {
    this.venueStories.set(story.id, story);
  }

  getVenueStory(venueId: string): VenueStory | undefined {
    return this.venueStories.get(venueId);
  }

  getAllVenueStories(): VenueStory[] {
    return Array.from(this.venueStories.values());
  }

  getVenueStoriesByType(
    venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy'
  ): VenueStory[] {
    return this.getAllVenueStories().filter(
      (story) => story.venueType === venueType
    );
  }

  triggerVenueDiscovery(
    venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy',
    venueId: string,
    venueName: string
  ): void {
    progressionService.addVenueDiscoveryEvent(venueType, venueId, venueName);
  }

  triggerVenueMastery(
    venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy',
    venueId: string,
    venueName: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): void {
    progressionService.addVenueMasteryEvent(
      venueType,
      venueId,
      venueName,
      difficulty
    );
  }

  triggerSpecialEvent(
    venueType: 'bar' | 'club' | 'hall' | 'arcade' | 'academy',
    venueId: string,
    venueName: string,
    eventTitle: string,
    eventDescription: string
  ): void {
    progressionService.addVenueSpecialEvent(
      venueType,
      venueId,
      venueName,
      eventTitle,
      eventDescription
    );
  }

  checkSpecialEventTriggers(venueId: string, playerStats: any): void {
    const story = this.getVenueStory(venueId);
    if (!story) return;

    story.specialEvents.forEach((event) => {
      if (!event.isTriggered) {
        // Check if trigger condition is met
        if (
          this.evaluateTriggerCondition(event.triggerCondition, playerStats)
        ) {
          event.isTriggered = true;
          this.triggerSpecialEvent(
            story.venueType,
            story.venueId,
            story.venueName,
            event.title,
            event.description
          );
        }
      }
    });
  }

  private evaluateTriggerCondition(
    condition: string,
    playerStats: any
  ): boolean {
    // Simple condition evaluation - in a real app, this would be more sophisticated
    if (condition.includes('level') && condition.includes('20')) {
      return playerStats.level >= 20;
    }
    if (condition.includes('consecutive games') && condition.includes('5')) {
      return playerStats.currentStreak >= 5;
    }
    if (condition.includes('games at this venue') && condition.includes('3')) {
      return playerStats.venueGames >= 3;
    }
    return false;
  }

  advanceStoryChapter(venueId: string): void {
    const story = this.getVenueStory(venueId);
    if (story && !story.isCompleted) {
      story.currentChapter++;
      if (story.currentChapter > story.totalChapters) {
        story.isCompleted = true;
        this.triggerVenueMastery(
          story.venueType,
          story.venueId,
          story.venueName,
          'expert'
        );
      }
    }
  }
}

export default new VenueStoryService();
