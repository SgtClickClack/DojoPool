import { useState, useEffect, useCallback } from 'react';

// Types
export interface SocialPost {
  id: string;
  userId: string;
  content: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  likes: string[];
  comments: SocialComment[];
  shares: number;
  engagementScore: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  likes: string[];
  replies: SocialComment[];
  createdAt: Date;
}

export interface CommunityLeaderboard {
  id: string;
  type: 'weekly' | 'monthly' | 'all_time';
  category: 'engagement' | 'reputation' | 'challenges' | 'events';
  entries: LeaderboardEntry[];
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  score: number;
  rank: number;
  previousRank?: number;
  change: number;
  metadata?: Record<string, any>;
}

export interface SocialMediaIntegration {
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'tiktok';
  userId: string;
  externalUserId: string;
  accessToken: string;
  refreshToken?: string;
  isActive: boolean;
  lastSync: Date;
  syncSettings: {
    autoPost: boolean;
    autoShare: boolean;
    crossPost: boolean;
  };
}

export interface CommunityModeration {
  id: string;
  type: 'report' | 'warning' | 'suspension' | 'ban';
  targetUserId: string;
  reporterId?: string;
  reason: string;
  evidence?: string[];
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorId?: string;
  action?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface SocialAnalytics {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  metrics: {
    postsCreated: number;
    commentsMade: number;
    likesGiven: number;
    sharesMade: number;
    engagementReceived: number;
    followersGained: number;
    reputationChange: number;
    challengeParticipation: number;
    eventAttendance: number;
  };
  trends: {
    engagementGrowth: number;
    followerGrowth: number;
    reputationGrowth: number;
    activityLevel: 'low' | 'medium' | 'high';
  };
  timestamp: Date;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  type: 'tournament' | 'meetup' | 'workshop' | 'exhibition' | 'challenge' | 'social';
  location: string;
  virtualLocation?: string;
  startDate: Date;
  endDate: Date;
  maxParticipants: number;
  participants: string[];
  waitlist: string[];
  isFeatured: boolean;
  isPublic: boolean;
  registrationDeadline: Date;
  tags: string[];
  mediaUrls?: string[];
  engagementMetrics: {
    views: number;
    shares: number;
    registrations: number;
    engagementScore: number;
  };
}

export interface UseAdvancedSocialCommunityReturn {
  // Posts
  posts: SocialPost[];
  loadingPosts: boolean;
  createPost: (postData: Omit<SocialPost, 'id' | 'likes' | 'comments' | 'shares' | 'engagementScore' | 'createdAt' | 'updatedAt'>) => Promise<SocialPost | null>;
  likePost: (postId: string, userId: string) => Promise<boolean>;
  commentOnPost: (postId: string, userId: string, content: string) => Promise<SocialComment | null>;
  sharePost: (postId: string, userId: string) => Promise<boolean>;
  
  // Leaderboards
  leaderboards: CommunityLeaderboard[];
  loadingLeaderboards: boolean;
  getLeaderboard: (type: CommunityLeaderboard['type'], category: CommunityLeaderboard['category']) => Promise<CommunityLeaderboard | null>;
  
  // Social Media Integration
  socialMediaIntegrations: SocialMediaIntegration[];
  loadingIntegrations: boolean;
  connectSocialMedia: (integration: Omit<SocialMediaIntegration, 'lastSync'>) => Promise<SocialMediaIntegration | null>;
  autoPostToSocialMedia: (userId: string, content: string, platforms: SocialMediaIntegration['platform'][]) => Promise<boolean[]>;
  
  // Moderation
  moderationCases: CommunityModeration[];
  loadingModeration: boolean;
  reportUser: (reportData: Omit<CommunityModeration, 'id' | 'status' | 'createdAt'>) => Promise<CommunityModeration | null>;
  resolveModerationCase: (caseId: string, moderatorId: string, action: string) => Promise<boolean>;
  
  // Analytics
  analytics: SocialAnalytics | null;
  loadingAnalytics: boolean;
  getAnalytics: (userId: string, period: SocialAnalytics['period']) => Promise<SocialAnalytics | null>;
  
  // Events
  events: CommunityEvent[];
  loadingEvents: boolean;
  createEvent: (eventData: Omit<CommunityEvent, 'id' | 'participants' | 'waitlist' | 'engagementMetrics'>) => Promise<CommunityEvent | null>;
  registerForEvent: (eventId: string, userId: string) => Promise<boolean>;
  
