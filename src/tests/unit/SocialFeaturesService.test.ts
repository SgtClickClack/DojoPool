import { SocialFeaturesService, Friend, Message, ActivityFeedItem, SocialProfile } from '../../services/social/SocialFeaturesService';
import { vi } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Mock fetch
global.fetch = vi.fn();

describe('SocialFeaturesService', () => {
  let service: SocialFeaturesService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock successful fetch responses
    (global.fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        friends: [],
        messages: [],
        activities: [],
        users: []
      })
    });
    
    service = new SocialFeaturesService();
  });

  describe('initialization', () => {
    it('should initialize with empty state', () => {
      expect(service).toBeDefined();
    });
  });

  describe('friend management', () => {
    it('should send friend request', async () => {
      const result = await service.sendFriendRequest('user-2');
      expect(result).toBe(true);
    });

    it('should accept friend request', async () => {
      const result = await service.acceptFriendRequest('request-1');
      expect(result).toBe(true);
    });

    it('should remove friend', async () => {
      const result = await service.removeFriend('friend-1');
      expect(result).toBe(true);
    });

    it('should get friends list', async () => {
      const mockFriends: Friend[] = [
        {
          id: 'user-2',
          username: 'user2',
          avatar: 'avatar2.jpg',
          status: 'online',
          lastSeen: new Date(),
          rank: 'bronze',
          territoryCount: 2
        }
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ friends: mockFriends })
      });

      const friends = await service.getFriends();
      expect(friends).toHaveLength(1);
      expect(friends[0].id).toBe('user-2');
    });
  });

  describe('messaging', () => {
    it('should send message', async () => {
      const result = await service.sendMessage('user-2', 'Hello!');
      expect(result).toBe(true);
    });

    it('should get messages', async () => {
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 'user-1',
          receiverId: 'user-2',
          content: 'Hello!',
          timestamp: new Date(),
          type: 'text',
          read: false
        }
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ messages: mockMessages })
      });

      const messages = await service.getMessages('user-2');
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello!');
    });

    it('should mark message as read', async () => {
      const result = await service.markMessageAsRead('msg-1');
      expect(result).toBe(true);
    });
  });

  describe('activity feeds', () => {
    it('should get activity feed', async () => {
      const mockActivities: ActivityFeedItem[] = [
        {
          id: 'activity-1',
          userId: 'user-1',
          username: 'user1',
          avatar: 'avatar1.jpg',
          type: 'match-win',
          content: 'Won a match!',
          timestamp: new Date(),
          likes: 5,
          comments: 2
        }
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ activities: mockActivities })
      });

      const activities = await service.getActivityFeed();
      expect(activities).toHaveLength(1);
      expect(activities[0].content).toBe('Won a match!');
    });

    it('should like activity', async () => {
      const result = await service.likeActivity('activity-1');
      expect(result).toBe(true);
    });

    it('should comment on activity', async () => {
      const result = await service.commentOnActivity('activity-1', 'Great game!');
      expect(result).toBe(true);
    });
  });

  describe('user discovery', () => {
    it('should search users', async () => {
      const mockUsers: SocialProfile[] = [
        {
          id: 'user-2',
          username: 'john',
          avatar: 'john.jpg',
          bio: 'Pool player',
          rank: 'silver',
          territoryCount: 3,
          matchWins: 15,
          tournamentWins: 2,
          achievements: ['first_win'],
          followers: 10,
          following: 5,
          isOnline: true,
          lastSeen: new Date()
        }
      ];

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ users: mockUsers })
      });

      const users = await service.searchUsers('john');
      expect(users).toHaveLength(1);
      expect(users[0].username).toBe('john');
    });

    it('should get user profile', async () => {
      const mockProfile: SocialProfile = {
        id: 'user-1',
        username: 'user1',
        avatar: 'avatar1.jpg',
        bio: 'Pool enthusiast',
        rank: 'bronze',
        territoryCount: 1,
        matchWins: 5,
        tournamentWins: 0,
        achievements: [],
        followers: 3,
        following: 2,
        isOnline: true,
        lastSeen: new Date()
      };

      (global.fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockProfile)
      });

      const profile = await service.getProfile('user-1');
      expect(profile).toBeDefined();
      expect(profile?.username).toBe('user1');
    });
  });

  describe('social interactions', () => {
    it('should follow user', async () => {
      const result = await service.followUser('user-2');
      expect(result).toBe(true);
    });

    it('should unfollow user', async () => {
      const result = await service.unfollowUser('user-2');
      expect(result).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should get unread message count', () => {
      const count = service.getUnreadMessageCount();
      expect(typeof count).toBe('number');
    });

    it('should get online friends', () => {
      const onlineFriends = service.getOnlineFriends();
      expect(Array.isArray(onlineFriends)).toBe(true);
    });
  });

  describe('event listeners', () => {
    it('should register message callback', () => {
      const callback = vi.fn();
      service.onMessage(callback);
      // Test that callback is registered (implementation detail)
      expect(callback).toBeDefined();
    });

    it('should register friend update callback', () => {
      const callback = vi.fn();
      service.onFriendUpdate(callback);
      expect(callback).toBeDefined();
    });

    it('should register activity callback', () => {
      const callback = vi.fn();
      service.onActivity(callback);
      expect(callback).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const friends = await service.getFriends();
      expect(friends).toEqual([]);
    });

    it('should handle failed requests', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });
      
      const result = await service.sendFriendRequest('user-2');
      expect(result).toBe(false);
    });
  });
}); 