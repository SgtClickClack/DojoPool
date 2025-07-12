import { EventEmitter } from 'events';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'match_update' | 'tournament_announcement' | 'achievement' | 'general' | 'highlight';
  tournamentId?: string;
  matchId?: string;
  mediaUrls?: string[];
  likes: number;
  comments: Comment[];
  shares: number;
  createdAt: Date;
  isPinned: boolean;
  tags: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likes: number;
  createdAt: Date;
  replies: Comment[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  type: 'meetup' | 'watch_party' | 'training_session' | 'tournament' | 'social';
  venueId?: string;
  venueName?: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  currentParticipants: number;
  organizerId: string;
  organizerName: string;
  isOnline: boolean;
  meetingUrl?: string;
  tags: string[];
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: Date;
  followers: number;
  following: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  totalMatches: number;
  winRate: number;
  achievements: Achievement[];
  badges: Badge[];
  isOnline: boolean;
  lastActive: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  type: 'tournament' | 'social' | 'skill' | 'special';
}

export interface SocialStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalShares: number;
  activeUsers: number;
  trendingTopics: string[];
  topContributors: UserProfile[];
}

class TournamentSocialService extends EventEmitter {
  private static instance: TournamentSocialService;
  private posts: SocialPost[] = [];
  private events: CommunityEvent[] = [];
  private userProfiles: UserProfile[] = [];
  private socialStats: SocialStats;

  private constructor() {
    super();
    this.initializeMockData();
    this.startRealTimeUpdates();
  }

  public static getInstance(): TournamentSocialService {
    if (!TournamentSocialService.instance) {
      TournamentSocialService.instance = new TournamentSocialService();
    }
    return TournamentSocialService.instance;
  }

