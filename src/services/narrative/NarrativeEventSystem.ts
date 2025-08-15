import { AvatarProgressionService } from '';
// import { realTimeAICommentaryService } from '.js';
import { EnhancedTournamentService } from '';

export interface NarrativeEvent {
  id: string;
  type: 'story_arc' | 'character_interaction' | 'world_event' | 'achievement' | 'rival_encounter';
  title: string;
  description: string;
  content: string;
  triggers: NarrativeTrigger[];
  consequences: NarrativeConsequence[];
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
  metadata: Record<string, any>;
}

export interface NarrativeTrigger {
  type: 'game_event' | 'location' | 'achievement' | 'time' | 'player_action';
  condition: string;
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
}

export interface NarrativeConsequence {
  type: 'avatar_progression' | 'story_unlock' | 'character_relationship' | 'world_change' | 'achievement';
  effect: string;
  value: any;
  duration?: number;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  personality: string;
  backstory: string;
  relationship: 'friend' | 'rival' | 'mentor' | 'neutral' | 'enemy';
  currentLocation?: string;
  dialogue: CharacterDialogue[];
  avatar: string;
  isActive: boolean;
}

export interface CharacterDialogue {
  id: string;
  context: string;
  content: string;
  emotion: 'friendly' | 'hostile' | 'neutral' | 'excited' | 'sad';
  conditions: NarrativeTrigger[];
}

export interface StoryArc {
  id: string;
  title: string;
  description: string;
  chapters: StoryChapter[];
  currentChapter: number;
  isActive: boolean;
  isCompleted: boolean;
  startedAt: Date;
  completedAt?: Date;
  requiredLevel?: number;
  requiredAchievements?: string[];
  rewards: StoryReward[];
}

export interface StoryChapter {
  id: string;
  title: string;
  description: string;
  events: NarrativeEvent[];
  isCompleted: boolean;
  requiredEvents: string[];
  unlockCondition: string;
}

export interface StoryReward {
  type: 'avatar_feature' | 'experience' | 'dojo_coins' | 'nft' | 'territory_access';
  value: any;
  description: string;
}

export interface WorldState {
  currentLocation: string;
  activeEvents: NarrativeEvent[];
  characterLocations: Map<string, string>;
  worldFlags: Map<string, boolean>;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weather: 'clear' | 'rainy' | 'stormy' | 'foggy';
  specialEvents: string[];
}

export class NarrativeEventSystem {
  private static instance: NarrativeEventSystem;
  private events: Map<string, NarrativeEvent> = new Map();
  private characters: Map<string, Character> = new Map();
  private storyArcs: Map<string, StoryArc> = new Map();
  private worldState: WorldState;
  private avatarService: AvatarProgressionService;
  // private aiCommentaryService: typeof realTimeAICommentaryService;
  private tournamentService: EnhancedTournamentService;
  private activePlayerArcs: Map<string, StoryArc[]> = new Map();

  constructor() {
    this.avatarService = new AvatarProgressionService();
    // this.aiCommentaryService = realTimeAICommentaryService;
    this.tournamentService = new EnhancedTournamentService();
    this.worldState = this.initializeWorldState();
    this.initializeCharacters();
    this.initializeStoryArcs();
    this.initializeEvents();
  }

  static getInstance(): NarrativeEventSystem {
    if (!NarrativeEventSystem.instance) {
      NarrativeEventSystem.instance = new NarrativeEventSystem();
    }
    return NarrativeEventSystem.instance;
  }

  /**
   * Initialize the world state
   */
  private initializeWorldState(): WorldState {
    return {
      currentLocation: 'dojo_entrance',
      activeEvents: [],
      characterLocations: new Map(),
      worldFlags: new Map(),
      timeOfDay: 'morning',
      weather: 'clear',
      specialEvents: []
    };
  }

