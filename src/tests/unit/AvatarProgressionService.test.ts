import {
  AvatarProgressionService,
  AvatarProgression,
  type StoryArc,
  type StoryAchievement,
  VenueMastery,
} from '../../services/avatar/AvatarProgressionService';

describe('AvatarProgressionService', () => {
  let service: AvatarProgressionService;

  beforeEach(() => {
    service = new AvatarProgressionService();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(service).toBeDefined();
    });

    it('should create new user progression with default values', () => {
      const progression = service.getUserAvatarProgression('user-1');

      expect(progression.userId).toBe('user-1');
      expect(progression.currentLevel).toBe(1);
      expect(progression.experience).toBe(0);
      expect(progression.unlockedFeatures).toHaveLength(1);
      expect(progression.unlockedFeatures[0].id).toBe('beginner_outfit');
      expect(progression.activeEffects).toHaveLength(0);
      expect(progression.storyAchievements).toHaveLength(0);
      expect(progression.venueMastery).toHaveLength(0);
      expect(progression.visualProgression.baseAvatar).toBe(
        '/models/default-avatar.glb'
      );
      expect(progression.visualProgression.currentOutfit).toBe(
        'beginner_outfit'
      );
    });

    it('should return existing progression for same user', () => {
      const progression1 = service.getUserAvatarProgression('user-1');
      const progression2 = service.getUserAvatarProgression('user-1');

      expect(progression1).toBe(progression2);
    });
  });

  describe('story achievements', () => {
    it('should add story achievement', () => {
      const achievement: Omit<StoryAchievement, 'unlockedAt'> = {
        id: 'test_achievement',
        title: 'Test Achievement',
        description: 'A test achievement',
        type: 'tournament',
        storyContext: 'Test context',
      };

      service.addStoryAchievement('user-1', achievement);
      const progression = service.getUserAvatarProgression('user-1');

      expect(progression.storyAchievements).toHaveLength(1);
      expect(progression.storyAchievements[0].id).toBe('test_achievement');
      expect(progression.storyAchievements[0].title).toBe('Test Achievement');
      expect(progression.storyAchievements[0].unlockedAt).toBeInstanceOf(Date);
    });

    it('should handle multiple achievements', () => {
      const achievement1: Omit<StoryAchievement, 'unlockedAt'> = {
        id: 'achievement_1',
        title: 'First Achievement',
        description: 'First test achievement',
        type: 'tournament',
        storyContext: 'First context',
      };

      const achievement2: Omit<StoryAchievement, 'unlockedAt'> = {
        id: 'achievement_2',
        title: 'Second Achievement',
        description: 'Second test achievement',
        type: 'social',
        storyContext: 'Second context',
      };

      service.addStoryAchievement('user-1', achievement1);
      service.addStoryAchievement('user-1', achievement2);

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyAchievements).toHaveLength(2);
    });
  });

  describe('venue mastery', () => {
    it('should update venue mastery for new venue', () => {
      service.updateVenueMastery('user-1', 'bar', 'venue-1', 'Test Bar', true);

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.venueMastery).toHaveLength(1);
      expect(progression.venueMastery[0].venueId).toBe('venue-1');
      expect(progression.venueMastery[0].venueName).toBe('Test Bar');
      expect(progression.venueMastery[0].venueType).toBe('bar');
      expect(progression.venueMastery[0].gamesPlayed).toBe(1);
      expect(progression.venueMastery[0].gamesWon).toBe(1);
      expect(progression.venueMastery[0].masteryLevel).toBe(1);
    });

    it('should update existing venue mastery', () => {
      service.updateVenueMastery('user-1', 'bar', 'venue-1', 'Test Bar', true);
      service.updateVenueMastery('user-1', 'bar', 'venue-1', 'Test Bar', false);

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.venueMastery[0].gamesPlayed).toBe(2);
      expect(progression.venueMastery[0].gamesWon).toBe(1);
    });

    it('should calculate mastery levels correctly', () => {
      // Win 6 out of 10 games to reach level 2 (60% win rate, 10 games played)
      for (let i = 0; i < 6; i++) {
        service.updateVenueMastery(
          'user-1',
          'bar',
          'venue-1',
          'Test Bar',
          true
        );
      }
      for (let i = 0; i < 4; i++) {
        service.updateVenueMastery(
          'user-1',
          'bar',
          'venue-1',
          'Test Bar',
          false
        );
      }

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.venueMastery[0].masteryLevel).toBe(2);
    });
  });

  describe('visual progression', () => {
    it('should get visual progression', () => {
      const visualProgression = service.getVisualProgression('user-1');

      expect(visualProgression.baseAvatar).toBe('/models/default-avatar.glb');
      expect(visualProgression.currentOutfit).toBe('beginner_outfit');
      expect(visualProgression.currentAccessories).toHaveLength(0);
      expect(visualProgression.currentEffects).toHaveLength(0);
      expect(visualProgression.unlockedOutfits).toContain('beginner_outfit');
    });

    it('should update current outfit', () => {
      // First unlock the tournament champion outfit
      const achievement: Omit<StoryAchievement, 'unlockedAt'> = {
        id: 'tournament_win',
        title: 'Tournament Champion',
        description: 'Won a tournament',
        type: 'tournament',
        storyContext: 'Tournament victory',
      };
      service.addStoryAchievement('user-1', achievement);

      service.updateCurrentOutfit('user-1', 'tournament_champion_outfit');

      const visualProgression = service.getVisualProgression('user-1');
      expect(visualProgression.currentOutfit).toBe(
        'tournament_champion_outfit'
      );
    });

    it('should add and remove accessories', () => {
      // Add a custom accessory feature and unlock it
      const progression = service.getUserAvatarProgression('user-1');
      const accessoryFeature = {
        id: 'test_accessory',
        name: 'Test Accessory',
        type: 'accessory' as const,
        rarity: 'rare' as const,
        unlockCondition: 'Test',
        isUnlocked: true,
        unlockDate: new Date(),
        storyContext: 'Test',
      };
      progression.unlockedFeatures.push(accessoryFeature);
      progression.visualProgression.unlockedAccessories.push('test_accessory');

      service.addAccessory('user-1', 'test_accessory');

      let visualProgression = service.getVisualProgression('user-1');
      expect(visualProgression.currentAccessories).toContain('test_accessory');

      service.removeAccessory('user-1', 'test_accessory');

      visualProgression = service.getVisualProgression('user-1');
      expect(visualProgression.currentAccessories).not.toContain(
        'test_accessory'
      );
    });
  });

  describe('story events', () => {
    it('should handle story events and generate achievements', () => {
      service.onStoryEvent('user-1', 'tournament', {
        tournamentName: 'Test Tournament',
        opponent: 'rival-1',
      });

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyAchievements).toHaveLength(1);
      expect(progression.storyAchievements[0].type).toBe('tournament');
    });

    it('should handle different event types', () => {
      service.onStoryEvent('user-1', 'social', {
        friendName: 'Test Friend',
      });

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyAchievements).toHaveLength(1);
      expect(progression.storyAchievements[0].type).toBe('social');
    });

    it('should handle venue events', () => {
      service.onStoryEvent('user-1', 'venue_discovery', {
        venueName: 'Test Venue',
        venueType: 'bar',
      });

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyAchievements).toHaveLength(1);
      expect(progression.storyAchievements[0].type).toBe('venue');
    });
  });

  describe('story arcs', () => {
    it('should start story arc', () => {
      const storyArc: StoryArc = {
        id: 'test_arc',
        title: 'Test Story Arc',
        description: 'A test story arc',
        steps: [
          {
            id: 'step_1',
            description: 'First step',
            isComplete: false,
            eventType: 'tournament_win',
          },
        ],
        currentStep: 0,
        isComplete: false,
        startedAt: new Date(),
      };

      service.startStoryArc('user-1', storyArc);

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyArc).toBeDefined();
      expect(progression.storyArc?.id).toBe('test_arc');
    });

    it('should advance story arc', () => {
      const storyArc: StoryArc = {
        id: 'test_arc',
        title: 'Test Story Arc',
        description: 'A test story arc',
        steps: [
          {
            id: 'step_1',
            description: 'First step',
            isComplete: false,
            eventType: 'tournament_win',
          },
          {
            id: 'step_2',
            description: 'Second step',
            isComplete: false,
            eventType: 'venue_mastery',
          },
        ],
        currentStep: 0,
        isComplete: false,
        startedAt: new Date(),
      };

      service.startStoryArc('user-1', storyArc);
      service.advanceStoryArc('user-1');

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.storyArc?.currentStep).toBe(1);
    });
  });

  describe('pool god blessings', () => {
    it('should grant pool god blessing', () => {
      service.grantPoolGodBlessing(
        'user-1',
        'AI Umpire',
        'Enhanced accuracy',
        60
      );

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.poolGodBlessings).toHaveLength(1);
      expect(progression.poolGodBlessings![0].god).toBe('AI Umpire');
      expect(progression.poolGodBlessings![0].effect).toBe('Enhanced accuracy');
    });

    it('should handle multiple blessings', () => {
      service.grantPoolGodBlessing(
        'user-1',
        'AI Umpire',
        'Enhanced accuracy',
        60
      );
      service.grantPoolGodBlessing('user-1', 'Fluke', 'Lucky shots', 30);

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.poolGodBlessings).toHaveLength(2);
    });
  });

  describe('evolution', () => {
    it('should trigger evolution', () => {
      const storyArc: StoryArc = {
        id: 'evolution_arc',
        title: 'Evolution Arc',
        description: 'An evolution story arc',
        steps: [
          {
            id: 'step_1',
            description: 'Evolution step',
            isComplete: true,
            eventType: 'evolution_trigger',
          },
        ],
        currentStep: 0,
        isComplete: true,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      service.startStoryArc('user-1', storyArc);
      service.triggerEvolution('user-1', 'evolution_arc');

      const progression = service.getUserAvatarProgression('user-1');
      expect(progression.evolutionStage).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle invalid user IDs gracefully', () => {
      expect(() => {
        service.getUserAvatarProgression('');
      }).not.toThrow();
    });

    it('should handle missing story arc gracefully', () => {
      expect(() => {
        service.advanceStoryArc('user-1');
      }).not.toThrow();
    });
  });

  describe('branch coverage', () => {
    it('should reach mastery level 3 when win rate >= 0.6 and gamesPlayed >= 20', () => {
      for (let i = 0; i < 12; i++) {
        service.updateVenueMastery(
          'user-1',
          'club',
          'venue-2',
          'Test Club',
          true
        );
      }
      for (let i = 0; i < 8; i++) {
        service.updateVenueMastery(
          'user-1',
          'club',
          'venue-2',
          'Test Club',
          false
        );
      }
      const progression = service.getUserAvatarProgression('user-1');
      const vm = progression.venueMastery.find((v) => v.venueId === 'venue-2')!;
      expect(vm.masteryLevel).toBeGreaterThanOrEqual(3);
    });

    it('should reach mastery level 4 when win rate >= 0.7 and gamesPlayed >= 30', () => {
      for (let i = 0; i < 21; i++) {
        service.updateVenueMastery(
          'user-1',
          'hall',
          'venue-3',
          'Test Hall',
          true
        );
      }
      for (let i = 0; i < 9; i++) {
        service.updateVenueMastery(
          'user-1',
          'hall',
          'venue-3',
          'Test Hall',
          false
        );
      }
      const progression = service.getUserAvatarProgression('user-1');
      const vm = progression.venueMastery.find((v) => v.venueId === 'venue-3')!;
      expect(vm.masteryLevel).toBeGreaterThanOrEqual(4);
    });

    it('should reach mastery level 5 when win rate >= 0.8 and gamesPlayed >= 50', () => {
      for (let i = 0; i < 40; i++) {
        service.updateVenueMastery(
          'user-1',
          'arcade',
          'venue-4',
          'Test Arcade',
          true
        );
      }
      for (let i = 0; i < 10; i++) {
        service.updateVenueMastery(
          'user-1',
          'arcade',
          'venue-4',
          'Test Arcade',
          false
        );
      }
      const progression = service.getUserAvatarProgression('user-1');
      const vm = progression.venueMastery.find((v) => v.venueId === 'venue-4')!;
      expect(vm.masteryLevel).toBeGreaterThanOrEqual(5);
    });

    it('should handle unknown story event types without throwing', () => {
      expect(() =>
        service.onStoryEvent('user-1', 'unknown_event' as any, {})
      ).not.toThrow();
    });
  });
});