  // Connection status
  isConnected: boolean;
  error: string | null;
}

export const useAdvancedSocialCommunity = (): UseAdvancedSocialCommunityReturn => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [leaderboards, setLeaderboards] = useState<CommunityLeaderboard[]>([]);
  const [socialMediaIntegrations, setSocialMediaIntegrations] = useState<SocialMediaIntegration[]>([]);
  const [moderationCases, setModerationCases] = useState<CommunityModeration[]>([]);
  const [analytics, setAnalytics] = useState<SocialAnalytics | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingLeaderboards, setLoadingLeaderboards] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  const [loadingModeration, setLoadingModeration] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE = '/api/advanced-social-community';

  // Connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        setIsConnected(response.ok);
      } catch (err) {
        setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Posts
  const createPost = useCallback(async (postData: Omit<SocialPost, 'id' | 'likes' | 'comments' | 'shares' | 'engagementScore' | 'createdAt' | 'updatedAt'>): Promise<SocialPost | null> => {
    try {
      setLoadingPosts(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) throw new Error('Failed to create post');
      
      const post = await response.json();
      setPosts(prev => [post, ...prev]);
      return post;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return null;
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const likePost = useCallback(async (postId: string, userId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Failed to like post');
      
      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: [...post.likes, userId], engagementScore: post.engagementScore + 5 }
            : post
        ));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to like post');
      return false;
    }
  }, []);

  const commentOnPost = useCallback(async (postId: string, userId: string, content: string): Promise<SocialComment | null> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content })
      });
      
      if (!response.ok) throw new Error('Failed to comment on post');
      
      const comment = await response.json();
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...post.comments, comment],
              engagementScore: post.engagementScore + 10 
            }
          : post
      ));
      
      return comment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to comment on post');
      return null;
    }
  }, []);

  const sharePost = useCallback(async (postId: string, userId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Failed to share post');
      
      const result = await response.json();
      if (result.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, shares: post.shares + 1, engagementScore: post.engagementScore + 15 }
            : post
        ));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share post');
      return false;
    }
  }, []);

  // Leaderboards
  const getLeaderboard = useCallback(async (type: CommunityLeaderboard['type'], category: CommunityLeaderboard['category']): Promise<CommunityLeaderboard | null> => {
    try {
      setLoadingLeaderboards(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/leaderboards/${type}/${category}`);
      
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      
      const leaderboard = await response.json();
      setLeaderboards(prev => {
        const filtered = prev.filter(lb => !(lb.type === type && lb.category === category));
        return [...filtered, leaderboard];
      });
      
      return leaderboard;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      return null;
    } finally {
      setLoadingLeaderboards(false);
    }
  }, []);

  // Social Media Integration
  const connectSocialMedia = useCallback(async (integration: Omit<SocialMediaIntegration, 'lastSync'>): Promise<SocialMediaIntegration | null> => {
    try {
      setLoadingIntegrations(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/social-media/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration)
      });
      
      if (!response.ok) throw new Error('Failed to connect social media');
      
      const newIntegration = await response.json();
      setSocialMediaIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect social media');
      return null;
    } finally {
      setLoadingIntegrations(false);
    }
  }, []);

  const autoPostToSocialMedia = useCallback(async (userId: string, content: string, platforms: SocialMediaIntegration['platform'][]): Promise<boolean[]> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/social-media/auto-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content, platforms })
      });
      
      if (!response.ok) throw new Error('Failed to auto-post to social media');
      
      const result = await response.json();
      return result.results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to auto-post to social media');
      return platforms.map(() => false);
    }
  }, []);

  // Moderation
  const reportUser = useCallback(async (reportData: Omit<CommunityModeration, 'id' | 'status' | 'createdAt'>): Promise<CommunityModeration | null> => {
    try {
      setLoadingModeration(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/moderation/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });
      
      if (!response.ok) throw new Error('Failed to create report');
      
      const report = await response.json();
      setModerationCases(prev => [...prev, report]);
      return report;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
      return null;
    } finally {
      setLoadingModeration(false);
    }
  }, []);

  const resolveModerationCase = useCallback(async (caseId: string, moderatorId: string, action: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/moderation/${caseId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId, action })
      });
      
      if (!response.ok) throw new Error('Failed to resolve moderation case');
      
      const result = await response.json();
      if (result.success) {
        setModerationCases(prev => prev.map(case_ => 
          case_.id === caseId 
            ? { ...case_, status: 'resolved', moderatorId, action, resolvedAt: new Date() }
            : case_
        ));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve moderation case');
      return false;
    }
  }, []);

  // Analytics
  const getAnalytics = useCallback(async (userId: string, period: SocialAnalytics['period']): Promise<SocialAnalytics | null> => {
    try {
      setLoadingAnalytics(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/analytics/${userId}?period=${period}`);
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const analyticsData = await response.json();
      setAnalytics(analyticsData);
      return analyticsData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      return null;
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  // Events
  const createEvent = useCallback(async (eventData: Omit<CommunityEvent, 'id' | 'participants' | 'waitlist' | 'engagementMetrics'>): Promise<CommunityEvent | null> => {
    try {
      setLoadingEvents(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) throw new Error('Failed to create event');
      
      const event = await response.json();
      setEvents(prev => [event, ...prev]);
      return event;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const registerForEvent = useCallback(async (eventId: string, userId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`${API_BASE}/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) throw new Error('Failed to register for event');
      
      const result = await response.json();
      if (result.success) {
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                participants: event.participants.length < event.maxParticipants 
                  ? [...event.participants, userId]
                  : event.participants,
                engagementMetrics: {
                  ...event.engagementMetrics,
                  registrations: event.engagementMetrics.registrations + 1
                }
              }
            : event
        ));
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register for event');
      return false;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load posts
        const postsResponse = await fetch(`${API_BASE}/posts`);
        if (postsResponse.ok) {
          const postsData = await postsResponse.json();
          setPosts(postsData);
        }

        // Load events
        const eventsResponse = await fetch(`${API_BASE}/events`);
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          setEvents(eventsData);
        }

        // Load moderation cases
        const moderationResponse = await fetch(`${API_BASE}/moderation/cases`);
        if (moderationResponse.ok) {
          const moderationData = await moderationResponse.json();
          setModerationCases(moderationData);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    if (isConnected) {
      loadInitialData();
    }
  }, [isConnected]);

  return {
    // Posts
    posts,
    loadingPosts,
    createPost,
    likePost,
    commentOnPost,
    sharePost,
    
    // Leaderboards
    leaderboards,
    loadingLeaderboards,
    getLeaderboard,
    
    // Social Media Integration
    socialMediaIntegrations,
    loadingIntegrations,
    connectSocialMedia,
    autoPostToSocialMedia,
    
    // Moderation
    moderationCases,
    loadingModeration,
    reportUser,
    resolveModerationCase,
    
    // Analytics
    analytics,
    loadingAnalytics,
    getAnalytics,
    
    // Events
    events,
    loadingEvents,
    createEvent,
    registerForEvent,
    
    // Connection status
    isConnected,
    error
  };
}; 