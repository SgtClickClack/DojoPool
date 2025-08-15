import { io, Socket } from 'socket.io-client';

export interface SocialProfile {
  userId: string;
  username: string;
  avatar: string;
  bio: string;
  level: number;
  achievements: string[];
  followers: number;
  following: number;
  joinDate: Date;
  lastActive: Date;
  status: 'online' | 'offline' | 'in-game' | 'spectating';
}

export interface ChatMessage {
  id: string;
  tournamentId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'image' | 'system' | 'highlight';
  replyTo?: string;
  reactions: { [emoji: string]: string[] };
  isHighlight?: boolean;
}

export interface TournamentChat {
  tournamentId: string;
  messages: ChatMessage[];
  participants: SocialProfile[];
  isActive: boolean;
  lastActivity: Date;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  images?: string[];
  tournamentId?: string;
  matchId?: string;
  likes: number;
  comments: Comment[];
  shares: number;
  timestamp: Date;
  tags: string[];
  isHighlight?: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  replies: Comment[];
}

export interface SocialStats {
  totalParticipants: number;
  activeChats: number;
  totalMessages: number;
  topContributors: SocialProfile[];
  trendingTopics: string[];
  engagementRate: number;
}

class TournamentSocialService {
  private static instance: TournamentSocialService;
  private socket: Socket | null = null;
  private chats: Map<string, TournamentChat> = new Map();
  private posts: CommunityPost[] = [];
  private profiles: Map<string, SocialProfile> = new Map();
  private isConnected = false;

  private constructor() {
    this.initializeSocket();
  }

  public static getInstance(): TournamentSocialService {
    if (!TournamentSocialService.instance) {
      TournamentSocialService.instance = new TournamentSocialService();
    }
    return TournamentSocialService.instance;
  }

  private initializeSocket(): void {
    try {
      this.socket = io('http://localhost:8080', {
        transports: ['websocket'],
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        console.log('TournamentSocialService connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('TournamentSocialService disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('chat_message', (message: ChatMessage) => {
        this.handleChatMessage(message);
      });

      this.socket.on('profile_update', (profile: SocialProfile) => {
        this.profiles.set(profile.userId, profile);
      });

      this.socket.on('post_created', (post: CommunityPost) => {
        this.posts.unshift(post);
      });

      this.socket.on('reaction_update', (data: { messageId: string; reactions: { [emoji: string]: string[] } }) => {
        this.updateMessageReactions(data.messageId, data.reactions);
      });

    } catch (error) {
      console.error('Failed to initialize TournamentSocialService socket:', error);
    }
  }

  public async joinTournamentChat(tournamentId: string, userId: string): Promise<TournamentChat> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/chat/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to join tournament chat');
      }

      const chatData = await response.json();
      const chat: TournamentChat = {
        tournamentId,
        messages: chatData.messages || [],
        participants: chatData.participants || [],
        isActive: true,
        lastActivity: new Date(),
      };

      this.chats.set(tournamentId, chat);
      this.socket?.emit('join_chat', { tournamentId, userId });

      return chat;
    } catch (error) {
      console.error('Error joining tournament chat:', error);
      throw error;
    }
  }

  public async sendMessage(tournamentId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      reactions: {},
    };

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const savedMessage = await response.json();
      this.handleChatMessage(savedMessage);
      this.socket?.emit('send_message', savedMessage);

      return savedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  public async createCommunityPost(post: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares'>): Promise<CommunityPost> {
    const newPost: CommunityPost = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      likes: 0,
      comments: [],
      shares: 0,
    };

    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      const savedPost = await response.json();
      this.posts.unshift(savedPost);
      this.socket?.emit('create_post', savedPost);

      return savedPost;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  public async likePost(postId: string, userId: string): Promise<void> {
    try {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.likes += 1;
      }
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  }

  public async addComment(postId: string, comment: Omit<Comment, 'id' | 'timestamp' | 'likes' | 'replies'>): Promise<Comment> {
    const newComment: Comment = {
      ...comment,
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      likes: 0,
      replies: [],
    };

    try {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComment),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const savedComment = await response.json();
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.comments.push(savedComment);
      }

      return savedComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  public async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      const response = await fetch(`/api/social/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ followerId, followingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      // Update local profiles
      const follower = this.profiles.get(followerId);
      const following = this.profiles.get(followingId);
      
      if (follower) {
        follower.following += 1;
      }
      if (following) {
        following.followers += 1;
      }
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  public async getSocialStats(tournamentId: string): Promise<SocialStats> {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/social/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to get social stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting social stats:', error);
      throw error;
    }
  }

  public async getTrendingPosts(tournamentId?: string): Promise<CommunityPost[]> {
    try {
      const url = tournamentId 
        ? `/api/social/posts/trending?tournamentId=${tournamentId}`
        : '/api/social/posts/trending';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to get trending posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting trending posts:', error);
      throw error;
    }
  }

  public async updateProfile(profile: Partial<SocialProfile>): Promise<SocialProfile> {
    try {
      const response = await fetch(`/api/social/profile/${profile.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      this.profiles.set(updatedProfile.userId, updatedProfile);
      this.socket?.emit('update_profile', updatedProfile);

      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  public async addReaction(messageId: string, emoji: string, userId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    this.socket?.emit('add_reaction', { messageId, emoji, userId });
  }

  public async shareHighlight(matchId: string, userId: string, message?: string): Promise<CommunityPost> {
    const highlightPost: Omit<CommunityPost, 'id' | 'timestamp' | 'likes' | 'comments' | 'shares'> = {
      authorId: userId,
      authorName: this.profiles.get(userId)?.username || 'Unknown',
      authorAvatar: this.profiles.get(userId)?.avatar || '',
      content: message || `Check out this amazing highlight from match ${matchId}!`,
      matchId,
      tags: ['highlight', 'pool', 'gaming'],
      isHighlight: true,
    };

    return this.createCommunityPost(highlightPost);
  }

  private handleChatMessage(message: ChatMessage): void {
    const chat = this.chats.get(message.tournamentId);
    if (chat) {
      chat.messages.push(message);
      chat.lastActivity = new Date();
      
      // Keep only last 100 messages for performance
      if (chat.messages.length > 100) {
        chat.messages = chat.messages.slice(-100);
      }
    }
  }

  private updateMessageReactions(messageId: string, reactions: { [emoji: string]: string[] }): void {
    for (const chat of this.chats.values()) {
      const message = chat.messages.find(m => m.id === messageId);
      if (message) {
        message.reactions = reactions;
        break;
      }
    }
  }

  public getChat(tournamentId: string): TournamentChat | undefined {
    return this.chats.get(tournamentId);
  }

  public getPosts(): CommunityPost[] {
    return this.posts;
  }

  public getProfile(userId: string): SocialProfile | undefined {
    return this.profiles.get(userId);
  }

  public isConnectedToServer(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }
}

export default TournamentSocialService; 