  /**
   * Initialize characters with personalities and dialogue
   */
  private initializeCharacters(): void {
    const characters: Character[] = [
      {
        id: 'master_li',
        name: 'Master Li',
        title: 'The Wise Mentor',
        personality: 'Wise, patient, and encouraging. Master Li has seen countless players rise and fall.',
        backstory: 'A legendary pool player who now dedicates his life to teaching others the art of pool.',
        relationship: 'mentor',
        currentLocation: 'dojo_training_room',
        dialogue: [
          {
            id: 'welcome',
            context: 'first_meeting',
            content: 'Welcome, young one. The path to pool mastery is long, but every journey begins with a single shot.',
            emotion: 'friendly',
            conditions: [{ type: 'game_event', condition: 'first_visit', value: true, operator: 'equals' }]
          },
          {
            id: 'encouragement',
            context: 'after_loss',
            content: 'Loss is not failure, it is learning. Each defeat teaches us something new about ourselves and the game.',
            emotion: 'friendly',
            conditions: [{ type: 'game_event', condition: 'recent_loss', value: true, operator: 'equals' }]
          }
        ],
        avatar: '/characters/master_li.png',
        isActive: true
      },
      {
        id: 'shadow_player',
        name: 'The Shadow',
        title: 'Mysterious Rival',
        personality: 'Mysterious, competitive, and challenging. The Shadow appears when least expected.',
        backstory: 'A skilled player who operates in the shadows, challenging worthy opponents.',
        relationship: 'rival',
        currentLocation: 'underground_club',
        dialogue: [
          {
            id: 'challenge',
            context: 'rival_encounter',
            content: 'You think you\'re ready? Prove it on the table.',
            emotion: 'hostile',
            conditions: [{ type: 'game_event', condition: 'rival_encounter', value: true, operator: 'equals' }]
          }
        ],
        avatar: '/characters/shadow_player.png',
        isActive: true
      },
      {
        id: 'lucky_lucy',
        name: 'Lucky Lucy',
        title: 'The Fluke Master',
        personality: 'Cheerful, lucky, and unpredictable. Lucy believes in the power of positive thinking.',
        backstory: 'A player known for incredible luck and impossible shots.',
        relationship: 'friend',
        currentLocation: 'casual_bar',
        dialogue: [
          {
            id: 'lucky_shot',
            context: 'fluke_shot',
            content: 'See? Sometimes the pool gods smile upon us!',
            emotion: 'excited',
            conditions: [{ type: 'game_event', condition: 'fluke_shot', value: true, operator: 'equals' }]
          }
        ],
        avatar: '/characters/lucky_lucy.png',
        isActive: true
      }
    ];

    characters.forEach(char => this.characters.set(char.id, char));
  }

  /**
   * Initialize story arcs
   */
  private initializeStoryArcs(): void {
    const arcs: StoryArc[] = [
      {
        id: 'the_beginning',
        title: 'The Beginning',
        description: 'Your journey into the world of competitive pool begins.',
        chapters: [
          {
            id: 'chapter_1',
            title: 'First Steps',
            description: 'Learn the basics and meet your mentor.',
            events: [],
            isCompleted: false,
            requiredEvents: ['tutorial_complete'],
            unlockCondition: 'Complete tutorial'
          },
          {
            id: 'chapter_2',
            title: 'First Victory',
            description: 'Win your first match and gain confidence.',
            events: [],
            isCompleted: false,
            requiredEvents: ['first_win'],
            unlockCondition: 'Win first match'
          }
        ],
        currentChapter: 0,
        isActive: false,
        isCompleted: false,
        startedAt: new Date(),
        rewards: [
          {
            type: 'avatar_feature',
            value: 'beginner_outfit',
            description: 'Novice Pool Player Outfit'
          }
        ]
      },
      {
        id: 'rival_rising',
        title: 'Rival Rising',
        description: 'A mysterious rival appears, challenging your skills.',
        chapters: [
          {
            id: 'chapter_1',
            title: 'The Challenge',
            description: 'Face your rival for the first time.',
            events: [],
            isCompleted: false,
            requiredEvents: ['rival_encounter'],
            unlockCondition: 'Encounter rival'
          }
        ],
        currentChapter: 0,
        isActive: false,
        isCompleted: false,
        startedAt: new Date(),
        requiredLevel: 5,
        rewards: [
          {
            type: 'avatar_feature',
            value: 'rival_challenger_outfit',
            description: 'Rival Challenger Outfit'
          }
        ]
      }
    ];

    arcs.forEach(arc => this.storyArcs.set(arc.id, arc));
  }