  private initializeMockData(): void {
    // Mock user profiles
    this.userProfiles = [
      {
        id: 'user1',
        name: 'Neon Shadow',
        avatar: '/avatars/neon-shadow.jpg',
        bio: 'Professional pool player and tournament champion. Love the competitive spirit!',
        location: 'New York, NY',
        joinDate: new Date('2023-01-15'),
        followers: 1250,
        following: 340,
        tournamentsPlayed: 45,
        tournamentsWon: 12,
        totalMatches: 320,
        winRate: 0.78,
        achievements: [
          {
            id: 'ach1',
            name: 'Tournament Champion',
            description: 'Won your first major tournament',
            icon: '🏆',
            unlockedAt: new Date('2023-06-15'),
            rarity: 'epic',
          },
          {
            id: 'ach2',
            name: 'Social Butterfly',
            description: 'Reached 1000 followers',
            icon: '🦋',
            unlockedAt: new Date('2023-08-20'),
            rarity: 'rare',
          },
        ],
        badges: [
          {
            id: 'badge1',
            name: 'Elite Player',
            description: 'Top 10% in tournament rankings',
            icon: '⭐',
            earnedAt: new Date('2023-07-10'),
            type: 'skill',
          },
        ],
        isOnline: true,
        lastActive: new Date(),
      },
      {
        id: 'user2',
        name: 'Digital Phantom',
        avatar: '/avatars/digital-phantom.jpg',
        bio: 'Defensive specialist with a love for strategic gameplay.',
        location: 'Los Angeles, CA',
        joinDate: new Date('2023-02-20'),
        followers: 890,
        following: 215,
        tournamentsPlayed: 32,
        tournamentsWon: 8,
        totalMatches: 245,
        winRate: 0.72,
        achievements: [
          {
            id: 'ach3',
            name: 'Defensive Master',
            description: 'Won 50 matches using defensive strategies',
            icon: '🛡️',
            unlockedAt: new Date('2023-09-05'),
            rarity: 'rare',
          },
        ],
        badges: [
          {
            id: 'badge2',
            name: 'Community Helper',
            description: 'Helped organize 5 community events',
            icon: '🤝',
            earnedAt: new Date('2023-10-15'),
            type: 'social',
          },
        ],
        isOnline: false,
        lastActive: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: 'user3',
        name: 'Cyber Striker',
        avatar: '/avatars/cyber-striker.jpg',
        bio: 'Consistency is key! Always improving my game.',
        location: 'Chicago, IL',
        joinDate: new Date('2023-03-10'),
        followers: 650,
        following: 180,
        tournamentsPlayed: 28,
        tournamentsWon: 6,
        totalMatches: 198,
        winRate: 0.68,
        achievements: [
          {
            id: 'ach4',
            name: 'Consistency King',
            description: 'Maintained 70%+ win rate for 3 months',
            icon: '📈',
            unlockedAt: new Date('2023-11-12'),
            rarity: 'epic',
          },
        ],
        badges: [
          {
            id: 'badge3',
            name: 'Tournament Organizer',
            description: 'Successfully organized a community tournament',
            icon: '🎯',
            earnedAt: new Date('2023-12-01'),
            type: 'tournament',
          },
        ],
        isOnline: true,
        lastActive: new Date(),
      },
    ];

    // Mock social posts
    this.posts = [
      {
        id: 'post1',
        userId: 'user1',
        userName: 'Neon Shadow',
        userAvatar: '/avatars/neon-shadow.jpg',
        content: 'Just won the Cyber Championship! What an incredible tournament. Thanks to everyone who supported me throughout this journey. The competition was fierce, but the community made it special! 🏆🎱',
        type: 'achievement',
        tournamentId: 'tournament_001',
        likes: 156,
        comments: [
          {
            id: 'comment1',
            userId: 'user2',
            userName: 'Digital Phantom',
            userAvatar: '/avatars/digital-phantom.jpg',
            content: 'Congratulations! You played amazingly. Looking forward to our next match!',
            likes: 23,
            createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
            replies: [],
          },
          {
            id: 'comment2',
            userId: 'user3',
            userName: 'Cyber Striker',
            userAvatar: '/avatars/cyber-striker.jpg',
            content: 'Well deserved victory! Your break shots were incredible today.',
            likes: 18,
            createdAt: new Date(Date.now() - 1200000), // 20 minutes ago
            replies: [],
          },
        ],
        shares: 45,
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        isPinned: true,
        tags: ['championship', 'victory', 'cyber-tournament'],
      },
      {
        id: 'post2',
        userId: 'user2',
        userName: 'Digital Phantom',
        userAvatar: '/avatars/digital-phantom.jpg',
        content: 'Hosting a defensive strategy workshop this weekend at Cyber Pool LA. Perfect for players looking to improve their safety game. Limited spots available! 🛡️🎱',
        type: 'general',
        likes: 89,
        comments: [
          {
            id: 'comment3',
            userId: 'user1',
            userName: 'Neon Shadow',
            userAvatar: '/avatars/neon-shadow.jpg',
            content: 'Count me in! Always looking to learn new defensive techniques.',
            likes: 12,
            createdAt: new Date(Date.now() - 900000), // 15 minutes ago
            replies: [],
          },
        ],
        shares: 23,
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        isPinned: false,
        tags: ['workshop', 'defensive-strategy', 'training'],
      },
      {
        id: 'post3',
        userId: 'user3',
        userName: 'Cyber Striker',
        userAvatar: '/avatars/cyber-striker.jpg',
        content: 'Just finished a 3-hour practice session. Consistency is everything in this game. Remember: every shot counts! 💪🎱',
        type: 'general',
        likes: 67,
        comments: [],
        shares: 12,
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
        isPinned: false,
        tags: ['practice', 'consistency', 'motivation'],
      },
    ];

    // Mock community events
    this.events = [
      {
        id: 'event1',
        title: 'Cyber Championship Watch Party',
        description: 'Join us for an epic watch party as we follow the Cyber Championship finals! Food, drinks, and great company guaranteed.',
        type: 'watch_party',
        venueId: 'venue_001',
        venueName: 'Cyber Pool LA',
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 86400000 + 18000000), // Tomorrow + 5 hours
        maxParticipants: 50,
        currentParticipants: 32,
        organizerId: 'user2',
        organizerName: 'Digital Phantom',
        isOnline: false,
        tags: ['watch-party', 'championship', 'social'],
        status: 'upcoming',
      },
      {
        id: 'event2',
        title: 'Online Strategy Discussion',
        description: 'Weekly online meetup to discuss advanced pool strategies and share tips. All skill levels welcome!',
        type: 'meetup',
        startDate: new Date(Date.now() + 604800000), // Next week
        endDate: new Date(Date.now() + 604800000 + 7200000), // Next week + 2 hours
        maxParticipants: 100,
        currentParticipants: 45,
        organizerId: 'user3',
        organizerName: 'Cyber Striker',
        isOnline: true,
        meetingUrl: 'https://meet.cyberpool.com/strategy-discussion',
        tags: ['online', 'strategy', 'discussion'],
        status: 'upcoming',
      },
      {
        id: 'event3',
        title: 'Community Tournament',
        description: 'Monthly community tournament for players of all levels. Great prizes and even better competition!',
        type: 'tournament',
        venueId: 'venue_002',
        venueName: 'Neon Pool Chicago',
        startDate: new Date(Date.now() + 259200000), // 3 days from now
        endDate: new Date(Date.now() + 259200000 + 28800000), // 3 days + 8 hours
        maxParticipants: 64,
        currentParticipants: 58,
        organizerId: 'user1',
        organizerName: 'Neon Shadow',
        isOnline: false,
        tags: ['tournament', 'community', 'competition'],
        status: 'upcoming',
      },
    ];

