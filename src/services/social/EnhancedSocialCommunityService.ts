// Enhanced Social Community Service
// This service provides advanced social networking features for the DojoPool platform

export interface ReputationEvent {
  id: string;
  userId: string;
  type: 'win' | 'loss' | 'achievement' | 'participation' | 'help';
  points: number;
  description: string;
  timestamp: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  type: 'skill' | 'speed' | 'trick' | 'endurance';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  reward: number;
  participants: string[];
  entries: ChallengeEntry[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isFeatured: boolean;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  score: number;
  videoUrl?: string;
  screenshotUrl?: string;
  description: string;
  timestamp: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: 'clan' | 'skill_level' | 'location' | 'interest';
  creatorId: string;
  members: string[];
  rules: string[];
  isPublic: boolean;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  type: 'tournament' | 'meetup' | 'workshop' | 'exhibition';
  location: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  participants: string[];
  isFeatured: boolean;
  registrationDeadline: Date;
}

export interface ConnectionStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  currentActivity?: string;
  venueId?: string;
}

export class EnhancedSocialCommunityService {
  private static instance: EnhancedSocialCommunityService;
  private reputationEvents: ReputationEvent[] = [];
  private challenges: Challenge[] = [];
  private groups: Group[] = [];
  private events: Event[] = [];
  private connections: Map<string, ConnectionStatus> = new Map();

  private constructor() {
    console.log('Enhanced Social Community Service initialized');
    this.initializeSampleData();
  }

  public static getInstance(): EnhancedSocialCommunityService {
    if (!EnhancedSocialCommunityService.instance) {
      EnhancedSocialCommunityService.instance = new EnhancedSocialCommunityService();
    }
    return EnhancedSocialCommunityService.instance;
  }

  private initializeSampleData(): void {
    // Initialize sample challenges
    this.challenges = [
      {
        id: 'challenge-1',
        title: 'Speed Demon Challenge',
        description: 'Complete 10 shots in under 30 seconds',
        creatorId: 'user-1',
        type: 'speed',
        difficulty: 'intermediate',
        reward: 100,
        participants: ['user-2', 'user-3'],
        entries: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isActive: true,
        isFeatured: true
      }
    ];

    // Initialize sample groups
    this.groups = [
      {
        id: 'group-1',
        name: 'Brisbane Pool Masters',
        description: 'Elite pool players in Brisbane area',
        type: 'location',
        creatorId: 'user-1',
        members: ['user-1', 'user-2', 'user-3'],
        rules: ['Respect all players', 'No cheating'],
        isPublic: true,
        createdAt: new Date()
      }
    ];

    // Initialize sample events
    this.events = [
      {
        id: 'event-1',
        title: 'Brisbane Championship 2024',
        description: 'Annual pool championship for Brisbane players',
        organizerId: 'user-1',
        type: 'tournament',
        location: 'The Jade Tiger',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        maxParticipants: 32,
        participants: ['user-1', 'user-2'],
        isFeatured: true,
        registrationDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  // Reputation System
  public getReputation(userId: string): number {
    const userEvents = this.reputationEvents.filter(event => event.userId === userId);
    return userEvents.reduce((total, event) => total + event.points, 0);
  }

  public addReputationEvent(event: Omit<ReputationEvent, 'id' | 'timestamp'>): ReputationEvent {
    const newEvent: ReputationEvent = {
      ...event,
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    this.reputationEvents.push(newEvent);
    return newEvent;
  }

  // Challenge System
  public createChallenge(challenge: Omit<Challenge, 'id' | 'participants' | 'entries'>): Challenge {
    const newChallenge: Challenge = {
      ...challenge,
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants: [challenge.creatorId],
      entries: []
    };
    this.challenges.push(newChallenge);
    return newChallenge;
  }

  public getActiveChallenges(): Challenge[] {
    return this.challenges.filter(challenge => challenge.isActive);
  }

  public getFeaturedChallenges(): Challenge[] {
    return this.challenges.filter(challenge => challenge.isFeatured && challenge.isActive);
  }

  public joinChallenge(challengeId: string, userId: string): boolean {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && challenge.isActive && !challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      return true;
    }
    return false;
  }

  public submitChallengeEntry(entry: Omit<ChallengeEntry, 'id' | 'timestamp'>): ChallengeEntry {
    const newEntry: ChallengeEntry = {
      ...entry,
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };
    
    const challenge = this.challenges.find(c => c.id === entry.challengeId);
    if (challenge) {
      challenge.entries.push(newEntry);
    }
    
    return newEntry;
  }

  // Group System
  public createGroup(group: Omit<Group, 'id' | 'members' | 'createdAt'>): Group {
    const newGroup: Group = {
      ...group,
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      members: [group.creatorId],
      createdAt: new Date()
    };
    this.groups.push(newGroup);
    return newGroup;
  }

  public getGroupsByType(type: Group['type']): Group[] {
    return this.groups.filter(group => group.type === type);
  }

  public joinGroup(groupId: string, userId: string): boolean {
    const group = this.groups.find(g => g.id === groupId);
    if (group && !group.members.includes(userId)) {
      group.members.push(userId);
      return true;
    }
    return false;
  }

  // Event System
  public createEvent(event: Omit<Event, 'id' | 'participants'>): Event {
    const newEvent: Event = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants: [event.organizerId]
    };
    this.events.push(newEvent);
    return newEvent;
  }

  public getUpcomingEvents(): Event[] {
    const now = new Date();
    return this.events.filter(event => event.startDate > now);
  }

  public getFeaturedEvents(): Event[] {
    return this.events.filter(event => event.isFeatured);
  }

  public registerForEvent(eventId: string, userId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (event && 
        event.startDate > new Date() && 
        event.participants.length < event.maxParticipants &&
        !event.participants.includes(userId)) {
      event.participants.push(userId);
      return true;
    }
    return false;
  }

  // Connection Status
  public getConnectionStatus(userId: string): ConnectionStatus | null {
    return this.connections.get(userId) || null;
  }

  public updateConnectionStatus(userId: string, status: Partial<ConnectionStatus>): void {
    const currentStatus = this.connections.get(userId) || {
      userId,
      isOnline: false,
      lastSeen: new Date()
    };
    
    this.connections.set(userId, {
      ...currentStatus,
      ...status,
      lastSeen: new Date()
    });
  }
}

export default EnhancedSocialCommunityService;