  /**
   * Initialize narrative events
   */
  private initializeEvents(): void {
    const events: NarrativeEvent[] = [
      {
        id: 'tutorial_complete',
        type: 'achievement',
        title: 'Tutorial Complete',
        description: 'You have completed the basic tutorial.',
        content: 'Master Li nods approvingly. "You show promise, young one. The path to greatness lies before you."',
        triggers: [
          { type: 'game_event', condition: 'tutorial_complete', value: true, operator: 'equals' }
        ],
        consequences: [
          { type: 'avatar_progression', effect: 'unlock_feature', value: 'beginner_outfit' },
          { type: 'story_unlock', effect: 'start_arc', value: 'the_beginning' }
        ],
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        metadata: { location: 'dojo_training_room' }
      },
      {
        id: 'first_win',
        type: 'achievement',
        title: 'First Victory',
        description: 'You have won your first match.',
        content: 'The feeling of victory courses through you. This is just the beginning.',
        triggers: [
          { type: 'game_event', condition: 'first_win', value: true, operator: 'equals' }
        ],
        consequences: [
          { type: 'avatar_progression', effect: 'add_experience', value: 100 },
          { type: 'story_unlock', effect: 'advance_chapter', value: 'the_beginning' }
        ],
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        metadata: { location: 'any' }
      },
      {
        id: 'rival_encounter',
        type: 'rival_encounter',
        title: 'The Shadow Appears',
        description: 'A mysterious figure challenges you to a match.',
        content: 'From the shadows emerges a figure. "You think you\'re ready? Prove it on the table."',
        triggers: [
          { type: 'game_event', condition: 'level_reached', value: 5, operator: 'greater_than' },
          { type: 'location', condition: 'underground_club', value: true, operator: 'equals' }
        ],
        consequences: [
          { type: 'story_unlock', effect: 'start_arc', value: 'rival_rising' },
          { type: 'character_relationship', effect: 'set_rival', value: 'shadow_player' }
        ],
        isActive: true,
        isCompleted: false,
        createdAt: new Date(),
        metadata: { location: 'underground_club', character: 'shadow_player' }
      }
    ];

    events.forEach(event => this.events.set(event.id, event));
  }

  /**
   * Process a game event and trigger narrative responses
   */
  async processGameEvent(userId: string, eventType: string, eventData: any): Promise<void> {
    // Check for triggered events
    const triggeredEvents = this.checkEventTriggers(eventType, eventData);
    
    for (const event of triggeredEvents) {
      await this.triggerEvent(userId, event);
    }

    // Check for character interactions
    const characterInteraction = this.checkCharacterInteraction(eventType, eventData);
    if (characterInteraction) {
      await this.triggerCharacterInteraction(userId, characterInteraction);
    }

    // Update world state
    this.updateWorldState(eventType, eventData);

    // Generate AI commentary for narrative events
    if (triggeredEvents.length > 0) {
      await this.generateNarrativeCommentary(triggeredEvents[0]);
    }
  }

