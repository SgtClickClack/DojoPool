import { BrowserEventEmitter } from '../../utils/BrowserEventEmitter';
import { Socket } from 'socket.io-client';
import io from 'socket.io-client';

export interface SocialProfile {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: Date;
  lastActive: Date;
  followers: string[];
  following: string[];
  achievements: string[];
  stats: {
    matchesPlayed: number;
    tournamentsWon: number;
    totalWinnings: number;
    winRate: number;
    rank: number;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showStats: boolean;
    showLocation: boolean;
    allowMessages: boolean;
  };
}

export interface SocialMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'tournament_invite' | 'friend_request';
  metadata?: any;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'tournament' | 'achievement';
  timestamp: Date;
  likes: string[];
  comments: CommunityComment[];
  shares: number;
  tags: string[];
  visibility: 'public' | 'friends' | 'venue' | 'tournament';
  metadata?: any;
}

export interface CommunityComment {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  likes: string[];
  replies: CommunityComment[];
}

export interface FriendRequest {
  id: string;
  senderId: string;
  recipientId: string;
  message?: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CommunityForum {
  id: string;
  name: string;
  description: string;
  category: 'general' | 'strategy' | 'tournaments' | 'venues' | 'technical';
  topics: ForumTopic[];
  moderators: string[];
  rules: string[];
  isActive: boolean;
}

export interface ForumTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  timestamp: Date;
  lastReply: Date;
  replies: ForumReply[];
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
}

export interface ForumReply {
  id: string;
  authorId: string;
  content: string;
  timestamp: Date;
  likes: string[];
  isSolution: boolean;
}

export interface SocialConfig {
  enableMessaging: boolean;
  enableForums: boolean;
  enableFriendSystem: boolean;
  enableSocialSharing: boolean;
  maxMessageLength: number;
  maxPostLength: number;
  autoModeration: boolean;
  notificationSettings: {
    messages: boolean;
    friendRequests: boolean;
    mentions: boolean;
    likes: boolean;
    comments: boolean;
  };
}

class SocialCommunityService extends BrowserEventEmitter {
  private static instance: SocialCommunityService;
  private socket: Socket | null = null;
  private _isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  private profiles: SocialProfile[] = [];
  private messages: SocialMessage[] = [];
  private posts: CommunityPost[] = [];
  private friendRequests: FriendRequest[] = [];
  private forums: CommunityForum[] = [];

  private config: SocialConfig = {
    enableMessaging: true,
    enableForums: true,
    enableFriendSystem: true,
    enableSocialSharing: true,
    maxMessageLength: 1000,
    maxPostLength: 5000,
    autoModeration: true,
    notificationSettings: {
      messages: true,
      friendRequests: true,
      mentions: true,
      likes: true,
      comments: true
    }
  };

  private constructor() {
    super();
    this.initializeWebSocket();
    this.loadMockData();
  }

  public static getInstance(): SocialCommunityService {
    if (!SocialCommunityService.instance) {
      SocialCommunityService.instance = new SocialCommunityService();
    }
    return SocialCommunityService.instance;
  }