    // Initialize social stats
    this.updateSocialStats();
  }

  private startRealTimeUpdates(): void {
    setInterval(() => {
      this.updateSocialStats();
      this.emit('socialUpdate', {
        posts: this.posts,
        events: this.events,
        stats: this.socialStats,
      });
    }, 30000); // Update every 30 seconds
  }

  private updateSocialStats(): void {
    const totalPosts = this.posts.length;
    const totalComments = this.posts.reduce((sum, post) => sum + post.comments.length, 0);
    const totalLikes = this.posts.reduce((sum, post) => sum + post.likes, 0);
    const totalShares = this.posts.reduce((sum, post) => sum + post.shares, 0);
    const activeUsers = this.userProfiles.filter(user => user.isOnline).length;

    // Generate trending topics from post tags
    const allTags = this.posts.flatMap(post => post.tags);
    const tagCounts = allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const trendingTopics = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // Get top contributors based on followers and engagement
    const topContributors = [...this.userProfiles]
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 5);

    this.socialStats = {
      totalPosts,
      totalComments,
      totalLikes,
      totalShares,
      activeUsers,
      trendingTopics,
      topContributors,
    };
  }

  public getPosts(limit?: number): SocialPost[] {
    const sortedPosts = [...this.posts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return limit ? sortedPosts.slice(0, limit) : sortedPosts;
  }

  public getPost(postId: string): SocialPost | null {
    return this.posts.find(post => post.id === postId) || null;
  }

  public createPost(post: Omit<SocialPost, 'id' | 'likes' | 'comments' | 'shares' | 'createdAt' | 'isPinned'>): SocialPost {
    const newPost: SocialPost = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      likes: 0,
      comments: [],
      shares: 0,
      createdAt: new Date(),
      isPinned: false,
    };
    
    this.posts.unshift(newPost);
    this.emit('postCreated', newPost);
    return newPost;
  }

  public likePost(postId: string, userId: string): boolean {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.likes++;
      this.emit('postLiked', { postId, userId });
      return true;
    }
    return false;
  }

  public addComment(postId: string, comment: Omit<Comment, 'id' | 'likes' | 'createdAt' | 'replies'>): Comment | null {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      const newComment: Comment = {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        likes: 0,
        createdAt: new Date(),
        replies: [],
      };
      
      post.comments.push(newComment);
      this.emit('commentAdded', { postId, comment: newComment });
      return newComment;
    }
    return null;
  }

  public getEvents(status?: string): CommunityEvent[] {
    let events = [...this.events];
    if (status) {
      events = events.filter(event => event.status === status);
    }
    return events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  public getEvent(eventId: string): CommunityEvent | null {
    return this.events.find(event => event.id === eventId) || null;
  }

  public createEvent(event: Omit<CommunityEvent, 'id' | 'currentParticipants' | 'status'>): CommunityEvent {
    const newEvent: CommunityEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentParticipants: 0,
      status: 'upcoming',
    };
    
    this.events.push(newEvent);
    this.emit('eventCreated', newEvent);
    return newEvent;
  }

  public joinEvent(eventId: string, userId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (event && event.currentParticipants < event.maxParticipants) {
      event.currentParticipants++;
      this.emit('eventJoined', { eventId, userId });
      return true;
    }
    return false;
  }

  public getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.find(user => user.id === userId) || null;
  }

  public getTopContributors(): UserProfile[] {
    return this.socialStats.topContributors;
  }

  public getSocialStats(): SocialStats {
    return this.socialStats;
  }

  public searchPosts(query: string): SocialPost[] {
    const lowercaseQuery = query.toLowerCase();
    return this.posts.filter(post => 
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      post.userName.toLowerCase().includes(lowercaseQuery)
    );
  }

  public getPostsByUser(userId: string): SocialPost[] {
    return this.posts.filter(post => post.userId === userId);
  }

  public getPostsByTournament(tournamentId: string): SocialPost[] {
    return this.posts.filter(post => post.tournamentId === tournamentId);
  }

  public followUser(followerId: string, followedId: string): boolean {
    const follower = this.userProfiles.find(u => u.id === followerId);
    const followed = this.userProfiles.find(u => u.id === followedId);
    
    if (follower && followed && followerId !== followedId) {
      follower.following++;
      followed.followers++;
      this.emit('userFollowed', { followerId, followedId });
      return true;
    }
    return false;
  }

  public subscribeToUpdates(callback: (data: unknown) => void): () => void {
    this.on('socialUpdate', callback);
    this.on('postCreated', callback);
    this.on('postLiked', callback);
    this.on('commentAdded', callback);
    this.on('eventCreated', callback);
    this.on('eventJoined', callback);
    this.on('userFollowed', callback);
    
    return () => {
      this.off('socialUpdate', callback);
      this.off('postCreated', callback);
      this.off('postLiked', callback);
      this.off('commentAdded', callback);
      this.off('eventCreated', callback);
      this.off('eventJoined', callback);
      this.off('userFollowed', callback);
    };
  }
}

export default TournamentSocialService; 