  /**
   * Check if any events should be triggered
   */
  private checkEventTriggers(eventType: string, eventData: any): NarrativeEvent[] {
    const triggered: NarrativeEvent[] = [];

    for (const event of this.events.values()) {
      if (event.isCompleted || !event.isActive) continue;

      const shouldTrigger = event.triggers.every(trigger => {
        switch (trigger.type) {
          case 'game_event':
            return this.evaluateCondition(eventData[trigger.condition], trigger.value, trigger.operator);
          case 'location':
            return this.evaluateCondition(this.worldState.currentLocation, trigger.value, trigger.operator);
          case 'achievement':
            return this.evaluateCondition(eventData.achievements?.includes(trigger.condition), trigger.value, trigger.operator);
          default:
            return false;
        }
      });

      if (shouldTrigger) {
        triggered.push(event);
      }
    }

    return triggered;
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(actual: any, expected: any, operator: string): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'in_range':
        return actual >= expected[0] && actual <= expected[1];
      default:
        return false;
    }
  }

  /**
   * Trigger a narrative event
   */
  private async triggerEvent(userId: string, event: NarrativeEvent): Promise<void> {
    event.isCompleted = true;
    event.completedAt = new Date();

    // Apply consequences
    for (const consequence of event.consequences) {
      await this.applyConsequence(userId, consequence);
    }

    // Update avatar progression
    this.avatarService.onStoryEvent(userId, event.type, {
      title: event.title,
      description: event.description,
      content: event.content,
      metadata: event.metadata
    });

    console.log(`Narrative event triggered: ${event.title}`);
  }

  /**
   * Apply a narrative consequence
   */
  private async applyConsequence(userId: string, consequence: NarrativeConsequence): Promise<void> {
    switch (consequence.type) {
      case 'avatar_progression':
        // Handle avatar progression consequences
        break;
      case 'story_unlock':
        if (consequence.effect === 'start_arc') {
          this.startStoryArc(userId, consequence.value);
        } else if (consequence.effect === 'advance_chapter') {
          this.advanceStoryArc(userId, consequence.value);
        }
        break;
      case 'character_relationship':
        // Handle character relationship changes
        break;
      case 'world_change':
        // Handle world state changes
        break;
      case 'achievement':
        // Handle achievement unlocks
        break;
    }
  }

  /**
   * Check for character interactions
   */
  private checkCharacterInteraction(eventType: string, eventData: any): Character | null {
    // Check if any characters are at the current location
    for (const character of this.characters.values()) {
      if (character.currentLocation === this.worldState.currentLocation && character.isActive) {
        return character;
      }
    }
    return null;
  }

  /**
   * Trigger a character interaction
   */
  private async triggerCharacterInteraction(userId: string, character: Character): Promise<void> {
    // Find appropriate dialogue based on context
    const dialogue = this.findAppropriateDialogue(character);
    
    if (dialogue) {
      // Generate AI commentary for character interaction
      // await this.aiCommentaryService.generateCommentary({
      //   event: 'character_interaction',
      //   character: character.name,
      //   title: character.title,
      //   personality: character.personality,
      //   dialogue: dialogue.content,
      //   emotion: dialogue.emotion,
      //   context: dialogue.context
      // });

      console.log(`Character interaction: ${character.name} - ${dialogue.content}`);
    }
  }

  /**
   * Find appropriate dialogue for a character
   */
  private findAppropriateDialogue(character: Character): CharacterDialogue | null {
    // Find dialogue that matches current conditions
    for (const dialogue of character.dialogue) {
      const isAppropriate = dialogue.conditions.every(condition => {
        // Check if condition is met based on current world state
        return this.evaluateCondition(this.worldState, condition.value, condition.operator);
      });

      if (isAppropriate) {
        return dialogue;
      }
    }

    return character.dialogue[0] || null; // Return first dialogue as fallback
  }

  /**
   * Update world state based on events
   */
  private updateWorldState(eventType: string, eventData: any): void {
    // Update time of day
    if (eventType === 'time_change') {
      this.worldState.timeOfDay = eventData.timeOfDay;
    }

    // Update location
    if (eventType === 'location_change') {
      this.worldState.currentLocation = eventData.location;
    }

    // Update weather
    if (eventType === 'weather_change') {
      this.worldState.weather = eventData.weather;
    }

    // Update world flags
    if (eventData.worldFlags) {
      Object.entries(eventData.worldFlags).forEach(([key, value]) => {
        this.worldState.worldFlags.set(key, value as boolean);
      });
    }
  }

  /**
   * Generate AI commentary for narrative events
   */
  private async generateNarrativeCommentary(event: NarrativeEvent): Promise<void> {
    // await this.aiCommentaryService.generateCommentary({
    //   event: 'narrative_event',
    //   narrative: {
    //     title: event.title,
    //     description: event.description,
    //     content: event.content,
    //     type: event.type,
    //     metadata: event.metadata
    //   }
    // });
  }

  /**
   * Start a story arc for a player
   */
  private startStoryArc(userId: string, arcId: string): void {
    const arc = this.storyArcs.get(arcId);
    if (!arc) return;

    if (!this.activePlayerArcs.has(userId)) {
      this.activePlayerArcs.set(userId, []);
    }

    const playerArcs = this.activePlayerArcs.get(userId)!;
    const activeArc = { ...arc, isActive: true };
    playerArcs.push(activeArc);

    console.log(`Story arc started for ${userId}: ${arc.title}`);
  }

  /**
   * Advance a story arc for a player
   */
  private advanceStoryArc(userId: string, arcId: string): void {
    const playerArcs = this.activePlayerArcs.get(userId);
    if (!playerArcs) return;

    const arc = playerArcs.find(a => a.id === arcId);
    if (!arc) return;

    arc.currentChapter++;
    if (arc.currentChapter >= arc.chapters.length) {
      arc.isCompleted = true;
      arc.completedAt = new Date();

      // Grant rewards
      for (const reward of arc.rewards) {
        this.grantStoryReward(userId, reward);
      }
    }

    console.log(`Story arc advanced for ${userId}: ${arc.title} - Chapter ${arc.currentChapter + 1}`);
  }

  /**
   * Grant a story reward
   */
  private grantStoryReward(userId: string, reward: StoryReward): void {
    switch (reward.type) {
      case 'avatar_feature':
        // Unlock avatar feature
        break;
      case 'experience':
        // Add experience
        break;
      case 'dojo_coins':
        // Add Dojo coins
        break;
      case 'nft':
        // Mint NFT
        break;
      case 'territory_access':
        // Grant territory access
        break;
    }
  }

  /**
   * Get active story arcs for a player
   */
  getActiveStoryArcs(userId: string): StoryArc[] {
    return this.activePlayerArcs.get(userId) || [];
  }

  /**
   * Get world state
   */
  getWorldState(): WorldState {
    return { ...this.worldState };
  }

  /**
   * Get characters at current location
   */
  getCharactersAtLocation(location: string): Character[] {
    return Array.from(this.characters.values()).filter(char => 
      char.currentLocation === location && char.isActive
    );
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Character[] {
    return Array.from(this.characters.values());
  }
}

export default NarrativeEventSystem.getInstance(); 