  private initializeWebSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 10000
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        this.reconnectAttempts = 0;
        this.socket?.emit('social:join', { service: 'social' });
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        this.handleReconnection();
      });

      this.socket.on('social:profile_updated', (profile: SocialProfile) => {
        this.updateProfile(profile);
      });

      this.socket.on('social:message_received', (message: SocialMessage) => {
        this.addMessage(message);
      });

      this.socket.on('social:post_created', (post: CommunityPost) => {
        this.addPost(post);
      });

      this.socket.on('social:friend_request', (request: FriendRequest) => {
        this.addFriendRequest(request);
      });

    } catch (error) {
      console.error('Failed to initialize social service WebSocket:', error);
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
  public async createProfile(profile: Omit<SocialProfile, 'userId' | 'joinDate' | 'lastActive' | 'followers' | 'following' | 'achievements'>): Promise<SocialProfile> {
    const newProfile: SocialProfile = {
      ...profile,
      userId: this.generateId(),
      joinDate: new Date(),
      lastActive: new Date(),
      followers: [],
      following: [],
      achievements: []
    };

    this.profiles.push(newProfile);
    this.socket?.emit('social:profile_created', newProfile);
    return newProfile;
  }

  public async updateProfile(profile: SocialProfile): Promise<void> {
    const index = this.profiles.findIndex(p => p.userId === profile.userId);
    if (index !== -1) {
      this.profiles[index] = { ...profile, lastActive: new Date() };
      this.socket?.emit('social:profile_updated', this.profiles[index]);
    }
  }

  public getProfile(userId: string): SocialProfile | undefined {
    return this.profiles.find(p => p.userId === userId);
  }

  public getAllProfiles(): SocialProfile[] {
    return [...this.profiles];
  }

  public searchProfiles(query: string): SocialProfile[] {
    return this.profiles.filter(profile =>
      profile.username.toLowerCase().includes(query.toLowerCase()) ||
      profile.displayName.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Messaging System
  public async sendMessage(message: Omit<SocialMessage, 'id' | 'timestamp' | 'read'>): Promise<SocialMessage> {
    const newMessage: SocialMessage = {
      ...message,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.messages.push(newMessage);
    this.socket?.emit('social:message_sent', newMessage);
    return newMessage;
  }

  public getMessages(userId: string): SocialMessage[] {
    return this.messages.filter(m => 
      m.senderId === userId || m.recipientId === userId
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getConversation(userId1: string, userId2: string): SocialMessage[] {
    return this.messages.filter(m =>
      (m.senderId === userId1 && m.recipientId === userId2) ||
      (m.senderId === userId2 && m.recipientId === userId1)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  public async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      this.socket?.emit('social:message_read', message);
    }
  }

  // Community Posts
  public async createPost(post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares'>): Promise<CommunityPost> {
    const newPost: CommunityPost = {
      ...post,
      id: this.generateId(),
      timestamp: new Date(),
      likes: [],
      comments: [],
      shares: 0
    };

    this.posts.unshift(newPost);
    this.socket?.emit('social:post_created', newPost);
    return newPost;
  }

  public getPosts(visibility: 'public' | 'friends' | 'venue' | 'tournament' = 'public'): CommunityPost[] {
    return this.posts.filter(p => p.visibility === visibility);
  }

  public async likePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      if (!post.likes.includes(userId)) {
        post.likes.push(userId);
        this.socket?.emit('social:post_liked', { postId, userId });
      }
    }
  }

  public async unlikePost(postId: string, userId: string): Promise<void> {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      post.likes = post.likes.filter(id => id !== userId);
      this.socket?.emit('social:post_unliked', { postId, userId });
    }
  }

  public async addComment(postId: string, comment: Omit<CommunityComment, 'id' | 'timestamp' | 'likes' | 'replies'>): Promise<CommunityComment> {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      const newComment: CommunityComment = {
        ...comment,
        id: this.generateId(),
        timestamp: new Date(),
        likes: [],
        replies: []
      };

      post.comments.push(newComment);
      this.socket?.emit('social:comment_added', { postId, comment: newComment });
      return newComment;
    }
    throw new Error('Post not found');
  }

  // Friend System
  public async sendFriendRequest(request: Omit<FriendRequest, 'id' | 'timestamp' | 'status'>): Promise<FriendRequest> {
    const newRequest: FriendRequest = {
      ...request,
      id: this.generateId(),
      timestamp: new Date(),
      status: 'pending'
    };

    this.friendRequests.push(newRequest);
    this.socket?.emit('social:friend_request_sent', newRequest);
    return newRequest;
  }

  public async respondToFriendRequest(requestId: string, status: 'accepted' | 'declined'): Promise<void> {
    const request = this.friendRequests.find(r => r.id === requestId);
    if (request) {
      request.status = status;
      
      if (status === 'accepted') {
        const senderProfile = this.getProfile(request.senderId);
        const recipientProfile = this.getProfile(request.recipientId);
        
        if (senderProfile && recipientProfile) {
          if (!senderProfile.following.includes(request.recipientId)) {
            senderProfile.following.push(request.recipientId);
          }
          if (!recipientProfile.followers.includes(request.senderId)) {
            recipientProfile.followers.push(request.senderId);
          }
        }
      }

      this.socket?.emit('social:friend_request_responded', { requestId, status });
    }
  }

  public getFriendRequests(userId: string): FriendRequest[] {
    return this.friendRequests.filter(r => 
      r.recipientId === userId && r.status === 'pending'
    );
  }

  public getFriends(userId: string): SocialProfile[] {
    const profile = this.getProfile(userId);
    if (!profile) return [];
    
    return this.profiles.filter(p => profile.following.includes(p.userId));
  }

  // Forum System
  public async createForum(forum: Omit<CommunityForum, 'id' | 'topics'>): Promise<CommunityForum> {
    const newForum: CommunityForum = {
      ...forum,
      id: this.generateId(),
      topics: []
    };

    this.forums.push(newForum);
    this.socket?.emit('social:forum_created', newForum);
    return newForum;
  }

  public async createTopic(forumId: string, topic: Omit<ForumTopic, 'id' | 'timestamp' | 'lastReply' | 'replies' | 'views' | 'isPinned' | 'isLocked'>): Promise<ForumTopic> {
    const forum = this.forums.find(f => f.id === forumId);
    if (!forum) throw new Error('Forum not found');

    const newTopic: ForumTopic = {
      ...topic,
      id: this.generateId(),
      timestamp: new Date(),
      lastReply: new Date(),
      replies: [],
      views: 0,
      isPinned: false,
      isLocked: false
    };

    forum.topics.push(newTopic);
    this.socket?.emit('social:topic_created', { forumId, topic: newTopic });
    return newTopic;
  }

  public async addForumReply(topicId: string, reply: Omit<ForumReply, 'id' | 'timestamp' | 'likes' | 'isSolution'>): Promise<ForumReply> {
    for (const forum of this.forums) {
      const topic = forum.topics.find(t => t.id === topicId);
      if (topic) {
        const newReply: ForumReply = {
          ...reply,
          id: this.generateId(),
          timestamp: new Date(),
          likes: [],
          isSolution: false
        };

        topic.replies.push(newReply);
        topic.lastReply = new Date();
        this.socket?.emit('social:forum_reply_added', { topicId, reply: newReply });
        return newReply;
      }
    }
    throw new Error('Topic not found');
  }

  public getForums(): CommunityForum[] {
    return this.forums.filter(f => f.isActive);
  }

  public getForumById(forumId: string): CommunityForum | undefined {
    return this.forums.find(f => f.id === forumId);
  }

  // Configuration
  public getConfig(): SocialConfig {
    return { ...this.config };
  }

  public async updateConfig(newConfig: Partial<SocialConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.socket?.emit('social:config_updated', this.config);
  }

  // Utility Methods
  public getConnectionStatus(): boolean {
    return this._isConnected;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private addMessage(message: SocialMessage): void {
    const existingIndex = this.messages.findIndex(m => m.id === message.id);
    if (existingIndex !== -1) {
      this.messages[existingIndex] = message;
    } else {
      this.messages.push(message);
    }
  }

  private addPost(post: CommunityPost): void {
    const existingIndex = this.posts.findIndex(p => p.id === post.id);
    if (existingIndex !== -1) {
      this.posts[existingIndex] = post;
    } else {
      this.posts.unshift(post);
    }
  }

  private addFriendRequest(request: FriendRequest): void {
    const existingIndex = this.friendRequests.findIndex(r => r.id === request.id);
    if (existingIndex !== -1) {
      this.friendRequests[existingIndex] = request;
    } else {
      this.friendRequests.push(request);
    }
  }

  private loadMockData(): void {
    // Mock profiles
    this.profiles = [
      {
        userId: 'user1',
        username: 'poolmaster',
        displayName: 'Pool Master',
        avatar: '/images/avatars/poolmaster.jpg',
        bio: 'Professional pool player and tournament organizer',
        location: 'New York, NY',
        joinDate: new Date('2024-01-15'),
        lastActive: new Date(),
        followers: ['user2', 'user3'],
        following: ['user2'],
        achievements: ['tournament_champion', 'winning_streak'],
        stats: {
          matchesPlayed: 150,
          tournamentsWon: 12,
          totalWinnings: 5000,
          winRate: 0.75,
          rank: 5
        },
        privacy: {
          profileVisibility: 'public',
          showStats: true,
          showLocation: true,
          allowMessages: true
        }
      },
      {
        userId: 'user2',
        username: 'cuequeen',
        displayName: 'Cue Queen',
        avatar: '/images/avatars/cuequeen.jpg',
        bio: 'Rising star in the pool world',
        location: 'Los Angeles, CA',
        joinDate: new Date('2024-02-01'),
        lastActive: new Date(),
        followers: ['user1', 'user3'],
        following: ['user1'],
        achievements: ['rookie_of_the_year'],
        stats: {
          matchesPlayed: 75,
          tournamentsWon: 3,
          totalWinnings: 1500,
          winRate: 0.68,
          rank: 15
        },
        privacy: {
          profileVisibility: 'public',
          showStats: true,
          showLocation: true,
          allowMessages: true
        }
      }
    ];

    // Mock messages
    this.messages = [
      {
        id: 'msg1',
        senderId: 'user1',
        recipientId: 'user2',
        content: 'Great game today! Want to play again next week?',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        type: 'text'
      },
      {
        id: 'msg2',
        senderId: 'user2',
        recipientId: 'user1',
        content: 'Absolutely! I had a blast. Same time next week?',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
        type: 'text'
      }
    ];

    // Mock posts
    this.posts = [
      {
        id: 'post1',
        authorId: 'user1',
        content: 'Just won the championship tournament! 🏆 Thanks everyone for the support!',
        type: 'achievement',
        timestamp: new Date(Date.now() - 7200000),
        likes: ['user2', 'user3'],
        comments: [
          {
            id: 'comment1',
            authorId: 'user2',
            content: 'Congratulations! You played amazingly!',
            timestamp: new Date(Date.now() - 3600000),
            likes: ['user1'],
            replies: []
          }
        ],
        shares: 5,
        tags: ['championship', 'victory', 'pool'],
        visibility: 'public'
      }
    ];

    // Mock forums
    this.forums = [
      {
        id: 'forum1',
        name: 'Strategy Discussion',
        description: 'Share tips, tricks, and strategies for improving your pool game',
        category: 'strategy',
        topics: [],
        moderators: ['user1'],
        rules: ['Be respectful', 'No spam', 'Stay on topic'],
        isActive: true
      }
    ];
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this._isConnected = false;
  }
}

export default SocialCommunityService; 